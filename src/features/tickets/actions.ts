"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  createTicketSchema,
  cancelTicketSchema,
  changePrioritySchema,
} from "./schema";

export interface ActionResult {
  ok: boolean;
  error?: string;
  ticketCode?: string;
}

function priorityWeight(priority: string) {
  if (priority === "urgent") return 0;
  if (priority === "priority") return 1;
  return 2;
}

/* =========================================================
   CRIAR TICKET
   ========================================================= */

export async function createTicketAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRole("admin", "receptionist");

  const parsed = createTicketSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Dados inválidos.",
    };
  }

  const data = parsed.data;
  const supabase = createSupabaseServerClient();

  try {
    /* Buscar setor */
    const { data: sector, error: sectorError } =
      await supabase
        .from("sectors")
        .select("id, code, name, active")
        .eq("id", data.sectorId)
        .single();

    if (sectorError || !sector) {
      return {
        ok: false,
        error: "Setor não encontrado.",
      };
    }

    if (!sector.active) {
      return {
        ok: false,
        error: "Este setor está inativo.",
      };
    }

    /* Criar visitante */
    const { data: visitor, error: visitorError } =
      await supabase
        .from("visitors")
        .insert({
          full_name: data.visitorName,
          document: data.document || null,
          phone: data.phone || null,
          institution: data.institution || null,
          visitor_type_id: data.visitorTypeId,
        })
        .select("id")
        .single();

    if (visitorError || !visitor) {
      console.error(visitorError);

      return {
        ok: false,
        error:
          visitorError?.message ??
          "Não foi possível cadastrar o visitante.",
      };
    }

    /* Data atual */
    const today = new Date()
      .toISOString()
      .slice(0, 10);

    /* Descobrir última sequência do setor hoje */
    const { data: lastTicket, error: sequenceError } =
      await supabase
        .from("tickets")
        .select("sequence_number")
        .eq("sector_id", sector.id)
        .eq("ticket_date", today)
        .order("sequence_number", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (sequenceError) {
      console.error(sequenceError);

      return {
        ok: false,
        error: "Não foi possível gerar a sequência da senha.",
      };
    }

    const sequenceNumber =
      (lastTicket?.sequence_number ?? 0) + 1;

    /*
     * Exemplo:
     * CENSO + 001
     *
     * O código utiliza o código cadastrado no setor.
     */
    const ticketCode =
      `${sector.code}${String(sequenceNumber).padStart(3, "0")}`;

    /* Criar ticket */
    const { data: ticket, error: ticketError } =
      await supabase
        .from("tickets")
        .insert({
          code: ticketCode,
          sequence_number: sequenceNumber,
          ticket_date: today,
          sector_id: sector.id,
          visitor_id: visitor.id,
          reason: data.reason || null,
          notes: data.notes || null,
          priority: data.priority,
          priority_justification:
            data.priorityJustification || null,
          status: "waiting",
          created_by: user.id,
        })
        .select("id, code")
        .single();

    if (ticketError || !ticket) {
      console.error(ticketError);

      return {
        ok: false,
        error:
          ticketError?.message ??
          "Não foi possível gerar a senha.",
      };
    }

    /* Registrar evento */
    await supabase.from("attendance_events").insert({
      ticket_id: ticket.id,
      event_type: "created",
      actor_id: user.id,
      metadata: {
        sector_id: sector.id,
        sector_name: sector.name,
        priority: data.priority,
      },
    });

    revalidatePath("/recepcao/novo-atendimento");
    revalidatePath("/recepcao/filas");
    revalidatePath("/atendimento");
    revalidatePath("/painel");
    revalidatePath("/dashboard");

    return {
      ok: true,
      ticketCode: ticket.code,
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao gerar senha.",
    };
  }
}

/* =========================================================
   CHAMAR PRÓXIMO
   ========================================================= */

