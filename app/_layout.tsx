import "../global.css";
import React from "react";
import { useFonts, Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, Component, ReactNode } from "react";
import { View, TouchableOpacity, LogBox, StatusBar } from "react-native";
import { useAuthStore } from "@/store/authStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TOPSCORE_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/config";
import { registerForPushNotificationsAsync, setupNotificationListeners } from "@/services/notifications";
import { router } from "expo-router";
import { USE_MOCK_DATA } from "@/constants/mockData";
import { LoaderBar } from "@/components/ui/LoaderBar";
import { EyebrowTight, Body, Label } from "@/components/ui";

LogBox.ignoreLogs(["Warning: ..."]);

SplashScreen.preventAutoHideAsync();

function MockDataWarning() {
  if (!USE_MOCK_DATA) return null;
  return (
    <View className="absolute top-12 left-0 right-0 z-50 bg-warning py-2 px-4">
      <EyebrowTight tone="primary" className="text-center tracking-[0.2em]">
        DEVELOPMENT MODE — Using mock data. Set EXPO_PUBLIC_USE_MOCK_DATA=false for production.
      </EyebrowTight>
    </View>
  );
}

const requiredEnvVars = [
  { key: "EXPO_PUBLIC_TOPSCORE_BASE_URL", value: TOPSCORE_BASE_URL, critical: true },
  { key: "EXPO_PUBLIC_SUPABASE_URL", value: SUPABASE_URL, critical: false },
  { key: "EXPO_PUBLIC_SUPABASE_ANON_KEY", value: SUPABASE_ANON_KEY, critical: false },
];

function validateEnvironment(): string[] {
  const errors: string[] = [];
  for (const envVar of requiredEnvVars) {
    if (!envVar.value && envVar.critical) errors.push(`Missing required environment variable: ${envVar.key}`);
  }
  return errors;
}

const errorLog: Array<{ timestamp: string; error: string; stack?: string }> = [];

function logErrorToStorage(error: Error, context?: string): void {
  const entry = {
    timestamp: new Date().toISOString(),
    error: context ? `${context}: ${error.message}` : error.message,
    stack: error.stack,
  };
  errorLog.push(entry);
  if (errorLog.length > 50) errorLog.shift();
  console.error("Error logged:", entry);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    logErrorToStorage(error, errorInfo.componentStack);
    console.error("ErrorBoundary caught:", error.message, errorInfo.componentStack);
  }

  handleRetry = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-bg p-6">
          <Label tone="danger" className="text-xl mb-2">something went wrong</Label>
          <Body tone="secondary" className="text-center mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </Body>
          <TouchableOpacity
            className="bg-primary px-6 py-3"
            onPress={this.handleRetry}
            accessibilityRole="button"
            accessibilityLabel="try again"
            activeOpacity={0.85}
          >
            <Label tone="inverse" className="text-xs">try again</Label>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function InitialLoading() {
  return (
    <View className="flex-1 bg-bg">
      <LoaderBar visible />
      <View className="flex-1 items-center justify-center">
        <EyebrowTight tone="muted" className="tracking-[0.2em]">starting up</EyebrowTight>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [fontsTimedOut, setFontsTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!fontsLoaded) {
        console.warn("[Startup] _layout: Font loading timed out, proceeding");
        setFontsTimedOut(true);
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [fontsLoaded]);

  const { initialize, isLoading: authLoading, user } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envErrors] = useState(() => validateEnvironment());

  useEffect(() => {
    if (fontsLoaded) {
      const initPromise = initialize();
      const timeout = setTimeout(() => {
        console.warn("[Startup] _layout: Auth initialization timed out");
        setIsReady(true);
        setError("Initialization timed out. Try force-quitting and reopening the app.");
      }, 15000);
      initPromise
        .then(() => {
          clearTimeout(timeout);
          setIsReady(true);
        })
        .catch((e) => {
          clearTimeout(timeout);
          logErrorToStorage(e, "Auth initialization");
          setError(e?.message ?? "Failed to initialize app");
          setIsReady(true);
        });
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (isReady && !authLoading) SplashScreen.hideAsync();
  }, [isReady, authLoading]);

  useEffect(() => {
    if (!isReady || authLoading || !user?.id) return;
    let cancelled = false;
    registerForPushNotificationsAsync(user.id).catch((e) => {
      if (!cancelled) console.error("Push registration failed:", e);
    });
    const cleanup = setupNotificationListeners(
      (notification) => {
        if (!cancelled) console.log("Notification received in app:", notification);
      },
      (notification, data) => {
        if (cancelled) return;
        if (data?.announcementId) router.push(`/announcements/${data.announcementId}`);
      },
    );
    return () => { cancelled = true; cleanup(); };
  }, [isReady, authLoading, user?.id]);

  useEffect(() => {
    if (envErrors.length > 0) console.warn("Environment validation errors:", envErrors);
  }, [envErrors]);

  if ((!fontsLoaded && !fontsTimedOut) || !isReady) return <InitialLoading />;

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Label tone="danger" className="text-lg mb-2">something went wrong</Label>
        <Body tone="secondary" className="text-center mb-4">
          {error}
        </Body>
        <EyebrowTight tone="muted" className="tracking-[0.12em]">
          please restart the app
        </EyebrowTight>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <QueryClientProvider client={queryClient}>
        <MockDataWarning />
        <Slot />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}