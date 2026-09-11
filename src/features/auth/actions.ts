"use server";
import { redirect } from "next/navigation";
import { listProfiles } from "@/lib/db/store";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";

const HOME_BY_ROLE: Record<string, string> = {
  admin: "/dashboard",
  manager: "/dashboard",
  receptionist: "/recepcao/novo-atendimento",
  attendant: "/atendimento",
};

export async function loginAsDemo(userId: string) {
  const profile = listProfiles().find((p) => p.id === userId);
  if (!profile) throw new Error("Usuário de demonstração inválido.");
  setSessionCookie(profile.id);
  redirect(HOME_BY_ROLE[profile.role_key] ?? "/dashboard");
}

export async function logout() {
  clearSessionCookie();
  redirect("/login");
}
