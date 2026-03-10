import React, { useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  withSequence,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Share2 } from "lucide-react-native";
import type { BadgeWithStatus } from "@/types/badges";
import { RARITY_COLORS } from "@/constants/badges";
import { useThemeColors } from "@/constants/colors";

type Props = {
  badge: BadgeWithStatus | null;
  onClose: () => void;
  onShare?: () => void;
  justEarned?: boolean;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const RAY_COUNT = 8;
const RAY_ANGLES = Array.from({ length: RAY_COUNT }, (_, i) => i * (360 / RAY_COUNT));

export function BadgeDetailModal({ badge, onClose, onShare, justEarned }: Props) {
  const colors = useThemeColors();

  // Starburst ray animation values
  const rayScale = useSharedValue(0);
  const rayOpacity = useSharedValue(0);
  // Glow ring
  const glowScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  // Badge icon entrance
  const iconScale = useSharedValue(1);
  // Grayscale-to-color overlay (opacity fades out to reveal color)
  const colorOverlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (badge && justEarned) {
      // Reset
      rayScale.value = 0;
      rayOpacity.value = 0;
      glowScale.value = 0;
      glowOpacity.value = 0;
      iconScale.value = 0.5;
      colorOverlayOpacity.value = 0.85;

      // Badge icon pops in
      iconScale.value = withDelay(100, withSpring(1, { damping: 10, stiffness: 200 }));

      // Starburst rays: flash visible then scale out + fade over 600ms
      rayOpacity.value = withDelay(200, withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 550 })
      ));
      rayScale.value = withDelay(200, withTiming(1.5, { duration: 600 }));

      // Glow ring: flash at 0.5 opacity then fade while scaling
      glowOpacity.value = withDelay(200, withSequence(
        withTiming(0.5, { duration: 50 }),
        withTiming(0, { duration: 550 })
      ));
      glowScale.value = withDelay(200, withTiming(2, { duration: 600 }));

      // Grayscale-to-color: overlay fades out revealing full-color emoji
      // Coordinated with starburst -- starts at 150ms, completes by 950ms
      colorOverlayOpacity.value = withDelay(150, withTiming(0, { duration: 800 }));

      // Heavy haptic: thump + success notification ("badge stamped" feel)
      setTimeout(async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 100);
      }, 250);
    } else if (badge) {
      iconScale.value = 1;
      rayOpacity.value = 0;
      glowOpacity.value = 0;
      colorOverlayOpacity.value = 0;
    }
  }, [badge, justEarned]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  // Overlay fades from opaque (card color = grayscale mask) to transparent (reveals color)
  const colorOverlayStyle = useAnimatedStyle(() => ({
    opacity: colorOverlayOpacity.value,
  }));

  if (!badge) return null;

  const rarityColor = RARITY_COLORS[badge.rarity];
  const showCelebration = justEarned && badge.earned;

  return (
    <Modal
      visible={!!badge}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.8)",
          justifyContent: "center",
          alignItems: "center",
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 24,
            width: "80%",
            maxWidth: 320,
            alignItems: "center",
            position: "relative",
            borderWidth: 1,
            borderColor: colors.cardBorder,
            ...(!colors.isDark && {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }),
          }}
          activeOpacity={1}
          onPress={() => {}}
        >
          {/* Close button */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 12,
              right: 16,
              zIndex: 10,
              width: 28,
              height: 28,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={onClose}
          >
            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 16,
                color: colors.textTertiary,
              }}
            >
              X
            </Text>
          </TouchableOpacity>

          {/* Badge icon with starburst */}
          <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            {/* Starburst rays */}
            {showCelebration && RAY_ANGLES.map((angle, i) => (
              <StarburstRay
                key={i}
                angle={angle}
                color={rarityColor}
                rayScale={rayScale}
                rayOpacity={rayOpacity}
              />
            ))}

            {/* Glow ring */}
            {showCelebration && (
              <Animated.View
                style={[
                  glowStyle,
                  {
                    position: "absolute",
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    borderWidth: 2,
                    borderColor: rarityColor,
                  },
                ]}
              />
            )}

            <Animated.View
              style={[
                iconAnimStyle,
                {
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  borderWidth: 2,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  backgroundColor: badge.earned
                    ? `${rarityColor}33`
                    : colors.isDark ? colors.card : colors.cardHover,
                  borderColor: badge.earned ? rarityColor : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 48,
                  opacity: badge.earned ? 1 : 0.3,
                }}
              >
                {badge.icon}
              </Text>
              {/* Grayscale-to-color overlay: fades out on justEarned to reveal full-color emoji */}
              {showCelebration && (
                <Animated.View
                  style={[
                    colorOverlayStyle,
                    {
                      position: "absolute",
                      top: 0, left: 0, right: 0, bottom: 0,
                      borderRadius: 36,
                      backgroundColor: colors.card,
                    },
                  ]}
                />
              )}
            </Animated.View>
          </View>

          {/* Badge name */}
          <Text
            style={{
              fontFamily: "Poppins_700Bold",
              fontSize: 20,
              color: colors.text,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {badge.name}
          </Text>

          {/* Rarity label */}
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
              marginBottom: 16,
              backgroundColor: `${rarityColor}26`,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 12,
                color: rarityColor,
              }}
            >
              {capitalizeFirst(badge.rarity)}
            </Text>
          </View>

          {/* Status-specific content */}
          {badge.earned ? (
            <>
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 14,
                  color: colors.teal,
                  marginBottom: 8,
                }}
              >
                Earned {formatDate(badge.earned_at!)}
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginBottom: 8,
                  lineHeight: 20,
                }}
              >
                {badge.description}
              </Text>
              {badge.rarity_percent !== null && (
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 13,
                    color: colors.gold,
                    marginTop: 4,
                  }}
                >
                  Top {badge.rarity_percent}% of fans
                </Text>
              )}
              {onShare && (
                <TouchableOpacity
                  onPress={onShare}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    marginTop: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                    backgroundColor: `${colors.purple}26`,
                  }}
                  activeOpacity={0.7}
                >
                  <Share2 size={14} color={colors.purple} />
                  <Text
                    style={{
                      fontFamily: "Poppins_600SemiBold",
                      fontSize: 13,
                      color: colors.purple,
                    }}
                  >
                    Share
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <View
                style={{
                  backgroundColor: colors.isDark ? colors.cardHover : colors.bg,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 12,
                    color: colors.textTertiary,
                  }}
                >
                  Locked
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 14,
                  color: colors.pink,
                  textAlign: "center",
                  marginBottom: 8,
                  lineHeight: 20,
                }}
              >
                {badge.criteria}
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginBottom: 8,
                  lineHeight: 20,
                }}
              >
                {badge.description}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ---------- Starburst ray component ----------

function StarburstRay({
  angle,
  color,
  rayScale,
  rayOpacity,
}: {
  angle: number;
  color: string;
  rayScale: SharedValue<number>;
  rayOpacity: SharedValue<number>;
}) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${angle}deg` },
      { scaleY: rayScale.value },
    ],
    opacity: rayOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          position: "absolute",
          width: 2,
          height: 30,
          backgroundColor: color,
          borderRadius: 1,
        },
      ]}
    />
  );
}
