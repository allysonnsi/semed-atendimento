import { PageHeader } from "@/components/layout/PageHeader";
import { requireRole } from "@/lib/auth/session";
import { listTicketsToday, listActiveSectors } from "@/lib/db/store";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDuration, STATUS_LABEL } from "@/lib/utils";
import type { TicketStatus } from "@/types/database";

const STATUSES: TicketStatus[] = ["waiting", "called", "in_progress", "completed", "cancelled", "no_show"];

export default function DashboardPage() {
  requireRole("admin", "manager");
  const tickets = listTicketsToday();
  const sectors = listActiveSectors();

  const waiting = tickets.filter((t) => t.status === "waiting").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const completed = tickets.filter((t) => t.status === "completed");
  const cancelled = tickets.filter((t) => t.status === "cancelled").length;
  const noShow = tickets.filter((t) => t.status === "no_show").length;

  const bySector: Record<string, number> = {};
  tickets.forEach((t) => (bySector[t.sector_id] = (bySector[t.sector_id] ?? 0) + 1));
  const topSectorId = Object.keys(bySector).sort((a, b) => bySector[b] - bySector[a])[0];
  const maxSectorCount = Math.max(1, ...Object.values(bySector));

  const byHour: Record<number, number> = {};
  tickets.forEach((t) => {
    const h = new Date(t.created_at).getHours();
    byHour[h] = (byHour[h] ?? 0) + 1;
  });
  const topHour = Object.keys(byHour).sort((a, b) => byHour[Number(b)] - byHour[Number(a)])[0];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral do atendimento hoje" />
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <Kpi label="Atendidos hoje" value={completed.length} />
          <Kpi label="Aguardando" value={waiting} />
          <Kpi label="Em andamento" value={inProgress} />
          <Kpi label="Cancelados / não compareceu" value={`${cancelled} / ${noShow}`} small />
          <Kpi
            label="Setor mais procurado"
            value={topSectorId ? sectors.find((s) => s.id === topSectorId)?.name ?? "—" : "—"}
            small
          />
          <Kpi label="Horário de maior movimento" value={topHour !== undefined ? `${topHour}h – ${Number(topHour) + 1}h` : "—"} small />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
          <div className="bg-surface border border-border rounded-md p-5">
            <h3 className="text-[14.5px] font-bold mb-3">Atendimentos por setor (hoje)</h3>
            <div className="flex items-end gap-3.5 h-[150px] pt-2.5">
              {sectors.map((s) => {
                const v = bySector[s.id] ?? 0;
                const h = Math.max(4, (v / maxSectorCount) * 120);
                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center justify-end h-full">
                    <div className="text-[11px] font-bold mb-1">{v}</div>
                    <div className="w-full max-w-[38px] rounded-t-md" style={{ height: h, background: s.color }} />
                    <div className="text-[11px] text-ink-muted mt-1.5">{s.code}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-md p-5">
            <h3 className="text-[14.5px] font-bold mb-3">Por status</h3>
            <div className="flex flex-col gap-2.5">
              {STATUSES.map((st) => (
                <div key={st} className="flex items-center justify-between text-[13px]">
                  <StatusBadge status={st} />
                  <b className="tabular-nums">{tickets.filter((t) => t.status === st).length}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className="text-xs text-ink-muted font-medium mb-2">{label}</div>
      <div className={`font-display font-extrabold ${small ? "text-lg" : "text-[26px]"}`}>{value}</div>
    </div>
  );
}
