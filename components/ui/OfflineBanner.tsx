import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOffline } from "@/hooks/useOffline";
import { EyebrowTight } from "./Typography";

export const OfflineBanner = React.memo(function OfflineBanner() {
  const { isOffline } = useOffline();
  if (!isOffline) return null;
  return (
    <View
      className="bg-warning px-4 py-2 flex-row items-center justify-center gap-2"
      accessibilityRole="alert"
      accessibilityLabel="you are offline. showing cached data."
    >
      <Ionicons name="cloud-offline-outline" size={16} color="#000000" />
      <EyebrowTight tone="primary" className="tracking-[0.2em]">
        offline · showing cached data
      </EyebrowTight>
    </View>
  );
});