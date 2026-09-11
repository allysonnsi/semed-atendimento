import { z } from "zod";

export const createTicketSchema = z
  .object({
    visitorName: z.string().trim().min(3, "Informe o nome completo."),
    visitorTypeId: z.string().min(1, "Selecione o tipo de visitante."),
    document: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    institution: z.string().trim().optional(),
    sectorId: z.string().min(1, "Selecione o setor."),
    reason: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    priority: z.enum(["normal", "priority", "urgent"]).default("normal"),
    priorityJustification: z.string().trim().optional(),
  })
  .refine((data) => data.priority === "normal" || !!data.priorityJustification, {
    message: "Justificativa obrigatória para atendimento com prioridade.",
    path: ["priorityJustification"],
  });

export type CreateTicketFormValues = z.infer<typeof createTicketSchema>;

export const cancelTicketSchema = z.object({
  ticketId: z.string().min(1),
  reason: z.string().trim().min(1, "Informe o motivo do cancelamento."),
});

export const changePrioritySchema = z
  .object({
    ticketId: z.string().min(1),
    priority: z.enum(["normal", "priority", "urgent"]),
    justification: z.string().trim().optional(),
  })
  .refine((data) => data.priority === "normal" || !!data.justification, {
    message: "Justificativa obrigatória.",
    path: ["justification"],
  });
