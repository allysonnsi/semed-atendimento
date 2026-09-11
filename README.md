# SEMED São José de Ribamar — Controle de Ordem de Chegada e Atendimento

Sistema web para a recepção da Secretaria Municipal de Educação organizar o
atendimento presencial: geração de senha por setor, filas, chamada de senha,
painel público (TV), dashboard, histórico e relatórios.

## Status deste pacote

Este projeto roda de duas formas, com o **mesmo código de UI e as mesmas
regras de negócio** nos dois casos:

| Modo | Como ativa | Dados |
|---|---|---|
| **Demonstração** (padrão) | Sem configurar nada | Em memória, no processo do servidor Next.js (`src/lib/db/store.ts`), com dados de exemplo (seed) |
| **Produção** | Preencher `.env.local` com as chaves do Supabase (ver `.env.example`) | PostgreSQL real, Supabase Auth, RLS e Realtime |

A troca entre os dois modos é só de **configuração** — os Server Actions em
`src/features/*/actions.ts` e as páginas em `src/app/` não mudam. O schema
SQL completo, com todas as constraints e as *policies* de RLS, já está
pronto em `supabase/migrations/0001_init.sql`, espelhando exatamente as
regras implementadas no modo demonstração.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000 — você será redirecionado para `/login`, onde pode
entrar como qualquer um dos 5 usuários de demonstração (Administrador,
Recepcionista, 2 Atendentes de setores diferentes, Gestor), sem senha.

Abra `http://localhost:3000/painel` em outra aba para ver o **painel
público**: ele atualiza sozinho (via polling a cada 2,5s no modo
demonstração; via Supabase Realtime no modo produção) sempre que uma senha
é chamada em `/atendimento`.

## Conectando o Supabase real

1. Crie um projeto em https://supabase.com
2. No SQL Editor do projeto, rode o conteúdo de `supabase/migrations/0001_init.sql`
3. Copie a "Project URL" e a "anon public key" (Settings → API)
4. Crie um arquivo `.env.local` na raiz com base em `.env.example`
5. `npm run dev` novamente — a página `/configuracoes` (como Administrador)
   mostra se o sistema detectou a conexão

Depois disso, o próximo passo de evolução é trocar a implementação de
`src/lib/db/store.ts` por chamadas equivalentes usando
`src/lib/supabase/server.ts` (o `@supabase/supabase-js` já está instalado e
os clients já estão prontos) — as assinaturas de função foram desenhadas
para isso.

## Estrutura do projeto

```
src/
  app/                     rotas (App Router)
    login/                 tela de login (demo)
    (app)/                 área autenticada (sidebar + topbar)
      dashboard/
      recepcao/novo-atendimento/
      recepcao/filas/
      atendimento/         dashboard do atendente
      historico/
      relatorios/
      setores/
      usuarios/
      configuracoes/
    painel/                painel público (TV) — rota pública
    api/painel/            polling do painel (modo demo)
    api/relatorios/csv/    exportação CSV
  components/
    ui/                    Button, Badge, Card, Field/Input/Select
    layout/                Sidebar, PageHeader
  features/
    tickets/               schema (zod), actions (server actions), components
    sectors/                idem
    users/                  idem
    auth/                   login/logout de demonstração
  lib/
    db/store.ts            camada de dados MOCK — todas as regras de negócio
    supabase/               clients reais (browser/server), prontos para uso
    auth/session.ts         sessão via cookie (trocar por Supabase Auth)
  middleware.ts             proteção de rotas
  types/database.ts         tipos espelhando o schema SQL
supabase/
  migrations/0001_init.sql  schema completo + RLS + índices + triggers de sequência
```

## Regras de negócio já implementadas (nos dois modos)

- Numeração de senha (`RH-023`) gerada por sequência atômica por setor/dia —
  nunca calculada no cliente.
- "Chamar próximo" usa update condicional (`status = 'waiting'`) para evitar
  que dois atendentes peguem a mesma senha.
- Mudança de prioridade exige justificativa e gera evento de auditoria.
- Toda mutação relevante (`created`, `called`, `recalled`, `started`,
  `completed`, `cancelled`, `no_show`, `priority_changed`) grava um evento em
  `attendance_events`.
- Rotas protegidas por papel tanto no middleware (checagem rápida de sessão)
  quanto no servidor (`requireRole` em cada Server Action/página — nunca
  confiar só no middleware/])

## Próximos passos sugeridos

1. Conectar o Supabase real e trocar `lib/db/store.ts` por `lib/db/supabase.ts`
2. Trocar a sessão de cookie simples por Supabase Auth (e-mail/senha ou magic link)
3. Trocar o polling do painel por uma subscription Realtime (`supabase.channel(...)`)
4. Testes E2E (Playwright) dos fluxos descritos no documento de arquitetura
