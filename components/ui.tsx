import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "purple"
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <div className="card stat-card">
      <div className={`icon-tile ${tone}`}>
        <Icon size={28} />
      </div>
      <div>
        <span className="muted small">{label}</span>
        <strong>{value}</strong>
        <span className="muted small">{hint}</span>
      </div>
    </div>
  );
}

export function Badge({ children, tone = "purple" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function ProgressRing({ value, label, total = 20 }: { value: number; label: string; total?: number | string }) {
  return (
    <div className="ring" style={{ "--value": `${value}%` } as React.CSSProperties}>
      <div className="ring-inner">
        <div style={{ textAlign: "center" }}>
          <strong style={{ display: "block", fontSize: 30 }}>{label}</strong>
          <span className="muted small">/ {total}</span>
        </div>
      </div>
    </div>
  );
}

export function ToggleSwitch({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button className={`toggle ${checked ? "on" : ""}`} onClick={onClick} type="button" aria-pressed={checked}>
      <span />
    </button>
  );
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="card pad" style={{ textAlign: "center" }}>
      <strong>{title}</strong>
      <p className="muted">{text}</p>
    </div>
  );
}

export function SkeletonBlock({ height = 16, width = "100%" }: { height?: number; width?: number | string }) {
  return <span className="skeleton" style={{ height, width }} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card pad">
      <SkeletonBlock height={42} width={42} />
      <div className="grid" style={{ gap: 10, marginTop: 16 }}>
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonBlock key={index} height={index === 0 ? 18 : 12} width={index === 0 ? "70%" : "92%"} />
        ))}
      </div>
    </div>
  );
}
