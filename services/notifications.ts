import React from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerPushToken, syncUserPreferences } from "./announcements";
import { useSettingsStore } from "@/store/settingsStore";

export type NotificationPermissionStatus = "granted" | "denied" | "not_determined" | "can_ask";

export interface PushNotificationState {
  permissionStatus: NotificationPermissionStatus;
  pushToken: string | null;
  isRegistered: boolean;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();

  if (status === Notifications.PermissionStatus.GRANTED) return "granted";
  if (status === Notifications.PermissionStatus.DENIED) return "denied";
  if (status === Notifications.PermissionStatus.UNDETERMINED) return "not_determined";
  return "can_ask";
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === Notifications.PermissionStatus.GRANTED) {
    return "granted";
  }

  if (existingStatus === Notifications.PermissionStatus.DENIED) {
    return "denied";
  }

  const { status } = await Notifications.requestPermissionsAsync();

  if (status === Notifications.PermissionStatus.GRANTED) return "granted";
  if (status === Notifications.PermissionStatus.DENIED) return "denied";
  return "can_ask";
}

export async function openDeviceNotificationSettings(): Promise<void> {
  if (Platform.OS === "ios") {
    await Notifications.setBadgeCountAsync(0);
  }
}

export async function registerForPushNotificationsAsync(userId?: string): Promise<PushNotificationState> {
  let token: string | null = null;
  let permissionStatus: NotificationPermissionStatus = "not_determined";

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      enableLights: true,
    });
    await Notifications.setNotificationChannelAsync("urgent", {
      name: "Urgent",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      enableLights: true,
    });
    await Notifications.setNotificationChannelAsync("announcements", {
      name: "Announcements",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  if (Platform.OS !== "web") {
    permissionStatus = await getNotificationPermissionStatus();

    if (permissionStatus === "not_determined" || permissionStatus === "can_ask") {
      permissionStatus = await requestNotificationPermission();
    }

    if (permissionStatus !== "granted") {
      console.log("Push notifications not permitted:", permissionStatus);
      return {
        permissionStatus,
        pushToken: null,
        isRegistered: false,
      };
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      token = tokenData.data;
    } catch (error) {
      console.error("Error getting push token:", error);
      return {
        permissionStatus,
        pushToken: null,
        isRegistered: false,
      };
    }
  } else {
    console.log("Web platform - push notifications not supported");
    permissionStatus = "denied";
  }

  if (token && userId) {
    try {
      await registerPushToken(userId, token);
    } catch (error) {
      console.error("Error registering push token:", error);
    }
  }

  return {
    permissionStatus,
    pushToken: token,
    isRegistered: !!token,
  };
}

export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (notification: Notifications.Notification, data?: Record<string, unknown>) => void
): () => void {
  const notificationSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received:", notification);
      onNotificationReceived?.(notification);
    }
  );

  const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log("Notification tapped:", response);
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      onNotificationTapped?.(response.notification, data);
    }
  );

  return () => {
    notificationSubscription.remove();
    notificationResponseSubscription.remove();
  };
}

export async function syncNotificationPreferences(userId: string): Promise<void> {
  const notifications = useSettingsStore.getState().notifications;
  try {
    await syncUserPreferences(userId, notifications);
  } catch (error) {
    console.error("Error syncing notification preferences:", error);
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  seconds: number = 1
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      seconds,
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    },
  });
  return id;
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getPresentedNotifications(): Promise<Notifications.Notification[]> {
  return Notifications.getPresentedNotificationsAsync();
}

export async function setBadgeCountAsync(count: number): Promise<void> {
  if (Platform.OS === "ios") {
    await Notifications.setBadgeCountAsync(count);
  } else {
    await Notifications.setBadgeCountAsync(count);
  }
}

export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

export function useNotificationObserver() {
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  React.useEffect(() => {
    if (lastNotificationResponse) {
      const data = lastNotificationResponse.notification.request.content.data;
      console.log("Notification tapped:", data);
    }
  }, [lastNotificationResponse]);

  return lastNotificationResponse;
}

export function useNotificationPermissions() {
  const [permissionStatus, setPermissionStatus] = React.useState<NotificationPermissionStatus>("not_determined");
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    setIsChecking(true);
    const status = await getNotificationPermissionStatus();
    setPermissionStatus(status);
    setIsChecking(false);
  };

  const requestPermission = async () => {
    const status = await requestNotificationPermission();
    setPermissionStatus(status);
    return status;
  };

  return {
    permissionStatus,
    isChecking,
    checkPermissions,
    requestPermission,
    isGranted: permissionStatus === "granted",
    isDenied: permissionStatus === "denied",
    canAskAgain: permissionStatus === "can_ask",
  };
}