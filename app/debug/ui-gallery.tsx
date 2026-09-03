import React from 'react';
import { ScrollView, View, Text, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { Card, CardSection } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoaderBar } from '@/components/ui/LoaderBar';
import { PagerDots } from '@/components/ui/PagerDots';
import { ReadOnlyBanner } from '@/components/ui/ReadOnlyBanner';
import { Tile, TileGrid, TileCell } from '@/components/ui/Tile';
import { Pivot, PivotPanorama } from '@/components/ui/Pivot';
import { Segmented } from '@/components/ui/SegmentedControl';
import { SectionLabel, IconChip } from '@/components/ui/Page';
import { Ionicons } from '@expo/vector-icons';

export default function UIGallery() {
  useAuthRedirect();
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <Stack.Screen options={{ title: "UI Gallery", headerShadowVisible: false }} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <PivotPanorama title="ui gallery" subtitle="padahub metro" />

        <View className="px-5 pb-12">
          <CardSection title="buttons" className="mb-8 mt-4">
            <View className="gap-3">
              <View className="flex-row flex-wrap gap-2">
                <Button label="Primary" variant="primary" />
                <Button label="Secondary" variant="secondary" />
                <Button label="Outline" variant="outline" />
                <Button label="Ghost" variant="ghost" />
                <Button label="Danger" variant="danger" />
              </View>
              <View className="flex-row items-center gap-2">
                <Button label="Small" size="sm" />
                <Button label="Medium" size="md" />
                <Button label="Large" size="lg" />
              </View>
              <Button label="Loading" loading />
              <Button
                label="With Icon"
                icon={<Ionicons name="send" size={16} color="#FFFFFF" />}
              />
            </View>
          </CardSection>

          <CardSection title="tiles" className="mb-8">
            <TileGrid>
              <TileCell basis="1/2">
                <Tile size="small" accent="primary" eyebrow="small" title="Schedule" />
              </TileCell>
              <TileCell basis="1/2">
                <Tile size="small" accent="danger" eyebrow="live" title="vs Slugs" />
              </TileCell>
              <TileCell basis="full">
                <Tile
                  size="wide"
                  accent="secondary"
                  eyebrow="next match"
                  title="Wednesday night pickup"
                  subtitle="Lower Buckman Field · 6:30 PM"
                  meta="23 attending"
                />
              </TileCell>
              <TileCell basis="1/2">
                <Tile size="small" accent="warning" eyebrow="quick" title="Donate" />
              </TileCell>
              <TileCell basis="1/2">
                <Tile size="small" accent="magenta" eyebrow="quick" title="Profile" />
              </TileCell>
            </TileGrid>
          </CardSection>

          <CardSection title="cards" className="mb-8">
            <Card className="mb-4">
              <Card.Header
                title="Standard Card"
                subtitle="With header, content and footer"
                icon={<IconChip name="layers" color="#00ABA9" background="#00ABA922" />}
              />
              <Card.Content>
                <Text className="text-txt-secondary text-sm">
                  This is the main content area of the card. It uses the standard surface background.
                </Text>
              </Card.Content>
              <Card.Footer>
                <Button label="Action" variant="outline" size="sm" />
              </Card.Footer>
            </Card>

            <Card variant="raised" className="mb-4">
              <Card.Header title="Raised Card" subtitle="White surface, hairline border" />
              <Card.Content>
                <Text className="text-txt-secondary text-sm">
                  Used for elements that need to pop out more from the surface background.
                </Text>
              </Card.Content>
            </Card>
          </CardSection>

          <CardSection title="avatars" className="mb-8">
            <View className="flex-row items-end gap-4 bg-surface p-4 border border-surface-border">
              {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
                <View key={size} className="items-center gap-1">
                  <Avatar size={size} name="PADA" border={size !== "xs"} accent="#00ABA9" />
                  <Text className="text-txt-muted text-[10px] uppercase tracking-[0.12em]">{size}</Text>
                </View>
              ))}
            </View>
          </CardSection>

          <CardSection title="badges" className="mb-8">
            <View className="flex-row flex-wrap gap-3">
              <Badge label="Default" variant="default" />
              <Badge label="Primary" variant="primary" />
              <Badge label="Secondary" variant="secondary" />
              <Badge label="Success" variant="success" />
              <Badge label="Warning" variant="warning" />
              <Badge label="Danger" variant="danger" />
              <Badge label="Ghost" variant="ghost" />
            </View>
          </CardSection>

          <CardSection title="pivot" className="mb-8">
            <View className="bg-bg border border-surface-border">
              <Pivot
                items={[
                  { key: "roster", label: "roster" },
                  { key: "schedule", label: "schedule" },
                  { key: "stats", label: "stats" },
                ]}
                value="roster"
                onChange={() => {}}
              />
              <View className="p-5">
                <Text className="text-txt-secondary text-sm">
                  Pivot headers in lowercase. Active item carries a teal underline.
                </Text>
              </View>
            </View>
          </CardSection>

          <CardSection title="segmented" className="mb-8">
            <Segmented
              options={[
                { key: "day", label: "Day" },
                { key: "list", label: "All Events" },
              ]}
              value="day"
              onChange={() => {}}
            />
          </CardSection>

          <CardSection title="section labels" className="mb-8">
            <SectionLabel action={<Text className="text-primary-700 text-[11px] font-semibold uppercase tracking-[0.18em]">all</Text>}>
              announcements
            </SectionLabel>
            <Text className="text-txt-secondary text-sm">
              Section labels are uppercase, tracked, secondary tone. They may carry an inline action.
            </Text>
          </CardSection>

          <CardSection title="banners" className="mb-8">
            <ReadOnlyBanner />
            <ReadOnlyBanner message="Custom message without link" showLink={false} />
          </CardSection>

          <CardSection title="states" className="mb-8">
            <EmptyState
              icon="calendar-outline"
              title="no events scheduled"
              subtitle="When your team schedules a game, it will appear here."
              accent="muted"
            />
            <View className="h-4" />
            <LoaderBar visible />
            <View className="h-3" />
            <PagerDots count={3} active={1} />
          </CardSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}