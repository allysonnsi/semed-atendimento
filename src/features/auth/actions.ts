"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const HOME_BY_ROLE = {
  admin: "/dashboard",
  receptionist: "/recepcao/novo-atendimento",
  attendant: "/atendimento",
} as const;

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Preencha%20e-mail%20e%20senha");
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=E-mail%20ou%20senha%20incorretos");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Nao%20foi%20possivel%20iniciar%20a%20sessao");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      active,
      roles!inner (
        key
      )
    `)
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.active) {
    await supabase.auth.signOut();

    redirect(
      "/login?error=Usuario%20sem%20perfil%20ou%20inativo"
    );
  }

  const roleData = profile.roles as unknown as
    | { key: keyof typeof HOME_BY_ROLE }
    | { key: keyof typeof HOME_BY_ROLE }[]
    | null;

  const role = Array.isArray(roleData)
    ? roleData[0]
    : roleData;

  if (!role || !(role.key in HOME_BY_ROLE)) {
    await supabase.auth.signOut();

    redirect(
      "/login?error=Perfil%20de%20acesso%20invalido"
    );
  }

  redirect(HOME_BY_ROLE[role.key]);
}

export async function logout() {
  const supabase = createSupabaseServerClient();

  await supabase.auth.signOut();

  redirect("/login");
}