import React, { useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Ionicons } from "@expo/vector-icons";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/authStore";
import { fetchAnnouncements, hideAnnouncement } from "@/services/announcements";
import { Announcement, AnnouncementType } from "@/types";

const PAGE_SIZE = 20;

const keyExtractor = (item: Announcement) => item.id;

const TYPE_COLORS: Record<AnnouncementType, { bg: string; text: string; label: string }> = {
  pada_org: { bg: "#7C3AED", text: "white", label: "PADA Org" },
  league_longterm: { bg: "#1E88E5", text: "white", label: "League" },
  game: { bg: "#F57C00", text: "white", label: "Game" },
};

const AnnouncementItem = React.memo(function AnnouncementItem({
  item,
  onDismiss
}: {
  item: Announcement;
  onDismiss: (id: string) => void;
}) {
  const typeInfo = TYPE_COLORS[item.announcementType] || TYPE_COLORS.league_longterm;
  const isExpired = item.expiresAt && isPast(new Date(item.expiresAt));
  const [showDismiss, setShowDismiss] = useState(false);

  const handleLongPress = () => {
    setShowDismiss(true);
  };

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
      ]
    );
  };

  return (
    <TouchableOpacity
      className={`bg-surface rounded-2xl p-4 gap-2 ${isExpired ? "opacity-50" : ""}`}
      onLongPress={handleLongPress}
      onPress={() => {
        if (showDismiss) {
          setShowDismiss(false);
        } else {
          router.push(`/announcements/${item.id}`);
        }
      }}
      delayLongPress={300}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          {!item.isRead && <View className="w-2 h-2 rounded-full bg-primary-500" />}
          <View className="px-2 py-1 rounded-md" style={{ backgroundColor: typeInfo.bg }}>
            <Text className="text-white text-xs font-bold">{typeInfo.label}</Text>
          </View>
          {item.isUrgent && <Badge label="Urgent" variant="danger" />}
          <Text className="text-txt-secondary text-xs">{format(new Date(item.createdAt), "MMM d, yyyy")}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          {item.expiresAt && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={12} color="#8B949E" />
              <Text className="text-txt-muted text-xs">
                {isExpired ? "Expired" : `Expires ${formatDistanceToNow(new Date(item.expiresAt), { addSuffix: true })}`}
              </Text>
            </View>
          )}
          {showDismiss && (
            <TouchableOpacity
              onPress={handleDismiss}
              className="w-7 h-7 rounded-full bg-danger/20 items-center justify-center"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={14} color="#E53935" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text className="text-txt-primary font-bold text-base">{item.title}</Text>
      <Text className="text-txt-muted text-sm" numberOfLines={2}>{item.content}</Text>
    </TouchableOpacity>
  );
});

export default function AnnouncementsListScreen() {
  const { user } = useAuthStore();
  const canPost = user?.role === "league_admin" || user?.role === "captain";
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadAnnouncements = async (reset = false) => {
    if (!user?.id) return;
    
    try {
      const currentOffset = reset ? 0 : offset;
      const result = await fetchAnnouncements(user.id, { 
        limit: PAGE_SIZE, 
        offset: currentOffset 
      });
      
      if (reset) {
        setAnnouncements(result.data);
      } else {
        setAnnouncements(prev => [...prev, ...result.data]);
      }
      
      setHasMore(result.pagination?.hasMore ?? false);
      setOffset(currentOffset + result.data.length);
      setError(null);
    } catch (err) {
      setError("Failed to load announcements");
      console.error("Error loading announcements:", err);
    }
  };

  const load = async () => {
    if (user?.id) {
      await loadAnnouncements(true);
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [user?.id])
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
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#1E88E5" />
      </View>
    );
  };

  const handleDismiss = async (id: string) => {
    await hideAnnouncement(id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 py-4 border-b border-surface-overlay flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#E6EDF3" />
          </TouchableOpacity>
          <Text className="text-txt-primary text-2xl font-black">Announcements</Text>
        </View>
        {canPost && (
          <TouchableOpacity onPress={() => router.push("/announcements/create")}>
            <Ionicons name="create-outline" size={24} color="#1E88E5" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center px-5">
          <Ionicons name="alert-circle-outline" size={48} color="#E53935" />
          <Text className="text-txt-primary text-center mt-2">{error}</Text>
          <TouchableOpacity
            className="mt-4 bg-primary-500 px-4 py-2 rounded-lg"
            onPress={load}
          >
            <Text className="text-white font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={announcements}
          contentContainerClassName="px-5 py-4 gap-4"
          keyExtractor={keyExtractor}
          renderItem={({ item }) => <AnnouncementItem item={item} onDismiss={handleDismiss} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E88E5" />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center pt-10">
              <Text className="text-txt-muted">No announcements yet.</Text>
            </View>
          }
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
        />
      )}
    </SafeAreaView>
  );
}