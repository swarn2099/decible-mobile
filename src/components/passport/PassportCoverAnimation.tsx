import { useEffect, useState, type ReactNode } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Award } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";

// Module-level flag — resets on app kill, does NOT persist to MMKV
let hasPlayedThisSession = false;

interface PassportCoverAnimationProps {
  children: ReactNode;
}

export function PassportCoverAnimation({
  children,
}: PassportCoverAnimationProps) {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const colors = useThemeColors();

  // If already played this session, skip the cover entirely
  const [coverDone, setCoverDone] = useState(hasPlayedThisSession);

  // rotateY goes from 0 → -90 (opens like a book rotating left edge as spine)
  const rotation = useSharedValue(0);

  const markDone = () => {
    hasPlayedThisSession = true;
    setCoverDone(true);
  };

  useEffect(() => {
    if (hasPlayedThisSession) return;

    // 500ms hold, then rotate open over 1000ms
    rotation.value = withDelay(
      500,
      withTiming(-90, { duration: 1000, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (finished) {
          runOnJS(markDone)();
        }
      })
    );
  }, []);

  const coverAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1200 },
        { translateX: -SCREEN_WIDTH / 2 },
        { rotateY: `${rotation.value}deg` },
        { translateX: SCREEN_WIDTH / 2 },
      ],
    };
  });

  return (
    <View style={{ flex: 1 }}>
      {children}

      {/* Cover overlay — unmounted after animation completes */}
      {!coverDone && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#111118",
              backfaceVisibility: "hidden",
              alignItems: "center",
              justifyContent: "center",
              borderRightWidth: 2,
              borderRightColor: "rgba(212,168,69,0.3)",
              // Subtle shadow to create depth on right edge (spine)
              shadowColor: "#000",
              shadowOffset: { width: 8, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 12,
              elevation: 8,
            },
            coverAnimatedStyle,
          ]}
        >
          {/* Dark leather texture — radial gradient overlay using LinearGradient */}
          <LinearGradient
            colors={["#1A1A24", "#0D0D14", "#111118", "#0D0D14"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.6,
            }}
          />

          {/* Gold DECIBEL text with gradient sheen */}
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            {/* Gold text — plain gold with letterSpacing (no MaskedView needed) */}
            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 32,
                letterSpacing: 8,
                color: "#D4A845",
                textShadowColor: "rgba(212,168,69,0.4)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 12,
              }}
            >
              DECIBEL
            </Text>

            {/* Gold seal icon */}
            <Award size={28} color="#D4A845" />
          </View>

          {/* Bottom embossed line */}
          <View
            style={{
              position: "absolute",
              bottom: 60,
              left: 40,
              right: 40,
              height: 1,
              backgroundColor: "rgba(212,168,69,0.2)",
            }}
          />

          {/* Top embossed line */}
          <View
            style={{
              position: "absolute",
              top: 60,
              left: 40,
              right: 40,
              height: 1,
              backgroundColor: "rgba(212,168,69,0.2)",
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}
