import React, { useState } from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  View,
  type TouchableOpacityProps,
  type GestureResponderEvent,
} from "react-native";
import { cn } from "@/utils/cn";
import { useColors } from "@/lib/tokens";
import { Label } from "./Typography";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type Size = "sm" | "md" | "lg";

type LabelTone = "primary" | "secondary" | "muted" | "inverse" | "danger" | "warning" | "success" | "primaryAccent";

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  label: string;
  icon?: React.ReactNode;
}

const variantContainer: Record<Variant, string> = {
  primary:   "bg-primary",
  secondary: "bg-surface-raised",
  ghost:     "bg-transparent",
  danger:    "bg-danger",
  success:   "bg-success",
  outline:   "bg-transparent border border-primary",
};

const variantActiveContainer: Record<Variant, string> = {
  primary:   "bg-txt-inverse",
  secondary: "bg-primary",
  ghost:     "bg-primary",
  danger:    "bg-txt-inverse",
  success:   "bg-txt-inverse",
  outline:   "bg-primary",
};

const variantText: Record<Variant, LabelTone> = {
  primary:   "inverse",
  secondary: "primary",
  ghost:     "primaryAccent",
  danger:    "inverse",
  success:   "inverse",
  outline:   "primaryAccent",
};

const variantActiveText: Record<Variant, LabelTone> = {
  primary:   "primary",
  secondary: "inverse",
  ghost:     "inverse",
  danger:    "danger",
  success:   "success",
  outline:   "inverse",
};

const containerSize: Record<Size, string> = {
  sm: "px-3 py-1.5",
  md: "px-5 py-3",
  lg: "px-6 py-4",
};

const textSize: Record<Size, string> = {
  sm: "text-[11px]",
  md: "text-xs",
  lg: "text-sm",
};

export const Button = React.memo(function Button({
  variant = "primary",
  size = "md",
  loading = false,
  label,
  icon,
  disabled,
  className,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isFilled = variant === "primary" || variant === "danger" || variant === "success";
  const textTone = pressed ? variantActiveText[variant] : variantText[variant];

  const colors = useColors();
  const spinnerColor = isFilled ? colors.txtInverse : colors.primary;

  const handlePressIn = (e: GestureResponderEvent) => {
    setPressed(true);
    onPressIn?.(e);
  };
  const handlePressOut = (e: GestureResponderEvent) => {
    setPressed(false);
    onPressOut?.(e);
  };

  return (
    <TouchableOpacity
      {...props}
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading), busy: loading }}
      className={cn(
        "flex-row items-center justify-center gap-2",
        pressed ? variantActiveContainer[variant] : variantContainer[variant],
        containerSize[size],
        (disabled || loading) && "opacity-50",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : icon ? (
        <View>{icon}</View>
      ) : null}
      <Label tone={textTone} className={cn(textSize[size])}>
        {loading ? (label || " ") : label}
      </Label>
    </TouchableOpacity>
  );
});