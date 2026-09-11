// ============================================================================
// Camada de dados — implementação MOCK (em memória, processo único).
//
// Esta camada implementa exatamente as mesmas regras de negócio que a
// migration SQL (supabase/migrations/0001_init.sql) e as policies de RLS
// descrevem — geração atômica de sequência, update condicional em
// "callNext", justificativa obrigatória para prioridade, e log de auditoria
// em toda mutação sensível — para que trocar esta implementação por uma
// que usa `@supabase/supabase-js` (ver lib/supabase/*) não exija reescrever
// nenhuma regra, apenas a fonte dos dados. Ver lib/db/index.ts.
// ============================================================================
import "server-only";
import { randomUUID } from "crypto";
import type {
  Sector,
  Profile,
  RoleKey,
  VisitorType,
  Visitor,
  Ticket,
  Attendance,
  AttendanceEvent,
  AuditLog,
  TicketPriority,
} from "@/types/database";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface Store {
  sectors: Sector[];
  profiles: Profile[];
  visitorTypes: VisitorType[];
  visitors: Visitor[];
  tickets: Ticket[];
  attendances: Attendance[];
  events: AttendanceEvent[];
  auditLogs: AuditLog[];
}

const g = globalThis as unknown as { __semedStore?: Store };

function seed(): Store {
  const now = new Date().toISOString();
  const sectors: Sector[] = [
    { id: "sec-rh", name: "Recursos Humanos", code: "RH", description: null, color: "#1F6E4A", active: true, created_at: now, updated_at: now },
    { id: "sec-pr", name: "Protocolo", code: "PR", description: null, color: "#2A5FA8", active: true, created_at: now, updated_at: now },
    { id: "sec-ge", name: "Gestão Escolar", code: "GE", description: null, color: "#C98A2C", active: true, created_at: now, updated_at: now },
    { id: "sec-ped", name: "Coordenação Pedagógica", code: "PED", description: null, color: "#7A4FB0", active: true, created_at: now, updated_at: now },
    { id: "sec-tra", name: "Transporte Escolar", code: "TRA", description: null, color: "#3A8FA0", active: true, created_at: now, updated_at: now },
    { id: "sec-fin", name: "Financeiro", code: "FIN", description: null, color: "#B23B3B", active: true, created_at: now, updated_at: now },
    { id: "sec-adm", name: "Administrativo", code: "ADM", description: null, color: "#5B6B62", active: false, created_at: now, updated_at: now },
  ];

  const profiles: Profile[] = [
    { id: "u-admin", full_name: "Ana Beatriz Ribeiro", role_id: "role-admin", role_key: "admin", sector_id: null, active: true, created_at: now, updated_at: now },
    { id: "u-recep", full_name: "Carlos Eduardo Souza", role_id: "role-receptionist", role_key: "receptionist", sector_id: null, active: true, created_at: now, updated_at: now },
    { id: "u-att-rh", full_name: "Marina Alves Costa", role_id: "role-attendant", role_key: "attendant", sector_id: "sec-rh", active: true, created_at: now, updated_at: now },
    { id: "u-att-ped", full_name: "João Pedro Lima", role_id: "role-attendant", role_key: "attendant", sector_id: "sec-ped", active: true, created_at: now, updated_at: now },
    { id: "u-gestor", full_name: "Fernanda Oliveira", role_id: "role-manager", role_key: "manager", sector_id: null, active: true, created_at: now, updated_at: now },
  ];

  const visitorTypes: VisitorType[] = [
    "Pai/Responsável", "Professor", "Gestor", "Coordenador", "Servidor",
    "Aluno", "Representante de escola", "Fornecedor", "Visitante", "Outro",
  ].map((label) => ({ id: "vt-" + label.toLowerCase().replace(/[^a-z]+/g, "-"), label, active: true }));

  const visitors: Visitor[] = [];
  const tickets: Ticket[] = [];
  const attendances: Attendance[] = [];
  const events: AttendanceEvent[] = [];

  const names = ["Maria da Silva", "José Ferreira", "Patrícia Nunes", "Antônio Gomes", "Luciana Rocha",
    "Roberto Dias", "Camila Teixeira", "Eduardo Martins", "Sandra Melo", "Bruno Cardoso", "Aline Barros", "Felipe Araújo"];
  const reasons = ["Dúvida sobre matrícula", "Entrega de documentos", "Solicitação de transferência",
    "Atendimento pedagógico", "Questão salarial", "Requerimento administrativo", "Reunião agendada", "Encaminhamento"];

  const seq: Record<string, number> = {};
  const activeSectors = sectors.filter((s) => s.active);
  activeSectors.forEach((s) => (seq[s.id] = 0));

  const nowMs = Date.now();
  for (let i = 0; i < 16; i++) {
    const sector = activeSectors[i % activeSectors.length];
    seq[sector.id]++;
    const visitorId = "v-" + randomUUID();
    const vt = visitorTypes[i % visitorTypes.length];
    visitors.push({
      id: visitorId,
      full_name: names[i % names.length],
      document: null,
      phone: null,
      institution: null,
      visitor_type_id: vt.id,
      visitor_type_label: vt.label,
      created_at: new Date(nowMs - (16 - i) * 9 * 60000).toISOString(),
    });

    const createdAt = new Date(nowMs - (16 - i) * 9 * 60000);
    const status: Ticket["status"] =
      i < 10 ? "completed" : i < 13 ? "waiting" : i < 15 ? "called" : "no_show";
    const startedAt = status === "completed" ? new Date(createdAt.getTime() + 6 * 60000) : null;
    const endedAt = status === "completed" ? new Date(startedAt!.getTime() + (5 + Math.random() * 10) * 60000) : null;
    const priority: TicketPriority = i === 12 ? "urgent" : i === 7 ? "priority" : "normal";

    const ticketId = "t-" + randomUUID();
    tickets.push({
      id: ticketId,
      code: `${sector.code}-${String(seq[sector.id]).padStart(3, "0")}`,
      sequence_number: seq[sector.id],
      ticket_date: todayISO(),
      sector_id: sector.id,
      visitor_id: visitorId,
      visitor_name: names[i % names.length],
      visitor_type_label: vt.label,
      reason: reasons[i % reasons.length],
      notes: null,
      priority,
      priority_justification: priority !== "normal" ? "Idoso / situação de saúde relatada" : null,
      status,
      created_by: "u-recep",
      created_at: createdAt.toISOString(),
    });

    if (status !== "waiting") {
      const attendantId = sector.id === "sec-rh" ? "u-att-rh" : "u-att-ped";
      attendances.push({
        id: "a-" + randomUUID(),
        ticket_id: ticketId,
        attendant_id: attendantId,
        called_at: new Date(createdAt.getTime() + 4 * 60000).toISOString(),
        recall_count: 0,
        started_at: startedAt ? startedAt.toISOString() : null,
        ended_at: endedAt ? endedAt.toISOString() : null,
        result_status: status === "completed" ? "completed" : status === "no_show" ? "no_show" : null,
        observation: null,
      });
    }
  }

  return { sectors, profiles, visitorTypes, visitors, tickets, attendances, events, auditLogs: [] };
}

