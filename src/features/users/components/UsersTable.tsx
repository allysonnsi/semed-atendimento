"use client";
import { useState, useTransition } from "react";
import { addUserAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { ROLE_LABEL } from "@/lib/constants";
import type { Profile, Sector, RoleKey } from "@/types/database";

export function UsersTable({ users, sectors }: { users: Profile[]; sectors: Sector[] }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<RoleKey>("receptionist");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12.5px] text-ink-muted">{users.length} usuários cadastrados</span>
        <Button onClick={() => setOpen(true)}>+ Novo usuário</Button>
      </div>

      <div className="bg-surface border border-border rounded-md overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11.5px] uppercase tracking-wide text-ink-muted border-b border-border">
              <th className="p-2.5">Nome</th><th className="p-2.5">Perfil</th><th className="p-2.5">Setor</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[#EEF2EF] last:border-none">
                <td className="p-2.5">{u.full_name}</td>
                <td className="p-2.5">{ROLE_LABEL[u.role_key]}</td>
                <td className="p-2.5">{u.sector_id ? sectors.find((s) => s.id === u.sector_id)?.name : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-5" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-[15px] mb-3">Novo usuário</h3>
            {error && <div className="bg-danger-light text-danger text-[12.5px] rounded-lg p-2.5 mb-3">{error}</div>}
            <form
              action={(fd) => {
                setError(null);
                startTransition(async () => {
                  const result = await addUserAction(fd);
                  if (result && !result.ok) { setError(result.error ?? "Erro."); return; }
                  setOpen(false);
                });
              }}
            >
              <Field label="Nome completo"><Input name="fullName" required /></Field>
              <Field label="Perfil">
                <Select name="roleKey" value={role} onChange={(e) => setRole(e.target.value as RoleKey)}>
                  {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              {role === "attendant" && (
                <Field label="Setor">
                  <Select name="sectorId" required defaultValue="">
                    <option value="" disabled>Selecione...</option>
                    {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </Field>
              )}
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
