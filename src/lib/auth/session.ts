import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/store";
import type { Profile, RoleKey } from "@/types/database";

export async function getSession(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const profile = getProfile(user.id);

  if (!profile || !profile.active) {
    return null;
  }

  return profile;
}

export async function clearSessionCookie() {
  const supabase = await createClient();

  await supabase.auth.signOut();
}

export async function requireUser(): Promise<Profile> {
  const session = await getSession();

  if (!session) {
    throw new Error("NAO_AUTENTICADO");
  }

  return session;
}

export async function requireRole(...roles: RoleKey[]): Promise<Profile> {
  const session = await requireUser();

  if (!roles.includes(session.role_key)) {
    throw new Error("SEM_PERMISSAO");
  }

  return session;
}