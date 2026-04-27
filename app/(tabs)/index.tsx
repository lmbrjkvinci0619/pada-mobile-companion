import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { fetchEvents } from "@/services/topscore";
import { fetchAnnouncements } from "@/services/announcements";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import type { Event, Announcement } from "@/types";
import { APP_NAME, SPORT_EMOJI } from "@/constants/config";

function eventDateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE, MMM d");
}

function EventStatusBadge({ status }: { status: Event["status"] }) {
  const map: Record<string, { label: string; variant: any }> = {
    scheduled:   { label: "Upcoming",    variant: "primary" },
    in_progress: { label: "LIVE",        variant: "danger" },
    completed:   { label: "Final",       variant: "ghost" },
    cancelled:   { label: "Cancelled",   variant: "warning" },
    postponed:   { label: "Postponed",   variant: "warning" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "ghost" };
  return <Badge label={label} variant={variant} />;
}

function UpcomingEventCard({ event }: { event: Event }) {
  const isLive = event.status === "in_progress";
  return (
    <TouchableOpacity
      onPress={() => router.push(`/events/${event.id}`)}
      className="mr-4"
      style={{ width: 240 }}
    >
      <Card
        elevated
        className={`gap-3 ${isLive ? "border border-danger/40" : ""}`}
      >
        {isLive && (
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-danger" />
            <Text className="text-danger text-xs font-bold tracking-widest">LIVE NOW</Text>
          </View>
        )}
        <View className="flex-row items-center justify-between">
          <EventStatusBadge status={event.status} />
          <Text className="text-txt-muted text-xs font-mid">
            {eventDateLabel(event.startDate)}
          </Text>
        </View>

        <View>
          <Text className="text-txt-primary text-base font-bold" numberOfLines={1}>
            {event.title}
          </Text>
          <Text className="text-txt-secondary text-sm font-mid mt-0.5" numberOfLines={1}>
            {event.teamName}
          </Text>
        </View>

        {event.location && (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="location-outline" size={13} color="#8B949E" />
            <Text className="text-txt-muted text-xs font-mid flex-1" numberOfLines={1}>
              {event.location.name}
            </Text>
          </View>
        )}

        {event.score && (
          <View className="bg-surface-overlay rounded-xl px-3 py-2 flex-row justify-center gap-4">
            <Text className="text-txt-primary font-black text-lg">
              {event.score.homeScore}
            </Text>
            <Text className="text-txt-muted font-mid text-lg">—</Text>
            <Text className="text-txt-primary font-black text-lg">
              {event.score.awayScore}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

function AnnouncementRow({ ann }: { ann: Announcement }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/announcements/${ann.id}`)}
      className="flex-row items-start gap-3 py-3 border-b border-surface-overlay"
    >
      <View
        className={`w-8 h-8 rounded-full items-center justify-center flex-shrink-0 ${
          ann.isUrgent ? "bg-danger/20" : "bg-primary-500/20"
        }`}
      >
        <Ionicons
          name={ann.isUrgent ? "warning" : "megaphone"}
          size={16}
          color={ann.isUrgent ? "#E53935" : "#64B5F6"}
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-0.5">
          {!ann.isRead && (
            <View className="w-2 h-2 rounded-full bg-primary-500" />
          )}
          {ann.isUrgent && <Badge label="Urgent" variant="danger" />}
          <Text className="text-txt-secondary text-xs font-mid">
            {format(new Date(ann.createdAt), "MMM d")}
          </Text>
        </View>
        <Text
          className={`text-sm font-semi ${ann.isRead ? "text-txt-secondary" : "text-txt-primary"}`}
          numberOfLines={1}
        >
          {ann.title}
        </Text>
        <Text className="text-txt-muted text-xs font-mid mt-0.5" numberOfLines={2}>
          {ann.content}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [events, setEvents]       = useState<Event[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const upcoming = events
    .filter((e) => e.status === "scheduled" || e.status === "in_progress")
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 6);

  const load = async () => {
    const eventData = await fetchEvents();
    setEvents(eventData);

    if (user?.id) {
      const annData = await fetchAnnouncements(user.id);
      setAnnouncements(annData);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E88E5" />
        }
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-txt-muted text-sm font-mid">
              {format(new Date(), "EEEE, MMMM d")}
            </Text>
            <Text className="text-txt-primary text-2xl font-black mt-0.5">
              Hey, {user?.firstName ?? "Player"} {SPORT_EMOJI}
            </Text>
          </View>
          <Avatar
            uri={user?.avatarUrl}
            name={`${user?.firstName} ${user?.lastName}`}
            size="md"
          />
        </View>

        {/* Live game callout */}
        {events.some((e) => e.status === "in_progress") && (
          <TouchableOpacity
            className="mx-5 mb-5 bg-danger/10 border border-danger/30 rounded-2xl px-4 py-3 flex-row items-center gap-3"
            onPress={() => {
              const live = events.find((e) => e.status === "in_progress");
              if (live) router.push(`/events/${live.id}`);
            }}
          >
            <View className="w-3 h-3 rounded-full bg-danger" />
            <View className="flex-1">
              <Text className="text-danger font-bold text-sm">Game in progress!</Text>
              <Text className="text-txt-secondary text-xs font-mid">
                {events.find((e) => e.status === "in_progress")?.title}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#E53935" />
          </TouchableOpacity>
        )}

        {/* Upcoming Events */}
        <View className="mb-6">
          <View className="px-5 flex-row items-center justify-between mb-3">
            <Text className="text-txt-primary text-lg font-bold">Upcoming</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/schedule")}>
              <Text className="text-primary-400 text-sm font-semi">See all</Text>
            </TouchableOpacity>
          </View>

          {upcoming.length === 0 ? (
            <View className="mx-5 bg-surface rounded-2xl p-6 items-center gap-2">
              <Ionicons name="calendar-outline" size={32} color="#484F58" />
              <Text className="text-txt-muted text-sm font-mid text-center">
                No upcoming events. Check back later!
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-5"
            >
              {upcoming.map((ev) => (
                <UpcomingEventCard key={ev.id} event={ev} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Announcements */}
        <View className="mx-5 mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-txt-primary text-lg font-bold">Announcements</Text>
            <TouchableOpacity onPress={() => router.push("/announcements")}>
              <Text className="text-primary-400 text-sm font-semi">See all</Text>
            </TouchableOpacity>
          </View>
          {announcements.length === 0 ? (
             <Card className="items-center py-6">
                <Ionicons name="megaphone-outline" size={32} color="#484F58" />
                <Text className="text-txt-muted text-sm font-mid mt-2 text-center">
                  No new announcements.
                </Text>
             </Card>
          ) : (
             <Card className="gap-0 divide-y divide-surface-overlay">
               {announcements.slice(0, 3).map((ann) => (
                 <AnnouncementRow key={ann.id} ann={ann} />
               ))}
             </Card>
          )}
        </View>

        {/* Quick Actions */}
        <View className="mx-5 mb-8">
          <Text className="text-txt-primary text-lg font-bold mb-3">Quick Actions</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-primary-500/10 border border-primary-500/20 rounded-2xl p-4 items-center gap-2"
              onPress={() => router.push("/(tabs)/chat")}
            >
              <Ionicons name="chatbubbles" size={26} color="#64B5F6" />
              <Text className="text-primary-200 text-xs font-semi text-center">Team Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-disc/10 border border-disc/20 rounded-2xl p-4 items-center gap-2"
              onPress={() => router.push("/(tabs)/schedule")}
            >
              <Ionicons name="calendar" size={26} color="#56D364" />
              <Text className="text-disc-light text-xs font-semi text-center">Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-warning/10 border border-warning/20 rounded-2xl p-4 items-center gap-2"
              onPress={() => router.push("/(tabs)/teams")}
            >
              <Ionicons name="people" size={26} color="#FFA000" />
              <Text className="text-warning text-xs font-semi text-center">My Teams</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
