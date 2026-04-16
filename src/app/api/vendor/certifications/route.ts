import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get("vendorId");

    if (!vendorId) {
      return NextResponse.json({ error: "vendorId manquant" }, { status: 400 });
    }

    const certifications = await prisma.certification.findMany({
      where: { vendorId },
      orderBy: { uploadedAt: "desc" },
    });

    const supabaseAdmin = getSupabaseAdmin();
    const withUrls = await Promise.all(
      certifications.map(async (c) => {
        const signed = await supabaseAdmin.storage
          .from("documents")
          .createSignedUrl(c.s3Key, 60 * 30);

        if (!signed.error && signed.data?.signedUrl) {
          return { ...c, publicUrl: signed.data.signedUrl };
        }
        const { data } = supabaseAdmin.storage.from("documents").getPublicUrl(c.s3Key);
        return { ...c, publicUrl: data.publicUrl };
      })
    );

    return NextResponse.json({ success: true, certifications: withUrls });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { vendorId, certType, filename, s3Key, category } = await req.json();

    if (!vendorId || !certType || !filename || !s3Key || !category) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const certification = await prisma.certification.create({
      data: {
        vendorId,
        certType,
        filename,
        s3Key,
        category,
      },
    });

    await prisma.vendor.update({
      where: { id: vendorId },
      data: { onboardingStep: 5 },
    }).catch((err) => console.error("Vendor step update error:", err));

    return NextResponse.json({ success: true, certification });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id manquant" }, { status: 400 });
    }

    const cert = await prisma.certification.findUnique({ where: { id } });
    if (!cert) return NextResponse.json({ success: true });

    await prisma.certification.delete({ where: { id } });

    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.storage.from("documents").remove([cert.s3Key]).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
