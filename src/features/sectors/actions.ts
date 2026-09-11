"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { toggleSector, addSector } from "@/lib/db/store";

const addSectorSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do setor."),
  code: z.string().trim().min(2, "Informe um código.").max(6, "Máximo 6 caracteres."),
});

export async function toggleSectorAction(sectorId: string) {
  const user = requireRole("admin");
  toggleSector(sectorId, user.id);
  revalidatePath("/setores");
  revalidatePath("/recepcao/novo-atendimento");
}

export async function addSectorAction(formData: FormData) {
  const user = requireRole("admin");
  const parsed = addSectorSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  addSector(parsed.data.name, parsed.data.code, user.id);
  revalidatePath("/setores");
  return { ok: true };
}
