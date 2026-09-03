import React from "react";
import { View, ScrollView, useWindowDimensions, type ScrollViewProps } from "react-native";
import { cn } from "@/utils/cn";
import { Section } from "./Typography";

interface HubProps extends Omit<ScrollViewProps, "horizontal"> {
  children: React.ReactNode;
  gap?: number;
  className?: string;
}

export const HUB_GAP_DEFAULT = 12;
export const HUB_PANEL_OVERFLOW = 32;

export function useHubMetrics(gap: number = HUB_GAP_DEFAULT) {
  const { width } = useWindowDimensions();
  const panelWidth = width - HUB_PANEL_OVERFLOW;
  const stride = panelWidth + gap;
  return { width, panelWidth, stride };
}

export const Hub = React.memo(function Hub({
  children,
  gap = HUB_GAP_DEFAULT,
  className,
  ...rest
}: HubProps) {
  const { panelWidth } = useHubMetrics(gap);

  const items = React.Children.toArray(children);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={panelWidth + gap}
      snapToAlignment="start"
      contentContainerStyle={{ paddingHorizontal: 16 }}
      className={className}
      onScroll={rest.onScroll}
      scrollEventThrottle={rest.onScroll ? 16 : undefined}
      {...rest}
    >
      {items.map((child, i) => (
        <View
          key={i}
          style={{
            width: panelWidth,
            marginRight: i === items.length - 1 ? 0 : gap,
          }}
        >
          {child}
        </View>
      ))}
    </ScrollView>
  );
});

export function HubPanel({
  title,
  children,
  className,
  signal,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  signal?: "unread" | "new" | null;
}) {
  return (
    <View className={cn("flex-1", className)}>
      <View className="mb-4 flex-row items-end justify-between">
        <View className="flex-1">
          <View className="h-1 w-10 bg-primary mb-3" />
          <Section numberOfLines={1}>{title}</Section>
        </View>
        {signal ? (
          <View
            className={cn(
              "mb-1 w-2 h-2",
              signal === "unread" ? "bg-primary" : "bg-danger",
            )}
            accessibilityLabel={signal === "unread" ? "has unread" : "has new"}
          />
        ) : null}
      </View>
      {children}
    </View>
  );
}