import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Lecture des infos du buyer connecté.
 * Identifié via `?id=` ou `?buyerId=` (le client passe l'id stocké en
 * localStorage). Pas d'auth serveur stricte ici — symétrique au flux
 * vendor/me. À durcir avec un cookie signé pour la prod.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") ?? searchParams.get("buyerId");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });

    if (!buyer) {
      return NextResponse.json({ error: "Acheteur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ success: true, buyer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, phone, address } = body;
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = String(name).trim();
    if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;
    if (address !== undefined)
      data.address = address ? String(address).trim() : null;

    const buyer = await prisma.buyer.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      },
    });

    return NextResponse.json({ success: true, buyer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * Droit à l'effacement (art. 17 RGPD).
 *
 * Supprime définitivement le compte acheteur. Les commandes liées sont
 * supprimées en cascade (onDelete: Cascade dans le schema), ce qui peut
 * être problématique pour la comptabilité (obligation légale de 10 ans).
 *
 * En prod stricte, on ferait un "soft delete" : on anonymise le buyer
 * (name = "Compte supprimé", email = `deleted-${id}@carlow.fr`) et on
 * conserve les commandes. Ici on assume une suppression dure car c'est
 * le comportement attendu par l'utilisateur RGPD.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") ?? searchParams.get("buyerId");
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    // Confirmation explicite : on demande à passer `confirm=DELETE` dans
    // la query pour éviter une suppression accidentelle par mauvaise
    // requête. Cohérent avec ce que demande l'UI côté front.
    const confirm = searchParams.get("confirm");
    if (confirm !== "DELETE") {
      return NextResponse.json(
        { error: "Confirmation manquante (param confirm=DELETE)" },
        { status: 400 }
      );
    }

    const existing = await prisma.buyer.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    }

    await prisma.buyer.delete({ where: { id } });

    console.log("[api/buyer/me] DELETE buyer effacé:", existing.email);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/buyer/me] DELETE error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du compte" },
      { status: 500 }
    );
  }
}
