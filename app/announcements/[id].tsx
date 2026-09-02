import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import { fetchAnnouncementById, markAnnouncementAsRead } from "@/services/announcements";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader, SectionLabel, IconChip } from "@/components/ui/Page";
import { Badge } from "@/components/ui/Badge";
import type { Announcement, AnnouncementType } from "@/types";

const TYPE_ACCENTS: Record<AnnouncementType, string> = {
  pada_org: "#A200FF",
  league_longterm: "#1BA1E2",
  game: "#F09609",
};
const TYPE_LABELS: Record<AnnouncementType, string> = {
  pada_org: "PADA Organization",
  league_longterm: "League",
  game: "Game",
};

export default function AnnouncementDetail() {
  useAuthRedirect();
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
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#00ABA9" />
      </SafeAreaView>
    );
  }

  if (error || !announcement) {
    return (
      <SafeAreaView className="flex-1 bg-bg">
        <PageHeader title="announcement" back />
        <View className="flex-1 items-center justify-center">
          <Ionicons name="alert-circle" size={48} color="#E51400" />
          <Text className="mt-2 text-danger">{error || "Unknown error"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const accent = TYPE_ACCENTS[announcement.announcementType] ?? TYPE_ACCENTS.league_longterm;
  const typeLabel = TYPE_LABELS[announcement.announcementType] ?? "League";
  const isExpired = announcement.expiresAt && isPast(new Date(announcement.expiresAt));

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <PageHeader title="announcement" subtitle={typeLabel.toLowerCase()} back />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pt-4 pb-8" showsVerticalScrollIndicator={false}>
        <View className="mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="px-2 py-0.5 border-2 self-start" style={{ borderColor: accent, backgroundColor: `${accent}1A` }}>
              <Text style={{ color: accent }} className="text-[10px] font-bold uppercase tracking-wider">
                {typeLabel}
              </Text>
            </View>
            {announcement.isUrgent && <Badge label="Urgent" variant="danger" />}
          </View>
          <Text className="text-txt-primary text-3xl font-light lowercase tracking-tight mb-2">
            {announcement.title}
          </Text>
          <Text className="text-txt-secondary text-xs uppercase tracking-wider font-bold">
            By {announcement.authorName} · {format(new Date(announcement.createdAt), "MMM d, yyyy 'at' h:mm a")}
          </Text>
        </View>

        {isExpired && (
          <View className="bg-danger/10 border-2 border-danger px-4 py-3 mb-4 flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={18} color="#E51400" />
            <Text className="text-danger text-xs uppercase tracking-wider font-bold">This announcement has expired</Text>
          </View>
        )}

        <Text className="text-txt-primary text-sm leading-6 mb-6">
          {announcement.content}
        </Text>

        <SectionLabel>details</SectionLabel>
        <View className="bg-surface border-2 border-surface-border">
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
        </View>
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
    <View className={`flex-row items-center justify-between px-4 py-3 ${last ? "" : "border-b-2 border-surface-border"}`}>
      <Text className="text-txt-secondary text-xs font-bold uppercase tracking-wider">{label}</Text>
      <Text className="text-txt-primary text-sm font-bold" style={accent ? { color: accent } : undefined}>
        {value}
      </Text>
    </View>
  );
}