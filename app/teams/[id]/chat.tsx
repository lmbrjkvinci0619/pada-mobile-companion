import React, { useState, useCallback, useEffect } from "react";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { GiftedChat, IMessage, Bubble } from "react-native-gifted-chat";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchTeam } from "@/services/topscore";
import { useAuthStore } from "@/store/authStore";
import { fetchMessages, sendMessage, subscribeToMessages } from "@/services/chat";

export default function TeamChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [teamName, setTeamName] = useState("");
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuthStore();
  const PAGE_SIZE = 50;

  const mapToGiftedChat = (msg: any): IMessage => ({
    _id: msg.id,
    text: msg.content,
    createdAt: new Date(msg.createdAt),
    user: {
      _id: msg.senderId,
      name: msg.senderName,
      avatar: msg.senderAvatarUrl,
    },
  });

  useEffect(() => {
    if (id) {
      fetchTeam(id).then(t => t && setTeamName(t.name));
      
      // Load initial messages
      fetchMessages(id, PAGE_SIZE, 0).then(msgs => {
        setMessages(msgs.map(mapToGiftedChat));
        if (msgs.length < PAGE_SIZE) setHasMore(false);
      });

      // Subscribe to real-time updates
      const unsubscribe = subscribeToMessages(id, (newMsg) => {
        // Avoid duplicate if sent by current user (since onSend handles local append)
        if (newMsg.senderId !== user?.id) {
          setMessages(prev => GiftedChat.append(prev, [mapToGiftedChat(newMsg)]));
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [id, user?.id]);

  const onLoadEarlier = async () => {
    if (!hasMore || isLoadingEarlier || !id) return;
    setIsLoadingEarlier(true);
    
    const offset = messages.length;
    const olderMsgs = await fetchMessages(id, PAGE_SIZE, offset);
    
    if (olderMsgs.length < PAGE_SIZE) setHasMore(false);
    
    setMessages(prev => GiftedChat.prepend(prev, olderMsgs.map(mapToGiftedChat)));
    setIsLoadingEarlier(false);
  };

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
      
      const msg = newMessages[0];
      if (id && user && msg) {
        await sendMessage(id, user.id, user.firstName + " " + user.lastName, msg.text);
      }
    },
    [id, user]
  );

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <View className="px-5 py-4 bg-surface border-b border-surface-overlay flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#E6EDF3" />
        </TouchableOpacity>
        <View className="flex-1">
           <Text className="text-txt-primary text-xl font-bold" numberOfLines={1}>{teamName || "Team Chat"}</Text>
        </View>
      </View>

      <View className="flex-1 bg-bg pb-2">
      {/* @ts-ignore */}
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{
          _id: user?.id || "anonymous",
          name: user?.firstName || "Unknown",
        }}
        // @ts-ignore
        loadEarlier={hasMore}
        // @ts-ignore
        onLoadEarlier={onLoadEarlier}
        // @ts-ignore
        isLoadingEarlier={isLoadingEarlier}
        renderBubble={props => (
          <Bubble
            {...props}
            wrapperStyle={{
              right: { backgroundColor: "#1E88E5" },
              left: { backgroundColor: "#21262D" },
            }}
            textStyle={{
              right: { color: "#ffffff", fontFamily: "Inter_400Regular" },
              left: { color: "#E6EDF3", fontFamily: "Inter_400Regular" },
            }}
          />
        )}
      />
      </View>
    </SafeAreaView>
  );
}
