import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEvent } from "@/hooks/useApi";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/components/ui/Card";
import { format, parseISO } from "date-fns";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#1E88E5" />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
        <View className="px-5 py-4 border-b border-surface-overlay flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#E6EDF3" />
          </TouchableOpacity>
          <Text className="text-txt-primary text-xl font-bold flex-1" numberOfLines={1}>Event Details</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-txt-muted">Event not found</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text className="text-txt-muted text-sm mb-3">{event.location.address}</Text>
          )}

          {event.location?.latitude && event.location?.longitude && (
            <View className="rounded-xl overflow-hidden mb-3 border border-surface-overlay bg-surface-overlay">
              <MapView
                style={{ height: 150, width: '100%' }}
                initialRegion={{
                  latitude: event.location.latitude,
                  longitude: event.location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: event.location.latitude,
                    longitude: event.location.longitude,
                  }}
                  title={event.location.name}
                />
              </MapView>
            </View>
          )}

          {event.location && (event.location.latitude || event.location.address) && (
            <TouchableOpacity 
              className="bg-primary-500/10 border border-primary-500/20 rounded-xl py-3 items-center flex-row justify-center gap-2"
              onPress={() => {
                const destination = (event.location?.latitude && event.location?.longitude)
                  ? `${event.location.latitude},${event.location.longitude}`
                  : encodeURIComponent(event.location?.address || event.location?.name || "");
                Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
              }}
            >
              <Ionicons name="navigate" size={18} color="#388BFD" />
              <Text className="text-primary-300 font-bold">Directions to Field</Text>
            </TouchableOpacity>
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