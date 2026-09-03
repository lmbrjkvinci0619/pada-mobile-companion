import React, { useMemo } from "react";
import { View, Text, ScrollView, useWindowDimensions, type ScrollViewProps } from "react-native";
import { cn } from "@/utils/cn";

interface HubProps extends Omit<ScrollViewProps, "horizontal"> {
  children: React.ReactNode;
  gap?: number;
  className?: string;
}

export const Hub = React.memo(function Hub({
  children,
  gap = 12,
  className,
  ...rest
}: HubProps) {
  const { width } = useWindowDimensions();
  const panelWidth = useMemo(() => width - 40, [width]);

  const items = React.Children.toArray(children);
  const totalWidth = items.length * panelWidth + (items.length - 1) * gap;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={panelWidth + gap}
      snapToAlignment="start"
      className={className}
      onScroll={rest.onScroll}
      scrollEventThrottle={rest.onScroll ? 16 : undefined}
      {...rest}
    >
      <View
        style={{ width: totalWidth, paddingHorizontal: 20 }}
        className="flex-row"
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
      </View>
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
          <Text
            className="text-txt-primary text-[28px] font-light lowercase tracking-tight leading-tight"
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {signal ? (
          <View
            className={cn(
              "mb-1 w-2.5 h-2.5",
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