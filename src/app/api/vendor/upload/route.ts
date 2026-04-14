import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const vendorId = formData.get("vendorId") as string;
    const type = formData.get("type") as string;

    if (!file || !vendorId || !type) {
      return NextResponse.json({ error: "Donnees manquantes" }, { status: 400 });
    }

    // Remplacement: on nettoie l'ancien fichier du même type (si présent)
    const previous = await prisma.document.findFirst({
      where: { vendorId, type },
      orderBy: { uploadedAt: "desc" },
      select: { id: true, s3Key: true },
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${vendorId}/${type}/${Date.now()}_${file.name}`;

    const { error } = await supabaseAdmin.storage
      .from("documents")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ error: "Erreur upload" }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("documents")
      .getPublicUrl(filename);

    await prisma.$transaction(async (tx) => {
      if (previous) {
        await tx.document.delete({ where: { id: previous.id } });
      }

      await tx.document.create({
        data: {
          vendorId,
          type,
          filename: file.name,
          s3Key: filename,
          status: "uploaded",
        },
      });

      await tx.vendor.update({
        where: { id: vendorId },
        data: { onboardingStep: 4 },
      });
    });

    if (previous?.s3Key) {
      const { error: removeError } = await supabaseAdmin.storage
        .from("documents")
        .remove([previous.s3Key]);
      if (removeError) console.error("Supabase remove error:", removeError);
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      key: filename,
      publicUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error && error.message.startsWith("Missing env ")
        ? error.message
        : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}