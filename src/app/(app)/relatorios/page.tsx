import { PageHeader } from "@/components/layout/PageHeader";
import { requireRole } from "@/lib/auth/session";
import { listTicketsToday, getProfile } from "@/lib/db/store";

export default function RelatoriosPage() {
  requireRole("admin", "manager");
  const tickets = listTicketsToday();

  const byType: Record<string, number> = {};
  tickets.forEach((t) => (byType[t.visitor_type_label] = (byType[t.visitor_type_label] ?? 0) + 1));
  const maxType = Math.max(1, ...Object.values(byType));

  const byAttendant: Record<string, number> = {};
  tickets.forEach((t) => {
    if (t.status === "completed") {
      // attendant vem via attendances no mundo real; aqui usamos created_by como aproximação de demo
    }
  });

  return (
    <>
      <PageHeader title="Relatórios" subtitle="Indicadores por período, setor e atendente" />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-md p-5">
            <h3 className="text-[14.5px] font-bold mb-3">Atendimentos por tipo de visitante (hoje)</h3>
            <div className="flex flex-col gap-2">
              {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div key={k}>
                  <div className="flex justify-between text-[12.5px] mb-0.5"><span>{k}</span><b>{v}</b></div>
                  <div className="bg-primary-light rounded h-[7px]">
                    <div className="bg-primary rounded h-[7px]" style={{ width: `${(v / maxType) * 100}%` }} />
                  </div>
                </div>
              ))}
              {!Object.keys(byType).length && <div className="text-ink-muted text-[13px]">Sem dados hoje.</div>}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-md p-5">
            <h3 className="text-[14.5px] font-bold mb-3">Exportar</h3>
            <p className="text-[12.5px] text-ink-muted mb-3">
              A exportação CSV é gerada a partir dos mesmos dados exibidos no Histórico. A exportação em PDF, na
              versão conectada ao Supabase, é gerada no servidor a partir das mesmas tabelas.
            </p>
            <a
              href="/api/relatorios/csv"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-[13.5px] font-semibold hover:border-primary hover:text-primary"
            >
              Exportar CSV
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