function getStore(): Store {
  if (!g.__semedStore) g.__semedStore = seed();
  return g.__semedStore;
}

// ---------------------------------------------------------------------------
// Leituras
// ---------------------------------------------------------------------------
export function listSectors(): Sector[] {
  return [...getStore().sectors];
}
export function listActiveSectors(): Sector[] {
  return getStore().sectors.filter((s) => s.active);
}
export function getSector(id: string): Sector | undefined {
  return getStore().sectors.find((s) => s.id === id);
}
export function listProfiles(): Profile[] {
  return [...getStore().profiles];
}
export function getProfile(id: string): Profile | undefined {
  return getStore().profiles.find((p) => p.id === id);
}
export function listVisitorTypes(): VisitorType[] {
  return getStore().visitorTypes.filter((v) => v.active);
}
export function listTicketsToday(): Ticket[] {
  const today = todayISO();
  return getStore().tickets.filter((t) => t.ticket_date === today);
}
export function listAllTickets(): Ticket[] {
  return [...getStore().tickets].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}
export function listAttendances(): Attendance[] {
  return [...getStore().attendances];
}
export function getAttendanceForTicket(ticketId: string): Attendance | undefined {
  return getStore().attendances.find((a) => a.ticket_id === ticketId);
}
export function listRecentEvents(limit = 8): AttendanceEvent[] {
  return [...getStore().events].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, limit);
}
export function listLastCalls(limit = 8) {
  const events = [...getStore().events]
    .filter((e) => e.event_type === "called" || e.event_type === "recalled")
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, limit);
  return events.map((e) => {
    const ticket = getStore().tickets.find((t) => t.id === e.ticket_id)!;
    return { ticketId: ticket.id, code: ticket.code, sectorId: ticket.sector_id, calledAt: e.created_at };
  });
}

