import { cn } from "@/lib/utils";
import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="block text-[12.5px] font-semibold text-ink mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11.5px] text-ink-muted mt-1">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2.5 border border-border rounded-lg text-[13.5px] text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputClass, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "min-h-[70px] resize-y", props.className)} />;
}
