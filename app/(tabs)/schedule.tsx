import React, { useState, useMemo, useCallback } from "react";
import { View, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, DateData } from "react-native-calendars";
import { format, parseISO, isSameDay } from "date-fns";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEvents } from "@/hooks/useApi";
import type { Event } from "@/types";
import { PageHeader, SectionLabel } from "@/components/ui/Page";
import { Segmented } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { Body, EyebrowTight } from "@/components/ui";
import { cn } from "@/utils/cn";

function isSameDayLocal(eventDateStr: string | undefined, selectedDateStr: string): boolean {
  if (!eventDateStr) return false;
  const eventDate = parseISO(eventDateStr);
  const selectedDate = parseISO(selectedDateStr + "T12:00:00");
  return isSameDay(eventDate, selectedDate);
}

const CALENDAR_THEME = Object.freeze({
  calendarBackground: "#FFFFFF",
  textSectionTitleColor: "#5C5C5C",
  selectedDayBackgroundColor: "#00ABA9",
  selectedDayTextColor: "#FFFFFF",
  todayTextColor: "#00ABA9",
  dayTextColor: "#000000",
  textDisabledColor: "#C4C4C4",
  dotColor: "#00ABA9",
  selectedDotColor: "#FFFFFF",
  arrowColor: "#000000",
  monthTextColor: "#000000",
  textDayFontFamily: "System",
  textMonthFontFamily: "System",
  textDayHeaderFontFamily: "System",
});

const EventCard = React.memo(function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const start = event.startDate ? format(parseISO(event.startDate), "h:mm") : "--:--";
  const ampm = event.startDate ? format(parseISO(event.startDate), "a") : "";
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} className="mb-3">
      <View className="flex-row bg-surface border border-surface-border">
        <View className="w-16 items-center justify-center bg-primary py-4 border-r border-surface-border">
          <Body tone="inverse" className="font-semibold text-base">
            {start}
          </Body>
          <EyebrowTight tone="inverse">{ampm}</EyebrowTight>
        </View>
        <View className="flex-1 p-4">
          <Body tone="primary" className="font-semibold text-base" numberOfLines={1}>
            {event.title}
          </Body>
          <EyebrowTight tone="secondary" className="mt-1">
            {event.teamName ?? "team tbd"}
          </EyebrowTight>
        </View>
        <View className="pr-4 self-center">
          <Ionicons name="chevron-forward" size={18} color="#5C5C5C" />
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function ScheduleScreen() {
  const { data: events = [], isLoading, refetch } = useEvents();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [view, setView] = useState<"day" | "list">("day");

  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    for (const ev of events) {
      if (ev.startDate) dates.add(format(parseISO(ev.startDate), "yyyy-MM-dd"));
    }
    return dates;
  }, [events]);

  const markedDates = useMemo(() => {
    const marks: Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }> = {};
    for (const dateStr of eventDates) {
      marks[dateStr] = { marked: true, dotColor: "#00ABA9" };
    }
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: "#00ABA9",
    };
    return marks;
  }, [eventDates, selectedDate]);

  const selectedEvents = useMemo(
    () => events.filter((e) => e.startDate && isSameDayLocal(e.startDate, selectedDate)),
    [events, selectedDate],
  );

  const sortedEvents = useMemo(
    () =>
      [...events]
        .filter((e) => e.startDate)
        .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? "")),
    [events],
  );

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
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <PageHeader title="schedule" subtitle="timeline" />
        <LoaderBar visible />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <PageHeader title="schedule" subtitle="timeline" />
      <LoaderBar visible={refreshing} />

      <View className="px-5 pt-3 pb-2">
        <Segmented
          options={[
            { key: "day", label: "Day" },
            { key: "list", label: "All Events" },
          ]}
          value={view}
          onChange={setView}
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ABA9" />}
      >
        {view === "day" ? (
          <>
            <View className="mx-5 mt-3 border border-surface-border bg-surface">
              <Calendar theme={CALENDAR_THEME} markedDates={markedDates} onDayPress={handleDayPress} />
            </View>

            <View className="px-5 py-4">
              <SectionLabel>
                {format(parseISO(selectedDate), "EEEE, MMMM d").toLowerCase()}
              </SectionLabel>

              {selectedEvents.length === 0 ? (
                <EmptyState
                  icon="calendar-outline"
                  title="no events on this day"
                  subtitle="Pick another day or switch to All Events to see the full season."
                  accent="muted"
                />
              ) : (
                selectedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => router.push(`/events/${event.id}`)}
                  />
                ))
              )}
            </View>
          </>
        ) : (
          <View className="px-5 py-4">
            <SectionLabel>all upcoming</SectionLabel>
            {sortedEvents.length === 0 ? (
              <EmptyState
                icon="calendar-outline"
                title="no events"
                subtitle="The season calendar is empty right now."
                accent="muted"
              />
            ) : (
              sortedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => router.push(`/events/${event.id}`)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}