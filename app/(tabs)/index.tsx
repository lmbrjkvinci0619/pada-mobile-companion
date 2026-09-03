import React, { useMemo, useCallback, useState, useRef } from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  RefreshControl,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { useEvents, useAnnouncements, useRegistrations, useArticles } from "@/hooks/useApi";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Tile, TileGrid, TileCell } from "@/components/ui/Tile";
import { Hub, HubPanel, useHubMetrics } from "@/components/ui/Hub";
import { PivotPanorama } from "@/components/ui/Pivot";
import { SectionLabel, IconChip } from "@/components/ui/Page";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { PagerDots } from "@/components/ui/PagerDots";
import { DonateFooter } from "@/components/ui/DonateFooter";
import { Title, Body, Eyebrow, Subtitle, Label } from "@/components/ui";
import type { Event, Article } from "@/types";
import { EXTERNAL_URLS, openUrl } from "@/lib/urlUtils";

function eventDateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "EEE, MMM d");
}

const AnnouncementRow = React.memo(function AnnouncementRow({
  ann,
}: {
  ann: { id: string; title: string; content: string; isUrgent: boolean; isRead?: boolean; createdAt: string };
}) {
  const accent = ann.isUrgent ? "danger" : "secondary";
  const iconName = ann.isUrgent ? "warning" : "megaphone";
  const accentColor = ann.isUrgent ? "#E51400" : "#1BA1E2";
  return (
    <TouchableOpacity
      onPress={() => router.push(`/announcements/${ann.id}`)}
      activeOpacity={0.85}
      className="flex-row items-start gap-3 py-4 border-b border-surface-border"
    >
      <View className="w-9 h-9 items-center justify-center bg-surface-overlay border border-surface-border">
        <Ionicons name={iconName} size={18} color={accentColor} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-1">
          {!ann.isRead && <View className="w-2 h-2 bg-primary" accessibilityLabel="unread" />}
          {ann.isUrgent && <Badge label="Urgent" variant="danger" />}
          <Eyebrow tone="secondary" className="tracking-[0.12em]">
            {format(new Date(ann.createdAt), "MMM d")}
          </Eyebrow>
        </View>
        <Body
          tone={ann.isRead ? "secondary" : "primary"}
          className="text-sm font-semibold leading-snug"
          numberOfLines={1}
        >
          {ann.title}
        </Body>
        <Subtitle tone="secondary" className="mt-1" numberOfLines={2}>
          {ann.content}
        </Subtitle>
      </View>
    </TouchableOpacity>
  );
});

const PublicEventCard = React.memo(function PublicEventCard({ event }: { event: Event }) {
  const dateLabel = event.startDate ? eventDateLabel(event.startDate) : "Date TBD";
  return (
    <TouchableOpacity
      onPress={() => router.push(`/events/${event.id}`)}
      activeOpacity={0.85}
      className="mr-3"
    >
      <Tile
        size="medium"
        accent="secondary"
        eyebrow={dateLabel}
        title={event.title}
        subtitle={event.location?.name}
        style={{ width: 200, height: 130 }}
      />
    </TouchableOpacity>
  );
});

