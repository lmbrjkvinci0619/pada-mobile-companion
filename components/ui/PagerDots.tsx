import React from "react";
import { View, ViewProps } from "react-native";
import { cn } from "@/utils/cn";

interface PagerDotsProps extends ViewProps {
  count: number;
  active: number;
}

export const PagerDots = React.memo(function PagerDots({
  count,
  active,
  className,
  ...rest
}: PagerDotsProps) {
  if (count <= 1) return null;
  return (
    <View
      {...rest}
      className={cn("flex-row items-center justify-center gap-1.5 py-3", className)}
      accessibilityRole="tablist"
    >
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === active;
        return (
          <View
            key={i}
            className={cn("h-1", isActive ? "w-6 bg-primary" : "w-2 bg-surface-border")}
            accessibilityState={{ selected: isActive }}
          />
        );
      })}
    </View>
  );
});