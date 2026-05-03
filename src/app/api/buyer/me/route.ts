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
