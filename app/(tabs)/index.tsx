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
import { useEvents, useAnnouncements, useRegistrations, useArticles } from "@/hooks/useApi";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import type { Event, Article } from "@/types";
import { SPORT_EMOJI } from "@/constants/config";
import { EXTERNAL_URLS, openUrl } from "@/lib/urlUtils";

function eventDateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE, MMM d");
}

const MyNextGameCard = React.memo(function MyNextGameCard({ event }: { event: Event }) {
  const eventDate = parseISO(event.startDate);
  const dateLabel = eventDateLabel(event.startDate);
  const timeLabel = format(eventDate, "h:mm a");

  return (
    <Card className="p-0 overflow-hidden border border-primary-500/30">
      <LinearGradient
        colors={["#1E88E5", "#1565C0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-5"
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white/70 text-xs font-bold uppercase tracking-widest">
            My Next Game
          </Text>
          <Badge label={dateLabel} variant="ghost" className="bg-white/20 border-white/40" />
        </View>

        <View className="mb-3">
          <Text className="text-white text-xl font-black leading-tight mb-1">
            {event.opponentName ? `vs. ${event.opponentName}` : event.title}
          </Text>
          <Text className="text-white/70 text-sm font-semi">
            {event.teamName}
          </Text>
        </View>

        <View className="flex-row gap-4">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text className="text-white text-sm font-semi">{timeLabel}</Text>
          </View>

          {event.location && (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="location-outline" size={14} color="#fff" />
              <Text className="text-white text-sm font-semi" numberOfLines={1}>
                {event.location.name}
              </Text>
            </View>
          )}
        </View>

        {event.attendance !== undefined && (
          <View className="flex-row items-center gap-1.5 mt-2">
            <Ionicons name="people-outline" size={14} color="#fff" />
            <Text className="text-white/70 text-xs font-mid">
              {event.attendance} players attending
            </Text>
          </View>
        )}
      </LinearGradient>
    </Card>
  );
});

const PublicEventCard = React.memo(function PublicEventCard({ event }: { event: Event }) {
  const eventDate = parseISO(event.startDate);
  const dateLabel = eventDateLabel(event.startDate);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/events/${event.id}`)}
      activeOpacity={0.8}
    >
      <Card className="p-4 mr-4 bg-surface-raised border border-surface-border/30" style={{ width: 180 }}>
        <View className="mb-2">
          <Badge label={dateLabel} variant="primary" />
        </View>
        <Text className="text-txt-primary text-base font-black leading-tight mb-1" numberOfLines={2}>
          {event.title}
        </Text>
        {event.location && (
          <View className="flex-row items-center gap-1 mt-1">
            <Ionicons name="location-outline" size={10} color="#8B949E" />
            <Text className="text-txt-muted text-xs" numberOfLines={1}>
              {event.location.name}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
});

const ArticleCard = React.memo(function ArticleCard({ article }: { article: Article }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/p/${article.slug || article.id}`)}
      className="mr-4"
      activeOpacity={0.8}
      style={{ width: 280 }}
    >
      <Card className="p-0 overflow-hidden border border-surface-border/30">
        {article.imageUrl && (
          <View className="h-32 bg-surface-raised">
            <Text className="text-txt-muted text-xs p-2">Image: {article.imageUrl}</Text>
          </View>
        )}
        <View className="p-4">
          {article.category && (
            <Badge label={article.category} variant="primary" className="mb-2 self-start" />
          )}
          <Text className="text-txt-primary text-base font-black leading-tight mb-1" numberOfLines={2}>
            {article.title}
          </Text>
          {article.summary && (
            <Text className="text-txt-secondary text-sm font-mid mt-1" numberOfLines={2}>
              {article.summary}
            </Text>
          )}
          {article.publishedAt && (
            <Text className="text-txt-muted text-xs font-mid mt-2">
              {format(parseISO(article.publishedAt), "MMM d, yyyy")}
            </Text>
          )}
        </View>
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
  const { user, isAuthenticated } = useAuthStore();
  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useEvents();
  const { data: registrations = [] } = useRegistrations();
  const { data: announcements = [], isLoading: announcementsLoading } = useAnnouncements(user?.id || "");
  const { data: articles = [] } = useArticles();
  const [refreshing, setRefreshing] = React.useState(false);

  const upcomingGames = useMemo(
    () =>
      events
        .filter((e) => e.type === "game" && (e.status === "scheduled" || e.status === "in_progress"))
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 6),
    [events]
  );

  const publicEvents = useMemo(
    () =>
      events
        .filter((e) => e.status === "scheduled")
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 6),
    [events]
  );

  const recentArticles = useMemo(
    () =>
      [...articles]
        .sort((a, b) => {
          const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 6),
    [articles]
  );

  const myNextGame = useMemo(() => {
    if (!isAuthenticated || registrations.length === 0) return null;

    const userTeamIds = registrations
      .filter(r => r.status === "accepted" && r.teamId)
      .map(r => r.teamId);

    if (userTeamIds.length === 0) return null;

    const myGames = events.filter(
      e => e.type === "game" &&
           userTeamIds.includes(e.teamId) &&
           e.status === "scheduled"
    );

    if (myGames.length === 0) return null;

    return myGames.sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  }, [events, registrations, isAuthenticated]);

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
        <Ionicons name="sync" size={32} color="#1E88E5" />
    </SafeAreaView>
    );
  }

  const greeting = isAuthenticated
    ? `Hey, ${user?.firstName ?? "Player"} ${SPORT_EMOJI}`
    : `Welcome to PadaHub ${SPORT_EMOJI}`;

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
                {greeting}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
              <Avatar
                uri={user?.avatarUrl}
                name={user ? `${user.firstName} ${user.lastName}` : "Guest"}
                size="md"
                className="border-2 border-primary-500/30"
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {!isAuthenticated && (
          <View className="mx-5 -mt-4 mb-6">
            <Card className="bg-primary-500/10 border-primary-500/30 p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-primary-500/20 items-center justify-center">
                  <Ionicons name="log-in-outline" size={20} color="#388BFD" />
                </View>
                <View className="flex-1">
                  <Text className="text-txt-primary text-sm font-bold">
                    Sign in to see your games
                  </Text>
                  <Text className="text-txt-secondary text-xs font-mid">
                    View your schedule, team details, and more
                  </Text>
                </View>
              </View>
              <Button
                label="Sign In"
                onPress={() => router.push("/(auth)/login")}
                className="mt-3"
              />
            </Card>
          </View>
        )}

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

        {isAuthenticated && myNextGame && (
          <View className="mx-5 -mt-4 mb-6">
            <MyNextGameCard event={myNextGame} />
          </View>
        )}

        {!isAuthenticated && (
          <View className="mx-5 mb-6">
            <TouchableOpacity
              onPress={() => openUrl(EXTERNAL_URLS.about)}
              activeOpacity={0.9}
            >
              <Card className="bg-accent/10 border-accent/20 p-5">
                <View className="flex-row items-center gap-4">
                  <View className="w-14 h-14 rounded-2xl bg-accent items-center justify-center">
                    <Ionicons name="information-circle" size={28} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-txt-primary text-lg font-black mb-1">
                      About PADA
                    </Text>
                    <Text className="text-txt-secondary text-sm font-mid" numberOfLines={2}>
                      Portland Ultimate Frisbee Association - Building community through spirit of the game since 1985.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8B949E" />
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {!isAuthenticated && (
          <View className="mb-6">
            <View className="px-5 flex-row items-center justify-between mb-3">
              <Text className="text-txt-primary text-lg font-bold">Upcoming Event Dates</Text>
            </View>

            {publicEvents.length === 0 ? (
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
                {publicEvents.map((ev) => (
                  <PublicEventCard key={ev.id} event={ev} />
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {!isAuthenticated && recentArticles.length > 0 && (
          <View className="mb-6">
            <View className="px-5 flex-row items-center justify-between mb-3">
              <Text className="text-txt-primary text-lg font-bold">Recent News</Text>
              <TouchableOpacity onPress={() => router.push("/p")}>
                <Text className="text-primary-400 text-sm font-semi">See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-5"
            >
              {recentArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </ScrollView>
          </View>
        )}

        {isAuthenticated && (
          <>
            <View className="mb-6">
              <View className="px-5 flex-row items-center justify-between mb-3">
                <Text className="text-txt-primary text-lg font-bold">Upcoming Games</Text>
                <TouchableOpacity onPress={() => router.push("/(tabs)/schedule")}>
                  <Text className="text-primary-400 text-sm font-semi">See all</Text>
                </TouchableOpacity>
              </View>

              {upcomingGames.length === 0 ? (
                <View className="mx-5 bg-surface rounded-2xl p-6 items-center gap-2">
                  <Ionicons name="calendar-outline" size={32} color="#484F58" />
                  <Text className="text-txt-muted text-sm font-mid text-center">
                    No upcoming games. Check back later!
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="px-5"
                >
                  {upcomingGames.map((ev) => (
                    <TouchableOpacity
                      key={ev.id}
                      onPress={() => router.push(`/events/${ev.id}`)}
                      className="mr-4"
                      activeOpacity={0.8}
                      style={{ width: 260 }}
                    >
                      <Card
                        className={`p-0 overflow-hidden border border-surface-border/50 ${
                          ev.status === "in_progress" ? "border-danger/40" : ""
                        }`}
                      >
                        <LinearGradient
                          colors={ev.status === "in_progress" ? ["#F85149", "#DA3633"] : ["#21262D", "#161B22"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          className="p-4"
                        >
                          <View className="flex-row items-center justify-between mb-4">
                            <Badge
                              label={ev.status === "in_progress" ? "LIVE" : eventDateLabel(ev.startDate)}
                              variant={ev.status === "in_progress" ? "ghost" : "primary"}
                              className={ev.status === "in_progress" ? "bg-white/20 border-white/40" : ""}
                            />
                            {ev.status !== "in_progress" && (
                              <Text className="text-txt-secondary text-[10px] font-bold uppercase tracking-widest">
                                {format(parseISO(ev.startDate), "h:mm a")}
                              </Text>
                            )}
                          </View>

                          <View className="mb-4">
                            <Text
                              className={`text-lg font-black leading-tight ${
                                ev.status === "in_progress" ? "text-white" : "text-txt-primary"
                              }`}
                              numberOfLines={2}
                            >
                              {ev.title}
                            </Text>
                            <Text
                              className={`text-sm font-semi mt-1 ${
                                ev.status === "in_progress" ? "text-white/80" : "text-primary-300"
                              }`}
                              numberOfLines={1}
                            >
                              {ev.teamName}
                            </Text>
                          </View>

                          <View className="flex-row items-center justify-between mt-auto pt-4 border-t border-white/10">
                            {ev.location ? (
                              <View className="flex-row items-center gap-1.5 flex-1 mr-2">
                                <Ionicons
                                  name="location"
                                  size={12}
                                  color={ev.status === "in_progress" ? "#fff" : "#8B949E"}
                                />
                                <Text
                                  className={`text-[10px] font-bold uppercase tracking-wider ${
                                    ev.status === "in_progress" ? "text-white/70" : "text-txt-muted"
                                  }`}
                                  numberOfLines={1}
                                >
                                  {ev.location.name}
                                </Text>
                              </View>
                            ) : (
                              <View className="flex-1" />
                            )}

                            <Ionicons
                              name="chevron-forward-circle"
                              size={20}
                              color={ev.status === "in_progress" ? "#fff" : "#30363D"}
                            />
                          </View>
                        </LinearGradient>
                      </Card>
                    </TouchableOpacity>
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}