// ---------------------------------------------------------------------------
// Escritas / regras de negócio
// ---------------------------------------------------------------------------
function priorityWeight(p: TicketPriority) {
  return p === "urgent" ? 0 : p === "priority" ? 1 : 2;
}

export function logEvent(ticketId: string, eventType: AttendanceEvent["event_type"], actorId: string | null, metadata: Record<string, unknown> = {}) {
  getStore().events.push({
    id: "ev-" + randomUUID(),
    ticket_id: ticketId,
    event_type: eventType,
    actor_id: actorId,
    metadata,
    created_at: new Date().toISOString(),
  });
}

export function logAudit(actorId: string | null, action: string, entity: string, entityId: string | null, metadata: Record<string, unknown> = {}) {
  getStore().auditLogs.push({
    id: "aud-" + randomUUID(),
    actor_id: actorId,
    action,
    entity,
    entity_id: entityId,
    metadata,
    created_at: new Date().toISOString(),
  });
}

export interface CreateTicketInput {
  visitorName: string;
  visitorTypeId: string;
  document?: string;
  phone?: string;
  institution?: string;
  sectorId: string;
  reason?: string;
  notes?: string;
  priority: TicketPriority;
  priorityJustification?: string;
  createdBy: string;
}

export function createTicket(input: CreateTicketInput): Ticket {
  const store = getStore();
  const sector = store.sectors.find((s) => s.id === input.sectorId);
  if (!sector || !sector.active) throw new Error("Setor inválido ou inativo.");
  if (input.priority !== "normal" && !input.priorityJustification) {
    throw new Error("Justificativa obrigatória para atendimento com prioridade.");
  }

  const vt = store.visitorTypes.find((v) => v.id === input.visitorTypeId);
  const visitor: Visitor = {
    id: "v-" + randomUUID(),
    full_name: input.visitorName,
    document: input.document || null,
    phone: input.phone || null,
    institution: input.institution || null,
    visitor_type_id: input.visitorTypeId,
    visitor_type_label: vt?.label,
    created_at: new Date().toISOString(),
  };
  store.visitors.push(visitor);

  // Geração atômica de sequência por setor/dia (equivalente à função SQL next_ticket_sequence)
  const today = todayISO();
  const existing = store.tickets.filter((t) => t.sector_id === sector.id && t.ticket_date === today);
  const seq = (existing.length ? Math.max(...existing.map((t) => t.sequence_number)) : 0) + 1;

  const ticket: Ticket = {
    id: "t-" + randomUUID(),
    code: `${sector.code}-${String(seq).padStart(3, "0")}`,
    sequence_number: seq,
    ticket_date: today,
    sector_id: sector.id,
    visitor_id: visitor.id,
    visitor_name: visitor.full_name,
    visitor_type_label: vt?.label ?? "",
    reason: input.reason || null,
    notes: input.notes || null,
    priority: input.priority,
    priority_justification: input.priorityJustification || null,
    status: "waiting",
    created_by: input.createdBy,
    created_at: new Date().toISOString(),
  };
  store.tickets.push(ticket);
  logEvent(ticket.id, "created", input.createdBy, { sectorId: sector.id });
  logAudit(input.createdBy, "ticket_created", "tickets", ticket.id, { code: ticket.code });
  return ticket;
}

export function callNextTicket(sectorId: string, attendantId: string): Ticket | null {
  const store = getStore();
  const today = todayISO();
  const queue = store.tickets
    .filter((t) => t.sector_id === sectorId && t.ticket_date === today && t.status === "waiting")
    .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority) || (a.created_at < b.created_at ? -1 : 1));
  if (!queue.length) return null;

  const target = queue[0];
  // Update condicional — só afeta se ainda está "waiting" (evita 2 atendentes pegarem a mesma senha)
  const idx = store.tickets.findIndex((t) => t.id === target.id && t.status === "waiting");
  if (idx === -1) return null;
  store.tickets[idx] = { ...store.tickets[idx], status: "called" };

  store.attendances.push({
    id: "a-" + randomUUID(),
    ticket_id: target.id,
    attendant_id: attendantId,
    called_at: new Date().toISOString(),
    recall_count: 0,
    started_at: null,
    ended_at: null,
    result_status: null,
    observation: null,
  });
  logEvent(target.id, "called", attendantId, {});
  return store.tickets[idx];
}

