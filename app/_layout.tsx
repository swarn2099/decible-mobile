import "../global.css";

import { useEffect, useState } from "react";
import { Stack, Redirect, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Image } from "expo-image";
import NetInfo from "@react-native-community/netinfo";

import { useQuery } from "@tanstack/react-query";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { useAuthRecovery } from "@/hooks/useAuthRecovery";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { ReAuthModal } from "@/components/auth/ReAuthModal";
import { apiCall } from "@/lib/api";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const hasSeenOnboarding = useUIStore((s) => s.hasSeenOnboarding);
  const segments = useSegments();

  useAuthRecovery();

  const { data: fanProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["fanProfile", session?.user?.email],
    queryFn: async () => {
      const data = await apiCall<{ fan: { name: string | null } }>("/mobile/passport?page=0");
      return data.fan;
    },
    enabled: !!session?.user?.email,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return null;
  }

  const inAuthGroup = segments[0] === "(auth)";

  if (!session && !inAuthGroup) {
    const authRoute = hasSeenOnboarding
      ? "/(auth)/login"
      : "/(auth)/onboarding";
    return <Redirect href={authRoute} />;
  }
  if (session && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  if (session && !inAuthGroup && !profileLoading && fanProfile && !fanProfile.name) {
    const inSetup = segments[0] === "setup-username";
    if (!inSetup) {
      return <Redirect href="/setup-username" />;
    }
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="artist/[slug]"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="artist/fans"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="collection"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="followers"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="following"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="settings"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="search"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="jukebox"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="profile/[id]"
          options={{ presentation: "card", animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="setup-username"
          options={{ presentation: "card" }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>

      <OfflineBanner />
      <ReAuthModal />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (typeof Image.configureCache === "function") {
      Image.configureCache({ maxDiskSize: 100 * 1024 * 1024 });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      useUIStore.getState().setIsOnline(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
