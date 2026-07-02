import React, { useState, useMemo, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { format, parseISO, isSameDay } from "date-fns";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEvents } from "@/hooks/useApi";
import type { Event } from "@/types";
import { Card } from "@/components/ui/Card";
import { LinearGradient } from "expo-linear-gradient";

function isSameDayLocal(eventDateStr: string | undefined, selectedDateStr: string): boolean {
  if (!eventDateStr) return false;
  const eventDate = parseISO(eventDateStr);
  const selectedDate = parseISO(selectedDateStr + "T12:00:00");
  return isSameDay(eventDate, selectedDate);
}

const CALENDAR_THEME = Object.freeze({
  calendarBackground: "#161B22",
  textSectionTitleColor: "#8B949E",
  selectedDayBackgroundColor: "#1F6FEB",
  selectedDayTextColor: "#ffffff",
  todayTextColor: "#388BFD",
  dayTextColor: "#F0F6FC",
  textDisabledColor: "#484F58",
  dotColor: "#388BFD",
  selectedDotColor: "#ffffff",
  arrowColor: "#388BFD",
  monthTextColor: "#F0F6FC",
  textDayFontFamily: "Inter_500Medium",
  textMonthFontFamily: "Inter_900Black",
  textDayHeaderFontFamily: "Inter_600SemiBold",
});

const EVENT_DOT_COLOR = "#1E88E5";

const EventCard = React.memo(function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const startDateDisplay = event.startDate ? format(parseISO(event.startDate), "h:mm") : "--:--";
  const amPmDisplay = event.startDate ? format(parseISO(event.startDate), "a") : "";

  return (
    <TouchableOpacity onPress={onPress} className="mb-4">
      <Card className="flex-row items-center p-0 overflow-hidden bg-surface-raised border border-surface-border/30">
        <LinearGradient
          colors={["#21262D", "#161B22"]}
          className="w-16 items-center justify-center border-r border-surface-overlay h-full py-4"
        >
          <Text className="text-txt-primary font-black text-base">{startDateDisplay}</Text>
          <Text className="text-primary-300 text-[10px] font-black uppercase">{amPmDisplay}</Text>
        </LinearGradient>
        <View className="flex-1 p-4">
          <Text className="text-txt-primary font-black text-base" numberOfLines={1}>{event.title}</Text>
          <Text className="text-txt-secondary text-sm font-semi mt-0.5">{event.teamName ?? "Team TBD"}</Text>
        </View>
        <View className="pr-4">
          <Ionicons name="chevron-forward" size={18} color="#30363D" />
        </View>
      </Card>
    </TouchableOpacity>
  );
});

export default function ScheduleScreen() {
  const { data: events = [], isLoading, refetch } = useEvents();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    for (const ev of events) {
      if (ev.startDate) {
        dates.add(format(parseISO(ev.startDate), "yyyy-MM-dd"));
      }
    }
    return dates;
  }, [events]);

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }> = {};

    for (const dateStr of eventDates) {
      marks[dateStr] = { marked: true, dotColor: EVENT_DOT_COLOR };
    }

    const selected = marks[selectedDate];
    marks[selectedDate] = {
      ...(selected || {}),
      selected: true,
      selectedColor: "#1E88E5",
    };

    return marks;
  }, [eventDates, selectedDate]);

  const selectedEvents = useMemo(() =>
    events.filter(e => e.startDate && isSameDayLocal(e.startDate, selectedDate)),
  [events, selectedDate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#1E88E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <LinearGradient
        colors={["#161B22", "#0D1117"]}
        className="px-5 pt-6 pb-6 rounded-b-[40px] shadow-2xl mb-2"
      >
        <Text className="text-primary-300 text-xs font-bold tracking-[2px] uppercase mb-1">Timeline</Text>
        <Text className="text-txt-primary text-3xl font-black">Schedule</Text>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E88E5" />}
      >
        <View className="mx-5 mt-4 rounded-3xl overflow-hidden border border-surface-border/40 shadow-xl">
          <Calendar
            theme={CALENDAR_THEME}
            markedDates={markedDates}
            onDayPress={handleDayPress}
          />
        </View>

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
              <EventCard
                key={event.id}
                event={event}
                onPress={() => router.push(`/events/${event.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}