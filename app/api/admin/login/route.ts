import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  checkPassword,
  createSessionToken,
  SESSION_MAX_AGE,
} from "@/lib/admin-auth";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "L'accès admin n'est pas configuré (ADMIN_PASSWORD manquant)." },
      { status: 503 },
    );
  }

  let password: string | undefined;
  try {
    const body = (await req.json()) as { password?: string };
    password = body?.password;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (!checkPassword(password)) {
    await audit("admin_login_failed", "admin");
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  await audit("admin_login", "admin");
  return res;
}
