import React from 'react';
import { ScrollView, View, Text, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { Card, CardSection } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ReadOnlyBanner } from '@/components/ui/ReadOnlyBanner';
import { Ionicons } from '@expo/vector-icons';

export default function UIGallery() {
  useAuthRedirect();
  return (
    <SafeAreaView className="flex-1 bg-bg">
      <Stack.Screen options={{ title: "UI Gallery", headerShadowVisible: false }} />
      <ScrollView className="flex-1 px-4 py-6">
        
        {/* --- BUTTONS --- */}
        <CardSection title="Buttons" className="mb-8">
          <View className="gap-4">
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
            <Button label="Loading State" loading={true} />
            <Button label="With Icon" icon={<Ionicons name="send" size={16} color="white" />} />
          </View>
        </CardSection>

        {/* --- CARDS --- */}
        <CardSection title="Cards" className="mb-8">
          <Card className="mb-4">
            <Card.Header 
              title="Standard Card" 
              subtitle="With header, content and footer"
              icon={<View className="bg-primary-500/20 p-2 rounded-lg"><Ionicons name="layers" size={20} color="#388BFD" /></View>}
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

          <Card elevated={true} bordered={false} className="mb-4">
            <Card.Header title="Elevated Card" subtitle="No border, raised surface" />
            <Card.Content>
              <Text className="text-txt-secondary text-sm">
                Used for elements that need to pop out more from the background.
              </Text>
            </Card.Content>
          </Card>
        </CardSection>

        {/* --- AVATARS --- */}
        <CardSection title="Avatars" className="mb-8">
          <View className="flex-row items-end gap-4 bg-surface-raised p-4 rounded-2xl border border-surface-border">
            <View className="items-center gap-1">
              <Avatar size="xs" name="John Doe" />
              <Text className="text-txt-muted text-[10px]">XS</Text>
            </View>
            <View className="items-center gap-1">
              <Avatar size="sm" name="Jane Smith" />
              <Text className="text-txt-muted text-[10px]">SM</Text>
            </View>
            <View className="items-center gap-1">
              <Avatar size="md" name="Alex Reed" border={true} />
              <Text className="text-txt-muted text-[10px]">MD (Border)</Text>
            </View>
            <View className="items-center gap-1">
              <Avatar size="lg" name="P A D A" />
              <Text className="text-txt-muted text-[10px]">LG</Text>
            </View>
            <View className="items-center gap-1">
              <Avatar size="xl" uri="https://i.pravatar.cc/300" />
              <Text className="text-txt-muted text-[10px]">XL (Image)</Text>
            </View>
          </View>
        </CardSection>

        {/* --- BADGES --- */}
        <CardSection title="Badges" className="mb-8">
          <View className="flex-row flex-wrap gap-3">
            <Badge label="Default" variant="default" />
            <Badge label="Primary" variant="primary" />
            <Badge label="Success" variant="success" />
            <Badge label="Warning" variant="warning" />
            <Badge label="Danger" variant="danger" />
            <Badge label="Ghost" variant="ghost" />
          </View>
        </CardSection>

        {/* --- BANNERS --- */}
        <CardSection title="Banners" className="mb-12">
          <ReadOnlyBanner />
          <ReadOnlyBanner message="Custom message with no link" showLink={false} />
        </CardSection>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
