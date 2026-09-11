import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function formatDuration(ms: number | null) {
  if (ms == null) return "—";
  const m = Math.round(ms / 60000);
  if (m < 1) return "<1 min";
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}min`;
}

export const STATUS_LABEL: Record<string, string> = {
  waiting: "Aguardando",
  called: "Chamado",
  in_progress: "Em atendimento",
  completed: "Finalizado",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  waiting: "bg-slate-100 text-slate-600",
  called: "bg-accent-light text-accent",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-primary-light text-primary",
  cancelled: "bg-danger-light text-danger",
  no_show: "bg-neutral-100 text-neutral-500",
};
