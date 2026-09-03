import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
} from "react-native";
import { cn } from "@/utils/cn";

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
  primary:   "bg-primary active:bg-primary-700 border-2 border-primary",
  secondary: "bg-surface active:bg-surface-overlay border-2 border-surface-border",
  ghost:     "bg-transparent active:bg-surface-overlay border-2 border-transparent",
  danger:    "bg-danger active:opacity-90 border-2 border-danger",
  success:   "bg-success active:opacity-90 border-2 border-success",
  outline:   "bg-transparent active:bg-primary-50 border-2 border-primary",
};

const variantText: Record<Variant, string> = {
  primary:   "text-txt-inverse",
  secondary: "text-txt-primary",
  ghost:     "text-primary",
  danger:    "text-txt-inverse",
  success:   "text-txt-inverse",
  outline:   "text-primary",
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
  const isMuted = variant === "ghost" || variant === "secondary" || variant === "outline";
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
          color={isMuted ? "#00ABA9" : "#FFFFFF"}
        />
      ) : (
        icon ? <View>{icon}</View> : null
      )}
      <Text className={cn("font-semibold uppercase tracking-[0.12em]", variantText[variant], textSize[size])}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});