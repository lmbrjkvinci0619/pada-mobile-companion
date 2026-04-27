import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { format, parseISO, isSameDay } from "date-fns";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchEvents } from "@/services/topscore";
import type { Event } from "@/types";
import { Card } from "@/components/ui/Card";

export default function ScheduleScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const load = async () => {
    const data = await fetchEvents();
    setEvents(data);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const markedDates = events.reduce((acc, ev) => {
    const dateStr = format(parseISO(ev.startDate), "yyyy-MM-dd");
    acc[dateStr] = { marked: true, dotColor: "#1E88E5" };
    return acc;
  }, {} as any);

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: "#1E88E5",
    };
  }

  const selectedEvents = events.filter(e => isSameDay(parseISO(e.startDate), parseISO(selectedDate)));

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-4 pb-4">
        <Text className="text-txt-primary text-2xl font-black">Schedule</Text>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E88E5" />}
      >
        <Calendar
          theme={{
            calendarBackground: "#161B22",
            textSectionTitleColor: "#8B949E",
            selectedDayBackgroundColor: "#1E88E5",
            selectedDayTextColor: "#ffffff",
            todayTextColor: "#1E88E5",
            dayTextColor: "#E6EDF3",
            textDisabledColor: "#484F58",
            dotColor: "#1E88E5",
            selectedDotColor: "#ffffff",
            arrowColor: "#1E88E5",
            monthTextColor: "#E6EDF3",
            textDayFontFamily: "Inter_400Regular",
            textMonthFontFamily: "Inter_600SemiBold",
            textDayHeaderFontFamily: "Inter_500Medium",
          }}
          markedDates={markedDates}
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        />

        <View className="px-5 py-4">
          <Text className="text-txt-primary text-lg font-bold mb-3">
            {format(parseISO(selectedDate), "EEEE, MMMM d")}
          </Text>
          
          {selectedEvents.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="calendar-outline" size={48} color="#484F58" />
              <Text className="text-txt-muted text-mid mt-2">No events scheduled.</Text>
            </View>
          ) : (
            selectedEvents.map(event => (
              <TouchableOpacity key={event.id} onPress={() => router.push(`/events/${event.id}`)} className="mb-3">
                <Card elevated className="flex-row items-center gap-3">
                   <View className="w-14 items-center justify-center border-r border-surface-overlay pr-3">
                     <Text className="text-txt-primary font-bold">{format(parseISO(event.startDate), "h:mm")}</Text>
                     <Text className="text-txt-secondary text-xs">{format(parseISO(event.startDate), "a")}</Text>
                   </View>
                   <View className="flex-1">
                     <Text className="text-txt-primary font-semi text-base">{event.title}</Text>
                     <Text className="text-txt-secondary text-sm">{event.teamName}</Text>
                   </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
