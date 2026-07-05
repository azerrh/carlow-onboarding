import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Nettoie un nom de fichier pour l'utiliser comme clé Supabase Storage.
 * Supabase refuse les clés contenant des accents, espaces ou caractères
 * spéciaux ("Invalid key"). On retire les accents et on ne garde que
 * [A-Za-z0-9._-]. Le nom d'affichage original reste stocké en DB.
 */
function sanitizeStorageName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1) : "";
  const strip = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // enlève les accents
      .replace(/[^a-zA-Z0-9._-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^[_.]+|[_.]+$/g, "");
  const safeBase = strip(base) || "fichier";
  const safeExt = ext.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase();
  return safeExt ? `${safeBase}.${safeExt}` : safeBase;
}

export async function POST(req: NextRequest) {
  try {
    // Vérification des variables d'environnement
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante sur le serveur. Ajoutez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_KEY dans les variables d'environnement Vercel." },
        { status: 500 }
      );
    }

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
    // Clé Supabase : nom de fichier nettoyé (accents/espaces → "Invalid key").
    const filename = `${vendorId}/${type}/${Date.now()}_${sanitizeStorageName(file.name)}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false, // Changed to false to avoid overwriting without record update
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: `Erreur Supabase Storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("documents")
      .getPublicUrl(filename);
    const signed = await supabaseAdmin.storage
      .from("documents")
      .createSignedUrl(filename, 60 * 30);

    if (signed.error) {
      console.error("Supabase signed URL error:", signed.error);
      // Continue with public URL as fallback
    }

    let transactionError = null;
    await prisma.$transaction(async (tx) => {
      try {
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
      } catch (error) {
        transactionError = error;
        throw error;
      }
    });

    if (transactionError) {
      // Transaction failed, remove the uploaded file
      const { error: removeError } = await supabaseAdmin.storage
        .from("documents")
        .remove([filename]);
      if (removeError) console.error("Supabase cleanup error:", removeError);
      throw transactionError;
    }

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
      publicUrl: signed.data?.signedUrl ?? urlData.publicUrl,
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