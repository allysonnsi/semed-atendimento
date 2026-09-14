import "server-only";

import type { Profile, RoleKey } from "@/types/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSession(): Promise<Profile | null> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      role_id,
      sector_id,
      active,
      created_at,
      updated_at,
      roles!inner (
        key
      )
    `)
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  if (!profile.active) {
    return null;
  }

  const roleData = profile.roles as unknown as
    | { key: RoleKey }
    | { key: RoleKey }[]
    | null;

  const role = Array.isArray(roleData)
    ? roleData[0]
    : roleData;

  if (!role) {
    return null;
  }

  return {
    id: profile.id,
    full_name: profile.full_name,
    role_id: profile.role_id,
    role_key: role.key,
    sector_id: profile.sector_id,
    active: profile.active,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

export async function clearSessionCookie() {
  const supabase = createSupabaseServerClient();

  await supabase.auth.signOut();
}

export async function requireUser(): Promise<Profile> {
  const session = await getSession();

  if (!session) {
    throw new Error("NAO_AUTENTICADO");
  }

  return session;
}

export async function requireRole(
  ...roles: RoleKey[]
): Promise<Profile> {
  const session = await requireUser();

  if (!roles.includes(session.role_key)) {
    throw new Error("SEM_PERMISSAO");
  }

  return session;
}