import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useThemeColors } from "@/constants/colors";

type Props = {
  elapsed: number;
  onCancel: () => void;
};

/**
 * Full-screen loading state shown while the VM scraper hunts for tonight's lineup.
 * Renders an animated pulsing icon, elapsed time, and a cancel button.
 */
export function ScrapingWaitScreen({ elapsed, onCancel }: Props) {
  const colors = useThemeColors();

  // ----- Pulsing icon animation -----
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, {
            toValue: 0.95,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseScale, pulseOpacity]);

  // ----- Progress dots animation -----
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const dotAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    const anim1 = dotAnim(dot1, 0);
    const anim2 = dotAnim(dot2, 200);
    const anim3 = dotAnim(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Pulsing radar/music icon */}
      <Animated.View
        style={[
          styles.iconContainer,
          { borderColor: colors.pink, backgroundColor: colors.card },
          { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
        ]}
      >
        <Text style={styles.iconEmoji}>🎵</Text>
      </Animated.View>

      {/* Main label */}
      <Text style={[styles.heading, { color: colors.text }]}>
        Finding out what's playing here...
      </Text>

      {/* Elapsed time */}
      <Text style={[styles.elapsed, { color: colors.textSecondary }]}>
        {elapsed}s
      </Text>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: colors.pink, opacity: dot },
            ]}
          />
        ))}
      </View>

      {/* Cancel */}
      <TouchableOpacity
        onPress={onCancel}
        activeOpacity={0.6}
        hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
        style={styles.cancelButton}
      >
        <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconEmoji: {
    fontSize: 32,
  },
  heading: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    lineHeight: 26,
  },
  elapsed: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    letterSpacing: 1,
    marginTop: -4,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cancelButton: {
    marginTop: 24,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
});
