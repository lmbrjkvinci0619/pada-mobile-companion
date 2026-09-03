import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { cn } from "@/utils/cn";
import { Title, Eyebrow, Body } from "./Typography";

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
    <View className={cn("border-b border-surface-border bg-bg", className)}>
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
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              className={cn(
                "px-4 py-3 border-b-2",
                isActive ? "border-primary" : "border-transparent",
              )}
            >
              <Body
                className={cn(
                  "text-base font-light lowercase tracking-tight",
                  isActive ? "text-txt-primary" : "text-txt-muted",
                )}
              >
                {item.label}
              </Body>
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
  unread,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  right?: React.ReactNode;
  unread?: number;
}) {
  return (
    <View className="px-5 pt-4 pb-3 bg-bg border-b border-surface-border">
      <View className="flex-row items-end justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center gap-2">
            {unread ? (
              <View
                className="w-2 h-2 bg-primary"
                accessibilityLabel={`${unread} unread`}
              />
            ) : null}
            <Title numberOfLines={1} className="text-[34px]">
              {title}
            </Title>
          </View>
          {subtitle && (
            <Eyebrow tone="secondary" className="mt-2">
              {subtitle}
            </Eyebrow>
          )}
        </View>
        {right}
      </View>
    </View>
  );
}