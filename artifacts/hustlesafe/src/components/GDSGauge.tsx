import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GDSGaugeProps {
  score: number;
  size?: number;
  className?: string;
}

export function GDSGauge({ score, size = 120, className }: GDSGaugeProps) {
  const radius = (size - 16) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = "text-success";
  let label = "NORMAL";
  
  if (score >= 80) {
    colorClass = "text-foreground";
    label = "SHUTDOWN";
  } else if (score >= 60) {
    colorClass = "text-destructive";
    label = "HIGH RISK";
  } else if (score >= 40) {
    colorClass = "text-warning";
    label = "ELEVATED";
  }

  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={colorClass}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span className={cn("text-4xl font-display font-bold leading-none", colorClass)}>
          {score}
        </span>
        <span className="text-[10px] font-bold tracking-wider text-muted-foreground mt-1">
          {label}
        </span>
      </div>
    </div>
  );
}
