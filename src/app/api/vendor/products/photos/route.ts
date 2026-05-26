import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * Gestion des photos produit côté vendeur.
 *
 *  - POST   /api/vendor/products/photos     → upload une nouvelle photo
 *  - DELETE /api/vendor/products/photos     → supprime une photo
 *  - PATCH  /api/vendor/products/photos     → définit la photo principale
 *
 * Le bucket Supabase utilisé est "documents" (déjà existant et publique),
 * avec un préfixe `products/{vendorId}/{productId}/` pour cloisonner.
 *
 * Sécurité : à chaque opération on vérifie que le produit appartient bien
 * au vendeur via la chaîne Product → Catalog → Vendor.
 */

const BUCKET = "documents";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Vérifie que le produit appartient bien au vendeur. Renvoie le produit
 * ou null si non autorisé / introuvable.
 */
async function assertOwnership(productId: string, vendorId: string) {
  return prisma.product.findFirst({
    where: { id: productId, catalog: { vendorId } },
    select: { id: true },
  });
}

/* ------------------------------------------------------------------ POST */

export async function POST(req: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_KEY
    ) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante côté serveur." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string | null;
    const vendorId = formData.get("vendorId") as string | null;

    if (!file || !productId || !vendorId) {
      return NextResponse.json(
        { error: "Champs requis : file, productId, vendorId" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Format non supporté (${file.type}). Utilisez JPG, PNG, WEBP ou GIF.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image trop volumineuse (max 5 MB)." },
        { status: 400 }
      );
    }

    const product = await assertOwnership(productId, vendorId);
    if (!product) {
      return NextResponse.json(
        { error: "Produit introuvable ou accès refusé." },
        { status: 404 }
      );
    }

    // Combien de photos existent déjà ? La première devient automatiquement
    // la photo principale.
    const existingCount = await prisma.photo.count({ where: { productId } });
    const isPrimary = existingCount === 0;

    const supabase = getSupabaseAdmin();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `products/${vendorId}/${productId}/${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (upErr) {
      console.error("[photos POST] supabase upload error:", upErr);
      return NextResponse.json(
        { error: `Erreur Supabase: ${upErr.message}` },
        { status: 500 }
      );
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const photo = await prisma.photo.create({
      data: {
        productId,
        url: pub.publicUrl,
        primary: isPrimary,
        order: existingCount,
      },
    });

    return NextResponse.json({ success: true, photo });
  } catch (error) {
    console.error("[api/vendor/products/photos POST] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ---------------------------------------------------------------- DELETE */

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("id");
    const vendorId = searchParams.get("vendorId");

    if (!photoId || !vendorId) {
      return NextResponse.json(
        { error: "Paramètres requis : id, vendorId" },
        { status: 400 }
      );
    }

    // Vérifie l'appartenance via la photo → produit → catalogue → vendeur
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, product: { catalog: { vendorId } } },
      select: { id: true, url: true, productId: true, primary: true },
    });
    if (!photo) {
      return NextResponse.json(
        { error: "Photo introuvable ou accès refusé." },
        { status: 404 }
      );
    }

    // Tente la suppression du fichier dans Supabase (best-effort).
    // On extrait le chemin depuis l'URL publique : .../object/public/{bucket}/{path}
    try {
      const marker = `/public/${BUCKET}/`;
      const idx = photo.url.indexOf(marker);
      if (idx >= 0) {
        const path = photo.url.slice(idx + marker.length);
        const supabase = getSupabaseAdmin();
        await supabase.storage.from(BUCKET).remove([path]);
      }
    } catch (storageErr) {
      // On log mais on continue : la DB doit refléter la suppression.
      console.error("[photos DELETE] storage cleanup failed:", storageErr);
    }

    await prisma.photo.delete({ where: { id: photoId } });

    // Si on a supprimé la photo principale, promouvoir la suivante en primaire.
    if (photo.primary) {
      const next = await prisma.photo.findFirst({
        where: { productId: photo.productId },
        orderBy: { order: "asc" },
      });
      if (next) {
        await prisma.photo.update({
          where: { id: next.id },
          data: { primary: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/vendor/products/photos DELETE] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ----------------------------------------------------------------- PATCH */

/**
 * Définit `photoId` comme photo principale du produit. Désactive `primary`
 * sur toutes les autres photos du même produit. Atomique via $transaction.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { photoId, vendorId } = body as {
      photoId?: string;
      vendorId?: string;
    };

    if (!photoId || !vendorId) {
      return NextResponse.json(
        { error: "Paramètres requis : photoId, vendorId" },
        { status: 400 }
      );
    }

    const photo = await prisma.photo.findFirst({
      where: { id: photoId, product: { catalog: { vendorId } } },
      select: { id: true, productId: true },
    });
    if (!photo) {
      return NextResponse.json(
        { error: "Photo introuvable ou accès refusé." },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.photo.updateMany({
        where: { productId: photo.productId },
        data: { primary: false },
      }),
      prisma.photo.update({
        where: { id: photoId },
        data: { primary: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/vendor/products/photos PATCH] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------- GET */

/**
 * Liste les photos d'un produit (pour le modal d'édition).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const vendorId = searchParams.get("vendorId");

    if (!productId || !vendorId) {
      return NextResponse.json(
        { error: "Paramètres requis : productId, vendorId" },
        { status: 400 }
      );
    }

    const product = await assertOwnership(productId, vendorId);
    if (!product) {
      return NextResponse.json(
        { error: "Produit introuvable ou accès refusé." },
        { status: 404 }
      );
    }

    const photos = await prisma.photo.findMany({
      where: { productId },
      orderBy: [{ primary: "desc" }, { order: "asc" }],
      select: { id: true, url: true, primary: true, order: true },
    });

    return NextResponse.json({ success: true, photos });
  } catch (error) {
    console.error("[api/vendor/products/photos GET] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
