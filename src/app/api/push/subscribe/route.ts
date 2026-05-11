import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Inscription Web Push.
 *
 * POST   /api/push/subscribe  → enregistre une souscription liée à un
 *                               vendorId OU un buyerId.
 * DELETE /api/push/subscribe  → désinscrit (à appeler quand l'utilisateur
 *                               clique "désactiver les notifs").
 *
 * Idempotent : si l'endpoint existe déjà on met à jour les clés et le
 * propriétaire (utile si un même device passe d'un compte à un autre).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, vendorId, buyerId, userAgent } = body as {
      subscription?: {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      vendorId?: string;
      buyerId?: string;
      userAgent?: string;
    };

    if (
      !subscription?.endpoint ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      return NextResponse.json(
        { error: "Souscription invalide" },
        { status: 400 }
      );
    }
    if (!vendorId && !buyerId) {
      return NextResponse.json(
        { error: "vendorId ou buyerId requis" },
        { status: 400 }
      );
    }

    const data = {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      vendorId: vendorId ?? null,
      buyerId: buyerId ?? null,
      userAgent: userAgent ?? req.headers.get("user-agent") ?? null,
    };

    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: data,
      update: data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/push/subscribe] POST error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint");
    if (!endpoint) {
      return NextResponse.json({ error: "endpoint requis" }, { status: 400 });
    }
    await prisma.pushSubscription
      .delete({ where: { endpoint } })
      .catch(() => null); // idempotent (ignore les "not found")
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/push/subscribe] DELETE error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
