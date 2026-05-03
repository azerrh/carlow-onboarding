import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const docs = await prisma.document.findMany({
      orderBy: { uploadedAt: "desc" },
      include: {
        vendor: { select: { name: true } },
      },
    });

    const documents = docs.map((d) => ({
      id: d.id,
      vendorId: d.vendorId,
      type: d.type,
      filename: d.filename,
      status: d.status,
      uploadedAt: d.uploadedAt,
      vendorName: d.vendor?.name ?? null,
    }));

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
