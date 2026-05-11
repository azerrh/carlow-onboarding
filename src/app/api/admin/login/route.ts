import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Admin login : plus strict (5 tentatives / 5 min) car c'est la porte
  // d'entrée du back-office.
  const blocked = applyRateLimit(req, {
    bucket: "auth:login-admin",
    limit: 5,
    windowSec: 300,
  });
  if (blocked) return blocked;

  try {
    const { password } = await req.json();

    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
    }

    if (password !== secret) {
      return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set("admin_session", secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 heures
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
