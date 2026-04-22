import { NextRequest } from "next/server";

export function isAdminAuthenticated(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session")?.value;
  const secret = process.env.ADMIN_SECRET;
  return !!secret && session === secret;
}
