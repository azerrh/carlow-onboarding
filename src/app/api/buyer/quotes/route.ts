import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/buyer/quotes?id=<buyerId>
 * ou GET /api/buyer/quotes?email=<buyerEmail>
 *
 * Retourne tous les devis d'un acheteur, triés du plus récent au plus ancien.
 * Un acheteur peut être identifié par son buyerId (si compte créé) ou par
 * son email (pour les demandes anonymes).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("id") ?? searchParams.get("buyerId");
    const email = searchParams.get("email");

    if (!buyerId && !email) {
      return NextResponse.json({ error: "id ou email requis" }, { status: 400 });
    }

    const whereClause = buyerId
      ? { OR: [{ buyerId }, { buyerEmail: { equals: email?.toLowerCase() ?? "" } }] }
      : { buyerEmail: email!.toLowerCase() };

    // Si on a un buyerId, on cherche par buyerId OU par email du buyer
    let buyerEmail: string | null = null;
    if (buyerId) {
      const buyer = await prisma.buyer.findUnique({
        where: { id: buyerId },
        select: { email: true },
      });
      buyerEmail = buyer?.email ?? null;
    }

    const quotes = await prisma.quote.findMany({
      where: buyerId
        ? {
            OR: [
              { buyerId },
              ...(buyerEmail ? [{ buyerEmail }] : []),
            ],
          }
        : { buyerEmail: email!.toLowerCase().trim() },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            name: true,
            reference: true,
            price: true,
            category: true,
            photos: {
              select: { url: true },
              orderBy: { primary: "desc" },
              take: 1,
            },
          },
        },
        vendor: {
          select: { name: true, companyName: true },
        },
      },
    });

    return NextResponse.json({ success: true, quotes });
  } catch (error) {
    console.error("[api/buyer/quotes GET] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
