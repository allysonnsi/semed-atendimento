import { cn } from "@/lib/utils";
import { STATUS_BADGE_CLASS, STATUS_LABEL } from "@/lib/utils";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold", className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={STATUS_BADGE_CLASS[status]}>{STATUS_LABEL[status] ?? status}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "normal") return null;
  const isUrgent = priority === "urgent";
  return (
    <Badge className={isUrgent ? "bg-danger-light text-danger" : "bg-accent-light text-accent"}>
      {isUrgent ? "Urgente" : "Prioridade"}
    </Badge>
  );
}
