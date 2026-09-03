import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchRegistrationById } from "@/services/topscore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { getRegistrationUrl, openUrl } from "@/lib/urlUtils";
import { useColors } from "@/lib/tokens";
import { PageHeader } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { Body, EyebrowTight, Title } from "@/components/ui";
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
  const colors = useColors();

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const reg = await fetchRegistrationById(String(id));
        if (cancelled) return;
        if (!reg) { setError("Registration not found"); setIsLoading(false); return; }
        const url = resolveUrlForRegistration(reg);
        setRegistration(reg);
        setTargetUrl(url);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load registration", err);
        setError("Failed to load registration");
        setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const goBackSafe = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/registrations");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <Stack.Screen options={{ title: "Registration" }} />
      <PageHeader title="registration" subtitle="view on pada.org" back={goBackSafe} />

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
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
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
          <View
            className="w-16 h-16 items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="open-outline" size={32} color={colors.txtInverse} />
          </View>
          {registration && (
            <Body tone="primary" className="text-base font-semibold text-center" numberOfLines={2}>
              {registration.organizationName}
            </Body>
          )}
          <Title tone="primary" size="sm" className="text-center">
            continue on pada.org
          </Title>
          <Body tone="muted" className="text-sm text-center">
            To register, edit, or pay for this registration, PadaHub will hand you off to Pada.org. You&apos;ll return here when you&apos;re done.
          </Body>
          {targetUrl && (
            <Button label="Continue on Pada.org" onPress={() => openUrl(targetUrl)} className="mt-2" />
          )}
          <Button variant="ghost" label="Stay in PadaHub" onPress={goBackSafe} />
        </View>
      )}
    </SafeAreaView>
  );
}