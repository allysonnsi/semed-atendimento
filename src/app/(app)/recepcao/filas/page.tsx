import { PageHeader } from "@/components/layout/PageHeader";
import { listActiveSectors, listTicketsToday } from "@/lib/db/store";
import { requireRole } from "@/lib/auth/session";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { CancelButton } from "@/features/tickets/components/CancelButton";

function priorityWeight(p: string) {
  return p === "urgent" ? 0 : p === "priority" ? 1 : 2;
}

export default async function FilasPage() {
  const user = await requireRole("admin", "receptionist");
  const sectors = listActiveSectors();
  const tickets = listTicketsToday();
  const canCancel = user.role_key === "admin";
  return (
    <>
      <PageHeader title="Filas por setor" subtitle="Acompanhamento das filas da recepção" />
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {sectors.map((s) => {
          const queue = tickets
            .filter((t) => t.sector_id === s.id && ["waiting", "called"].includes(t.status))
            .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority) || (a.created_at < b.created_at ? -1 : 1));
          const current = tickets.find((t) => t.sector_id === s.id && t.status === "in_progress");

          return (
            <div key={s.id} className="bg-surface border border-border rounded-md p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                  {queue.length} na fila
                </span>
              </div>
              {current && (
                <div className="text-[12px] text-ink-muted mb-2">
                  Em atendimento agora: <b className="text-ink tabular-nums">{current.code}</b>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                {queue.length ? (
                  queue.slice(0, 6).map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-2.5 py-2 border border-border rounded-lg text-[13px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-display font-bold text-[14.5px] w-[62px] shrink-0 tabular-nums">{t.code}</span>
                        <span className="truncate">{t.visitor_name}</span>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      {canCancel ? <CancelButton ticketId={t.id} /> : <StatusBadge status={t.status} />}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-[13px] text-ink-muted py-5">Nenhuma pessoa aguardando neste setor.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
