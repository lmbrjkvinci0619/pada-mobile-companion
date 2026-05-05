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
    <View className="flex-row items-center gap-3 bg-surface-raised border border-primary-500/30 rounded-2xl px-4 py-4 mx-4 mb-4 shadow-sm">
      <View className="bg-primary-500/20 p-2 rounded-full">
        <Ionicons name="information-circle" size={20} color="#388BFD" />
      </View>
      <View className="flex-1">
        <Text className="text-txt-primary text-sm font-semi leading-5">{message}</Text>
        {showLink && (
          <TouchableOpacity 
            onPress={() => Linking.openURL(PADA_ORG_URL)}
            activeOpacity={0.7}
          >
            <Text className="text-primary-300 text-xs font-bold uppercase tracking-wider mt-1.5">
              Launch Pada.org →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});
