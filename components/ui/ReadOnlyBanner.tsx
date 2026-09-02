import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PADA_ORG_URL } from "@/constants/config";

interface ReadOnlyBannerProps {
  message?: string;
  showLink?: boolean;
}

export const ReadOnlyBanner = React.memo(function ReadOnlyBanner({
  message = "This information is read-only. To make changes, visit Pada.org.",
  showLink = true,
}: ReadOnlyBannerProps) {
  return (
    <View className="flex-row items-center gap-3 bg-primary-50 border-l-4 border-primary px-4 py-3 mx-5 mb-3">
      <View className="w-9 h-9 items-center justify-center bg-primary">
        <Ionicons name="information-circle" size={20} color="#FFFFFF" />
      </View>
      <View className="flex-1">
        <Text className="text-txt-primary text-sm font-medium leading-5">{message}</Text>
        {showLink && (
          <TouchableOpacity
            onPress={() => Linking.openURL(PADA_ORG_URL)}
            activeOpacity={0.7}
          >
            <Text className="text-primary text-[11px] font-bold uppercase tracking-[0.18em] mt-1">
              Launch Pada.org →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});