export async function callNextAction(
  sectorId: string
): Promise<ActionResult> {
  const user = await requireRole(
    "attendant",
    "admin"
  );

  if (
    user.role_key === "attendant" &&
    user.sector_id !== sectorId
  ) {
    return {
      ok: false,
      error:
        "Você não tem permissão para chamar senhas deste setor.",
    };
  }

  const supabase = createSupabaseServerClient();

  try {
    /* Procurar senhas aguardando */
    const { data: tickets, error } =
      await supabase
        .from("tickets")
        .select(`
          id,
          code,
          sequence_number,
          priority,
          created_at,
          sector_id
        `)
        .eq("sector_id", sectorId)
        .eq("status", "waiting")
        .order("created_at", {
          ascending: true,
        });

    if (error) {
      console.error(error);

      return {
        ok: false,
        error: "Não foi possível consultar a fila.",
      };
    }

    if (!tickets || tickets.length === 0) {
      return {
        ok: false,
        error:
          "Não há ninguém aguardando neste setor.",
      };
    }

    /* Ordenação por prioridade */
    tickets.sort(
      (a, b) =>
        priorityWeight(a.priority) -
          priorityWeight(b.priority) ||
        a.sequence_number - b.sequence_number
    );

    const ticket = tickets[0];

    /* Atualizar ticket */
    const { error: updateError } =
      await supabase
        .from("tickets")
        .update({
          status: "called",
        })
        .eq("id", ticket.id)
        .eq("status", "waiting");

    if (updateError) {
      console.error(updateError);

      return {
        ok: false,
        error: "Não foi possível chamar a senha.",
      };
    }

    /* Criar atendimento */
    const { error: attendanceError } =
      await supabase
        .from("attendances")
        .insert({
          ticket_id: ticket.id,
          attendant_id: user.id,
          called_at: new Date().toISOString(),
          recall_count: 0,
        });

    if (attendanceError) {
      console.error(attendanceError);

      /* Tentar devolver o ticket à fila */
      await supabase
        .from("tickets")
        .update({
          status: "waiting",
        })
        .eq("id", ticket.id);

      return {
        ok: false,
        error:
          "Não foi possível registrar o atendimento.",
      };
    }

    await supabase.from("attendance_events").insert({
      ticket_id: ticket.id,
      event_type: "called",
      actor_id: user.id,
      metadata: {
        ticket_code: ticket.code,
      },
    });

    revalidatePath("/atendimento");
    revalidatePath("/painel");
    revalidatePath("/recepcao/filas");

    return {
      ok: true,
      ticketCode: ticket.code,
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao chamar próximo.",
    };
  }
}

/* =========================================================
   RECHAMAR
   ========================================================= */

export async function recallAction(
  ticketId: string
): Promise<ActionResult> {
  const user = await requireRole(
    "attendant",
    "admin"
  );

  const supabase = createSupabaseServerClient();

  try {
    const { data: attendance, error } =
      await supabase
        .from("attendances")
        .select(
          "id, ticket_id, attendant_id, recall_count"
        )
        .eq("ticket_id", ticketId)
        .eq("attendant_id", user.id)
        .is("ended_at", null)
        .order("called_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (error || !attendance) {
      return {
        ok: false,
        error:
          "Atendimento em andamento não encontrado.",
      };
    }

    const newRecallCount =
      (attendance.recall_count ?? 0) + 1;

    await supabase
      .from("attendances")
      .update({
        recall_count: newRecallCount,
      })
      .eq("id", attendance.id);

    await supabase.from("attendance_events").insert({
      ticket_id: ticketId,
      event_type: "recalled",
      actor_id: user.id,
      metadata: {
        recall_count: newRecallCount,
      },
    });

    revalidatePath("/atendimento");
    revalidatePath("/painel");

    return { ok: true };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao rechamar.",
    };
  }
}

/* =========================================================
   INICIAR
   ========================================================= */

export async function startAction(
  ticketId: string
): Promise<ActionResult> {
  const user = await requireRole(
    "attendant",
    "admin"
  );

  const supabase = createSupabaseServerClient();

  try {
    const { data: attendance } =
      await supabase
        .from("attendances")
        .select("id")
        .eq("ticket_id", ticketId)
        .eq("attendant_id", user.id)
        .is("ended_at", null)
        .order("called_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (!attendance) {
      return {
        ok: false,
        error:
          "Atendimento não encontrado.",
      };
    }

    await supabase
      .from("attendances")
      .update({
        started_at: new Date().toISOString(),
      })
      .eq("id", attendance.id);

    await supabase
      .from("tickets")
      .update({
        status: "in_progress",
      })
      .eq("id", ticketId);

    await supabase.from("attendance_events").insert({
      ticket_id: ticketId,
      event_type: "started",
      actor_id: user.id,
      metadata: {},
    });

    revalidatePath("/atendimento");
    revalidatePath("/painel");

    return { ok: true };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao iniciar atendimento.",
    };
  }
}

