import { PageHeader } from "@/components/layout/PageHeader";
import { requireRole } from "@/lib/auth/session";
import { getSector, listTicketsToday } from "@/lib/db/store";
import { AttendanceConsole } from "@/features/tickets/components/AttendanceConsole";

function priorityWeight(p: string) {
  return p === "urgent" ? 0 : p === "priority" ? 1 : 2;
}

export default async function AtendimentoPage() {
  const user = await requireRole("attendant");
  const sector = getSector(user.sector_id!)!;
  const tickets = listTicketsToday().filter((t) => t.sector_id === sector.id);

  const current = tickets.find((t) => ["called", "in_progress"].includes(t.status)) ?? null;
  const queue = tickets
    .filter((t) => t.status === "waiting")
    .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority) || (a.created_at < b.created_at ? -1 : 1));

  return (
    <>
      <PageHeader title="Meu atendimento" subtitle="Fila e chamada do seu setor" />
      <div className="p-6 max-w-2xl">
        <AttendanceConsole sector={sector} current={current} queue={queue} />
      </div>
    </>
  );
}
