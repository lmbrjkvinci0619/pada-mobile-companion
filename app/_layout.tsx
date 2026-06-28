import "./global.css";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_900Black } from "@expo-google-fonts/inter";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, Component, ReactNode } from "react";
import { View, ActivityIndicator, Text, TouchableOpacity, LogBox } from "react-native";
import { useAuthStore } from "@/store/authStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TOPSCORE_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/config";
import { registerForPushNotificationsAsync, setupNotificationListeners } from "@/services/notifications";
import { router } from "expo-router";
import { USE_MOCK_DATA } from "@/constants/mockData";

LogBox.ignoreLogs(["Warning: ..."]);

SplashScreen.preventAutoHideAsync();

function MockDataWarning() {
  if (!USE_MOCK_DATA) return null;
  return (
    <View className="absolute top-12 left-0 right-0 z-50 bg-yellow-500/90 py-2 px-4">
      <Text className="text-yellow-900 text-xs font-bold text-center">
        DEVELOPMENT MODE — Using mock data. Set EXPO_PUBLIC_USE_MOCK_DATA=false for production.
      </Text>
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
    if (!envVar.value && envVar.critical) {
      errors.push(`Missing required environment variable: ${envVar.key}`);
    }
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
  
  if (errorLog.length > 50) {
    errorLog.shift();
  }
  
  console.error("Error logged:", entry);
}

function getErrorLog(): string {
  return errorLog.map(e => `[${e.timestamp}] ${e.error}`).join("\n");
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

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-bg p-6">
          <Text className="text-danger text-xl font-black mb-2">Something went wrong</Text>
          <Text className="text-txt-secondary text-center mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </Text>
          <TouchableOpacity
            className="bg-primary-500 px-6 py-3 rounded-xl"
            onPress={this.handleRetry}
          >
            <Text className="text-white font-bold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

function InitialLoading() {
  return (
    <View className="flex-1 items-center justify-center bg-bg">
      <ActivityIndicator size="large" color="#1E88E5" />
      <Text className="text-txt-secondary mt-4">Loading...</Text>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  const { initialize, isLoading: authLoading, user } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envErrors] = useState(() => validateEnvironment());

  useEffect(() => {
    if (fontsLoaded && !fontError) {
      initialize()
        .then(() => setIsReady(true))
        .catch((e) => {
          logErrorToStorage(e, "Auth initialization");
          setError(e.message);
        });
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (isReady && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [isReady, authLoading]);

  useEffect(() => {
    if (isReady && !authLoading) {
      const user = useAuthStore.getState().user;
      if (user?.id) {
        registerForPushNotificationsAsync(user.id).catch(console.error);

        setupNotificationListeners(
          (notification) => {
            console.log("Notification received in app:", notification);
          },
          (notification, data) => {
            if (data?.announcementId) {
              router.push(`/announcements/${data.announcementId}`);
            }
          }
        );
      }
    }
  }, [isReady, authLoading, user?.id]);

  useEffect(() => {
    if (envErrors.length > 0) {
      console.warn("Environment validation errors:", envErrors);
    }
  }, [envErrors]);

  if (!fontsLoaded || !isReady) {
    return <InitialLoading />;
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-danger text-lg font-bold mb-2">Something went wrong</Text>
        <Text className="text-txt-secondary text-center mb-4">{error}</Text>
        <Text className="text-txt-muted text-sm">Please restart the app</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MockDataWarning />
        <Slot />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
