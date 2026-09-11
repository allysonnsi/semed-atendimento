import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
          size === "md" ? "px-4 py-2 text-[13.5px]" : "px-5 py-3 text-[14.5px]",
          variant === "primary" && "bg-primary text-white hover:bg-[#195A3C]",
          variant === "outline" && "bg-white border border-border text-ink hover:border-primary hover:text-primary",
          variant === "ghost" && "bg-transparent text-ink-muted hover:text-ink",
          variant === "danger" && "bg-danger-light text-danger hover:bg-[#F6DADA]",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
