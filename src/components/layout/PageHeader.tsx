export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-[60px] shrink-0 bg-surface border-b border-border flex items-center justify-between px-6">
      <div>
        <h1 className="text-[17px] font-bold m-0">{title}</h1>
        {subtitle && <div className="text-[12.5px] text-ink-muted mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}
