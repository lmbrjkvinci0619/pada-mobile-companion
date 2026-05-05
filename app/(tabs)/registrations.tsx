import React, { useState, useCallback, useMemo } from "react";
import {
  ScrollView, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useRegistrations } from "@/hooks/useApi";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ReadOnlyBanner } from "@/components/ui/ReadOnlyBanner";
import type { Registration, RegistrationStatus, RegistrationType } from "@/types";

function statusBadge(status: RegistrationStatus) {
  const map: Record<RegistrationStatus, { label: string; variant: "success" | "warning" | "danger" | "ghost" }> = {
    active:      { label: "Active",      variant: "success" },
    pending:    { label: "Pending",    variant: "warning" },
    waitlisted: { label: "Waitlisted", variant: "warning" },
    cancelled:  { label: "Cancelled",   variant: "danger" },
    completed:  { label: "Completed",  variant: "ghost" },
  };
  const { label, variant } = map[status];
  return <Badge label={label} variant={variant} />;
}

function typeIcon(type: RegistrationType): keyof typeof Ionicons.glyphMap {
  const icons: Record<RegistrationType, keyof typeof Ionicons.glyphMap> = {
    team:   "people",
    league: "trophy",
    event:  "flag",
  };
  return icons[type];
}

function typeColor(type: RegistrationType): string {
  const colors: Record<RegistrationType, string> = {
    team:   "#1E88E5",
    league: "#FFA000",
    event:  "#43A047",
  };
  return colors[type];
}

const RegistrationCard = React.memo(function RegistrationCard({ reg }: { reg: Registration }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/registrations/${reg.id}`)}
      className="mb-3"
    >
      <Card elevated className="gap-3">
        <View className="flex-row items-start gap-3">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${typeColor(reg.type)}22` }}
          >
            <Ionicons name={typeIcon(reg.type)} size={20} color={typeColor(reg.type)} />
          </View>
          <View className="flex-1">
            <Text className="text-txt-primary font-semi text-base" numberOfLines={1}>
              {reg.organizationName}
            </Text>
            {reg.seasonName && (
              <Text className="text-txt-secondary text-sm font-mid mt-0.5">
                {reg.seasonName}
              </Text>
            )}
          </View>
          {statusBadge(reg.status)}
        </View>

        <View className="flex-row items-center gap-4 border-t border-surface-overlay pt-2">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="pricetag-outline" size={13} color="#8B949E" />
            <Text className="text-txt-muted text-xs font-mid capitalize">{reg.type}</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="calendar-outline" size={13} color="#8B949E" />
            <Text className="text-txt-muted text-xs font-mid">
              {format(parseISO(reg.startDate), "MMM d, yyyy")}
              {reg.endDate ? ` – ${format(parseISO(reg.endDate), "MMM d, yyyy")}` : ""}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
});

export default function RegistrationsScreen() {
  const { data: regs = [], isLoading, refetch } = useRegistrations();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sections = useMemo(() => {
    const current    = regs.filter((r) => r.status === "active" || r.status === "pending" || r.status === "waitlisted");
    const historical = regs.filter((r) => r.status === "completed" || r.status === "cancelled");

    return [
      { title: "Current", data: current },
      { title: "Past Seasons", data: historical },
    ].filter((s) => s.data.length > 0);
  }, [regs]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#1E88E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-5 pt-4 pb-4">
        <Text className="text-txt-primary text-2xl font-black">Registrations</Text>
        <Text className="text-txt-secondary text-sm font-mid mt-1">
          Your Pada.org league, team & event registrations
        </Text>
      </View>

      <ReadOnlyBanner message="Registrations are read-only. To register or make changes, visit Pada.org." />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E88E5" />
        }
      >
        {sections.length === 0 ? (
          <View className="mt-20 items-center gap-3">
            <Ionicons name="document-text-outline" size={48} color="#484F58" />
            <Text className="text-txt-muted text-base font-mid text-center">
              No registrations found.{"\n"}Register on the Pada.org website.
            </Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.title} className="mb-4">
              <Text className="text-txt-secondary text-xs font-semi uppercase tracking-widest mb-3">
                {section.title}
              </Text>
              {section.data.map((reg) => (
                <RegistrationCard key={reg.id} reg={reg} />
              ))}
            </View>
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}