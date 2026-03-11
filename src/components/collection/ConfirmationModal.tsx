import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Modal, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withSequence,
  runOnJS,
  interpolateColor,
  useDerivedValue,
  useAnimatedReaction,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { Check } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { TIER_COLORS, TIER_LABELS, calculateTier, type TierName } from "@/hooks/useCollection";
import { WaxSeal } from "./WaxSeal";

type ConfirmationModalProps = {
  visible: boolean;
  type: "collect" | "discover" | "founded";
  performer: {
    name: string;
    photo_url: string | null;
  };
  result: {
    scan_count: number;
    current_tier: TierName;
    tierUp: boolean;
    alreadyDone: boolean;
  };
  shareCardUri?: string | null;
  onShare: () => void;
  onDismiss: () => void;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ConfirmationModal({
  visible,
  type,
  performer,
  result,
  shareCardUri,
  onShare,
  onDismiss,
}: ConfirmationModalProps) {
  const colors = useThemeColors();
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shared values for animations
  const stampScale = useSharedValue(0.3);
  const stampTranslateY = useSharedValue(-100);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0.5);
  const tierBadgeScale = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  // Confetti particles
  const confettiOpacity = useSharedValue(0);
  // Gold star scale for founded type
  const goldStarScale = useSharedValue(0);
  // Wax seal color transition for tier-up (0 = previous tier color, 1 = current tier color)
  const sealColorProgress = useSharedValue(result.tierUp ? 0 : 1);

  // Determine haptic and confetti behavior based on type
  const isFounded = type === "founded";
  const isDiscover = type === "discover";

  const triggerHaptic = () => {
    if (isFounded) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (isDiscover) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const triggerTierUpHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  useEffect(() => {
    if (visible) {
      // Reset values
      stampScale.value = 0.3;
      stampTranslateY.value = -100;
      ringScale.value = 0;
      ringOpacity.value = 0.5;
      tierBadgeScale.value = 0;
      textOpacity.value = 0;
      buttonsOpacity.value = 0;
      confettiOpacity.value = 0;
      goldStarScale.value = 0;
      sealColorProgress.value = result.tierUp ? 0 : 1;

      // Stamp slam animation with bounce-back overshoot
      stampScale.value = withSequence(
        withSpring(1.05, { damping: 12, stiffness: 180 }),
        withSpring(1, { damping: 14, stiffness: 200 })
      );
      stampTranslateY.value = withSpring(0, { damping: 12, stiffness: 180 }, (finished) => {
        if (finished) {
          runOnJS(triggerHaptic)();
        }
      });

      // Ink ring expands after stamp lands (~300ms delay)
      ringScale.value = withDelay(300, withTiming(2, { duration: 600 }));
      ringOpacity.value = withDelay(300, withTiming(0, { duration: 600 }));

      // Text fades in
      textOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));

      if (isFounded || isDiscover) {
        // Gold star / compass badge scales in
        goldStarScale.value = withDelay(500, withSpring(1, { damping: 8, stiffness: 200 }));
        // Confetti always shows for founded (20 particles), discover (10 particles)
        confettiOpacity.value = withDelay(600, withSequence(
          withTiming(1, { duration: 200 }),
          withDelay(1800, withTiming(0, { duration: 500 }))
        ));
        // Share button fades in after 1.5s
        buttonsOpacity.value = withDelay(1500, withTiming(1, { duration: 400 }));
        // Extra haptic for founded after confetti appears
        if (isFounded) {
          setTimeout(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }, 700);
        }
      } else {
        // collect path: tier badge wax seal
        tierBadgeScale.value = withDelay(500, withSpring(1, { damping: 10, stiffness: 200 }));
        // Buttons fade in last
        buttonsOpacity.value = withDelay(700, withTiming(1, { duration: 300 }));

        // Confetti + wax seal color transition for tier-up
        if (result.tierUp) {
          confettiOpacity.value = withDelay(600, withSequence(
            withTiming(1, { duration: 200 }),
            withDelay(1500, withTiming(0, { duration: 500 }))
          ));
          sealColorProgress.value = withDelay(600, withTiming(1, { duration: 600 }));
          setTimeout(() => {
            triggerTierUpHaptic();
          }, 800);
        }
      }

      // Auto-dismiss after 5 seconds
      dismissTimer.current = setTimeout(() => {
        onDismiss();
      }, 5000);
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
    };
  }, [visible]);

  const stampStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: stampScale.value },
      { translateY: stampTranslateY.value },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const tierBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tierBadgeScale.value }],
  }));

  const goldStarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: goldStarScale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));

  const tierColor = TIER_COLORS[result.current_tier];
  const tierLabel = TIER_LABELS[result.current_tier];

  // Compute the previous tier color for the seal color transition animation
  const prevTierColor = result.tierUp
    ? TIER_COLORS[calculateTier(Math.max(result.scan_count - 1, 0))]
    : tierColor;

  // Animated seal color: interpolates from previous tier color -> current tier color on tier-up
  const animatedSealColor = useDerivedValue(() =>
    interpolateColor(sealColorProgress.value, [0, 1], [prevTierColor, tierColor])
  );

  // Bridge Reanimated derived value to React state so WaxSeal (non-animated SVG) can consume it
  const [sealColor, setSealColor] = useState(result.tierUp ? prevTierColor : tierColor);
  useAnimatedReaction(
    () => animatedSealColor.value,
    (color) => {
      runOnJS(setSealColor)(color);
    }
  );

  const dateString = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleInteraction = () => {
    // User interacted — clear auto-dismiss
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  };

  // Determine ring color and confetti colors
  const ringColor = isFounded ? colors.yellow : isDiscover ? colors.purple : tierColor;

  // Confetti particle colors: founded = all 5 accents (20 particles), discover = purple-dominant (10)
  const confettiColors = isFounded
    ? [colors.pink, colors.purple, colors.yellow, colors.teal, colors.blue]
    : isDiscover
    ? [colors.purple, colors.purple, colors.pink, colors.blue, colors.purple]
    : [colors.pink, colors.purple, colors.yellow, colors.teal, colors.blue];

  const confettiCount = isFounded ? 20 : isDiscover ? 10 : 12;

  // Share button color
  const shareButtonBg = isFounded ? colors.yellow : isDiscover ? colors.purple : colors.purple;
  const shareButtonTextColor = isFounded ? "#000000" : "#FFFFFF";
  const shareButtonLabel = isFounded ? "Share Your Find" : "Share";

  // Title text
  const titleText = isFounded
    ? "Founded!"
    : isDiscover
    ? "Discovered!"
    : type === "collect"
    ? "Collected!"
    : "Done!";

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          handleInteraction();
          onDismiss();
        }}
      >
        <BlurView
          intensity={40}
          tint="dark"
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.85)",
          }}
        >
          <Pressable
            onPress={handleInteraction}
            style={{ alignItems: "center", width: "100%", paddingHorizontal: 32 }}
          >
            {/* Confetti particles */}
            {(isFounded || isDiscover || result.tierUp) && (
              <Animated.View
                style={[
                  confettiStyle,
                  {
                    position: "absolute",
                    top: "15%",
                    left: 0,
                    right: 0,
                    flexDirection: "row",
                    justifyContent: "space-around",
                    paddingHorizontal: 40,
                  },
                ]}
              >
                {Array.from({ length: confettiCount }).map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 6 + (i % 3) * 3,
                      height: 6 + (i % 3) * 3,
                      borderRadius: 3,
                      backgroundColor: confettiColors[i % confettiColors.length],
                      transform: [
                        { rotate: `${i * 30}deg` },
                        { translateY: (i % 4) * 15 },
                      ],
                    }}
                  />
                ))}
              </Animated.View>
            )}

            {/* Stamp press — artist photo */}
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              {/* Ink ring expanding behind the stamp */}
              <Animated.View
                style={[
                  ringStyle,
                  {
                    position: "absolute",
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    borderWidth: 3,
                    borderColor: ringColor,
                  },
                ]}
              />

              <Animated.View style={stampStyle}>
                {performer.photo_url ? (
                  <Image
                    source={{ uri: performer.photo_url }}
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      borderWidth: 2,
                      borderColor: isFounded ? colors.yellow : "rgba(255,255,255,0.2)",
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      borderWidth: 2,
                      borderColor: isFounded ? colors.yellow : "rgba(255,255,255,0.2)",
                      backgroundColor: colors.card,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: colors.white,
                        fontFamily: "Poppins_700Bold",
                        fontSize: 36,
                      }}
                    >
                      {getInitials(performer.name)}
                    </Text>
                  </View>
                )}
              </Animated.View>
            </View>

            {/* Text content */}
            <Animated.View style={[textStyle, { alignItems: "center", gap: 6 }]}>
              {result.alreadyDone ? (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Check size={24} color={colors.teal} />
                    <Text
                      style={{
                        color: colors.white,
                        fontFamily: "Poppins_700Bold",
                        fontSize: 22,
                      }}
                    >
                      Already in your passport
                    </Text>
                  </View>
                </>
              ) : (
                <Text
                  style={{
                    color: isFounded ? colors.yellow : colors.white,
                    fontFamily: "Poppins_700Bold",
                    fontSize: 24,
                  }}
                >
                  {titleText}
                </Text>
              )}

              <Text
                style={{
                  color: colors.white,
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                }}
              >
                {performer.name}
              </Text>

              <Text
                style={{
                  color: colors.gray,
                  fontFamily: "Poppins_400Regular",
                  fontSize: 14,
                }}
              >
                {dateString}
              </Text>

              {/* Tier-up celebration (collect path only) */}
              {result.tierUp && !result.alreadyDone && !isFounded && !isDiscover && (
                <Text
                  style={{
                    color: tierColor,
                    fontFamily: "Poppins_700Bold",
                    fontSize: 16,
                    marginTop: 8,
                  }}
                >
                  {tierLabel} Unlocked!
                </Text>
              )}
            </Animated.View>

            {/* Badge: founded = gold star, discover = compass emoji, collect = wax seal */}
            {!result.alreadyDone && (
              <>
                {isFounded && (
                  <Animated.View style={[goldStarStyle, { marginTop: 20, alignItems: "center" }]}>
                    <Text style={{ fontSize: 64, color: colors.yellow }}>★</Text>
                  </Animated.View>
                )}
                {isDiscover && (
                  <Animated.View style={[goldStarStyle, { marginTop: 20, alignItems: "center" }]}>
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: `${colors.purple}33`,
                        borderWidth: 2,
                        borderColor: colors.purple,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 36 }}>🧭</Text>
                    </View>
                  </Animated.View>
                )}
                {!isFounded && !isDiscover && (
                  <Animated.View style={[tierBadgeStyle, { marginTop: 20, alignItems: "center" }]}>
                    <WaxSeal
                      tier={result.current_tier}
                      scanCount={type === "collect" ? result.scan_count : 0}
                      size={80}
                      colorOverride={sealColor}
                    />
                  </Animated.View>
                )}
              </>
            )}

            {/* Action buttons */}
            <Animated.View style={[buttonsStyle, { width: "100%", marginTop: 32, gap: 12 }]}>
              {!result.alreadyDone && (
                <Pressable
                  onPress={() => {
                    handleInteraction();
                    onShare();
                  }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 14,
                    alignItems: "center",
                    overflow: "hidden",
                    backgroundColor: shareButtonBg,
                  }}
                >
                  <Text
                    style={{
                      color: shareButtonTextColor,
                      fontFamily: "Poppins_700Bold",
                      fontSize: 16,
                    }}
                  >
                    {shareButtonLabel}
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => {
                  handleInteraction();
                  onDismiss();
                }}
                style={{ alignItems: "center", paddingVertical: 12 }}
              >
                <Text
                  style={{
                    color: colors.gray,
                    fontFamily: "Poppins_500Medium",
                    fontSize: 16,
                  }}
                >
                  Done
                </Text>
              </Pressable>
            </Animated.View>
          </Pressable>
        </BlurView>
      </Pressable>
    </Modal>
  );
}
