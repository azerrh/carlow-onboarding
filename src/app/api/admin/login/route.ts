import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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