const ArticleTile = React.memo(function ArticleTile({ article }: { article: Article }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/p/${article.slug || article.id}`)}
      activeOpacity={0.85}
      className="mr-3"
    >
      <View style={{ width: 240 }} className="bg-surface-raised border border-surface-border">
        <View className="h-24 bg-primary-50 items-center justify-center border-b border-surface-border">
          <Ionicons name="newspaper-outline" size={28} color="#00ABA9" />
        </View>
        <View className="p-3">
          {article.category && <Badge label={article.category} variant="primary" className="mb-2" />}
          <Body tone="primary" className="text-sm font-semibold leading-snug" numberOfLines={2}>
            {article.title}
          </Body>
          {article.publishedAt && (
            <Eyebrow tone="secondary" className="text-[10px] mt-2">
              {format(parseISO(article.publishedAt), "MMM d, yyyy").toLowerCase()}
            </Eyebrow>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { data: events = [], isLoading: eventsLoading, refetch: refetchEvents } = useEvents();
  const { data: registrations = [] } = useRegistrations();
  const { data: announcements = [], isLoading: announcementsLoading, refetch: refetchAnnouncements } = useAnnouncements(user?.id || "");
  const { data: articles = [] } = useArticles();
  const [refreshing, setRefreshing] = React.useState(false);

  const upcomingGames = useMemo(
    () =>
      events
        .filter((e) => e.type === "game" && (e.status === "scheduled" || e.status === "in_progress") && e.startDate)
        .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))
        .slice(0, 6),
    [events],
  );

  const publicEvents = useMemo(
    () =>
      events
        .filter((e) => e.status === "scheduled" && e.startDate)
        .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))
        .slice(0, 6),
    [events],
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
    [articles],
  );

  const myNextGame = useMemo(() => {
    if (!isAuthenticated || registrations.length === 0) return null;

    const userTeamIds = registrations
      .filter((r) => r.status === "accepted" && r.teamId)
      .map((r) => r.teamId as string);

    if (userTeamIds.length === 0) return null;

    const myGames = events.filter(
      (e) =>
        e.type === "game" &&
        e.teamId != null &&
        userTeamIds.includes(e.teamId) &&
        e.status === "scheduled" &&
        e.startDate,
    );

    if (myGames.length === 0) return null;

    return myGames.sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))[0];
  }, [events, registrations, isAuthenticated]);

  const liveEvent = useMemo(() => events.find((e) => e.status === "in_progress"), [events]);

  const unreadAnnouncements = useMemo(
    () => announcements.filter((a) => !a.isRead).length,
    [announcements],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchEvents(), refetchAnnouncements()]);
    setRefreshing(false);
  }, [refetchEvents, refetchAnnouncements]);

  const isLoading = (eventsLoading || announcementsLoading) && events.length === 0;

  const [activePanel, setActivePanel] = useState(0);
  const activePanelRef = useRef(0);
  activePanelRef.current = activePanel;
  const { stride } = useHubMetrics();
  const hasPannedRef = useRef(false);
  const onHubScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    if (offsetX < 0) return;
    const idx = Math.round(offsetX / stride);
    if (idx !== activePanelRef.current && idx >= 0) {
      setActivePanel(idx);
      if (offsetX > 8) hasPannedRef.current = true;
    } else if (offsetX > 8) {
      hasPannedRef.current = true;
    }
  }, [stride]);

  const greeting = isAuthenticated ? (user?.firstName ?? "player").toLowerCase() : "guest";

  const liveGame = liveEvent
    ? {
        eyebrow: "Live now",
        title: liveEvent.title,
        subtitle: liveEvent.teamName ?? "",
        accent: "danger" as const,
        onPress: () => router.push(`/events/${liveEvent.id}`),
      }
    : null;

  const nextGameTile = myNextGame
    ? {
        eyebrow: eventDateLabel(myNextGame.startDate!),
        title: myNextGame.opponentName ? `vs ${myNextGame.opponentName}` : myNextGame.title,
        subtitle: myNextGame.teamName ?? "",
        meta: myNextGame.location?.name,
        accent: "primary" as const,
        onPress: () => router.push(`/events/${myNextGame.id}`),
      }
    : null;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <LoaderBar visible={isLoading} />
      <PivotPanorama
        title="padahub"
        subtitle={format(new Date(), "EEEE, MMMM d").toLowerCase()}
        unread={unreadAnnouncements}
        right={
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.85}>
            <Avatar
              uri={user?.avatarUrl}
              name={user ? `${user.firstName} ${user.lastName}` : "Guest"}
              size="md"
            />
          </TouchableOpacity>
        }
      />

      <Hub className="flex-1" onScroll={onHubScroll}>
        <HubPanel title="home">
          {!hasPannedRef.current && activePanel === 0 && (
            <View className="absolute right-3 top-2 z-10 flex-row items-center gap-1 opacity-60" pointerEvents="none" accessibilityElementsHidden>
              <Eyebrow tone="secondary" className="tracking-[0.18em]">swipe</Eyebrow>
              <Ionicons name="chevron-forward" size={14} color="#5C5C5C" />
            </View>
          )}
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ABA9" />}>
            <View className="mb-4">
              <Title numberOfLines={1} size="sm" className="text-[26px]">
                hello, {greeting}
              </Title>
            </View>

            {!isAuthenticated && (
              <Tile
                size="wide"
                accent="secondary"
                eyebrow="welcome"
                title="Sign in to see your schedule"
                subtitle="registrations, teams, and live games"
                onPress={() => router.push("/(auth)/login")}
                icon={<Ionicons name="log-in-outline" size={28} color="#FFFFFF" />}
              />
            )}

            <View className="h-3" />

            <TileGrid>
              {liveGame && (
                <TileCell basis="full">
                  <Tile
                    size="wide"
                    accent={liveGame.accent}
                    eyebrow={liveGame.eyebrow}
                    title={liveGame.title}
                    subtitle={liveGame.subtitle}
                    onPress={liveGame.onPress}
                  />
                </TileCell>
              )}
              {nextGameTile && (
                <TileCell basis="full">
                  <Tile
                    size="wide"
                    accent={nextGameTile.accent}
                    eyebrow={nextGameTile.eyebrow}
                    title={nextGameTile.title}
                    subtitle={nextGameTile.subtitle}
                    meta={nextGameTile.meta}
                    onPress={nextGameTile.onPress}
                  />
                </TileCell>
              )}
              <TileCell basis="1/2">
                <Tile
                  size="small"
                  accent="black"
                  eyebrow="quick"
                  title="Schedule"
                  onPress={() => router.push("/(tabs)/schedule")}
                />
              </TileCell>
              <TileCell basis="1/2">
                <Tile
                  size="small"
                  accent="black"
                  eyebrow="quick"
                  title="My Teams"
                  onPress={() => router.push("/(tabs)/teams")}
                />
              </TileCell>
              <TileCell basis="1/2">
                <Tile
                  size="small"
                  accent="success"
                  eyebrow="account"
                  title="registrations"
                  onPress={() => router.push("/(tabs)/registrations")}
                />
              </TileCell>
              <TileCell basis="1/2">
                <Tile
                  size="small"
                  accent="magenta"
                  eyebrow="account"
                  title="Profile"
                  onPress={() => router.push("/(tabs)/profile")}
                />
              </TileCell>
            </TileGrid>

            <View className="h-6" />

            <SectionLabel
              action={
                <TouchableOpacity onPress={() => router.push("/(tabs)/schedule")}>
                  <Eyebrow tone="primaryAccent" className="tracking-[0.18em]">all</Eyebrow>
                </TouchableOpacity>
              }
            >
              upcoming
            </SectionLabel>

            {upcomingGames.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="no games scheduled"
                subtitle="When your team schedules a game, it will appear here."
                accent="muted"
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
                <View className="flex-row px-1">
                  {upcomingGames.map((g) => (
                    <View key={g.id} className="mr-3" style={{ width: 200 }}>
                      <PublicEventCard event={g} />
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </ScrollView>
        </HubPanel>

        <HubPanel title="alerts" signal={unreadAnnouncements > 0 ? "unread" : null}>
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ABA9" />}>
            <SectionLabel
              action={
                <TouchableOpacity onPress={() => router.push("/announcements")}>
                  <Eyebrow tone="primaryAccent" className="tracking-[0.18em]">all</Eyebrow>
                </TouchableOpacity>
              }
            >
              announcements
            </SectionLabel>

            {announcements.length === 0 ? (
              <EmptyState
                icon="megaphone-outline"
                title="no active announcements"
                subtitle="You're all caught up. PADA posts here when there's news."
                accent="muted"
              />
            ) : (
              <View className="border-t border-surface-border">
                {announcements.slice(0, 6).map((ann) => (
                  <AnnouncementRow key={ann.id} ann={ann} />
                ))}
              </View>
            )}

            <View className="h-6" />
            <SectionLabel>quick links</SectionLabel>
            <TileGrid>
              <TileCell basis="1/2">
                <Tile
                  size="small"
                  accent="secondary"
                  eyebrow="pada"
                  title="New to PADA"
                  onPress={() => openUrl(EXTERNAL_URLS.newToPada)}
                />
              </TileCell>
              <TileCell basis="1/2">
                <Tile
                  size="small"
                  accent="warning"
                  eyebrow="pada"
                  title="Youth"
                  onPress={() => openUrl(EXTERNAL_URLS.youth)}
                />
              </TileCell>
              <TileCell basis="1/2">
                <Tile
                  size="small"
                  accent="success"
                  eyebrow="pada"
                  title="Fields"
                  onPress={() => openUrl(EXTERNAL_URLS.fields)}
                />
              </TileCell>
              <TileCell basis="1/2">
                <Tile
                  size="small"
                  accent="danger"
                  eyebrow="pada"
                  title="Donate"
                  onPress={() => openUrl(EXTERNAL_URLS.donate)}
                />
              </TileCell>
            </TileGrid>
          </ScrollView>
        </HubPanel>

        <HubPanel title="explore">
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ABA9" />}>
            <TouchableOpacity
              onPress={() => openUrl(EXTERNAL_URLS.about)}
              activeOpacity={0.85}
              className="mb-6"
            >
              <Card variant="default">
                <View className="p-4 flex-row items-start gap-3">
                  <IconChip name="information-circle" color="#339933" background="#33993322" />
                  <View className="flex-1">
                    <Label tone="primary" className="tracking-[0.12em]">About PADA</Label>
                    <Subtitle tone="secondary" className="mt-1" numberOfLines={3}>
                      Portland Ultimate Frisbee Association — building community through spirit of the game since 1985.
                    </Subtitle>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>

            <SectionLabel>events</SectionLabel>
            {publicEvents.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="no upcoming events"
                accent="muted"
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
                <View className="flex-row px-1">
                  {publicEvents.map((ev) => (
                    <View key={ev.id} className="mr-3">
                      <PublicEventCard event={ev} />
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}

            <View className="h-6" />

            {recentArticles.length > 0 && (
              <>
                <SectionLabel
                  action={
                    <TouchableOpacity onPress={() => router.push("/p")}>
                      <Eyebrow tone="primaryAccent" className="tracking-[0.18em]">all</Eyebrow>
                    </TouchableOpacity>
                  }
                >
                  recent news
                </SectionLabel>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
                  <View className="flex-row px-1">
                    {recentArticles.map((article) => (
                      <View key={article.id} className="mr-3">
                        <ArticleTile article={article} />
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
          </ScrollView>
        </HubPanel>
      </Hub>

      <View className="bg-bg border-t border-surface-border">
        <PagerDots count={3} active={activePanel} />
      </View>
      <DonateFooter />
      <LoaderBar visible={refreshing || (eventsLoading && events.length > 0)} />
    </SafeAreaView>
  );
}