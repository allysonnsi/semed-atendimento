import { PageHeader } from "@/components/layout/PageHeader";
import { listActiveSectors, listVisitorTypes } from "@/lib/db/store";
import { requireRole } from "@/lib/auth/session";
import { NewTicketForm } from "@/features/tickets/components/NewTicketForm";

export default function NovoAtendimentoPage() {
  requireRole("admin", "receptionist");
  const sectors = listActiveSectors();
  const visitorTypes = listVisitorTypes();

  return (
    <>
      <PageHeader title="Novo atendimento" subtitle="Registrar a chegada de um visitante" />
      <div className="p-6">
        <NewTicketForm sectors={sectors} visitorTypes={visitorTypes} />
      </div>
    </>
  );
}
