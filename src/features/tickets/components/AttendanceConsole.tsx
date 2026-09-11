"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { formatTime, STATUS_LABEL } from "@/lib/utils";
import { callNextAction, recallAction, startAction, finishAction, noShowAction } from "../actions";
import type { Sector, Ticket } from "@/types/database";

interface Props {
  sector: Sector;
  current: Ticket | null;
  queue: Ticket[];
}

export function AttendanceConsole({ sector, current, queue }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok && result.error) setError(result.error);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: sector.color }} />
        <span className="text-[13.5px] font-semibold">{sector.name}</span>
      </div>

      {error && <div className="bg-danger-light text-danger text-[13px] rounded-lg p-3 mb-4">{error}</div>}

      <div className="bg-surface border border-border rounded-md p-5 mb-5">
        <h3 className="text-[14.5px] font-bold mb-3">Atendimento atual</h3>

        {current ? (
          <div className="bg-gradient-to-b from-white to-primary-light rounded-xl border border-border p-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-display text-[38px] font-bold tabular-nums">{current.code}</div>
                <div className="text-[14px] font-semibold mt-1">{current.visitor_name}</div>
                <div className="text-[12.5px] text-ink-muted">
                  {current.visitor_type_label} · {current.reason || "Sem motivo informado"}
                </div>
                <div className="mt-2"><PriorityBadge priority={current.priority} /></div>
              </div>
              <StatusBadge status={current.status} />
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              {current.status === "called" && (
                <Button disabled={pending} onClick={() => run(() => startAction(current.id))}>Iniciar atendimento</Button>
              )}
              {current.status === "in_progress" && (
                <Button
                  disabled={pending}
                  onClick={() => {
                    const obs = window.prompt("Observação (opcional):", "") ?? "";
                    run(() => finishAction(current.id, obs));
                  }}
                >
                  Finalizar
                </Button>
              )}
              <Button variant="outline" disabled={pending} onClick={() => run(() => recallAction(current.id))}>Rechamar</Button>
              <Button variant="danger" disabled={pending} onClick={() => run(() => noShowAction(current.id))}>Não compareceu</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center py-7 text-ink-muted text-[13.5px]">Nenhum atendimento em andamento.</div>
            <Button
              size="lg"
              className="w-full"
              disabled={pending || queue.length === 0}
              onClick={() => run(() => callNextAction(sector.id))}
            >
              Chamar próximo {queue.length ? `(${queue[0].code})` : ""}
            </Button>
          </>
        )}
      </div>

      <div className="bg-surface border border-border rounded-md p-5">
        <h3 className="text-[14.5px] font-bold mb-3">Próximos na fila ({queue.length})</h3>
        <div className="flex flex-col gap-1.5">
          {queue.length ? (
            queue.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-3 py-2.5 border border-border rounded-lg text-[13px]">
                <div className="flex items-center gap-2.5">
                  <span className="font-display font-bold text-[14.5px] w-[62px] tabular-nums">{t.code}</span>
                  <span>{t.visitor_name}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
                <span className="text-ink-muted text-[12px]">{formatTime(t.created_at)}</span>
              </div>
            ))
          ) : (
            <div className="text-center text-[13px] text-ink-muted py-5">A fila está vazia.</div>
          )}
        </div>
      </div>
    </>
  );
}
