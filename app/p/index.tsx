import React, { useMemo } from "react";
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useArticles } from "@/hooks/useApi";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Article } from "@/types";

function PageRow({ article }: { article: Article }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/p/${article.slug || article.id}`)}
      className="py-4 border-b border-surface-overlay"
    >
      <View className="flex-row gap-4">
        {article.imageUrl && (
          <View className="w-20 h-20 rounded-xl bg-surface-raised items-center justify-center">
            <Ionicons name="image-outline" size={24} color="#484F58" />
          </View>
        )}
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            {article.category && <Badge label={article.category} variant="primary" />}
            {article.publishedAt && (
              <Text className="text-txt-muted text-xs">
                {format(parseISO(article.publishedAt), "MMM d, yyyy")}
              </Text>
            )}
          </View>
          <Text className="text-txt-primary text-base font-bold leading-tight" numberOfLines={2}>
            {article.title}
          </Text>
          {article.summary && (
            <Text className="text-txt-secondary text-sm font-mid mt-1" numberOfLines={2}>
              {article.summary}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color="#484F58" />
      </View>
    </TouchableOpacity>
  );
}

export default function PagesScreen() {
  const { data: articles = [], isLoading, refetch } = useArticles();
  const [refreshing, setRefreshing] = React.useState(false);

  const sortedArticles = useMemo(
    () =>
      [...articles].sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      }),
    [articles]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

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
        <Text className="text-txt-primary text-2xl font-black">News</Text>
        <Text className="text-txt-secondary text-sm font-mid mt-1">
          Latest updates from PADA
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E88E5" />
        }
      >
        {sortedArticles.length === 0 ? (
          <View className="mt-20 items-center gap-3">
            <Ionicons name="document-text-outline" size={48} color="#484F58" />
            <Text className="text-txt-muted text-base font-mid text-center">
              No pages available.
            </Text>
          </View>
        ) : (
          sortedArticles.map((article) => (
            <PageRow key={article.id} article={article} />
          ))
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}