import { PageHeader } from "@/components/layout/PageHeader";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AttendanceConsole } from "@/features/tickets/components/AttendanceConsole";
import type { Sector, Ticket } from "@/types/database";

function priorityWeight(priority: string) {
  return priority === "urgent"
    ? 0
    : priority === "priority"
      ? 1
      : 2;
}

function getTodayBrazil() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function AtendimentoPage() {
  const user = await requireRole("attendant");

  if (!user.sector_id) {
    throw new Error(
      "Este atendente não possui um setor vinculado."
    );
  }

  const supabase = createSupabaseServerClient();

  /*
   * =====================================================
   * BUSCAR SETOR DO ATENDENTE
   * =====================================================
   */

  const { data: sectorData, error: sectorError } =
    await supabase
      .from("sectors")
      .select("*")
      .eq("id", user.sector_id)
      .single();

  if (sectorError || !sectorData) {
    console.error("Erro ao buscar setor:", sectorError);

    throw new Error(
      "Setor do atendente não foi encontrado."
    );
  }

  const sector = sectorData as Sector;

  /*
   * =====================================================
   * DATA ATUAL
   * =====================================================
   */

  const today = getTodayBrazil();

  /*
   * =====================================================
   * BUSCAR TICKETS AGUARDANDO
   * =====================================================
   */

  const { data: waitingTickets, error: waitingError } =
    await supabase
      .from("tickets")
      .select(`
        id,
        code,
        sequence_number,
        ticket_date,
        sector_id,
        visitor_id,
        reason,
        notes,
        priority,
        priority_justification,
        status,
        created_by,
        created_at
      `)
      .eq("sector_id", user.sector_id)
      .eq("ticket_date", today)
      .eq("status", "waiting")
      .order("sequence_number", {
        ascending: true,
      });

  if (waitingError) {
    console.error(
      "Erro ao buscar fila:",
      waitingError
    );

    throw new Error(
      "Não foi possível carregar a fila."
    );
  }

  /*
   * =====================================================
   * BUSCAR VISITANTES DA FILA
   * =====================================================
   */

  const waitingVisitorIds =
    waitingTickets?.map((ticket) => ticket.visitor_id) ?? [];

  let visitorsMap = new Map<
    string,
    {
      full_name: string;
      visitor_type_id: string | null;
    }
  >();

  if (waitingVisitorIds.length > 0) {
    const { data: visitors, error: visitorsError } =
      await supabase
        .from("visitors")
        .select(
          "id, full_name, visitor_type_id"
        )
        .in("id", waitingVisitorIds);

    if (visitorsError) {
      console.error(
        "Erro ao buscar visitantes:",
        visitorsError
      );
    } else {
      visitorsMap = new Map(
        (visitors ?? []).map((visitor) => [
          visitor.id,
          {
            full_name: visitor.full_name,
            visitor_type_id:
              visitor.visitor_type_id,
          },
        ])
      );
    }
  }

  /*
   * =====================================================
   * BUSCAR TIPOS DE VISITANTE
   * =====================================================
   */

  const visitorTypeIds = Array.from(
    new Set(
      Array.from(visitorsMap.values())
        .map((visitor) => visitor.visitor_type_id)
        .filter(
          (id): id is string => Boolean(id)
        )
    )
  );

  let visitorTypesMap = new Map<
    string,
    string
  >();

  if (visitorTypeIds.length > 0) {
    const {
      data: visitorTypes,
      error: visitorTypesError,
    } = await supabase
      .from("visitor_types")
      .select("id, label")
      .in("id", visitorTypeIds);

    if (visitorTypesError) {
      console.error(
        "Erro ao buscar tipos de visitante:",
        visitorTypesError
      );
    } else {
      visitorTypesMap = new Map(
        (visitorTypes ?? []).map((type) => [
          type.id,
          type.label,
        ])
      );
    }
  }

  /*
   * =====================================================
   * TRANSFORMAR TICKETS PARA O FORMATO DA TELA
   * =====================================================
   */

  const queue: Ticket[] = (waitingTickets ?? [])
    .map((ticket) => {
      const visitor = visitorsMap.get(
        ticket.visitor_id
      );

      return {
        id: ticket.id,
        code: ticket.code,
        sequence_number:
          ticket.sequence_number,
        ticket_date: ticket.ticket_date,
        sector_id: ticket.sector_id,
        visitor_id: ticket.visitor_id,
        visitor_name:
          visitor?.full_name ??
          "Visitante não encontrado",
        visitor_type_label:
          visitor?.visitor_type_id
            ? visitorTypesMap.get(
                visitor.visitor_type_id
              ) ?? "Não informado"
            : "Não informado",
        reason: ticket.reason,
        notes: ticket.notes,
        priority: ticket.priority,
        priority_justification:
          ticket.priority_justification,
        status: ticket.status,
        created_by: ticket.created_by,
        created_at: ticket.created_at,
      } as Ticket;
    })
    .sort(
      (a, b) =>
        priorityWeight(a.priority) -
          priorityWeight(b.priority) ||
        (a.sequence_number -
          b.sequence_number)
    );

  /*
   * =====================================================
   * BUSCAR ATENDIMENTO ATUAL DO ATENDENTE
   * =====================================================
   */

  const { data: attendance } =
    await supabase
      .from("attendances")
      .select(`
        id,
        ticket_id,
        attendant_id,
        called_at,
        recall_count,
        started_at,
        ended_at,
        result_status,
        observation
      `)
      .eq("attendant_id", user.id)
      .is("ended_at", null)
      .order("called_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

  let current: Ticket | null = null;

  if (attendance) {
    const { data: currentTicket } =
      await supabase
        .from("tickets")
        .select(`
          id,
          code,
          sequence_number,
          ticket_date,
          sector_id,
          visitor_id,
          reason,
          notes,
          priority,
          priority_justification,
          status,
          created_by,
          created_at
        `)
        .eq("id", attendance.ticket_id)
        .single();

    if (currentTicket) {
      const { data: visitor } =
        await supabase
          .from("visitors")
          .select(
            "id, full_name, visitor_type_id"
          )
          .eq("id", currentTicket.visitor_id)
          .single();

      let visitorTypeLabel =
        "Não informado";

      if (visitor?.visitor_type_id) {
        const { data: visitorType } =
          await supabase
            .from("visitor_types")
            .select("label")
            .eq(
              "id",
              visitor.visitor_type_id
            )
            .maybeSingle();

        visitorTypeLabel =
          visitorType?.label ??
          "Não informado";
      }

      current = {
        id: currentTicket.id,
        code: currentTicket.code,
        sequence_number:
          currentTicket.sequence_number,
        ticket_date:
          currentTicket.ticket_date,
        sector_id:
          currentTicket.sector_id,
        visitor_id:
          currentTicket.visitor_id,
        visitor_name:
          visitor?.full_name ??
          "Visitante não encontrado",
        visitor_type_label:
          visitorTypeLabel,
        reason: currentTicket.reason,
        notes: currentTicket.notes,
        priority: currentTicket.priority,
        priority_justification:
          currentTicket.priority_justification,
        status: currentTicket.status,
        created_by:
          currentTicket.created_by,
        created_at:
          currentTicket.created_at,
      } as Ticket;
    }
  }

  return (
    <>
      <PageHeader
        title="Meu atendimento"
        subtitle="Fila e chamada do seu setor"
      />

      <div className="p-6 max-w-2xl">
        <AttendanceConsole
          sector={sector}
          current={current}
          queue={queue}
        />
      </div>
    </>
  );
}