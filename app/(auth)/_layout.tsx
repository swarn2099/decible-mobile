import { Stack } from "expo-router";
import { useUIStore } from "@/stores/uiStore";

export default function AuthLayout() {
  const hasSeenOnboarding = useUIStore((s) => s.hasSeenOnboarding);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0B0B0F" },
        animation: "fade",
      }}
      initialRouteName={hasSeenOnboarding ? "login" : "onboarding"}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
