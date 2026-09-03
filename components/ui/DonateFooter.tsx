import React from "react";
import { View, TouchableOpacity } from "react-native";
import { openUrl, openWithAppFallback, EXTERNAL_URLS } from "@/lib/urlUtils";
import { Meta, Label } from "./Typography";

export const DonateFooter = React.memo(function DonateFooter() {
  return (
    <View className="items-center gap-1 py-4 bg-bg border-t border-surface-border">
      <Meta tone="secondary">toss a coin to your developer</Meta>
      <View className="flex-row items-center gap-4 mt-1">
        <TouchableOpacity
          onPress={() => openUrl(EXTERNAL_URLS.devDonatePaypal)}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="tip the developer on PayPal"
        >
          <Label tone="primaryAccent">paypal</Label>
        </TouchableOpacity>
        <View className="w-px h-3 bg-surface-border" />
        <TouchableOpacity
          onPress={() => openWithAppFallback(EXTERNAL_URLS.devDonateVenmo, EXTERNAL_URLS.devDonateVenmoWeb)}
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="tip the developer on Venmo"
        >
          <Label tone="primaryAccent">venmo</Label>
        </TouchableOpacity>
      </View>
    </View>
  );
});