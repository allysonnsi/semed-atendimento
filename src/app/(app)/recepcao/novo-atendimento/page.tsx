import { PageHeader } from "@/components/layout/PageHeader";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewTicketForm } from "@/features/tickets/components/NewTicketForm";

export default async function NovoAtendimentoPage() {
  await requireRole("admin", "receptionist");

  const supabase = createSupabaseServerClient();

  const [
    { data: sectors, error: sectorsError },
    { data: visitorTypes, error: visitorTypesError },
  ] = await Promise.all([
    supabase
      .from("sectors")
      .select("*")
      .eq("active", true)
      .order("name"),

    supabase
      .from("visitor_types")
      .select("*")
      .eq("active", true)
      .order("label"),
  ]);

  if (sectorsError) {
    console.error(
      "Erro ao carregar setores:",
      sectorsError
    );
  }

  if (visitorTypesError) {
    console.error(
      "Erro ao carregar tipos de visitante:",
      visitorTypesError
    );
  }

  return (
    <>
      <PageHeader
        title="Novo atendimento"
        subtitle="Registrar a chegada de um visitante"
      />

      <div className="p-6">
        <NewTicketForm
          sectors={sectors ?? []}
          visitorTypes={visitorTypes ?? []}
        />
      </div>
    </>
  );
}