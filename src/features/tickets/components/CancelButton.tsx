"use client";
import { useState, useTransition } from "react";
import { cancelTicketAction } from "../actions";

export function CancelButton({ ticketId }: { ticketId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-ink-muted hover:text-danger p-1.5" aria-label="Cancelar atendimento">
        ✕
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-[15px] mb-1">Cancelar atendimento</h3>
        <p className="text-[12.5px] text-ink-muted mb-3">Informe o motivo — fica registrado na auditoria.</p>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-[13px] mb-3"
          placeholder="Motivo do cancelamento"
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-[13px] rounded-lg border border-border">Voltar</button>
          <button
            disabled={!reason || pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("ticketId", ticketId);
              fd.set("reason", reason);
              startTransition(async () => {
                await cancelTicketAction(fd);
                setOpen(false);
              });
            }}
            className="px-3 py-1.5 text-[13px] rounded-lg bg-danger text-white disabled:opacity-40"
          >
            Confirmar cancelamento
          </button>
        </div>
      </div>
    </div>
  );
}
