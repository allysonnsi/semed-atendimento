import { PageHeader } from "@/components/layout/PageHeader";
import { requireRole } from "@/lib/auth/session";
import { listAllTickets, listActiveSectors, getAttendanceForTicket, getProfile, getSector } from "@/lib/db/store";
import { StatusBadge } from "@/components/ui/Badge";
import { formatTime, formatDuration } from "@/lib/utils";
import { VISITOR_TYPE_LABELS } from "@/lib/constants";

export default async function HistoricoPage({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  await requireRole("admin");
  const sectors = listActiveSectors();
  let tickets = listAllTickets();

  const { sectorId, status, visitorType, search } = searchParams;
  if (sectorId) tickets = tickets.filter((t) => t.sector_id === sectorId);
  if (status) tickets = tickets.filter((t) => t.status === status);
  if (visitorType) tickets = tickets.filter((t) => t.visitor_type_label === visitorType);
  if (search) {
    const q = search.toLowerCase();
    tickets = tickets.filter((t) => t.code.toLowerCase().includes(q) || t.visitor_name.toLowerCase().includes(q));
  }

  return (
    <>
      <PageHeader title="Histórico de atendimentos" subtitle="Consulta completa com filtros" />
      <div className="p-6">
        <form className="flex gap-2.5 flex-wrap mb-3.5" method="get">
          <select name="sectorId" defaultValue={sectorId ?? ""} className="border border-border rounded-lg px-2.5 py-2 text-[12.5px]">
            <option value="">Todos os setores</option>
            {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="status" defaultValue={status ?? ""} className="border border-border rounded-lg px-2.5 py-2 text-[12.5px]">
            <option value="">Todos os status</option>
            {["waiting", "called", "in_progress", "completed", "cancelled", "no_show"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select name="visitorType" defaultValue={visitorType ?? ""} className="border border-border rounded-lg px-2.5 py-2 text-[12.5px]">
            <option value="">Todos os tipos</option>
            {VISITOR_TYPE_LABELS.map((v) => <option key={v}>{v}</option>)}
          </select>
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Buscar por senha ou nome..."
            className="border border-border rounded-lg px-2.5 py-2 text-[12.5px] min-w-[200px]"
          />
          <button type="submit" className="px-3.5 py-2 text-[12.5px] rounded-lg bg-primary text-white font-semibold">Filtrar</button>
          <a href="/historico" className="px-3.5 py-2 text-[12.5px] rounded-lg border border-border">Limpar</a>
        </form>

        <div className="bg-surface border border-border rounded-md overflow-auto">
          {tickets.length ? (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11.5px] uppercase tracking-wide text-ink-muted border-b border-border">
                  <th className="p-2.5">Senha</th><th className="p-2.5">Nome</th><th className="p-2.5">Setor</th>
                  <th className="p-2.5">Tipo</th><th className="p-2.5">Chegada</th><th className="p-2.5">Espera</th>
                  <th className="p-2.5">Atendimento</th><th className="p-2.5">Atendente</th><th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.slice(0, 60).map((t) => {
                  const att = getAttendanceForTicket(t.id);
                  const attendant = att ? getProfile(att.attendant_id) : null;
                  const wait = att?.started_at ? new Date(att.started_at).getTime() - new Date(t.created_at).getTime() : null;
                  const service = att?.ended_at && att?.started_at
                    ? new Date(att.ended_at).getTime() - new Date(att.started_at).getTime() : null;
                  return (
                    <tr key={t.id} className="border-b border-[#EEF2EF] last:border-none">
                      <td className="p-2.5 font-display font-bold tabular-nums">{t.code}</td>
                      <td className="p-2.5">{t.visitor_name}</td>
                      <td className="p-2.5">{getSector(t.sector_id)?.name}</td>
                      <td className="p-2.5">{t.visitor_type_label}</td>
                      <td className="p-2.5 tabular-nums">{formatTime(t.created_at)}</td>
                      <td className="p-2.5 tabular-nums">{formatDuration(wait)}</td>
                      <td className="p-2.5 tabular-nums">{formatDuration(service)}</td>
                      <td className="p-2.5">{attendant?.full_name ?? "—"}</td>
                      <td className="p-2.5"><StatusBadge status={t.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-ink-muted text-[13.5px]">Nenhum atendimento encontrado com os filtros atuais.</div>
          )}
        </div>
      </div>
    </>
  );
}
