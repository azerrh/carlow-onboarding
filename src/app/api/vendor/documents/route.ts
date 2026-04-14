import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId manquant" }, { status: 400 });
    }

    const documents = await prisma.document.findMany({
      where: { vendorId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        type: true,
        filename: true,
        s3Key: true,
        status: true,
        uploadedAt: true,
      },
    });

    const withUrls = documents.map((d) => {
      const { data } = supabaseAdmin.storage.from("documents").getPublicUrl(d.s3Key);
      return { ...d, publicUrl: data.publicUrl };
    });

    return NextResponse.json({ success: true, documents: withUrls });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { vendorId, type, filename } = await req.json();

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendeur non identifie" },
        { status: 400 }
      );
    }

    const document = await prisma.document.create({
      data: {
        vendorId,
        type,
        filename,
        s3Key: `documents/${vendorId}/${filename}`,
        status: "uploaded",
      },
    });

    await prisma.vendor.update({
      where: { id: vendorId },
      data: { onboardingStep: 4 },
    });

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId");
    const type = searchParams.get("type");

    if (!vendorId || !type) {
      return NextResponse.json({ error: "vendorId/type manquants" }, { status: 400 });
    }

    const existing = await prisma.document.findFirst({
      where: { vendorId, type },
      orderBy: { uploadedAt: "desc" },
      select: { id: true, s3Key: true },
    });

    if (!existing) {
      return NextResponse.json({ success: true });
    }

    await prisma.document.delete({ where: { id: existing.id } });
    const { error } = await supabaseAdmin.storage.from("documents").remove([existing.s3Key]);
    if (error) {
      // Non bloquant: le DB est déjà nettoyé
      console.error("Supabase remove error:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}