import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchEvent } from "@/services/topscore";
import { useAuthStore } from "@/store/authStore";
import type { Event } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { format, parseISO } from "date-fns";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (id) {
      fetchEvent(id).then(e => e && setEvent(e));
    }
  }, [id]);

  if (!event) return null;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <View className="px-5 py-4 border-b border-surface-overlay flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#E6EDF3" />
        </TouchableOpacity>
        <Text className="text-txt-primary text-xl font-bold flex-1" numberOfLines={1}>Event Details</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-4">
        <Text className="text-txt-primary text-2xl font-black mb-1">{event.title}</Text>
        <Text className="text-txt-secondary text-base mb-6">
          {format(parseISO(event.startDate), "EEEE, MMMM d 'at' h:mm a")}
        </Text>

        <Card elevated className="mb-4">
          <Text className="text-txt-secondary text-sm font-bold uppercase mb-2">Location</Text>
          <Text className="text-txt-primary text-base font-semi">{event.location?.name || "TBD"}</Text>
          {event.location?.address && (
            <Text className="text-txt-muted text-sm">{event.location.address}</Text>
          )}
        </Card>

        {event.notes && (
          <Card elevated className="mb-4">
             <Text className="text-txt-secondary text-sm font-bold uppercase mb-2">Notes</Text>
             <Text className="text-txt-primary text-sm">{event.notes}</Text>
          </Card>
        )}

        {event.score && (
          <Card className="mb-4">
             <Text className="text-txt-secondary text-sm font-bold uppercase mb-2">Score</Text>
             <View className="flex-row items-center justify-between">
                <Text className="text-txt-primary text-lg font-bold">{event.score.homeTeamName}</Text>
                <Text className="text-primary-400 text-2xl font-black">{event.score.homeScore}</Text>
             </View>
             <View className="flex-row items-center justify-between mt-2">
                <Text className="text-txt-primary text-lg font-bold">{event.score.awayTeamName}</Text>
                <Text className="text-primary-400 text-2xl font-black">{event.score.awayScore}</Text>
             </View>
          </Card>
        )}

        {/* Add to Calendar */}
        <TouchableOpacity 
           className="bg-surface-raised border border-surface-overlay rounded-xl py-4 mb-8 flex-row items-center justify-center gap-2"
           onPress={() => alert("Calendar Event Exported (ICS generation simulated)")}
        >
           <Ionicons name="calendar-outline" size={20} color="#E6EDF3" />
           <Text className="text-txt-primary font-bold text-base">Add to Calendar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
