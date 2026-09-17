"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { addUser } from "@/lib/db/store";

const addUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Informe o nome completo."),

  roleKey: z.enum([
    "admin",
    "receptionist",
    "attendant",
  ]),

  sectorId: z.string().optional(),
});

export async function addUserAction(formData: FormData) {
  const user = await requireRole("admin");

  const parsed = addUserSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Dados inválidos.",
    };
  }

  if (
    parsed.data.roleKey === "attendant" &&
    !parsed.data.sectorId
  ) {
    return {
      ok: false,
      error:
        "Selecione o setor do atendente.",
    };
  }

  try {
    addUser(
      parsed.data.fullName,
      parsed.data.roleKey,
      parsed.data.sectorId ?? null,
      user.id
    );

    revalidatePath("/usuarios");

    return {
      ok: true,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o usuário.",
    };
  }
}