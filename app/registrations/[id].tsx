import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchRegistrationById } from "@/services/topscore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getRegistrationUrl, openUrl } from "@/lib/urlUtils";
import { PageHeader } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { LoaderBar } from "@/components/ui/LoaderBar";
import type { Registration } from "@/types";

function resolveUrlForRegistration(reg: Registration): string {
  if (reg.type === "event" && reg.eventId) return getRegistrationUrl(reg.id, reg.eventId);
  if (reg.type === "team" && reg.teamId) return getRegistrationUrl(reg.id, undefined, reg.teamId);
  if (reg.type === "league" && reg.leagueId) return getRegistrationUrl(reg.id, undefined, undefined, reg.leagueId);
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
        if (!reg) { setError("Registration not found"); setIsLoading(false); return; }
        const url = resolveUrlForRegistration(reg);
        setRegistration(reg);
        setTargetUrl(url);
        setIsLoading(false);
        timer = setTimeout(() => { openUrl(url); }, 400);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load registration", err);
        setError("Failed to load registration");
        setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [id]);

  const goBackSafe = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/registrations");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <Stack.Screen options={{ title: "Registration" }} />
      <PageHeader title="registration" subtitle="opening on pada.org" back={goBackSafe} />

      {isLoading ? (
        <View className="flex-1">
          <LoaderBar visible />
          <View className="flex-1 items-center justify-center">
            <Text className="text-txt-muted mt-3 text-[11px] uppercase tracking-[0.18em] font-semibold">
              loading registration
            </Text>
          </View>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <Ionicons name="alert-circle-outline" size={48} color="#E51400" />
            <Text className="text-danger text-base font-semibold uppercase tracking-[0.12em] text-center">{error}</Text>
          <Text className="text-txt-muted text-sm text-center">
            We couldn&apos;t open this registration on Pada.org. Please try again or return to your registrations list.
          </Text>
          <Button label="Back to Registrations" onPress={goBackSafe} className="mt-2" />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <View className="w-16 h-16 bg-primary items-center justify-center">
            <Ionicons name="open-outline" size={32} color="#FFFFFF" />
          </View>
          {registration && (
            <Text className="text-txt-primary text-base font-semibold text-center" numberOfLines={2}>
              {registration.organizationName}
            </Text>
          )}
          <Text className="text-txt-primary text-2xl font-light lowercase tracking-tight text-center">
            opening registration in your browser...
          </Text>
          <Text className="text-txt-muted text-sm text-center">
            The Pada.org registration page is launching outside this app. After you finish, return here to continue browsing PADA.
          </Text>
          {targetUrl && (
            <Button label="Open Again" onPress={() => openUrl(targetUrl)} className="mt-2" />
          )}
          <TouchableOpacity className="px-5 py-3" onPress={goBackSafe} activeOpacity={0.85}>
            <Text className="text-primary-700 text-xs font-semibold uppercase tracking-[0.12em]">
              back to registrations
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}