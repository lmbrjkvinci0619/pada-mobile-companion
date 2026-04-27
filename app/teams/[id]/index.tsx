import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchTeam, fetchEvents } from "@/services/topscore";
import type { Team, Event } from "@/types";
import { ReadOnlyBanner } from "@/components/ui/ReadOnlyBanner";
import { Avatar } from "@/components/ui/Avatar";
import { format, parseISO } from "date-fns";

export default function TeamDetailScreen() {
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<"roster" | "schedule">(
     (tab === "schedule") ? "schedule" : "roster"
  );

  useEffect(() => {
    if (id) {
       fetchTeam(id).then(t => t && setTeam(t));
       fetchEvents(id).then(e => setEvents(e));
    }
  }, [id]);

  if (!team) return null;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <View className="px-5 py-4 border-b border-surface-overlay flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#E6EDF3" />
        </TouchableOpacity>
        <Text className="text-txt-primary text-xl font-bold flex-1" numberOfLines={1}>{team.name}</Text>
      </View>
      
      <ReadOnlyBanner />

      <View className="flex-row border-b border-surface-overlay mt-2">
         <TouchableOpacity 
            className={`flex-1 items-center pb-4 ${activeTab === "roster" ? "border-b-2 border-primary-500" : ""}`}
            onPress={() => setActiveTab("roster")}
         >
            <Text className={`font-semi ${activeTab === "roster" ? "text-primary-500" : "text-txt-muted"}`}>Roster</Text>
         </TouchableOpacity>
         <TouchableOpacity 
            className={`flex-1 items-center pb-4 ${activeTab === "schedule" ? "border-b-2 border-primary-500" : ""}`}
            onPress={() => setActiveTab("schedule")}
         >
            <Text className={`font-semi ${activeTab === "schedule" ? "text-primary-500" : "text-txt-muted"}`}>Schedule</Text>
         </TouchableOpacity>
      </View>

      {activeTab === "roster" ? (
         <FlatList
            className="flex-1"
            contentContainerClassName="py-4"
            data={team.roster}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
               <View className="flex-row items-center px-5 py-3 border-b border-surface-overlay/50">
                  <Avatar name={`${item.firstName} ${item.lastName}`} uri={item.avatarUrl} size="md" className="mr-3" />
                  <View className="flex-1">
                     <Text className="text-txt-primary font-bold">{item.firstName} {item.lastName}</Text>
                     <Text className="text-txt-muted text-xs capitalize">{item.role}</Text>
                  </View>
                  {item.jerseyNumber && (
                     <Text className="text-txt-secondary font-black text-lg">#{item.jerseyNumber}</Text>
                  )}
               </View>
            )}
         />
      ) : (
         <FlatList
            className="flex-1"
            contentContainerClassName="py-4"
            data={events}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
               <TouchableOpacity 
                  className="px-5 py-3 border-b border-surface-overlay/50"
                  onPress={() => router.push(`/events/${item.id}`)}
               >
                  <Text className="text-txt-secondary text-xs">{format(parseISO(item.startDate), "MMM d, h:mm a")}</Text>
                  <Text className="text-txt-primary font-bold text-base">{item.title}</Text>
                  {item.location && <Text className="text-txt-muted text-sm">{item.location.name}</Text>}
               </TouchableOpacity>
            )}
         />
      )}
    </SafeAreaView>
  );
}
