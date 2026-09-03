import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { useAuthStore } from "@/store/authStore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { fetchAnnouncements, hideAnnouncement } from "@/services/announcements";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader } from "@/components/ui/Page";
import { Announcement, AnnouncementType } from "@/types";

const PAGE_SIZE = 20;

const keyExtractor = (item: Announcement) => item.id;

const TYPE_ACCENTS: Record<AnnouncementType, string> = {
  pada_org: "#A200FF",
  league_longterm: "#1BA1E2",
  game: "#F09609",
};

const TYPE_LABELS: Record<AnnouncementType, string> = {
  pada_org: "PADA Org",
  league_longterm: "League",
  game: "Game",
};

const AnnouncementItem = React.memo(function AnnouncementItem({
  item,
  onDismiss,
}: {
  item: Announcement;
  onDismiss: (id: string) => void;
}) {
  const accent = TYPE_ACCENTS[item.announcementType] ?? TYPE_ACCENTS.league_longterm;
  const label = TYPE_LABELS[item.announcementType] ?? "League";
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
      className={`bg-surface border border-surface-border p-4 gap-2 ${isExpired ? "opacity-50" : ""}`}
      onLongPress={handleLongPress}
      onPress={() => {
        if (showDismiss) setShowDismiss(false);
        else router.push(`/announcements/${item.id}`);
      }}
      delayLongPress={300}
      activeOpacity={0.85}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          {!item.isRead && <View className="w-2 h-2 bg-primary" />}
          <Badge label={label} accent={accent} />
          {item.isUrgent && <Badge label="Urgent" variant="danger" />}
          <Text className="text-txt-secondary text-[11px] font-semibold uppercase tracking-[0.12em]">
            {format(new Date(item.createdAt), "MMM d, yyyy").toLowerCase()}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {item.expiresAt && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={12} color="#5C5C5C" />
              <Text className="text-txt-secondary text-[10px] uppercase font-semibold tracking-[0.12em]">
                {isExpired ? "Expired" : `Expires ${formatDistanceToNow(new Date(item.expiresAt), { addSuffix: true })}`}
              </Text>
            </View>
          )}
          {showDismiss && (
            <TouchableOpacity
              onPress={handleDismiss}
              className="w-7 h-7 bg-danger items-center justify-center"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text className="text-txt-primary font-semibold text-base">{item.title}</Text>
      <Text className="text-txt-secondary text-sm" numberOfLines={2}>{item.content}</Text>
    </TouchableOpacity>
  );
});

export default function AnnouncementsListScreen() {
  useAuthRedirect();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
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
        <Text className="text-txt-secondary text-[10px] font-semibold uppercase tracking-[0.2em]">loading more</Text>
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
          <TouchableOpacity onPress={() => router.push("/announcements/create")} className="w-10 h-10 items-center justify-center bg-primary">
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : undefined}
      />

      {isLoading ? (
        <LoaderBar visible />
      ) : error ? (
        <View className="flex-1 justify-center items-center px-5">
          <Ionicons name="alert-circle-outline" size={48} color="#E51400" />
          <Text className="text-txt-primary text-center mt-2">{error}</Text>
          <TouchableOpacity className="mt-4 bg-primary px-5 py-3" onPress={onRefresh} activeOpacity={0.85}>
            <Text className="text-txt-inverse font-semibold uppercase tracking-[0.12em] text-xs">retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={announcements}
          contentContainerClassName="px-5 py-4 gap-3"
          keyExtractor={keyExtractor}
          renderItem={({ item }) => <AnnouncementItem item={item} onDismiss={handleDismiss} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ABA9" />}
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