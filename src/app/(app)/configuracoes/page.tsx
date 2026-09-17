import { PageHeader } from "@/components/layout/PageHeader";
import { requireRole } from "@/lib/auth/session";
import { SUPABASE_CONFIGURED } from "@/lib/supabase/server";

export default async function ConfiguracoesPage() {
  await requireRole("admin");

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle="Parâmetros gerais do sistema"
      />

      <div className="p-6 max-w-xl">
        <div className="bg-surface border border-border rounded-md p-5 mb-4">
          <h3 className="text-[14.5px] font-bold mb-2">
            Status do backend
          </h3>

          <p className="text-[13px] text-ink-muted mb-3">
            {SUPABASE_CONFIGURED
              ? "Conectado ao Supabase — dados reais, com Auth, RLS e Realtime."
              : "Rodando em modo demonstração. Configure as variáveis do Supabase para utilizar o backend real."}
          </p>

          <span
            className={`inline-block px-2.5 py-1 rounded-full text-[11.5px] font-semibold ${
              SUPABASE_CONFIGURED
                ? "bg-primary-light text-primary"
                : "bg-accent-light text-accent"
            }`}
          >
            {SUPABASE_CONFIGURED
              ? "Produção"
              : "Demonstração"}
          </span>
        </div>

        <div className="bg-surface border border-border rounded-md p-5">
          <h3 className="text-[14.5px] font-bold mb-2">
            Parâmetros de atendimento
          </h3>

          <ul className="text-[13px] text-ink-muted list-disc pl-4 space-y-1">
            <li>
              Exigir CPF/documento no cadastro:{" "}
              <b className="text-ink">desativado</b>
            </li>

            <li>
              Tempo para marcar &quot;não compareceu&quot;
              automaticamente:{" "}
              <b className="text-ink">15 minutos</b>
            </li>
          </ul>

          <p className="text-[11.5px] text-ink-muted mt-3">
            Estes parâmetros poderão ser conectados à tabela
            system_settings posteriormente.
          </p>
        </div>
      </div>
    </>
  );
}