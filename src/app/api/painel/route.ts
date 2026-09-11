import { NextResponse } from "next/server";
import { listLastCalls, getSector } from "@/lib/db/store";

// Endpoint somente leitura consumido pelo painel público via polling.
// Em produção, isso é substituído por uma subscription do Supabase Realtime
// nas tabelas `tickets`/`attendance_events` — a UI do painel não muda,
// apenas a fonte do evento (ver hooks/useRealtimeTickets.ts).
export async function GET() {
  const lastCalls = listLastCalls(8).map((c) => ({
    ...c,
    sectorName: getSector(c.sectorId)?.name ?? "",
  }));
  return NextResponse.json({ lastCalls });
}
