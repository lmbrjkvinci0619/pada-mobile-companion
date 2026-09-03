import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useEvent, useTeam } from "@/hooks/useApi";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { fetchScheduleExport, canUserReportTeamScores } from "@/services/topscore";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader, SectionLabel } from "@/components/ui/Page";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { Hero, Eyebrow, Body, EyebrowTight, Subtitle } from "@/components/ui";
import { openUrl } from "@/lib/urlUtils";
import { format, parseISO } from "date-fns";
import type { ScheduleExport } from "@/types";

export default function EventDetailScreen() {
  useAuthRedirect();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);
  const { user } = useAuthStore();
  const eventTeamId = event?.teamId;
  const { data: team } = useTeam(eventTeamId ?? "");

  const [shareError, setShareError] = useState<string | null>(null);
  const [isOpeningCalendar, setIsOpeningCalendar] = useState(false);

  const canReportScore =
    !!event &&
    event.type === "game" &&
    (event.status === "scheduled" ||
      event.status === "in_progress" ||
      event.status === "completed") &&
    canUserReportTeamScores(team, user);

  const teamId = event?.teamId;

  const scheduleQuery = useQuery<ScheduleExport, Error>({
    queryKey: ["events", teamId, "schedule_export"],
    queryFn: () => fetchScheduleExport(teamId!),
    enabled: !!teamId,
    staleTime: 6 * 60 * 60 * 1000,
  });

  useEffect(() => {
    if (scheduleQuery.error) setShareError("Calendar sync is unavailable right now.");
    else if (scheduleQuery.data) setShareError(null);
  }, [scheduleQuery.data, scheduleQuery.error]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <PageHeader title="event" back={() => router.back()} />
        <LoaderBar visible />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
        <PageHeader title="event details" back={() => router.back()} />
        <View className="flex-1 items-center justify-center">
          <Body tone="muted">event not found</Body>
        </View>
      </SafeAreaView>
    );
  }

  const handleOpenDirections = () => {
    if (!event.location) return;
    const destination =
      event.location.latitude != null && event.location.longitude != null
        ? `${event.location.latitude},${event.location.longitude}`
        : encodeURIComponent(event.location.address || event.location.name || "");
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`).catch(() =>
      Alert.alert("Error", "Unable to open maps right now."),
    );
  };

  const handleAddToCalendar = async () => {
    const icsUrl = scheduleQuery.data?.icsUrl;
    const htmlUrl = scheduleQuery.data?.htmlUrl;
    if (!icsUrl && !htmlUrl) {
      Alert.alert(
        "Calendar Export",
        "ICal feed URL is not yet available. Once the team calendar is generated, it can be added to Google Calendar, Outlook, or Apple Calendar.",
      );
      return;
    }
    setIsOpeningCalendar(true);
    try {
      const candidate = htmlUrl || icsUrl!;
      try {
        await Share.share({
          title: `Subscribe to ${event.teamName} schedule`,
          message: candidate,
          url: candidate,
        });
      } catch {
        // dismissed
      }
      openUrl(candidate);
    } finally {
      setIsOpeningCalendar(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <PageHeader title="event" subtitle={event.teamName ?? ""} back={() => router.back()} />

      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-8" showsVerticalScrollIndicator={false}>
        <View className="bg-primary p-5">
          <Eyebrow tone="inverse" className="text-[10px] tracking-[0.2em]">
            {event.type}
          </Eyebrow>
          <Hero tone="inverse" className="text-2xl mt-1">
            {event.title}
          </Hero>
          <Body tone="inverse" className="text-sm mt-2 font-normal">
            {event.startDate ? format(parseISO(event.startDate), "EEEE, MMMM d 'at' h:mm a") : "date tbd"}
          </Body>
        </View>

        <View className="h-5" />

        <SectionLabel>location</SectionLabel>
          <Card>
          <Card.Content>
            <Body tone="primary" className="text-base font-semibold">
              {event.location?.name ?? "tbd"}
            </Body>
            {event.location?.address && (
              <Subtitle tone="secondary" className="mt-1">
                {event.location.address}
              </Subtitle>
            )}

            {event.location?.latitude != null && event.location.longitude != null && (
              <View className="mt-3 border border-surface-border overflow-hidden">
                <MapView
                  style={{ height: 160, width: "100%" }}
                  initialRegion={{
                    latitude: event.location.latitude,
                    longitude: event.location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: event.location.latitude,
                      longitude: event.location.longitude,
                    }}
                    title={event.location.name}
                  />
                </MapView>
              </View>
            )}

            {event.location && (event.location.latitude != null || event.location.address) && (
              <TouchableOpacity
                className="mt-3 flex-row items-center justify-center gap-2 bg-primary py-3"
                onPress={handleOpenDirections}
                activeOpacity={0.85}
              >
                <Ionicons name="navigate" size={18} color="#FFFFFF" />
                <EyebrowTight tone="inverse">Directions</EyebrowTight>
              </TouchableOpacity>
            )}
          </Card.Content>
        </Card>

        {event.notes && (
          <View className="mt-5">
            <SectionLabel>notes</SectionLabel>
            <Card>
              <Card.Content>
                <Body tone="primary" className="text-sm leading-6">
                  {event.notes}
                </Body>
              </Card.Content>
            </Card>
          </View>
        )}

        {event.score && (
          <View className="mt-5">
            <SectionLabel>score</SectionLabel>
            <Card>
              <Card.Content className="gap-3">
                <ScoreRow
                  name={event.score.homeTeamName}
                  score={event.score.homeScore}
                  accent
                />
                <ScoreRow
                  name={event.score.awayTeamName}
                  score={event.score.awayScore}
                />
              </Card.Content>
            </Card>
          </View>
        )}

        {canReportScore && (
          <View className="mt-6">
            <Button
              label={event.score ? "Update Score" : "Report Score"}
              onPress={() => router.push(`/events/${event.id}/report-score`)}
              variant="primary"
            />
          </View>
        )}

        <TouchableOpacity
          className="mt-4 bg-surface border border-surface-border py-4 flex-row items-center justify-center gap-2"
          onPress={handleAddToCalendar}
          disabled={isOpeningCalendar}
          accessibilityRole="button"
          accessibilityLabel="add event to calendar"
          activeOpacity={0.85}
        >
          <Ionicons name="calendar-outline" size={20} color="#000000" />
          <EyebrowTight tone="primary">
            {isOpeningCalendar ? "opening calendar..." : "add to calendar"}
          </EyebrowTight>
        </TouchableOpacity>

        {shareError && (
          <Body tone="muted" className="text-xs text-center mt-2">
            {shareError}
          </Body>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreRow({ name, score, accent }: { name: string; score: number; accent?: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Body tone="primary" className="text-base font-semibold flex-1">
        {name}
      </Body>
      <Hero tone={accent ? "primaryAccent" : "primary"} className="text-3xl">
        {score}
      </Hero>
    </View>
  );
}