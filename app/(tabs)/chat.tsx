import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Avatar } from "@/components/ui/Avatar";
import { format, parseISO, isToday } from "date-fns";
import { fetchUserConversations } from "@/services/chat";
import { useAuthStore } from "@/store/authStore";
import { ChatConversation } from "@/types";

export default function ChatListScreen() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    if (user?.id) {
      const data = await fetchUserConversations(user.id);
      setConversations(data);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadConversations().finally(() => setIsLoading(false));
    }, [user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: ChatConversation }) => {
    let timeStr = "";
    if (item.lastMessage) {
      const d = new Date(item.lastMessage.createdAt);
      timeStr = isToday(d) ? format(d, "h:mm a") : format(d, "MMM d");
    }

    return (
      <TouchableOpacity
        className="flex-row items-center px-5 py-4 border-b border-surface-overlay"
        onPress={() => router.push(`/teams/${item.teamId}/chat`)}
      >
        <Avatar name={item.teamName} size="lg" className="mr-3" />
        <View className="flex-1">
          <View className="flex-row justify-between mb-1">
            <Text className="text-txt-primary font-bold text-base">{item.teamName}</Text>
            {timeStr ? <Text className="text-txt-muted text-xs">{timeStr}</Text> : null}
          </View>
          <Text className="text-txt-secondary text-sm" numberOfLines={1}>
            {item.lastMessage ? `${item.lastMessage.senderName}: ${item.lastMessage.content}` : "No messages yet"}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View className="bg-primary-500 rounded-full px-2 py-1 ml-3 min-w-[24px] items-center">
            <Text className="text-white text-xs font-bold">{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-4 pb-2 border-b border-surface-overlay">
        <Text className="text-txt-primary text-2xl font-black">Messages</Text>
      </View>
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.teamId}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E88E5" />}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center pt-10">
              <Text className="text-txt-muted">No conversations found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
