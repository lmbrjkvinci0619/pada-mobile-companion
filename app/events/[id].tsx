import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
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
    if (scheduleQuery.error) {
      setShareError("Calendar sync is unavailable right now.");
    } else if (scheduleQuery.data) {
      setShareError(null);
    }
  }, [scheduleQuery.data, scheduleQuery.error]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#1E88E5" />
     </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
        <View className="px-5 py-4 border-b border-surface-overlay flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#E6EDF3" />
         </TouchableOpacity>
          <Text
            className="text-txt-primary text-xl font-bold flex-1"
            numberOfLines={1}
          >
            Event Details
         </Text>
       </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-txt-muted">Event not found</Text>
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
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`
    ).catch(() => Alert.alert("Error", "Unable to open maps right now."));
  };

  const handleAddToCalendar = async () => {
    const icsUrl = scheduleQuery.data?.icsUrl;
    const htmlUrl = scheduleQuery.data?.htmlUrl;
    if (!icsUrl && !htmlUrl) {
      Alert.alert(
        "Calendar Export",
        "ICal feed URL is not yet available. Once the team calendar is generated, it can be added to Google Calendar, Outlook, or Apple Calendar."
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
        // User dismissed or share unavailable; fall back to opening the URL.
      }
      openUrl(candidate);
    } finally {
      setIsOpeningCalendar(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <View className="px-5 py-4 border-b border-surface-overlay flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#E6EDF3" />
       </TouchableOpacity>
        <Text
          className="text-txt-primary text-xl font-bold flex-1"
          numberOfLines={1}
        >
          Event Details
       </Text>
     </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerClassName="pb-8"
      >
        <Text className="text-txt-primary text-2xl font-black mb-1">
{event.title}
        </Text>
        <Text className="text-txt-secondary text-base mb-6">
          {event.startDate ? format(parseISO(event.startDate), "EEEE, MMMM d 'at' h:mm a") : "Date TBD"}
        </Text>

        <Card elevated className="mb-4">
          <Text className="text-txt-secondary text-sm font-bold uppercase mb-2">
            Location
         </Text>
          <Text className="text-txt-primary text-base font-semi">
            {event.location?.name ?? "TBD"}
         </Text>
          {event.location?.address ? (
            <Text className="text-txt-muted text-sm mb-3">
              {event.location.address}
           </Text>
          ) : null}

          {event.location?.latitude != null &&
            event.location.longitude != null && (
              <View className="rounded-xl overflow-hidden mb-3 border border-surface-overlay bg-surface-overlay">
                <MapView
                  style={{ height: 150, width: "100%" }}
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

          {event.location &&
            (event.location.latitude != null || event.location.address) && (
              <TouchableOpacity
                className="bg-primary-500/10 border border-primary-500/20 rounded-xl py-3 items-center flex-row justify-center gap-2"
                onPress={handleOpenDirections}
              >
                <Ionicons name="navigate" size={18} color="#388BFD" />
                <Text className="text-primary-300 font-bold">
                  Directions to Field
               </Text>
             </TouchableOpacity>
            )}
       </Card>

        {event.notes && (
          <Card elevated className="mb-4">
            <Text className="text-txt-secondary text-sm font-bold uppercase mb-2">
              Notes
           </Text>
            <Text className="text-txt-primary text-sm">{event.notes}</Text>
         </Card>
        )}

        {event.score && (
          <Card className="mb-4">
            <Text className="text-txt-secondary text-sm font-bold uppercase mb-2">
              Score
           </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-txt-primary text-lg font-bold">
                {event.score.homeTeamName}
             </Text>
              <Text className="text-primary-400 text-2xl font-black">
                {event.score.homeScore}
             </Text>
           </View>
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-txt-primary text-lg font-bold">
                {event.score.awayTeamName}
             </Text>
              <Text className="text-primary-400 text-2xl font-black">
                {event.score.awayScore}
             </Text>
           </View>
         </Card>
        )}

        {canReportScore && (
          <View className="mb-6">
            <Button
              label={event.score ? "Update Score" : "Report Score"}
              onPress={() =>
                router.push(`/events/${event.id}/report-score`)
              }
              variant="primary"
            />
         </View>
        )}

        <TouchableOpacity
          className="bg-surface-raised border border-surface-overlay rounded-xl py-4 flex-row items-center justify-center gap-2"
          onPress={handleAddToCalendar}
          disabled={isOpeningCalendar}
        >
          <Ionicons name="calendar-outline" size={20} color="#E6EDF3" />
          <Text className="text-txt-primary font-bold text-base">
            {isOpeningCalendar ? "Opening Calendar..." : "Add to Calendar"}
         </Text>
       </TouchableOpacity>

        {shareError && (
          <Text className="text-txt-muted text-xs text-center mt-2">
            {shareError}
         </Text>
        )}
     </ScrollView>
   </SafeAreaView>
  );
}
