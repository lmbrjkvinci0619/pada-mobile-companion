import React from "react";
import { ScrollView, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useArticles } from "@/hooks/useApi";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/Page";
import { LoaderBar } from "@/components/ui/LoaderBar";

export default function PageDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: articles = [], isLoading } = useArticles();

  const page = articles.find((a) => a.slug === slug || a.id === slug);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <PageHeader title="article" back />
        <LoaderBar visible />
      </SafeAreaView>
    );
  }

  if (!page) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <PageHeader title="article" back />
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle-outline" size={48} color="#8A8A8A" />
          <Text className="text-txt-primary text-2xl font-light lowercase tracking-tight mt-4">page not found</Text>
          <Text className="text-txt-secondary text-sm mt-2 text-center">
            This page may have been removed or the link is invalid.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <PageHeader title="article" subtitle={page.category ?? ""} back />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {page.imageUrl && (
          <View className="h-48 bg-surface-overlay items-center justify-center border-b border-surface-border">
            <Ionicons name="image-outline" size={48} color="#8A8A8A" />
          </View>
        )}

        <View className="px-5 py-6">
          <View className="flex-row items-center gap-2 mb-3">
            {page.category && <Badge label={page.category} variant="primary" />}
            {page.publishedAt && (
              <Text className="text-txt-secondary text-[10px] font-semibold uppercase tracking-[0.12em]">
                {format(parseISO(page.publishedAt), "MMMM d, yyyy").toLowerCase()}
              </Text>
            )}
          </View>

          <Text className="text-txt-primary text-3xl font-light lowercase tracking-tight mb-4 leading-tight">
            {page.title}
          </Text>

          {page.authorName && (
            <Text className="text-txt-secondary text-xs uppercase tracking-[0.12em] font-semibold mb-6">
              by {page.authorName.toLowerCase()}
            </Text>
          )}

          <View className="bg-surface border border-surface-border p-4">
            <Text className="text-txt-primary text-sm leading-6">
              {page.content || page.summary || "No content available."}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}