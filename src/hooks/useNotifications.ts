import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useRouter } from "expo-router";

import { useAuthStore } from "@/stores/authStore";
import { registerPushToken, handleNotificationRoute } from "@/lib/notifications";

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Registers for push notifications, stores the Expo push token in Supabase,
 * and handles deep-link routing when users tap on a notification.
 *
 * Call once in the root layout when the user is authenticated.
 */
export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus | null>(null);

  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    async function setup() {
      // Android notification channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Decibel",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF4D6A",
        });
      }

      // Push tokens only work on physical devices
      if (!Device.isDevice) {
        console.log("[notifications] Not a physical device, skipping push token registration");
        return;
      }

      // Check existing permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      // Request if not determined yet
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (isMounted) {
        setPermissionStatus(finalStatus);
      }

      if (finalStatus !== "granted") {
        console.log("[notifications] Permission not granted:", finalStatus);
        return;
      }

      // Get Expo push token
      try {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId ?? undefined,
        });

        const token = tokenData.data;

        if (isMounted) {
          setExpoPushToken(token);
        }

        // Register in Supabase
        await registerPushToken(user!.id, token);
      } catch (err) {
        console.warn("[notifications] Failed to get push token:", err);
      }
    }

    setup();

    // Listen for notification taps (responses)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<
          string,
          string
        >;
        if (data) {
          const route = handleNotificationRoute(data);
          router.push(route as any);
        }
      });

    return () => {
      isMounted = false;
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.id]);

  return { expoPushToken, permissionStatus };
}
