import React from "react";
import { View, Text } from "react-native";
import { cn } from "@/utils/cn";

type Variant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "ghost";

interface BadgeProps {
  label: string;
  variant?: Variant;
  size?: "sm" | "md";
  className?: string;
  accent?: string;
}

const containerVariant: Record<Variant, string> = {
  default:   "bg-surface-overlay border-2 border-surface-border",
  primary:   "bg-primary-50 border-2 border-primary",
  secondary: "bg-secondary-50 border-2 border-secondary",
  success:   "bg-success/10 border-2 border-success",
  warning:   "bg-warning/10 border-2 border-warning",
  danger:    "bg-danger/10 border-2 border-danger",
  ghost:     "bg-transparent border-2 border-surface-border",
};

const textVariant: Record<Variant, string> = {
  default:   "text-txt-secondary",
  primary:   "text-primary-700",
  secondary: "text-secondary-700",
  success:   "text-success",
  warning:   "text-warning",
  danger:    "text-danger",
  ghost:     "text-txt-secondary",
};

export const Badge = React.memo(function Badge({
  label,
  variant = "default",
  size = "sm",
  className,
  accent,
}: BadgeProps) {
  return (
    <View
      className={cn(
        "items-center justify-center self-start",
        size === "sm" ? "px-2 py-0.5" : "px-3 py-1",
        containerVariant[variant],
        className,
      )}
      style={accent ? { backgroundColor: `${accent}1A`, borderColor: accent } : undefined}
    >
      <Text
        className={cn(
          "font-semibold uppercase tracking-[0.12em]",
          size === "sm" ? "text-[10px]" : "text-xs",
          textVariant[variant],
        )}
        style={accent ? { color: accent } : undefined}
      >
        {label}
      </Text>
    </View>
  );
});