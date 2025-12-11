import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "warning" | "danger" | "success";
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: KPICardProps) {
  const variantStyles = {
    default: {
      container: "bg-card border-border",
      icon: "bg-primary/10 text-primary",
      value: "text-foreground",
    },
    warning: {
      container: "bg-card border-warning/30",
      icon: "bg-warning/10 text-warning",
      value: "text-warning",
    },
    danger: {
      container: "bg-card border-destructive/30",
      icon: "bg-destructive/10 text-destructive",
      value: "text-destructive",
    },
    success: {
      container: "bg-card border-success/30",
      icon: "bg-success/10 text-success",
      value: "text-success",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "rounded-xl border p-6 shadow-card transition-all duration-300 hover:shadow-soft animate-slide-up",
        styles.container
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn("text-3xl font-semibold tracking-tight", styles.value)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-3", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          <span
            className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}
          >
            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-muted-foreground">from last month</span>
        </div>
      )}
    </div>
  );
}
