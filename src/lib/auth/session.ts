// ============================================================================
// Sessão de demonstração — cookie simples contendo o id do perfil.
//
// Em produção, isso é substituído pelo Supabase Auth (ver lib/supabase/server.ts):
// o cookie de sessão do Supabase já viria assinado e a função getSession()
// abaixo passaria a ler `supabase.auth.getUser()` em vez do cookie manual.
// A interface (getSession/requireUser/requireRole) permanece a mesma, então
// as Server Actions e páginas que a consomem não precisam mudar.
// ============================================================================
import "server-only";
import { cookies } from "next/headers";
import { getProfile } from "@/lib/db/store";
import type { Profile, RoleKey } from "@/types/database";

const COOKIE_NAME = "semed_session";

export function getSession(): Profile | null {
  const uid = cookies().get(COOKIE_NAME)?.value;
  if (!uid) return null;
  const profile = getProfile(uid);
  if (!profile || !profile.active) return null;
  return profile;
}

export function setSessionCookie(userId: string) {
  cookies().set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export function requireUser(): Profile {
  const session = getSession();
  if (!session) throw new Error("NAO_AUTENTICADO");
  return session;
}

export function requireRole(...roles: RoleKey[]): Profile {
  const session = requireUser();
  if (!roles.includes(session.role_key)) throw new Error("SEM_PERMISSAO");
  return session;
}
