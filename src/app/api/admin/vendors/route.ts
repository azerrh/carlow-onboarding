import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCompteActiveEmail } from "@/lib/email";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        onboardingStep: true,
        companyName: true,
        siret: true,
        vatNumber: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ success: true, vendors });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        status,
        activatedAt: status === "active" ? new Date() : undefined,
      },
    });

    if (status === "active") {
      // Crée automatiquement un catalogue par défaut s'il n'en existe pas encore
      // — sinon l'admin doit créer la ligne en base à la main avant de pouvoir
      // ajouter le moindre produit côté /admin/produits.
      const existingCatalog = await prisma.catalog.findFirst({
        where: { vendorId: vendor.id },
        select: { id: true },
      });
      if (!existingCatalog) {
        await prisma.catalog.create({
          data: {
            vendorId: vendor.id,
            name: vendor.companyName ?? `Catalogue ${vendor.name}`,
            description: "Catalogue principal créé automatiquement à l'activation.",
            active: true,
          },
        });
      }

      await sendCompteActiveEmail(vendor.name, vendor.email);
    }

    return NextResponse.json({ success: true, vendor });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    // Supprimer en cascade — documents et certifications avant le vendor
    await prisma.$transaction([
      prisma.document.deleteMany({ where: { vendorId: id } }),
      prisma.certification.deleteMany({ where: { vendorId: id } }),
      prisma.vendor.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}