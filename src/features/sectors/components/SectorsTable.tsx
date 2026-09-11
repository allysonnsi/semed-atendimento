"use client";
import { useState, useTransition } from "react";
import { toggleSectorAction, addSectorAction } from "../actions";
import type { Sector } from "@/types/database";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export function SectorsTable({ sectors }: { sectors: Sector[] }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12.5px] text-ink-muted">{sectors.length} setores cadastrados</span>
        <Button onClick={() => setOpen(true)}>+ Novo setor</Button>
      </div>

      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11.5px] uppercase tracking-wide text-ink-muted border-b border-border">
              <th className="p-2.5">Setor</th><th className="p-2.5">Código</th><th className="p-2.5">Status</th><th className="p-2.5 text-right">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((s) => (
              <tr key={s.id} className="border-b border-[#EEF2EF] last:border-none">
                <td className="p-2.5">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </span>
                </td>
                <td className="p-2.5 tabular-nums">{s.code}</td>
                <td className="p-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[11.5px] font-semibold ${s.active ? "bg-primary-light text-primary" : "bg-danger-light text-danger"}`}>
                    {s.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="p-2.5 text-right">
                  <input
                    type="checkbox"
                    defaultChecked={s.active}
                    disabled={pending}
                    onChange={() => startTransition(() => toggleSectorAction(s.id))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-[15px] mb-3">Novo setor</h3>
            {error && <div className="bg-danger-light text-danger text-[12.5px] rounded-lg p-2.5 mb-3">{error}</div>}
            <form
              action={(fd) => {
                setError(null);
                startTransition(async () => {
                  const result = await addSectorAction(fd);
                  if (result && !result.ok) { setError(result.error ?? "Erro."); return; }
                  setOpen(false);
                });
              }}
            >
              <Field label="Nome do setor"><Input name="name" required placeholder="Ex.: Ouvidoria" /></Field>
              <Field label="Código (prefixo da senha)"><Input name="code" required maxLength={6} placeholder="Ex.: OUV" /></Field>
              <div className="flex justify-end gap-2 mt-3">
                <button type="button" onClick={() => setOpen(false)} className="px-3.5 py-2 text-[13px] rounded-lg border border-border">Cancelar</button>
                <Button type="submit" disabled={pending}>Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
