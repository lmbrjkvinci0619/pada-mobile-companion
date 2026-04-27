import React from "react";
import { View, Text, type ViewProps } from "react-native";
import { cn } from "@/utils/cn";

interface CardProps extends ViewProps {
  elevated?: boolean;
  className?: string;
}

export function Card({ elevated = false, className, children, ...props }: CardProps) {
  return (
    <View
      {...props}
      className={cn(
        "rounded-2xl p-4",
        elevated ? "bg-surface-raised" : "bg-surface",
        className,
      )}
    >
      {children}
    </View>
  );
}

interface CardSectionProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export function CardSection({ title, className, children }: CardSectionProps) {
  return (
    <View className={cn("gap-3", className)}>
      {title && (
        <Text className="text-txt-secondary text-xs font-semi uppercase tracking-widest">
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}
