import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
  type SharedValue,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { useThemeColors } from "@/constants/colors";

interface OrbBackgroundProps {
  activeTabIndex: SharedValue<number>;
}

export function OrbBackground({ activeTabIndex }: OrbBackgroundProps) {
  const colors = useThemeColors();
  const opacityMultiplier = colors.isDark ? 1.0 : 0.6;

  // Drift shared values for each orb (X and Y independently)
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const orb3X = useSharedValue(0);
  const orb3Y = useSharedValue(0);

  useEffect(() => {
    const easingFn = Easing.inOut(Easing.sin);

    // Orb 1: 4s X drift, 5s Y drift
    orb1X.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 4000, easing: easingFn }),
        withTiming(-20, { duration: 4000, easing: easingFn })
      ),
      -1,
      false
    );
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 5000, easing: easingFn }),
        withTiming(-15, { duration: 5000, easing: easingFn })
      ),
      -1,
      false
    );

    // Orb 2: 5s X, 6s Y
    orb2X.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 5000, easing: easingFn }),
        withTiming(20, { duration: 5000, easing: easingFn })
      ),
      -1,
      false
    );
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 6000, easing: easingFn }),
        withTiming(15, { duration: 6000, easing: easingFn })
      ),
      -1,
      false
    );

    // Orb 3: 6s X, 4.5s Y
    orb3X.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 6000, easing: easingFn }),
        withTiming(-20, { duration: 6000, easing: easingFn })
      ),
      -1,
      false
    );
    orb3Y.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 4500, easing: easingFn }),
        withTiming(15, { duration: 4500, easing: easingFn })
      ),
      -1,
      false
    );
  }, []);

  // Tab-reactive opacity for each orb
  // Stamps (0): pink bright (0.30), purple dim (0.12), blue dim (0.10)
  // Finds (1): purple bright (0.28), pink medium (0.18), blue dim (0.10)
  // Discoveries (2): blue bright (0.28), purple medium (0.18), pink dim (0.10)

  const orb1Style = useAnimatedStyle(() => {
    // Orb 1 = pink
    const opacity =
      interpolate(activeTabIndex.value, [0, 1, 2], [0.30, 0.18, 0.10]) *
      opacityMultiplier;
    return {
      transform: [
        { translateX: orb1X.value },
        { translateY: orb1Y.value },
      ],
      opacity,
    };
  });

  const orb2Style = useAnimatedStyle(() => {
    // Orb 2 = purple
    const opacity =
      interpolate(activeTabIndex.value, [0, 1, 2], [0.12, 0.28, 0.18]) *
      opacityMultiplier;
    return {
      transform: [
        { translateX: orb2X.value },
        { translateY: orb2Y.value },
      ],
      opacity,
    };
  });

  const orb3Style = useAnimatedStyle(() => {
    // Orb 3 = blue
    const opacity =
      interpolate(activeTabIndex.value, [0, 1, 2], [0.10, 0.10, 0.28]) *
      opacityMultiplier;
    return {
      transform: [
        { translateX: orb3X.value },
        { translateY: orb3Y.value },
      ],
      opacity,
    };
  });

  return (
    <>
      {/* Orb 1 — pink, top-left */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          orb1Style,
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["#FF4D6A", "rgba(255,77,106,0)"]}
          style={styles.orbGradient}
        />
      </Animated.View>

      {/* Orb 2 — purple, center-right */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb2,
          orb2Style,
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["#9B6DFF", "rgba(155,109,255,0)"]}
          style={styles.orbGradient}
        />
      </Animated.View>

      {/* Orb 3 — blue, bottom-left */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb3,
          orb3Style,
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["#4D9AFF", "rgba(77,154,255,0)"]}
          style={styles.orbGradient}
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: "absolute",
    borderRadius: 9999,
    pointerEvents: "none",
  } as any,
  orb1: {
    width: 200,
    height: 200,
    top: 20,
    left: -40,
  },
  orb2: {
    width: 180,
    height: 180,
    top: "35%",
    right: -20,
  },
  orb3: {
    width: 160,
    height: 160,
    bottom: 60,
    left: 40,
  },
  orbGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 9999,
  },
});
