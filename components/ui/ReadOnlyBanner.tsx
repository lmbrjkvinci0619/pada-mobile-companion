import React from "react";
import { View, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PADA_ORG_URL } from "@/constants/config";
import { Body, Eyebrow } from "./Typography";

interface ReadOnlyBannerProps {
  message?: string;
  showLink?: boolean;
}

export const ReadOnlyBanner = React.memo(function ReadOnlyBanner({
  message = "This information is read-only. To make changes, visit Pada.org.",
  showLink = true,
}: ReadOnlyBannerProps) {
  return (
    <View className="bg-primary-700 flex-row items-center gap-3 px-4 py-3 mb-3">
      <Ionicons name="information-circle" size={20} color="#FFFFFF" />
      <View className="flex-1">
        <Body tone="inverse" className="text-sm leading-5">
          {message}
        </Body>
        {showLink && (
          <TouchableOpacity
            onPress={() => Linking.openURL(PADA_ORG_URL)}
            activeOpacity={0.7}
            accessibilityRole="link"
            accessibilityLabel="open Pada.org"
          >
            <Eyebrow tone="inverse" className="mt-1 underline">
              Launch Pada.org
            </Eyebrow>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});