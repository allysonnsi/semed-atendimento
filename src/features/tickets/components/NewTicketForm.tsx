"use client";
import { useState, useTransition } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { createTicketAction } from "../actions";
import type { Sector, VisitorType } from "@/types/database";

export function NewTicketForm({ sectors, visitorTypes }: { sectors: Sector[]; visitorTypes: VisitorType[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ code: string; sector: string; time: string; name: string } | null>(null);
  const [priority, setPriority] = useState("normal");

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTicketAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Não foi possível gerar a senha.");
        return;
      }
      const sectorId = formData.get("sectorId") as string;
      const sector = sectors.find((s) => s.id === sectorId);
      setConfirmation({
        code: result.ticketCode!,
        sector: sector?.name ?? "",
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        name: formData.get("visitorName") as string,
      });
      setPriority("normal");
      const form = document.getElementById("ticket-form") as HTMLFormElement;
      form?.reset();
    });
  }

  return (
    <div className="max-w-2xl">
      {confirmation && (
        <div className="bg-primary-light rounded-xl p-5 mb-5 relative">
          <button
            onClick={() => setConfirmation(null)}
            className="absolute top-4 right-4 text-primary-dark/60 hover:text-primary-dark"
            aria-label="Fechar confirmação"
          >
            ✕
          </button>
          <div className="text-[12.5px] font-semibold text-primary-dark mb-1">Atendimento registrado com sucesso!</div>
          <div className="font-display text-[32px] font-bold text-primary-dark tabular-nums">{confirmation.code}</div>
          <div className="grid grid-cols-3 gap-4 mt-2.5">
            <div><span className="block text-[11px] text-ink-muted">Setor</span><b className="text-[13.5px]">{confirmation.sector}</b></div>
            <div><span className="block text-[11px] text-ink-muted">Horário</span><b className="text-[13.5px]">{confirmation.time}</b></div>
            <div><span className="block text-[11px] text-ink-muted">Visitante</span><b className="text-[13.5px]">{confirmation.name}</b></div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-danger-light text-danger text-[13px] rounded-lg p-3 mb-4">{error}</div>
      )}

      <form id="ticket-form" action={handleSubmit} className="bg-surface border border-border rounded-md p-6">
        <h3 className="text-[14.5px] font-bold mb-4">Dados do visitante</h3>

        <div className="grid grid-cols-2 gap-x-3.5">
          <Field label="Nome completo *">
            <Input name="visitorName" required placeholder="Ex.: Maria da Silva" />
          </Field>
          <Field label="Tipo de visitante *">
            <Select name="visitorTypeId" required defaultValue="">
              <option value="" disabled>Selecione...</option>
              {visitorTypes.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-x-3.5">
          <Field label="CPF / documento" hint="Opcional">
            <Input name="document" placeholder="000.000.000-00" />
          </Field>
          <Field label="Telefone" hint="Opcional">
            <Input name="phone" placeholder="(98) 90000-0000" />
          </Field>
        </div>

        <Field label="Escola / instituição" hint="Quando aplicável">
          <Input name="institution" placeholder="Ex.: Escola Municipal..." />
        </Field>

        <div className="grid grid-cols-2 gap-x-3.5">
          <Field label="Setor desejado *">
            <Select name="sectorId" required defaultValue="">
              <option value="" disabled>Selecione...</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Prioridade">
            <Select name="priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="normal">Normal</option>
              <option value="priority">Prioridade</option>
              <option value="urgent">Urgente</option>
            </Select>
          </Field>
        </div>

        {priority !== "normal" && (
          <Field label="Justificativa da prioridade *" hint="Fica registrado em auditoria">
            <Input name="priorityJustification" required placeholder="Motivo da prioridade" />
          </Field>
        )}

        <Field label="Motivo do atendimento">
          <Input name="reason" placeholder="Ex.: Entrega de documentos" />
        </Field>
        <Field label="Observação">
          <Textarea name="notes" placeholder="Informações adicionais para o atendente" />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Gerando..." : "Gerar senha"}
        </Button>
      </form>
    </div>
  );
}
