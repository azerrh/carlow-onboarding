import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";

/**
 * Vue agrégée Vendor + Buyer (utilisée par /admin/utilisateurs).
 */
export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const [vendors, buyers] = await Promise.all([
      prisma.vendor.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          companyName: true,
          createdAt: true,
        },
      }),
      prisma.buyer.findMany({
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ]);

    const users = [
      ...vendors.map((v) => ({
        id: v.id,
        role: "vendor" as const,
        name: v.name,
        email: v.email,
        meta: v.companyName ?? "—",
        status: v.status,
        createdAt: v.createdAt,
      })),
      ...buyers.map((b) => ({
        id: b.id,
        role: "buyer" as const,
        name: b.name,
        email: b.email,
        meta: "Acheteur",
        status: "active",
        createdAt: b.createdAt,
      })),
    ].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    return NextResponse.json({
      success: true,
      users,
      stats: {
        total: users.length,
        vendors: vendors.length,
        buyers: buyers.length,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