export function recallTicket(ticketId: string, actorId: string) {
  const store = getStore();
  const att = store.attendances.find((a) => a.ticket_id === ticketId);
  if (!att) throw new Error("Atendimento não encontrado.");
  att.recall_count += 1;
  att.called_at = new Date().toISOString();
  logEvent(ticketId, "recalled", actorId, { count: att.recall_count });
}

export function startTicket(ticketId: string, actorId: string) {
  const store = getStore();
  const t = store.tickets.find((t) => t.id === ticketId);
  if (!t) throw new Error("Senha não encontrada.");
  t.status = "in_progress";
  const att = store.attendances.find((a) => a.ticket_id === ticketId);
  if (att) att.started_at = new Date().toISOString();
  logEvent(ticketId, "started", actorId, {});
}

export function finishTicket(ticketId: string, actorId: string, observation?: string) {
  const store = getStore();
  const t = store.tickets.find((t) => t.id === ticketId);
  if (!t) throw new Error("Senha não encontrada.");
  t.status = "completed";
  const att = store.attendances.find((a) => a.ticket_id === ticketId);
  if (att) {
    att.ended_at = new Date().toISOString();
    att.result_status = "completed";
    if (observation) att.observation = observation;
  }
  logEvent(ticketId, "completed", actorId, {});
}

export function noShowTicket(ticketId: string, actorId: string) {
  const store = getStore();
  const t = store.tickets.find((t) => t.id === ticketId);
  if (!t) throw new Error("Senha não encontrada.");
  t.status = "no_show";
  const att = store.attendances.find((a) => a.ticket_id === ticketId);
  if (att) att.result_status = "no_show";
  logEvent(ticketId, "no_show", actorId, {});
}

export function cancelTicket(ticketId: string, actorId: string, reason?: string) {
  const store = getStore();
  const t = store.tickets.find((t) => t.id === ticketId);
  if (!t) throw new Error("Senha não encontrada.");
  t.status = "cancelled";
  t.notes = (t.notes ? t.notes + " — " : "") + "Cancelado: " + (reason || "sem motivo informado");
  logEvent(ticketId, "cancelled", actorId, { reason });
}

export function changeTicketPriority(ticketId: string, priority: TicketPriority, justification: string, actorId: string) {
  if (priority !== "normal" && !justification) throw new Error("Justificativa obrigatória.");
  const store = getStore();
  const t = store.tickets.find((t) => t.id === ticketId);
  if (!t) throw new Error("Senha não encontrada.");
  const from = t.priority;
  t.priority = priority;
  t.priority_justification = justification || null;
  logEvent(ticketId, "priority_changed", actorId, { from, to: priority, justification });
}

export function toggleSector(sectorId: string, actorId: string) {
  const store = getStore();
  const s = store.sectors.find((s) => s.id === sectorId);
  if (!s) throw new Error("Setor não encontrado.");
  s.active = !s.active;
  s.updated_at = new Date().toISOString();
  logAudit(actorId, "sector_updated", "sectors", sectorId, { active: s.active });
}

export function addSector(name: string, code: string, actorId: string): Sector {
  const store = getStore();
  if (store.sectors.some((s) => s.code.toLowerCase() === code.toLowerCase())) {
    throw new Error("Já existe um setor com esse código.");
  }
  const now = new Date().toISOString();
  const sector: Sector = {
    id: "sec-" + randomUUID(),
    name,
    code: code.toUpperCase(),
    description: null,
    color: "#1F6E4A",
    active: true,
    created_at: now,
    updated_at: now,
  };
  store.sectors.push(sector);
  logAudit(actorId, "sector_created", "sectors", sector.id, { name, code });
  return sector;
}

export function addUser(fullName: string, roleKey: RoleKey, sectorId: string | null, actorId: string): Profile {
  const store = getStore();
  const now = new Date().toISOString();
  const profile: Profile = {
    id: "u-" + randomUUID(),
    full_name: fullName,
    role_id: "role-" + roleKey,
    role_key: roleKey,
    sector_id: roleKey === "attendant" ? sectorId : null,
    active: true,
    created_at: now,
    updated_at: now,
  };
  store.profiles.push(profile);
  logAudit(actorId, "user_created", "profiles", profile.id, { roleKey });
  return profile;
}

export function getAuditLogs(): AuditLog[] {
  return [...getStore().auditLogs].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}
