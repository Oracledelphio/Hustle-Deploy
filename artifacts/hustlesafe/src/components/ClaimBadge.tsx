import { cn } from "@/lib/utils";

interface ClaimBadgeProps {
  status: string;
}

export function ClaimBadge({ status }: ClaimBadgeProps) {
  const configs: Record<string, string> = {
    auto_approved: "bg-success/15 text-success border-success/30",
    soft_hold: "bg-warning/15 text-warning border-warning/30",
    insurer_review: "bg-orange-100 text-orange-700 border-orange-200",
    auto_rejected: "bg-destructive/15 text-destructive border-destructive/30",
    paid: "bg-primary/15 text-primary border-primary/30",
    pending: "bg-muted text-muted-foreground border-border",
  };

  const labels: Record<string, string> = {
    auto_approved: "AUTO APPROVED",
    soft_hold: "SOFT HOLD",
    insurer_review: "REVIEW",
    auto_rejected: "REJECTED",
    paid: "PAID",
    pending: "PENDING",
  };

  const normalized = status.toLowerCase();
  const config = configs[normalized] || configs.pending;
  const label = labels[normalized] || status.replace('_', ' ').toUpperCase();

  return (
    <span className={cn(
      "px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full border inline-flex items-center justify-center whitespace-nowrap",
      config
    )}>
      {label}
    </span>
  );
}
