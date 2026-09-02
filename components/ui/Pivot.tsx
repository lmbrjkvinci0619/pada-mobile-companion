import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { cn } from "@/utils/cn";

export interface PivotItem<T extends string> {
  key: T;
  label: string;
}

interface PivotProps<T extends string> {
  items: PivotItem<T>[];
  value?: T;
  onChange?: (key: T) => void;
  className?: string;
}

export function Pivot<T extends string>({
  items,
  value,
  onChange,
  className,
}: PivotProps<T>) {
  const [internal, setInternal] = useState<T>(items[0]?.key as T);
  const active = value ?? internal;

  return (
    <View className={cn("border-b-2 border-surface-border bg-bg", className)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-2"
      >
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => {
                setInternal(item.key);
                onChange?.(item.key);
              }}
              activeOpacity={0.7}
              className={cn(
                "px-4 py-3",
                isActive ? "border-b-4 border-primary" : "border-b-4 border-transparent",
              )}
            >
              <Text
                className={cn(
                  "text-base font-light lowercase tracking-tight",
                  isActive ? "text-txt-primary" : "text-txt-muted",
                )}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function PivotContent({ children }: { children: React.ReactNode }) {
  return <View className="flex-1 bg-bg">{children}</View>;
}

export function PivotPanorama({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <View className="px-5 pt-4 pb-3 bg-bg">
      <View className="flex-row items-end justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-primary text-[44px] font-light lowercase leading-[0.95] tracking-tight">
            {title}
          </Text>
          {subtitle && (
            <Text className="text-txt-secondary text-[11px] font-bold uppercase tracking-[0.2em] mt-2">
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
    </View>
  );
}