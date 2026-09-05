import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/lib/tokens";
import { useAuthStore } from "@/store/authStore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { fetchAnnouncementById, markAnnouncementAsRead } from "@/services/announcements";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader, SectionLabel, IconChip } from "@/components/ui/Page";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { Title, EyebrowTight, Body, MetaSentence, TileTitle } from "@/components/ui";
import type { Announcement, AnnouncementType } from "@/types";

const TYPE_LABEL: Record<AnnouncementType, string> = {
  pada_org: "PADA Organization",
  league_longterm: "League",
  game: "Game",
};

function accentFor(type: AnnouncementType, colors: ReturnType<typeof useColors>) {
  switch (type) {
    case "pada_org":       return colors.purple;
    case "game":           return colors.warning;
    case "league_longterm":
    default:               return colors.secondary;
  }
}

export default function AnnouncementDetail() {
  useAuthRedirect();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user?.id) {
      setError("Invalid announcement ID");
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    fetchAnnouncementById(id, user.id)
      .then((data) => {
        if (cancelled) return;
        if (!data) { setError("Announcement not found"); setIsLoading(false); return; }
        setAnnouncement(data);
        if (data.isRead) { setIsLoading(false); return; }
        markAnnouncementAsRead(id, user.id)
          .catch((err) => console.error("Failed to mark announcement as read:", err))
          .finally(() => {
            if (cancelled) return;
            queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all(user.id) });
            setIsLoading(false);
          });
      })
      .catch((err) => {
        if (cancelled) return;
        setError("Failed to load announcement");
        console.error(err);
        setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, user?.id, queryClient]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <PageHeader title="announcement" back />
        <LoaderBar visible />
      </SafeAreaView>
    );
  }

  if (error || !announcement) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <PageHeader title="announcement" back />
        <View className="flex-1 items-center justify-center">
          <Ionicons name="alert-circle" size={48} color={colors.danger} />
          <Body tone="danger" className="mt-2">
            {error || "Unknown error"}
          </Body>
        </View>
      </SafeAreaView>
    );
  }

  const accent = accentFor(announcement.announcementType, colors);
  const typeLabel = TYPE_LABEL[announcement.announcementType] ?? "League";
  const isExpired = announcement.expiresAt && isPast(new Date(announcement.expiresAt));

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <PageHeader title="announcement" subtitle={typeLabel.toLowerCase()} back />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-8" showsVerticalScrollIndicator={false}>
        <View className="mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Badge label={typeLabel} accent={accent} />
            {announcement.isUrgent && <Badge label="Urgent" variant="danger" />}
          </View>
          <Title tone="primary" size="md" className="mb-2">
            {announcement.title.toLowerCase()}
          </Title>
          <MetaSentence tone="secondary">
            By {announcement.authorName} · {format(new Date(announcement.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </MetaSentence>
        </View>

        {isExpired && (
          <View
            className="border border-danger px-4 py-3 mb-4 flex-row items-center gap-2"
            style={{ backgroundColor: colors.surface }}
            accessibilityRole="alert"
          >
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <EyebrowTight style={{ color: colors.danger }}>this announcement has expired</EyebrowTight>
          </View>
        )}

        <Body tone="primary" className="text-sm leading-6 mb-6">
          {announcement.content}
        </Body>

        <SectionLabel>details</SectionLabel>
        <Card variant="raised">
          <DetailRow label="Type" value={typeLabel} accent={accent} />
          <DetailRow
            label="Audience"
            value={
              announcement.targetType === "league"
                ? "League-wide"
                : announcement.targetType === "division"
                  ? "Division"
                  : "Team"
            }
          />
          {announcement.expiresAt && (
            <DetailRow
              label="Expires"
              value={
                isExpired
                  ? "Expired"
                  : formatDistanceToNow(new Date(announcement.expiresAt), { addSuffix: true })
              }
              last
            />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  accent,
  last,
}: {
  label: string;
  value: string;
  accent?: string;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center justify-between px-4 py-3 ${last ? "" : "border-b border-surface-border"}`}>
      <EyebrowTight tone="secondary">{label}</EyebrowTight>
      <TileTitle
        tone="primary"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </TileTitle>
    </View>
  );
}