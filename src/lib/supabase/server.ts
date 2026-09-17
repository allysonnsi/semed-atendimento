import "server-only";

import { cookies } from "next/headers";
import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";

export function createSupabaseServerClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local."
    );
  }

  const cookieStore = cookies();

  return createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },

        set(
          name: string,
          value: string,
          options: CookieOptions
        ) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
            });
          } catch {
            /*
             * Server Components podem não permitir
             * escrita de cookies. O middleware é
             * responsável por atualizar a sessão.
             */
          }
        },

        remove(
          name: string,
          options: CookieOptions
        ) {
          try {
            cookieStore.set({
              name,
              value: "",
              ...options,
            });
          } catch {
            /*
             * Ignorado em contextos onde cookies não
             * podem ser modificados.
             */
          }
        },
      },
    }
  );
}

export const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);