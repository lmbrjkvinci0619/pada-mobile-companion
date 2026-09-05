import React, { useState, useCallback } from "react";
import { View, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/lib/tokens";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { Body, EyebrowTight, Label, TileTitle } from "@/components/ui";
import { useAuthStore } from "@/store/authStore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { fetchAnnouncements, hideAnnouncement } from "@/services/announcements";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader } from "@/components/ui/Page";
import { Announcement, AnnouncementType } from "@/types";

const PAGE_SIZE = 20;

const keyExtractor = (item: Announcement) => item.id;

type AccentKey = "pada_org" | "league_longterm" | "game";

const TYPE_ACCENT_KEYS: Record<AnnouncementType, AccentKey> = {
  pada_org: "pada_org",
  league_longterm: "league_longterm",
  game: "game",
};

const TYPE_LABEL: Record<AnnouncementType, string> = {
  pada_org: "PADA Org",
  league_longterm: "League",
  game: "Game",
};

function accentFor(type: AnnouncementType, colors: ReturnType<typeof useColors>) {
  switch (TYPE_ACCENT_KEYS[type]) {
    case "pada_org":       return colors.purple;
    case "game":           return colors.warning;
    case "league_longterm":
    default:               return colors.secondary;
  }
}

const AnnouncementItem = React.memo(function AnnouncementItem({
  item,
  onDismiss,
}: {
  item: Announcement;
  onDismiss: (id: string) => void;
}) {
  const colors = useColors();
  const accent = accentFor(item.announcementType, colors);
  const label = TYPE_LABEL[item.announcementType] ?? "League";
  const isExpired = item.expiresAt && isPast(new Date(item.expiresAt));
  const [showDismiss, setShowDismiss] = useState(false);

  const handleLongPress = () => setShowDismiss(true);

  const handleDismiss = () => {
    Alert.alert(
      "Hide Announcement",
      "This announcement will be hidden from your feed. You can unhide it from settings.",
      [
        { text: "Cancel", style: "cancel", onPress: () => setShowDismiss(false) },
        {
          text: "Hide",
          style: "destructive",
          onPress: () => {
            onDismiss(item.id);
            setShowDismiss(false);
          },
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      onPress={() => {
        if (showDismiss) setShowDismiss(false);
        else router.push(`/announcements/${item.id}`);
      }}
      delayLongPress={300}
      activeOpacity={0.85}
      className={isExpired ? "opacity-50" : undefined}
    >
      <Card variant="raised">
        <View className="p-4 gap-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 flex-1">
              {!item.isRead && (
                <View
                  className="w-2 h-2"
                  style={{ backgroundColor: colors.primary }}
                  accessibilityLabel="unread"
                />
              )}
              <Badge label={label} accent={accent} />
              {item.isUrgent && <Badge label="Urgent" variant="danger" />}
              <EyebrowTight tone="secondary">
                {format(new Date(item.createdAt), "MMM d, yyyy").toLowerCase()}
              </EyebrowTight>
            </View>
            <View className="flex-row items-center gap-2">
              {item.expiresAt && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="time-outline" size={12} color={colors.txtSecondary} />
                  <EyebrowTight tone="secondary">
                    {isExpired ? "Expired" : `Expires ${formatDistanceToNow(new Date(item.expiresAt), { addSuffix: true })}`}
                  </EyebrowTight>
                </View>
              )}
              {showDismiss && (
                <TouchableOpacity
                  onPress={handleDismiss}
                  className="w-7 h-7 items-center justify-center"
                  style={{ backgroundColor: colors.danger }}
                  accessibilityRole="button"
                  accessibilityLabel="hide announcement"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={14} color={colors.txtInverse} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TileTitle tone="primary">
            {item.title}
          </TileTitle>
          <Body tone="secondary" className="text-sm" numberOfLines={2}>
            {item.content}
          </Body>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

export default function AnnouncementsListScreen() {
  useAuthRedirect();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const colors = useColors();
  const canPost = user?.isCoordinator || user?.isAdmin || user?.role === "captain";

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadAnnouncements = async (reset: boolean) => {
    try {
      if (!user?.id) {
        setAnnouncements([]);
        setHasMore(false);
        setError(null);
        return;
      }
      const currentOffset = reset ? 0 : offset;
      const result = await fetchAnnouncements(user.id, { limit: PAGE_SIZE, offset: currentOffset });

      if (reset) setAnnouncements(result.data);
      else setAnnouncements((prev) => [...prev, ...result.data]);

      setHasMore(result.pagination?.hasMore ?? false);
      setOffset(currentOffset + result.data.length);
      setError(null);
    } catch (err) {
      setError("Failed to load announcements");
      console.error("Error loading announcements:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user?.id) {
        setIsLoading(false);
        setAnnouncements([]);
        setHasMore(false);
        return () => { active = false; };
      }

      setIsLoading(true);
      setOffset(0);
      (async () => {
        try {
          const result = await fetchAnnouncements(user.id, { limit: PAGE_SIZE, offset: 0 });
          if (!active) return;
          setAnnouncements(result.data);
          setHasMore(result.pagination?.hasMore ?? false);
          setOffset(result.data.length);
          setError(null);
        } catch (err) {
          if (!active) return;
          setError("Failed to load announcements");
        } finally {
          if (active) setIsLoading(false);
        }
      })();

      return () => { active = false; };
    }, [user?.id]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setOffset(0);
    await loadAnnouncements(true);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore || !user?.id) return;
    setIsLoadingMore(true);
    await loadAnnouncements(false);
    setIsLoadingMore(false);
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4 items-center flex-row justify-center gap-3">
        <View className="h-px w-8 bg-primary" />
        <EyebrowTight tone="secondary" className="tracking-[0.2em]">loading more</EyebrowTight>
        <View className="h-px w-8 bg-primary" />
      </View>
    );
  };

  const handleDismiss = async (id: string) => {
    await hideAnnouncement(id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all(user.id) });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <PageHeader
        title="announcements"
        subtitle="alerts & updates"
        back={() => router.back()}
        right={canPost ? (
          <TouchableOpacity
            onPress={() => router.push("/announcements/create")}
            className="w-10 h-10 items-center justify-center"
            style={{ backgroundColor: colors.primary }}
            accessibilityRole="button"
            accessibilityLabel="new announcement"
          >
            <Ionicons name="add" size={24} color={colors.txtInverse} />
          </TouchableOpacity>
        ) : undefined}
      />

      {isLoading ? (
        <LoaderBar visible />
      ) : error ? (
        <View className="flex-1 justify-center items-center px-5">
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Body tone="primary" className="text-center mt-2">
            {error}
          </Body>
          <TouchableOpacity
            className="mt-4 px-5 py-3"
            style={{ backgroundColor: colors.primary }}
            onPress={onRefresh}
            accessibilityRole="button"
            accessibilityLabel="retry loading announcements"
            activeOpacity={0.85}
          >
            <Label style={{ color: colors.txtInverse }} className="text-xs">retry</Label>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={announcements}
          contentContainerClassName="px-5 py-4 gap-3"
          keyExtractor={keyExtractor}
          renderItem={({ item }) => <AnnouncementItem item={item} onDismiss={handleDismiss} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListHeaderComponent={refreshing ? <LoaderBar visible /> : null}
          ListEmptyComponent={
            <View className="mt-8 px-5">
              <EmptyState
                icon="megaphone-outline"
                title="no announcements yet"
                subtitle="PADA posts league, game, and org news here when there's something to share."
                accent="muted"
              />
            </View>
          }
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}