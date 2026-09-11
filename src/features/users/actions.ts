"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { addUser } from "@/lib/db/store";

const addUserSchema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo."),
  roleKey: z.enum(["admin", "receptionist", "attendant", "manager"]),
  sectorId: z.string().optional(),
});

export async function addUserAction(formData: FormData) {
  const user = requireRole("admin");
  const parsed = addUserSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  addUser(parsed.data.fullName, parsed.data.roleKey, parsed.data.sectorId ?? null, user.id);
  revalidatePath("/usuarios");
  return { ok: true };
}
