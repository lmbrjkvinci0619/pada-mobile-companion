import React from "react";
import { View, TouchableOpacity } from "react-native";
import { cn } from "@/utils/cn";
import { Label } from "./Typography";

export interface SegmentedOption<T extends string> {
  key: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>) {
  return (
    <View className={cn("flex-row border border-surface-border", className)}>
      {options.map((opt, idx) => {
        const active = opt.key === value;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.85}
            className={cn(
              "flex-1 py-3 items-center justify-center",
              active ? "bg-primary" : "bg-surface",
              idx < options.length - 1 && "border-r border-surface-border",
            )}
          >
            <Label tone={active ? "inverse" : "secondary"}>
              {opt.label}
            </Label>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}