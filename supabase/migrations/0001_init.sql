-- ============================================================================
-- SEMED São José de Ribamar — Controle de Ordem de Chegada e Atendimento
-- Migration 0001: schema inicial, constraints, índices e RLS
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ROLES
-- ---------------------------------------------------------------------------
create table roles (
  id uuid primary key default gen_random_uuid(),
  key text unique not null check (key in ('admin','receptionist','attendant','manager')),
  label text not null,
  permissions jsonb not null default '{}'::jsonb
);

insert into roles (key, label) values
  ('admin', 'Administrador'),
  ('receptionist', 'Recepcionista'),
  ('attendant', 'Atendente'),
  ('manager', 'Gestor');

-- ---------------------------------------------------------------------------
-- SECTORS
-- ---------------------------------------------------------------------------
create table sectors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  color text not null default '#1F6E4A',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sectors_active on sectors(active);

-- ---------------------------------------------------------------------------
-- PROFILES (estende auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role_id uuid not null references roles(id),
  sector_id uuid references sectors(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendant_requires_sector check (
    (select key from roles where id = role_id) is distinct from 'attendant'
    or sector_id is not null
  )
);

create index idx_profiles_role on profiles(role_id);
create index idx_profiles_sector on profiles(sector_id);

-- ---------------------------------------------------------------------------
-- VISITOR TYPES
-- ---------------------------------------------------------------------------
create table visitor_types (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  active boolean not null default true
);

insert into visitor_types (label) values
  ('Pai/Responsável'), ('Professor'), ('Gestor'), ('Coordenador'), ('Servidor'),
  ('Aluno'), ('Representante de escola'), ('Fornecedor'), ('Visitante'), ('Outro');

-- ---------------------------------------------------------------------------
-- VISITORS
-- ---------------------------------------------------------------------------
create table visitors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  document text,
  phone text,
  institution text,
  visitor_type_id uuid references visitor_types(id),
  created_at timestamptz not null default now()
);

create index idx_visitors_document on visitors(document) where document is not null;

