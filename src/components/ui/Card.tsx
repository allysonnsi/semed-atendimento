import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("bg-surface border border-border rounded-md p-5", className)}>{children}</div>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[14.5px] font-bold mb-2.5">{children}</h3>;
}
