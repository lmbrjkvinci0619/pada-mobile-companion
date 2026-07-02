import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchRegistrationById } from "@/services/topscore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getRegistrationUrl, openUrl } from "@/lib/urlUtils";
import type { Registration } from "@/types";

function resolveUrlForRegistration(reg: Registration): string {
  if (reg.type === "event" && reg.eventId) {
    return getRegistrationUrl(reg.id, reg.eventId);
  }
  if (reg.type === "team" && reg.teamId) {
    return getRegistrationUrl(reg.id, undefined, reg.teamId);
  }
  if (reg.type === "league" && reg.leagueId) {
    return getRegistrationUrl(reg.id, undefined, undefined, reg.leagueId);
  }
  return getRegistrationUrl(reg.id);
}

export default function RegistrationDetailScreen() {
  useAuthRedirect();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      try {
        const reg = await fetchRegistrationById(String(id));
        if (cancelled) return;

        if (!reg) {
          setError("Registration not found");
          setIsLoading(false);
          return;
        }

        const url = resolveUrlForRegistration(reg);
        setRegistration(reg);
        setTargetUrl(url);
        setIsLoading(false);

        timer = setTimeout(() => {
          openUrl(url);
        }, 400);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load registration", err);
        setError("Failed to load registration");
        setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  const goBackSafe = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/registrations");
    }
  };

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

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text className="text-txt-muted mt-3 text-sm">
            Loading registration...
        </Text>
      </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <Ionicons name="alert-circle-outline" size={48} color="#E53935" />
          <Text className="text-danger text-base font-bold text-center">
            {error}
        </Text>
          <Text className="text-txt-muted text-sm text-center">
            We couldn&apos;t open this registration on Pada.org. Please try again
            or return to your registrations list.
        </Text>
          <TouchableOpacity
            className="bg-primary-500 px-5 py-3 rounded-2xl mt-2"
            onPress={goBackSafe}
          >
            <Text className="text-white font-bold">Back to Registrations</Text>
        </TouchableOpacity>
      </View>
      ) : (
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <View className="w-16 h-16 rounded-full bg-primary-500/10 items-center justify-center">
            <Ionicons name="open-outline" size={32} color="#388BFD" />
        </View>
          {registration ? (
            <Text
              className="text-txt-primary text-base font-bold text-center"
              numberOfLines={2}
            >
              {registration.organizationName}
          </Text>
          ) : null}
          <Text className="text-txt-primary text-lg font-bold text-center">
            Opening registration in your browser...
        </Text>
          <Text className="text-txt-muted text-sm text-center">
            The Pada.org registration page is launching outside this app. After
            you finish, return here to continue browsing PADA.
        </Text>
          {targetUrl ? (
            <TouchableOpacity
              className="bg-primary-500 px-5 py-3 rounded-2xl mt-2"
              onPress={() => openUrl(targetUrl)}
            >
              <Text className="text-white font-bold">Open Again</Text>
          </TouchableOpacity>
          ) : null}
          <TouchableOpacity className="px-5 py-3" onPress={goBackSafe}>
            <Text className="text-primary-400 font-semi">
              Back to Registrations
          </Text>
        </TouchableOpacity>
      </View>
      )}
  </SafeAreaView>
  );
}
