import { useEffect, useRef } from "react";
import { View, Text, Modal, Pressable, Platform, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { BlurView, BlurTargetView } from "expo-blur";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useThemeColors } from "@/constants/colors";
import type { StampData } from "@/types";

// ---------- Types ----------

type StampAnimationModalProps = {
  visible: boolean;
  stamps: StampData[];
  onViewPassport: () => void;
  onDismiss: () => void;
};

// ---------- Helpers ----------

function formatDate(dateStr: string): string {
  // dateStr: "YYYY-MM-DD"
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------- Component ----------

export function StampAnimationModal({
  visible,
  stamps,
  onViewPassport,
  onDismiss,
}: StampAnimationModalProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const lottieRef = useRef<LottieView>(null);
  const bgRef = useRef<View>(null);

  // Shared animation values
  const stampTranslateY = useSharedValue(-300);
  const stampScale = useSharedValue(1.2);
  const inkOpacity = useSharedValue(0);
  const inkScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  useEffect(() => {
    if (visible) {
      // Reset all values
      stampTranslateY.value = -300;
      stampScale.value = 1.2;
      inkOpacity.value = 0;
      inkScale.value = 0;
      textOpacity.value = 0;
      buttonsOpacity.value = 0;

      // 1. Stamp slams down — on finish, trigger haptic
      stampTranslateY.value = withSpring(0, { damping: 12, stiffness: 180 }, (finished) => {
        if (finished) {
          runOnJS(triggerHaptic)();
          // Trigger Lottie after slam
          runOnJS(() => {
            lottieRef.current?.play();
          })();
        }
      });

      stampScale.value = withSequence(
        withSpring(1.05, { damping: 12, stiffness: 180 }),
        withSpring(1.0, { damping: 14, stiffness: 200 })
      );

      // 2. Ink spread — pink at 30% opacity, expands and fades
      inkOpacity.value = withDelay(200, withSequence(
        withTiming(0.6, { duration: 100 }),
        withTiming(0, { duration: 400 })
      ));
      inkScale.value = withDelay(200, withTiming(3, { duration: 400 }));

      // 3. Reveal text
      textOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));

      // 4. Buttons
      buttonsOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));
    }
  }, [visible]);

  // Animated styles
  const stampStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: stampTranslateY.value },
      { scale: stampScale.value },
    ],
  }));

  const inkStyle = useAnimatedStyle(() => ({
    opacity: inkOpacity.value,
    transform: [{ scale: inkScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  // Derive display data from stamps
  const primaryStamp = stamps[0];
  const venueName = primaryStamp?.venue_name ?? "";
  const eventDate = primaryStamp ? formatDate(primaryStamp.event_date) : "";
  const artistNames = stamps.map((s) => s.performer_name);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <BlurTargetView
        ref={bgRef}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.88)" }}
      >
        <BlurView
          blurTarget={bgRef}
          intensity={40}
          tint="dark"
          blurMethod="dimezisBlurViewSdk31Plus"
          style={StyleSheet.absoluteFill}
        />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
        <View
          style={{
            alignItems: "center",
            width: "100%",
            paddingHorizontal: 32,
          }}
        >
          {/* Stamp animation area */}
          <View style={{ alignItems: "center", marginBottom: 28, position: "relative" }}>
            {/* Ink spread — circular pink burst behind the stamp */}
            <Animated.View
              style={[
                inkStyle,
                {
                  position: "absolute",
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: colors.pink,
                },
              ]}
            />

            {/* The stamp itself — Lottie animation or fallback circle */}
            <Animated.View style={stampStyle}>
              <LottieView
                ref={lottieRef}
                source={require("../../../assets/animations/stamp-press.json")}
                autoPlay={false}
                loop={false}
                style={{ width: 120, height: 120 }}
                colorFilters={[
                  {
                    keypath: "ink_ring",
                    color: colors.pink,
                  },
                  {
                    keypath: "stamp_circle",
                    color: colors.pink,
                  },
                ]}
              />
            </Animated.View>
          </View>

          {/* Revealed stamp content */}
          <Animated.View style={[textStyle, { alignItems: "center", gap: 8, width: "100%" }]}>
            {/* Venue name — large and prominent */}
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: "Poppins_700Bold",
                fontSize: 26,
                textAlign: "center",
                lineHeight: 32,
              }}
              numberOfLines={2}
            >
              {venueName}
            </Text>

            {/* Date — monospace-ish with letter spacing */}
            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                fontSize: 14,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {eventDate}
            </Text>

            {/* Artist names — listed vertically for multi-lineup */}
            <View style={{ gap: 4, alignItems: "center", marginTop: 4 }}>
              {artistNames.map((name, i) => (
                <Text
                  key={i}
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  {name}
                </Text>
              ))}
            </View>
          </Animated.View>

          {/* Action buttons */}
          <Animated.View style={[buttonsStyle, { width: "100%", marginTop: 36, gap: 12 }]}>
            {/* Primary — View Passport */}
            <Pressable
              onPress={onViewPassport}
              style={({ pressed }) => ({
                backgroundColor: colors.pink,
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "Poppins_700Bold",
                  fontSize: 16,
                }}
              >
                View Passport
              </Text>
            </Pressable>

            {/* Secondary — Done */}
            <Pressable
              onPress={onDismiss}
              style={{ alignItems: "center", paddingVertical: 12 }}
            >
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "Poppins_500Medium",
                  fontSize: 16,
                }}
              >
                Done
              </Text>
            </Pressable>
          </Animated.View>
        </View>
        </View>
      </BlurTargetView>
    </Modal>
  );
}
