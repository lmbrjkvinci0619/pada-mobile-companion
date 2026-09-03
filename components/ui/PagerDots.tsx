import React from "react";
import { View, ViewProps, TouchableOpacity } from "react-native";
import { cn } from "@/utils/cn";

interface PagerDotsProps extends ViewProps {
  count: number;
  active: number;
  onSelect?: (index: number) => void;
}

export const PagerDots = React.memo(function PagerDots({
  count,
  active,
  onSelect,
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
          <TouchableOpacity
            key={i}
            onPress={() => onSelect?.(i)}
            disabled={!onSelect}
            accessibilityRole="tab"
            accessibilityLabel={`go to panel ${i + 1}`}
            accessibilityState={{ selected: isActive }}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            className={cn("h-1", isActive ? "w-6 bg-primary" : "w-2 bg-surface-border")}
          />
        );
      })}
    </View>
  );
});