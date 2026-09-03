import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { openUrl, openWithAppFallback, EXTERNAL_URLS } from "@/lib/urlUtils";

export const DonateFooter = React.memo(function DonateFooter() {
  return (
    <View className="items-center gap-1 py-4 bg-bg border-t border-surface-border">
      <Text className="text-txt-secondary text-[10px] font-semibold uppercase tracking-[0.18em]">
        toss a coin to your developer
      </Text>
      <View className="flex-row items-center gap-4 mt-1">
        <TouchableOpacity
          onPress={() => openUrl(EXTERNAL_URLS.devDonatePaypal)}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="tip the developer on PayPal"
        >
          <Text className="text-primary text-[11px] font-semibold uppercase tracking-[0.12em]">
            paypal
          </Text>
        </TouchableOpacity>
        <View className="w-px h-3 bg-surface-border" />
        <TouchableOpacity
          onPress={() => openWithAppFallback(EXTERNAL_URLS.devDonateVenmo, EXTERNAL_URLS.devDonateVenmoWeb)}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="tip the developer on Venmo"
        >
          <Text className="text-primary text-[11px] font-semibold uppercase tracking-[0.12em]">
            venmo
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});