import React, { useEffect, useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchRegistrationById } from "@/services/topscore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getRegistrationUrl, openUrl } from "@/lib/urlUtils";
import { PageHeader } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { Body, EyebrowTight, Section } from "@/components/ui";
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
            <EyebrowTight tone="muted" className="mt-3 tracking-[0.18em]">
              loading registration
            </EyebrowTight>
          </View>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6 gap-3">
          <Ionicons name="alert-circle-outline" size={48} color="#E51400" />
          <Body tone="danger" className="text-base font-semibold text-center">
            {error}
          </Body>
          <Body tone="muted" className="text-sm text-center">
            We couldn&apos;t open this registration on Pada.org. Please try again or return to your registrations list.
          </Body>
          <Button label="Back to Registrations" onPress={goBackSafe} className="mt-2" />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <View className="w-16 h-16 bg-primary items-center justify-center">
            <Ionicons name="open-outline" size={32} color="#FFFFFF" />
          </View>
          {registration && (
            <Body tone="primary" className="text-base font-semibold text-center" numberOfLines={2}>
              {registration.organizationName}
            </Body>
          )}
          <Section tone="primary" size="sm" className="text-center">
            opening registration in your browser...
          </Section>
          <Body tone="muted" className="text-sm text-center">
            The Pada.org registration page is launching outside this app. After you finish, return here to continue browsing PADA.
          </Body>
          {targetUrl && (
            <Button label="Open Again" onPress={() => openUrl(targetUrl)} className="mt-2" />
          )}
          <TouchableOpacity
            className="px-5 py-3"
            onPress={goBackSafe}
            accessibilityRole="button"
            accessibilityLabel="back to registrations"
            activeOpacity={0.85}
          >
            <EyebrowTight tone="primaryAccent">back to registrations</EyebrowTight>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}