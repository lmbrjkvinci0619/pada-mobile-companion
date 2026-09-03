import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";

export const LoaderBar = React.memo(function LoaderBar({ visible = true }: { visible?: boolean }) {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, x]);

  if (!visible) return null;

  const width = x.interpolate({ inputRange: [0, 1], outputRange: ["-40%", "140%"] });

  return (
    <View
      className="absolute top-0 left-0 right-0 h-[3px] bg-surface-overlay z-50 overflow-hidden"
      accessibilityRole="progressbar"
    >
      <Animated.View
        className="h-full bg-primary"
        style={{ width: "40%", transform: [{ translateX: width }] }}
      />
    </View>
  );
});