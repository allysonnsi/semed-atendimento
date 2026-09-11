"use server";
import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth/session";
import {
  createTicket,
  callNextTicket,
  recallTicket,
  startTicket,
  finishTicket,
  noShowTicket,
  cancelTicket,
  changeTicketPriority,
} from "@/lib/db/store";
import { createTicketSchema, cancelTicketSchema, changePrioritySchema } from "./schema";

export interface ActionResult {
  ok: boolean;
  error?: string;
  ticketCode?: string;
}

// Toda regra crítica é revalidada aqui no servidor — nunca confiamos no
// payload do cliente para decidir setor, sequência de senha ou permissão.
export async function createTicketAction(formData: FormData): Promise<ActionResult> {
  const user = requireRole("admin", "receptionist");

  const raw = Object.fromEntries(formData.entries());
  const parsed = createTicketSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const ticket = createTicket({ ...parsed.data, createdBy: user.id });
    revalidatePath("/recepcao/novo-atendimento");
    revalidatePath("/recepcao/filas");
    revalidatePath("/dashboard");
    return { ok: true, ticketCode: ticket.code };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao gerar senha." };
  }
}

export async function callNextAction(sectorId: string): Promise<ActionResult> {
  const user = requireRole("attendant", "admin");
  if (user.role_key === "attendant" && user.sector_id !== sectorId) {
    return { ok: false, error: "Você não tem permissão para chamar senhas deste setor." };
  }
  const ticket = callNextTicket(sectorId, user.id);
  revalidatePath("/atendimento");
  revalidatePath("/painel");
  if (!ticket) return { ok: false, error: "Não há ninguém aguardando neste setor." };
  return { ok: true, ticketCode: ticket.code };
}

export async function recallAction(ticketId: string): Promise<ActionResult> {
  const user = requireRole("attendant", "admin");
  recallTicket(ticketId, user.id);
  revalidatePath("/atendimento");
  revalidatePath("/painel");
  return { ok: true };
}

export async function startAction(ticketId: string): Promise<ActionResult> {
  const user = requireRole("attendant", "admin");
  startTicket(ticketId, user.id);
  revalidatePath("/atendimento");
  return { ok: true };
}

export async function finishAction(ticketId: string, observation?: string): Promise<ActionResult> {
  const user = requireRole("attendant", "admin");
  finishTicket(ticketId, user.id, observation);
  revalidatePath("/atendimento");
  revalidatePath("/dashboard");
  revalidatePath("/historico");
  return { ok: true };
}

export async function noShowAction(ticketId: string): Promise<ActionResult> {
  const user = requireRole("attendant", "admin");
  noShowTicket(ticketId, user.id);
  revalidatePath("/atendimento");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function cancelTicketAction(formData: FormData): Promise<ActionResult> {
  const user = requireRole("admin", "receptionist", "attendant");
  const parsed = cancelTicketSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  cancelTicket(parsed.data.ticketId, user.id, parsed.data.reason);
  revalidatePath("/recepcao/filas");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function changePriorityAction(formData: FormData): Promise<ActionResult> {
  const user = requireRole("admin", "receptionist");
  const parsed = changePrioritySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  changeTicketPriority(parsed.data.ticketId, parsed.data.priority, parsed.data.justification ?? "", user.id);
  revalidatePath("/recepcao/filas");
  return { ok: true };
}