-- ---------------------------------------------------------------------------
-- TICKETS (a "senha")
-- ---------------------------------------------------------------------------
create table tickets (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  sequence_number int not null,
  ticket_date date not null default current_date,
  sector_id uuid not null references sectors(id),
  visitor_id uuid not null references visitors(id),
  reason text,
  notes text,
  priority text not null default 'normal' check (priority in ('normal','priority','urgent')),
  priority_justification text,
  status text not null default 'waiting'
    check (status in ('waiting','called','in_progress','completed','cancelled','no_show')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  constraint priority_requires_justification check (
    priority = 'normal' or (priority_justification is not null and length(priority_justification) > 0)
  ),
  unique (sector_id, ticket_date, sequence_number)
);

create index idx_tickets_sector_status on tickets(sector_id, status, created_at);
create index idx_tickets_date_sector on tickets(ticket_date, sector_id);
create index idx_tickets_status on tickets(status);

-- Atomic sequence generation per sector/day — never trust the client for this.
create or replace function next_ticket_sequence(p_sector_id uuid, p_date date)
returns int
language plpgsql
security definer
as $$
declare
  v_next int;
begin
  select coalesce(max(sequence_number), 0) + 1 into v_next
  from tickets
  where sector_id = p_sector_id and ticket_date = p_date
  for update;
  return v_next;
end;
$$;

-- ---------------------------------------------------------------------------
-- ATTENDANCES
-- ---------------------------------------------------------------------------
create table attendances (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  attendant_id uuid not null references profiles(id),
  called_at timestamptz not null default now(),
  recall_count int not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  result_status text check (result_status in ('completed','cancelled','no_show')),
  observation text
);

create index idx_attendances_ticket on attendances(ticket_id);
create index idx_attendances_attendant on attendances(attendant_id, ended_at);

-- ---------------------------------------------------------------------------
-- ATTENDANCE EVENTS (auditoria de negócio / timeline do ticket)
-- ---------------------------------------------------------------------------
create table attendance_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  event_type text not null check (event_type in
    ('created','called','recalled','started','completed','cancelled','no_show','priority_changed')),
  actor_id uuid references profiles(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_events_ticket_time on attendance_events(ticket_id, created_at);

-- ---------------------------------------------------------------------------
-- SYSTEM SETTINGS
-- ---------------------------------------------------------------------------
create table system_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

insert into system_settings (key, value) values
  ('require_document', 'false'),
  ('no_show_timeout_minutes', '15'),
  ('institution_name', '"SEMED São José de Ribamar"');

-- ---------------------------------------------------------------------------
-- AUDIT LOGS (segurança / sistema)
-- ---------------------------------------------------------------------------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index idx_audit_actor_time on audit_logs(actor_id, created_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table sectors enable row level security;
alter table profiles enable row level security;
alter table visitor_types enable row level security;
alter table visitors enable row level security;
alter table tickets enable row level security;
alter table attendances enable row level security;
alter table attendance_events enable row level security;
alter table system_settings enable row level security;
alter table audit_logs enable row level security;

-- Helper: current user's role key and sector
create or replace function current_role_key() returns text
language sql stable security definer as $$
  select r.key from profiles p join roles r on r.id = p.role_id where p.id = auth.uid();
$$;

create or replace function current_sector_id() returns uuid
language sql stable security definer as $$
  select p.sector_id from profiles p where p.id = auth.uid();
$$;

-- sectors: readable by all authenticated; writable by admin only
create policy sectors_select on sectors for select using (auth.role() = 'authenticated');
create policy sectors_write on sectors for all using (current_role_key() = 'admin') with check (current_role_key() = 'admin');

-- profiles: self read/update; admin full access
create policy profiles_self_select on profiles for select using (id = auth.uid() or current_role_key() in ('admin','manager'));
create policy profiles_self_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_write on profiles for all using (current_role_key() = 'admin') with check (current_role_key() = 'admin');

-- visitor_types: read all, write admin
create policy visitor_types_select on visitor_types for select using (auth.role() = 'authenticated');
create policy visitor_types_write on visitor_types for all using (current_role_key() = 'admin') with check (current_role_key() = 'admin');

-- visitors: staff can read/insert (receptionist/admin), attendants read for own sector via join not modeled here directly
create policy visitors_select on visitors for select using (auth.role() = 'authenticated');
create policy visitors_insert on visitors for insert with check (current_role_key() in ('admin','receptionist'));

-- tickets: admin/manager/receptionist see all; attendant sees only own sector
create policy tickets_select on tickets for select using (
  current_role_key() in ('admin','manager','receptionist')
  or (current_role_key() = 'attendant' and sector_id = current_sector_id())
);
create policy tickets_insert on tickets for insert with check (current_role_key() in ('admin','receptionist'));
create policy tickets_update_staff on tickets for update using (
  current_role_key() in ('admin','receptionist')
  or (current_role_key() = 'attendant' and sector_id = current_sector_id())
);

-- attendances: attendant of the sector, admin
create policy attendances_select on attendances for select using (
  current_role_key() in ('admin','manager')
  or attendant_id = auth.uid()
);
create policy attendances_write on attendances for all using (
  current_role_key() = 'admin' or attendant_id = auth.uid()
) with check (
  current_role_key() = 'admin' or attendant_id = auth.uid()
);

-- attendance_events: read for staff, insert via security-definer functions only in practice
create policy events_select on attendance_events for select using (auth.role() = 'authenticated');
create policy events_insert on attendance_events for insert with check (auth.role() = 'authenticated');

-- system_settings: read all, write admin
create policy settings_select on system_settings for select using (auth.role() = 'authenticated');
create policy settings_write on system_settings for all using (current_role_key() = 'admin') with check (current_role_key() = 'admin');

-- audit_logs: insert by any authenticated (server-side), select admin only
create policy audit_insert on audit_logs for insert with check (auth.role() = 'authenticated');
create policy audit_select on audit_logs for select using (current_role_key() = 'admin');

-- ============================================================================
-- REALTIME
-- ============================================================================
alter publication supabase_realtime add table tickets;
alter publication supabase_realtime add table attendance_events;
