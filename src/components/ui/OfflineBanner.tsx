import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { WifiOff } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { useUIStore } from "@/stores/uiStore";

export function OfflineBanner() {
  const colors = useThemeColors();
  const isOnline = useUIStore((s) => s.isOnline);
  const translateY = useSharedValue(36);

  useEffect(() => {
    translateY.value = withTiming(isOnline ? 36 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [isOnline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 36,
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingHorizontal: 16,
          overflow: "hidden",
        },
        animatedStyle,
      ]}
      pointerEvents={isOnline ? "none" : "box-none"}
    >
      <WifiOff size={16} color={colors.textSecondary} />
      <Text
        style={{
          fontSize: 13,
          fontFamily: "Poppins_500Medium",
          color: colors.textSecondary,
        }}
      >
        Offline -- showing saved data
      </Text>
    </Animated.View>
  );
}
