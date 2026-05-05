import React, { useMemo, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { useEvents, useAnnouncements } from "@/hooks/useApi";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import type { Event } from "@/types";
import { SPORT_EMOJI } from "@/constants/config";

function eventDateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE, MMM d");
}

function EventStatusBadge({ status }: { status: Event["status"] }) {
  const map: Record<string, { label: string; variant: "primary" | "danger" | "ghost" | "warning" }> = {
    scheduled: { label: "Upcoming", variant: "primary" },
    in_progress: { label: "LIVE", variant: "danger" },
    completed: { label: "Final", variant: "ghost" },
    cancelled: { label: "Cancelled", variant: "warning" },
    postponed: { label: "Postponed", variant: "warning" },
  };
  const { label, variant } = map[status] ?? { label: status, variant: "ghost" };
  return <Badge label={label} variant={variant} />;
}

const UpcomingEventCard = React.memo(function UpcomingEventCard({ event }: { event: Event }) {
  const isLive = event.status === "in_progress";
  return (
    <TouchableOpacity
      onPress={() => router.push(`/events/${event.id}`)}
      className="mr-4"
      activeOpacity={0.8}
      style={{ width: 260 }}
    >
      <Card
        className={`p-0 overflow-hidden border border-surface-border/50 ${
          isLive ? "border-danger/40" : ""
        }`}
      >
        <LinearGradient
          colors={isLive ? ["#F85149", "#DA3633"] : ["#21262D", "#161B22"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-4"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Badge
              label={isLive ? "LIVE" : eventDateLabel(event.startDate)}
              variant={isLive ? "ghost" : "primary"}
              className={isLive ? "bg-white/20 border-white/40" : ""}
            />
            {!isLive && (
              <Text className="text-txt-secondary text-[10px] font-bold uppercase tracking-widest">
                {format(parseISO(event.startDate), "h:mm a")}
              </Text>
            )}
          </View>

          <View className="mb-4">
            <Text
              className={`text-lg font-black leading-tight ${
                isLive ? "text-white" : "text-txt-primary"
              }`}
              numberOfLines={2}
            >
              {event.title}
            </Text>
            <Text
              className={`text-sm font-semi mt-1 ${
                isLive ? "text-white/80" : "text-primary-300"
              }`}
              numberOfLines={1}
            >
              {event.teamName}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-auto pt-4 border-t border-white/10">
            {event.location ? (
              <View className="flex-row items-center gap-1.5 flex-1 mr-2">
                <Ionicons
                  name="location"
                  size={12}
                  color={isLive ? "#fff" : "#8B949E"}
                />
                <Text
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isLive ? "text-white/70" : "text-txt-muted"
                  }`}
                  numberOfLines={1}
                >
                  {event.location.name}
                </Text>
              </View>
            ) : (
              <View className="flex-1" />
            )}

            <Ionicons
              name="chevron-forward-circle"
              size={20}
              color={isLive ? "#fff" : "#30363D"}
            />
          </View>
        </LinearGradient>
      </Card>
    </TouchableOpacity>
  );
});

const AnnouncementRow = React.memo(function AnnouncementRow({ ann }: { ann: { id: string; title: string; content: string; isUrgent: boolean; isRead?: boolean; createdAt: string } }) {
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
          {!ann.isRead && <View className="w-2 h-2 rounded-full bg-primary-500" />}
          {ann.isUrgent && <Badge label="Urgent" variant="danger" />}
          <Text className="text-txt-secondary text-xs font-mid">
            {format(new Date(ann.createdAt), "MMM d")}
          </Text>
        </View>
        <Text
          className={`text-sm font-semi ${
            ann.isRead ? "text-txt-secondary" : "text-txt-primary"
          }`}
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
});

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useEvents();
  const { data: announcements = [], isLoading: announcementsLoading } = useAnnouncements(user?.id || "");
  const [refreshing, setRefreshing] = React.useState(false);

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => e.status === "scheduled" || e.status === "in_progress")
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 6),
    [events]
  );

  const liveEvent = useMemo(
    () => events.find((e) => e.status === "in_progress"),
    [events]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchEvents();
    setRefreshing(false);
  }, [refetchEvents]);

  const isLoading = eventsLoading || announcementsLoading;

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        {/* @ts-ignore */}
        <Ionicons name="sync" size={32} color="#1E88E5" className="animate-spin" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1E88E5"
          />
        }
      >
        <LinearGradient
          colors={["#161B22", "#0D1117"]}
          className="px-5 pt-6 pb-8 rounded-b-[40px] shadow-2xl"
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-primary-300 text-xs font-bold tracking-[2px] uppercase mb-1">
                {format(new Date(), "EEEE, MMMM d")}
              </Text>
              <Text className="text-txt-primary text-3xl font-black">
                Hey, {user?.firstName ?? "Player"} {SPORT_EMOJI}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
              <Avatar
                uri={user?.avatarUrl}
                name={`${user?.firstName} ${user?.lastName}`}
                size="md"
                className="border-2 border-primary-500/30"
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {liveEvent && (
          <TouchableOpacity
            className="mx-5 -mt-4 mb-6 bg-danger/10 border border-danger/30 rounded-2xl overflow-hidden"
            onPress={() => router.push(`/events/${liveEvent.id}`)}
          >
            <LinearGradient
              colors={["rgba(248, 81, 73, 0.15)", "rgba(248, 81, 73, 0.05)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="px-4 py-3 flex-row items-center gap-3"
            >
              <View className="w-3 h-3 rounded-full bg-danger shadow-[0_0_8px_rgba(248,81,73,0.8)]" />
              <View className="flex-1">
                <Text className="text-danger font-black text-sm uppercase tracking-wider">
                  Game in progress!
                </Text>
                <Text className="text-txt-primary text-xs font-bold mt-0.5">
                  {liveEvent.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#F85149" />
            </LinearGradient>
          </TouchableOpacity>
        )}

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

        <View className="mx-5 mb-12">
          <Text className="text-txt-primary text-lg font-black mb-4">Quick Links</Text>
          <View className="flex-row gap-4">
            <TouchableOpacity
              className="flex-1 bg-accent/10 border border-accent/20 rounded-3xl p-5 items-center gap-3 shadow-sm"
              onPress={() => router.push("/(tabs)/schedule")}
            >
              <View className="w-12 h-12 rounded-2xl bg-accent items-center justify-center shadow-lg shadow-accent/50">
                <Ionicons name="calendar" size={24} color="#fff" />
              </View>
              <Text className="text-txt-primary text-xs font-bold text-center tracking-wide">
                Schedule
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-warning/10 border border-warning/20 rounded-3xl p-5 items-center gap-3 shadow-sm"
              onPress={() => router.push("/(tabs)/teams")}
            >
              <View className="w-12 h-12 rounded-2xl bg-warning items-center justify-center shadow-lg shadow-warning/50">
                <Ionicons name="people" size={24} color="#fff" />
              </View>
              <Text className="text-txt-primary text-xs font-bold text-center tracking-wide">
                My Teams
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}