/* =========================================================
   FINALIZAR
   ========================================================= */

export async function finishAction(
  ticketId: string,
  observation?: string
): Promise<ActionResult> {
  const user = await requireRole(
    "attendant",
    "admin"
  );

  const supabase = createSupabaseServerClient();

  try {
    const { data: attendance } =
      await supabase
        .from("attendances")
        .select("id")
        .eq("ticket_id", ticketId)
        .eq("attendant_id", user.id)
        .is("ended_at", null)
        .order("called_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (!attendance) {
      return {
        ok: false,
        error:
          "Atendimento não encontrado.",
      };
    }

    const now = new Date().toISOString();

    await supabase
      .from("attendances")
      .update({
        ended_at: now,
        result_status: "completed",
        observation:
          observation?.trim() || null,
      })
      .eq("id", attendance.id);

    await supabase
      .from("tickets")
      .update({
        status: "completed",
      })
      .eq("id", ticketId);

    await supabase.from("attendance_events").insert({
      ticket_id: ticketId,
      event_type: "finished",
      actor_id: user.id,
      metadata: {
        observation:
          observation?.trim() || null,
      },
    });

    revalidatePath("/atendimento");
    revalidatePath("/painel");
    revalidatePath("/dashboard");
    revalidatePath("/historico");

    return { ok: true };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao finalizar atendimento.",
    };
  }
}

/* =========================================================
   NÃO COMPARECEU
   ========================================================= */

export async function noShowAction(
  ticketId: string
): Promise<ActionResult> {
  const user = await requireRole(
    "attendant",
    "admin"
  );

  const supabase = createSupabaseServerClient();

  try {
    const { data: attendance } =
      await supabase
        .from("attendances")
        .select("id")
        .eq("ticket_id", ticketId)
        .eq("attendant_id", user.id)
        .is("ended_at", null)
        .order("called_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (!attendance) {
      return {
        ok: false,
        error:
          "Atendimento não encontrado.",
      };
    }

    const now = new Date().toISOString();

    await supabase
      .from("attendances")
      .update({
        ended_at: now,
        result_status: "no_show",
      })
      .eq("id", attendance.id);

    await supabase
      .from("tickets")
      .update({
        status: "no_show",
      })
      .eq("id", ticketId);

    await supabase.from("attendance_events").insert({
      ticket_id: ticketId,
      event_type: "no_show",
      actor_id: user.id,
      metadata: {},
    });

    revalidatePath("/atendimento");
    revalidatePath("/painel");
    revalidatePath("/dashboard");
    revalidatePath("/historico");

    return { ok: true };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao registrar ausência.",
    };
  }
}

/* =========================================================
   CANCELAR
   ========================================================= */

export async function cancelTicketAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRole(
    "admin",
    "receptionist",
    "attendant"
  );

  const parsed = cancelTicketSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Dados inválidos.",
    };
  }

  const supabase = createSupabaseServerClient();

  try {
    await supabase
      .from("tickets")
      .update({
        status: "cancelled",
      })
      .eq("id", parsed.data.ticketId);

    await supabase.from("attendance_events").insert({
      ticket_id: parsed.data.ticketId,
      event_type: "cancelled",
      actor_id: user.id,
      metadata: {
        reason: parsed.data.reason,
      },
    });

    revalidatePath("/recepcao/filas");
    revalidatePath("/atendimento");
    revalidatePath("/painel");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao cancelar senha.",
    };
  }
}

/* =========================================================
   ALTERAR PRIORIDADE
   ========================================================= */

export async function changePriorityAction(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireRole(
    "admin",
    "receptionist"
  );

  const parsed = changePrioritySchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Dados inválidos.",
    };
  }

  const supabase = createSupabaseServerClient();

  try {
    await supabase
      .from("tickets")
      .update({
        priority: parsed.data.priority,
        priority_justification:
          parsed.data.justification || null,
      })
      .eq("id", parsed.data.ticketId);

    await supabase.from("attendance_events").insert({
      ticket_id: parsed.data.ticketId,
      event_type: "priority_changed",
      actor_id: user.id,
      metadata: {
        priority: parsed.data.priority,
        justification:
          parsed.data.justification || null,
      },
    });

    revalidatePath("/recepcao/filas");
    revalidatePath("/atendimento");
    revalidatePath("/painel");

    return { ok: true };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao alterar prioridade.",
    };
  }
}