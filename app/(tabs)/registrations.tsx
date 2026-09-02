import React, { useState, useCallback, useMemo } from "react";
import {
  ScrollView, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { useRegistrations } from "@/hooks/useApi";
import { Badge } from "@/components/ui/Badge";
import { ReadOnlyBanner } from "@/components/ui/ReadOnlyBanner";
import { PageHeader, SectionLabel } from "@/components/ui/Page";
import { openRegistrationInBrowser } from "@/lib/urlUtils";
import type { Registration, RegistrationStatus, RegistrationType } from "@/types";

function statusBadge(status: RegistrationStatus) {
  const map: Record<RegistrationStatus, { label: string; variant: "success" | "warning" | "danger" | "ghost" }> = {
    accepted:    { label: "Active",      variant: "success" },
    pending:    { label: "Pending",    variant: "warning" },
    waitlisted: { label: "Waitlisted", variant: "warning" },
    incomplete: { label: "Incomplete", variant: "danger" },
    inactive:   { label: "Inactive",  variant: "ghost" },
    interested: { label: "Interested", variant: "ghost" },
    active:     { label: "Active",     variant: "success" },
    paid:       { label: "Paid",       variant: "success" },
    refunded:   { label: "Refunded",   variant: "danger" },
    partial:    { label: "Partial",   variant: "warning" },
  };
  const { label, variant } = map[status];
  return <Badge label={label} variant={variant} />;
}

const TYPE_ACCENTS: Record<RegistrationType, string> = {
  team:   "#1BA1E2",
  league: "#F09609",
  event:  "#339933",
};

const TYPE_ICONS: Record<RegistrationType, keyof typeof Ionicons.glyphMap> = {
  team:   "people",
  league: "trophy",
  event:  "flag",
};

const RegistrationCard = React.memo(function RegistrationCard({ reg }: { reg: Registration }) {
  const accent = TYPE_ACCENTS[reg.type];
  return (
    <TouchableOpacity
      onPress={() => openRegistrationInBrowser(reg.id, reg.eventId, reg.teamId, reg.leagueId)}
      activeOpacity={0.85}
      className="mb-3"
    >
      <View className="flex-row items-start gap-3 bg-surface border-2 border-surface-border p-4">
        <View
          className="w-10 h-10 items-center justify-center"
          style={{ backgroundColor: accent }}
        >
          <Ionicons name={TYPE_ICONS[reg.type]} size={20} color="#FFFFFF" />
        </View>
        <View className="flex-1">
          <Text className="text-txt-primary font-bold text-base" numberOfLines={1}>
            {reg.organizationName}
          </Text>
          {reg.seasonName && (
            <Text className="text-txt-secondary text-xs mt-0.5">
              {reg.seasonName}
            </Text>
          )}
        </View>
        {statusBadge(reg.status)}
        <Ionicons name="open-outline" size={18} color="#5C5C5C" />
      </View>
      <View className="flex-row items-center gap-4 px-4 py-2 bg-surface-overlay border-t-2 border-surface-border">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="pricetag-outline" size={13} color="#5C5C5C" />
          <Text className="text-txt-secondary text-[11px] font-bold uppercase tracking-wider">{reg.type}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={13} color="#5C5C5C" />
          <Text className="text-txt-secondary text-[11px] font-bold">
            {format(parseISO(reg.startDate), "MMM d, yyyy").toLowerCase()}
            {reg.endDate ? ` – ${format(parseISO(reg.endDate), "MMM d, yyyy").toLowerCase()}` : ""}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function RegistrationsScreen() {
  const { isAuthenticated } = useAuthStore();
  const { data: regs = [], isLoading, refetch } = useRegistrations();
  const [refreshing, setRefreshing] = useState(false);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const sections = useMemo(() => {
    const current = regs.filter((r) =>
      r.status === "accepted" ||
      r.status === "pending" ||
      r.status === "waitlisted" ||
      r.status === "interested" ||
      r.status === "incomplete" ||
      r.status === "active" ||
      r.status === "paid" ||
      r.status === "partial",
    );
    const historical = regs.filter((r) => r.status === "inactive" || r.status === "refunded");
    return [
      { title: "current", data: current },
      { title: "past seasons", data: historical },
    ].filter((s) => s.data.length > 0);
  }, [regs]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#00ABA9" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <PageHeader title="registrations" subtitle="your pada.org registrations" />
      <ReadOnlyBanner message="Registrations are read-only. To register or make changes, visit Pada.org." />

      <ScrollView
        className="flex-1 px-5 pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ABA9" />}
      >
        {sections.length === 0 ? (
          <View className="mt-20 items-center gap-3">
            <Ionicons name="document-text-outline" size={48} color="#8A8A8A" />
            <Text className="text-txt-secondary text-sm font-bold text-center lowercase">
              no registrations found.{"\n"}register on the pada.org website.
            </Text>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.title} className="mb-5">
              <SectionLabel>{section.title}</SectionLabel>
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