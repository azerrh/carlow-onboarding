import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const vendorId = formData.get("vendorId") as string;
    const type = formData.get("type") as string;

    if (!file || !vendorId || !type) {
      return NextResponse.json({ error: "Donnees manquantes" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${vendorId}/${type}/${Date.now()}_${file.name}`;

    const { data, error } = await supabaseAdmin.storage
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

    await prisma.document.create({
      data: {
        vendorId,
        type,
        filename: file.name,
        s3Key: filename,
        status: "uploaded",
      },
    });

    await prisma.vendor.update({
      where: { id: vendorId },
      data: { onboardingStep: 4 },
    });

    return NextResponse.json({
      success: true,
      filename: file.name,
      key: filename,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}