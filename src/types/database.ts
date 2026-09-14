// Tipos que espelham o schema em supabase/migrations/0001_init.sql
// Usados pelo sistema SEMED.

export type RoleKey = "admin" | "receptionist" | "attendant";

export type TicketStatus =
  | "waiting"
  | "called"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type TicketPriority = "normal" | "priority" | "urgent";

export type EventType =
  | "created"
  | "called"
  | "recalled"
  | "started"
  | "completed"
  | "cancelled"
  | "no_show"
  | "priority_changed";

export interface Role {
  id: string;
  key: RoleKey;
  label: string;
}

export interface Sector {
  id: string;
  name: string;
  code: string;
  description: string | null;
  color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role_id: string;
  role_key: RoleKey;
  sector_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VisitorType {
  id: string;
  label: string;
  active: boolean;
}

export interface Visitor {
  id: string;
  full_name: string;
  document: string | null;
  phone: string | null;
  institution: string | null;
  visitor_type_id: string;
  visitor_type_label?: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  code: string;
  sequence_number: number;
  ticket_date: string;
  sector_id: string;
  visitor_id: string;
  visitor_name: string;
  visitor_type_label: string;
  reason: string | null;
  notes: string | null;
  priority: TicketPriority;
  priority_justification: string | null;
  status: TicketStatus;
  created_by: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  ticket_id: string;
  attendant_id: string;
  called_at: string;
  recall_count: number;
  started_at: string | null;
  ended_at: string | null;
  result_status:
    | "completed"
    | "cancelled"
    | "no_show"
    | null;
  observation: string | null;
}

export interface AttendanceEvent {
  id: string;
  ticket_id: string;
  event_type: EventType;
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: unknown;
  updated_by: string | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}