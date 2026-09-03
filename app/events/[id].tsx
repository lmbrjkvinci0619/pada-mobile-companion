import React, { useEffect, useState } from "react";
import {
  View,
  Text,
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
          <Text className="text-txt-muted">event not found</Text>
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
        <View className="bg-primary p-5 border-2 border-primary-700">
          <Text className="text-txt-inverse/85 text-[10px] font-semibold uppercase tracking-[0.2em]">
            {event.type}
          </Text>
          <Text className="text-txt-inverse text-2xl font-light lowercase tracking-tight mt-1">
            {event.title}
          </Text>
          <Text className="text-txt-inverse/90 text-sm mt-2 font-normal">
            {event.startDate ? format(parseISO(event.startDate), "EEEE, MMMM d 'at' h:mm a") : "date tbd"}
          </Text>
        </View>

        <View className="h-5" />

        <SectionLabel>location</SectionLabel>
        <Card>
          <Card.Content>
            <Text className="text-txt-primary text-base font-semibold">{event.location?.name ?? "tbd"}</Text>
            {event.location?.address && (
              <Text className="text-txt-secondary text-xs mt-1">{event.location.address}</Text>
            )}

            {event.location?.latitude != null && event.location.longitude != null && (
              <View className="mt-3 border-2 border-surface-border overflow-hidden">
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
                className="mt-3 flex-row items-center justify-center gap-2 bg-primary border-2 border-primary py-3"
                onPress={handleOpenDirections}
                activeOpacity={0.85}
              >
                <Ionicons name="navigate" size={18} color="#FFFFFF" />
                <Text className="text-txt-inverse text-xs font-semibold uppercase tracking-[0.12em]">Directions</Text>
              </TouchableOpacity>
            )}
          </Card.Content>
        </Card>

        {event.notes && (
          <View className="mt-5">
            <SectionLabel>notes</SectionLabel>
            <Card>
              <Card.Content>
                <Text className="text-txt-primary text-sm leading-6">{event.notes}</Text>
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
          className="mt-4 bg-surface border-2 border-surface-border py-4 flex-row items-center justify-center gap-2"
          onPress={handleAddToCalendar}
          disabled={isOpeningCalendar}
          activeOpacity={0.85}
        >
          <Ionicons name="calendar-outline" size={20} color="#000000" />
          <Text className="text-txt-primary text-sm font-semibold uppercase tracking-[0.12em]">
            {isOpeningCalendar ? "opening calendar..." : "add to calendar"}
          </Text>
        </TouchableOpacity>

        {shareError && (
          <Text className="text-txt-muted text-xs text-center mt-2">{shareError}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScoreRow({ name, score, accent }: { name: string; score: number; accent?: boolean }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-txt-primary text-base font-semibold flex-1">{name}</Text>
      <Text className={`text-3xl font-light ${accent ? "text-primary" : "text-txt-primary"}`}>{score}</Text>
    </View>
  );
}