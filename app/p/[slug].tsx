import React from "react";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useArticles } from "@/hooks/useApi";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function PageDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: articles = [], isLoading } = useArticles();

  const page = articles.find((a) => a.slug === slug || a.id === slug);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#1E88E5" />
      </SafeAreaView>
    );
  }

  if (!page) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
        <View className="flex-1 items-center justify-center p-6">
          <Ionicons name="alert-circle-outline" size={48} color="#484F58" />
          <Text className="text-txt-primary text-lg font-bold mt-4">Page not found</Text>
          <Text className="text-txt-secondary text-sm font-mid mt-2 text-center">
            This page may have been removed or the link is invalid.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {page.imageUrl && (
          <View className="h-48 bg-surface-raised items-center justify-center">
            <Ionicons name="image-outline" size={48} color="#484F58" />
          </View>
        )}

        <View className="px-5 py-6">
          <View className="flex-row items-center gap-2 mb-3">
            {page.category && <Badge label={page.category} variant="primary" />}
            {page.publishedAt && (
              <Text className="text-txt-muted text-sm">
                {format(parseISO(page.publishedAt), "MMMM d, yyyy")}
              </Text>
            )}
          </View>

          <Text className="text-txt-primary text-2xl font-black leading-tight mb-4">
            {page.title}
          </Text>

          {page.authorName && (
            <Text className="text-txt-secondary text-sm font-mid mb-6">
              By {page.authorName}
            </Text>
          )}

          <Card className="bg-surface-raised">
            <Text className="text-txt-primary text-base leading-relaxed">
              {page.content || page.summary || "No content available."}
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}