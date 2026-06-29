import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { openRegistrationInBrowser } from "@/lib/urlUtils";

export default function RegistrationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(() => {
      openRegistrationInBrowser(id as string);
    }, 400);
    return () => clearTimeout(timer);
  }, [id]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <Stack.Screen options={{ title: "Registration" }} />
      <View className="px-5 py-4 border-b border-surface-overlay flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#E6EDF3" />
       </TouchableOpacity>
        <Text className="text-txt-primary text-xl font-bold flex-1">
          Registration
      </Text>
    </View>

      <View className="flex-1 items-center justify-center px-6 gap-4">
        <View className="w-16 h-16 rounded-full bg-primary-500/10 items-center justify-center">
          <Ionicons name="open-outline" size={32} color="#388BFD" />
      </View>
        <Text className="text-txt-primary text-lg font-bold text-center">
          Opening registration in your browser…
      </Text>
        <Text className="text-txt-muted text-sm text-center">
          The Pada.org registration page is launching outside this app. After
          you finish, return here to continue browsing PADA.
      </Text>
        <TouchableOpacity
          className="bg-primary-500 px-5 py-3 rounded-2xl mt-2"
          onPress={() => openRegistrationInBrowser(id as string)}
        >
          <Text className="text-white font-bold">Open Again</Text>
       </TouchableOpacity>
        <TouchableOpacity
          className="px-5 py-3"
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace("/(tabs)/registrations")
          }
        >
          <Text className="text-primary-400 font-semi">Back to Registrations</Text>
       </TouchableOpacity>
    </View>
  </SafeAreaView>
  );
}
