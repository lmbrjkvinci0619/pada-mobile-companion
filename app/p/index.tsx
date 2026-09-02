import React, { useMemo } from "react";
import { ScrollView, View, Text, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useArticles } from "@/hooks/useApi";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, SectionLabel } from "@/components/ui/Page";
import type { Article } from "@/types";

function PageRow({ article }: { article: Article }) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/p/${article.slug || article.id}`)}
      activeOpacity={0.85}
      className="flex-row items-center gap-3 py-4 border-b-2 border-surface-border"
    >
      {article.imageUrl && (
        <View className="w-16 h-16 bg-surface-overlay border-2 border-surface-border items-center justify-center">
          <Ionicons name="image-outline" size={24} color="#5C5C5C" />
        </View>
      )}
      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-1">
          {article.category && <Badge label={article.category} variant="primary" />}
          {article.publishedAt && (
            <Text className="text-txt-secondary text-[10px] font-bold uppercase tracking-wider">
              {format(parseISO(article.publishedAt), "MMM d, yyyy").toLowerCase()}
            </Text>
          )}
        </View>
        <Text className="text-txt-primary text-sm font-bold leading-snug" numberOfLines={2}>
          {article.title}
        </Text>
        {article.summary && (
          <Text className="text-txt-secondary text-xs mt-1" numberOfLines={2}>
            {article.summary}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#5C5C5C" />
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
    [articles],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#00ABA9" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <PageHeader title="news" subtitle="latest updates from pada" back />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ABA9" />
        }
      >
        {sortedArticles.length === 0 ? (
          <View className="mt-20 items-center gap-3">
            <Ionicons name="document-text-outline" size={48} color="#8A8A8A" />
            <Text className="text-txt-secondary text-sm font-bold text-center lowercase">
              no articles yet.
            </Text>
          </View>
        ) : (
          <>
            <SectionLabel>recent</SectionLabel>
            <View className="border-t-2 border-surface-border">
              {sortedArticles.map((article) => (
                <PageRow key={article.id} article={article} />
              ))}
            </View>
          </>
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}