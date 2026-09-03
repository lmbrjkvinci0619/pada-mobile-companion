import React from "react";
import { View, TouchableOpacity } from "react-native";
import { cn } from "@/utils/cn";
import { EyebrowTight, Eyebrow } from "./Typography";

export interface ChipOption<T extends string> {
  key: T;
  label: string;
  description?: string;
  accent?: string;
  disabled?: boolean;
}

interface ChipGroupProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (key: T) => void;
  layout?: "wrap" | "scroll";
  accessibilityLabel?: string;
  className?: string;
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  layout = "wrap",
  accessibilityLabel,
  className,
}: ChipGroupProps<T>) {
  const containerClass = layout === "wrap" ? "flex-row flex-wrap gap-2" : "flex-row gap-2";
  const chips = options.map((option) => {
    const isSelected = option.key === value;
    const isDisabled = !!option.disabled;
    return (
      <TouchableOpacity
        key={option.key}
        onPress={() => !isDisabled && onChange(option.key)}
        disabled={isDisabled}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected, disabled: isDisabled }}
        accessibilityLabel={
          accessibilityLabel ? `${accessibilityLabel}: ${option.label}` : option.label
        }
        activeOpacity={0.85}
        className={cn(
          layout === "wrap" ? "flex-1 min-w-[100px] p-3 border items-center" : "px-4 py-3 border",
          isSelected
            ? "bg-primary border-primary"
            : isDisabled
              ? "bg-surface-overlay border-surface-border opacity-50"
              : "bg-surface-raised border-surface-border",
        )}
        style={
          option.accent && !isSelected
            ? { borderColor: option.accent }
            : undefined
        }
      >
        {option.description ? (
          <>
            <EyebrowTight tone={isSelected ? "inverse" : "primary"}>
              {option.label}
            </EyebrowTight>
            <Eyebrow
              tone={isSelected ? "inverse" : "muted"}
              className="mt-1 opacity-85"
            >
              {option.description}
            </Eyebrow>
          </>
        ) : (
          <EyebrowTight tone={isSelected ? "inverse" : "secondary"}>
            {option.label}
          </EyebrowTight>
        )}
      </TouchableOpacity>
    );
  });

  return (
    <View className={cn(layout === "scroll" ? "-mx-5" : "", className)}>
      {layout === "scroll" ? (
        <View className="px-5 flex-row gap-2">{chips}</View>
      ) : (
        <View className={containerClass}>{chips}</View>
      )}
    </View>
  );
}