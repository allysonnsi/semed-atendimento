import { NextResponse } from "next/server";
import { listTicketsToday, getSector } from "@/lib/db/store";
import { requireRole } from "@/lib/auth/session";
import { STATUS_LABEL, formatTime } from "@/lib/utils";

export async function GET() {
  requireRole("admin", "manager");
  const tickets = listTicketsToday();
  const rows = [["Senha", "Nome", "Setor", "Tipo", "Status", "Chegada"].join(",")];
  tickets.forEach((t) => {
    rows.push([t.code, t.visitor_name, getSector(t.sector_id)?.name ?? "", t.visitor_type_label, STATUS_LABEL[t.status], formatTime(t.created_at)].join(","));
  });
  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=relatorio_atendimentos.csv",
    },
  });
}
