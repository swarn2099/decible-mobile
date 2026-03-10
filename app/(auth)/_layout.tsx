import { Stack } from "expo-router";
import { useUIStore } from "@/stores/uiStore";
import { useThemeColors } from "@/constants/colors";

export default function AuthLayout() {
  const hasSeenOnboarding = useUIStore((s) => s.hasSeenOnboarding);
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
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
