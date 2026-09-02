import React, { useMemo } from "react";
import { ScrollView, View, Text, useWindowDimensions, type ScrollViewProps } from "react-native";
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
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn("flex-1", className)}>
      <View className="mb-4">
        <View className="h-1 w-10 bg-primary mb-3" />
        <Text className="text-txt-primary text-3xl font-light lowercase tracking-tight">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}