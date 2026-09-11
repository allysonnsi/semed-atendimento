// Cliente Supabase para uso no BROWSER (Client Components).
// Só é instanciado se as variáveis de ambiente estiverem configuradas —
// no protótipo (sem Supabase real), o app usa lib/db/store.ts em vez disso.
"use client";
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local para usar o backend real."
    );
  }
  return createBrowserClient(url, key);
}
