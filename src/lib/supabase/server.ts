// Cliente Supabase para uso no SERVIDOR (Server Components, Server Actions,
// Route Handlers). Nunca exponha a service role key no cliente — aqui usamos
// sempre a anon key + RLS, respeitando a sessão do usuário via cookies.
import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase não configurado. Este projeto está rodando com a camada mock (lib/db/store.ts). " +
      "Para conectar o backend real, defina as variáveis em .env.local — veja README.md."
    );
  }
  const cookieStore = cookies();
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });
}

// Indica se o backend real está configurado, para a UI poder avisar o usuário.
export const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
