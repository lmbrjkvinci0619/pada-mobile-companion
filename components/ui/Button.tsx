import React from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
} from "react-native";
import { cn } from "@/utils/cn";
import { Label } from "./Typography";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  label: string;
  icon?: React.ReactNode;
}

const variantContainer: Record<Variant, string> = {
  primary:   "bg-primary active:bg-primary-700",
  secondary: "bg-surface-raised active:bg-surface-overlay",
  ghost:     "bg-transparent active:bg-surface-overlay",
  danger:    "bg-danger active:opacity-90",
  success:   "bg-success active:opacity-90",
  outline:   "bg-transparent active:bg-primary-50 border border-primary",
};

const containerSize: Record<Size, string> = {
  sm: "px-3 py-1.5",
  md: "px-5 py-3",
  lg: "px-6 py-4",
};

const textSize: Record<Size, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export const Button = React.memo(function Button({
  variant = "primary",
  size = "md",
  loading = false,
  label,
  icon,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <TouchableOpacity
      {...props}
      disabled={disabled || loading}
      className={cn(
        "flex-row items-center justify-center gap-2",
        variantContainer[variant],
        containerSize[size],
        (disabled || loading) && "opacity-50",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "primary" || variant === "danger" || variant === "success"
              ? "#FFFFFF"
              : "#00ABA9"
          }
        />
      ) : (
        icon ? <View>{icon}</View> : null
      )}
      <Label
        tone={
          variant === "primary" || variant === "danger" || variant === "success"
            ? "inverse"
            : variant === "ghost" || variant === "outline"
              ? "primaryAccent"
              : "primary"
        }
        className={cn(textSize[size])}
      >
        {label}
      </Label>
    </TouchableOpacity>
  );
});