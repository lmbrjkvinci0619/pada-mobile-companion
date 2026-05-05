import React from "react";
import { View, Text, type ViewProps } from "react-native";
import { cn } from "@/utils/cn";

interface CardProps extends ViewProps {
  elevated?: boolean;
  className?: string;
  bordered?: boolean;
}

function CardComponent({ elevated = false, bordered = true, className, children, ...props }: CardProps) {
  return (
    <View
      {...props}
      className={cn(
        "rounded-2xl overflow-hidden",
        elevated ? "bg-surface-raised" : "bg-surface",
        bordered && "border border-surface-border",
        className,
      )}
    >
      {children}
    </View>
  );
}

const CardHeader = function CardHeader({ title, subtitle, icon, className, children }: { 
  title?: string; 
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <View className={cn("px-4 pt-4 pb-2 flex-row items-center justify-between", className)}>
      <View className="flex-1 flex-row items-center gap-3">
        {icon}
        <View className="flex-1">
          {title && <Text className="text-txt-primary font-semi text-base">{title}</Text>}
          {subtitle && <Text className="text-txt-secondary text-xs">{subtitle}</Text>}
        </View>
      </View>
      {children}
    </View>
  );
};

const CardContent = function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <View className={cn("px-4 py-2", className)}>{children}</View>;
};

const CardFooter = function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <View className={cn("px-4 pt-2 pb-4 border-t border-surface-border/50 mt-2", className)}>{children}</View>;
};

export const Card = Object.assign(React.memo(CardComponent), {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
});

export const CardSection = React.memo(function CardSection({ title, className, children }: { title?: string; className?: string; children: React.ReactNode }) {
  return (
    <View className={cn("gap-3", className)}>
      {title && (
        <Text className="text-txt-secondary text-xs font-semi uppercase tracking-widest px-1">
          {title}
        </Text>
      )}
      {children}
    </View>
  );
});

