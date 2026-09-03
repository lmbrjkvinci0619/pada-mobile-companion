import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useArticles } from "@/hooks/useApi";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/Page";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { Title, EyebrowTight, Body } from "@/components/ui";

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
          <Title tone="muted" size="sm" className="mt-4">
            page not found
          </Title>
          <Body tone="secondary" className="text-sm mt-2 text-center">
            This page may have been removed or the link is invalid.
          </Body>
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
              <EyebrowTight tone="secondary">
                {format(parseISO(page.publishedAt), "MMMM d, yyyy").toLowerCase()}
              </EyebrowTight>
            )}
          </View>

          <Title tone="primary" size="md" className="mb-4 leading-tight">
            {page.title.toLowerCase()}
          </Title>

          {page.authorName && (
            <EyebrowTight tone="secondary" className="mb-6">
              by {page.authorName.toLowerCase()}
            </EyebrowTight>
          )}

          <Card variant="default">
            <View className="p-4">
              <Body tone="primary" className="text-sm leading-6">
                {page.content || page.summary || "No content available."}
              </Body>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}