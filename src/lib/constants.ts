import type { RoleKey } from "@/types/database";

export const ROLE_LABEL: Record<RoleKey, string> = {
  admin: "Administrador",
  receptionist: "Recepcionista",
  attendant: "Atendente",
  manager: "Gestor",
};

export const VISITOR_TYPE_LABELS = [
  "Pai/Responsável", "Professor", "Gestor", "Coordenador", "Servidor",
  "Aluno", "Representante de escola", "Fornecedor", "Visitante", "Outro",
];
