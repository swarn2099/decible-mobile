import { StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";

interface LoginOrbBackgroundProps {
  isDark: boolean;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export function LoginOrbBackground({ isDark }: LoginOrbBackgroundProps) {
  const opacityMultiplier = isDark ? 1.0 : 0.6;

  // Drift shared values for each orb (X and Y independently)
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const orb3X = useSharedValue(0);
  const orb3Y = useSharedValue(0);

  useEffect(() => {
    const easingFn = Easing.inOut(Easing.sin);

    // Orb 1 (pink): 5s X drift, 6.5s Y drift
    orb1X.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 5000, easing: easingFn }),
        withTiming(-30, { duration: 5000, easing: easingFn })
      ),
      -1,
      false
    );
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 6500, easing: easingFn }),
        withTiming(-20, { duration: 6500, easing: easingFn })
      ),
      -1,
      false
    );

    // Orb 2 (purple): 6.5s X, 5s Y
    orb2X.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 6500, easing: easingFn }),
        withTiming(25, { duration: 6500, easing: easingFn })
      ),
      -1,
      false
    );
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 5000, easing: easingFn }),
        withTiming(20, { duration: 5000, easing: easingFn })
      ),
      -1,
      false
    );

    // Orb 3 (blue): 7s X, 5.5s Y
    orb3X.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 7000, easing: easingFn }),
        withTiming(-20, { duration: 7000, easing: easingFn })
      ),
      -1,
      false
    );
    orb3Y.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 5500, easing: easingFn }),
        withTiming(15, { duration: 5500, easing: easingFn })
      ),
      -1,
      false
    );
  }, []);

  // Orb 1 = pink — prominent top-left area
  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb1X.value },
      { translateY: orb1Y.value },
    ],
    opacity: 0.18 * opacityMultiplier,
  }));

  // Orb 2 = purple — center-right area
  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb2X.value },
      { translateY: orb2Y.value },
    ],
    opacity: 0.16 * opacityMultiplier,
  }));

  // Orb 3 = blue — bottom-center area
  const orb3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb3X.value },
      { translateY: orb3Y.value },
    ],
    opacity: 0.14 * opacityMultiplier,
  }));

  return (
    <Animated.View
      style={styles.container}
      pointerEvents="none"
    >
      {/* Orb 1 — pink, top-left */}
      <Animated.View style={[styles.orb, styles.orb1, orb1Style]} pointerEvents="none">
        <LinearGradient
          colors={["#FF4D6A", "rgba(255,77,106,0)"]}
          style={styles.orbGradient}
        />
      </Animated.View>

      {/* Orb 2 — purple, center-right */}
      <Animated.View style={[styles.orb, styles.orb2, orb2Style]} pointerEvents="none">
        <LinearGradient
          colors={["#9B6DFF", "rgba(155,109,255,0)"]}
          style={styles.orbGradient}
        />
      </Animated.View>

      {/* Orb 3 — blue, bottom-center */}
      <Animated.View style={[styles.orb, styles.orb3, orb3Style]} pointerEvents="none">
        <LinearGradient
          colors={["#4D9AFF", "rgba(77,154,255,0)"]}
          style={styles.orbGradient}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  } as any,
  orb: {
    position: "absolute",
    borderRadius: 9999,
    pointerEvents: "none",
  } as any,
  // Pink orb — top-left, larger
  orb1: {
    width: 280,
    height: 280,
    top: SCREEN_H * 0.05,
    left: SCREEN_W * 0.2 - 140,
  },
  // Purple orb — center-right, largest
  orb2: {
    width: 320,
    height: 320,
    top: SCREEN_H * 0.2,
    left: SCREEN_W * 0.75 - 160,
  },
  // Blue orb — bottom-center
  orb3: {
    width: 240,
    height: 240,
    top: SCREEN_H * 0.55,
    left: SCREEN_W * 0.5 - 120,
  },
  orbGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 9999,
  },
});
