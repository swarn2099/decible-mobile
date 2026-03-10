import React, { useEffect } from "react";
import { View, RefreshControl, type RefreshControlProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  type SharedValue,
} from "react-native-reanimated";
import { useThemeColors } from "@/constants/colors";
const BAR_RESTING_HEIGHTS = [12, 20, 14];
const BAR_PEAK_HEIGHTS = [24, 32, 26];
const BAR_WIDTH = 4;
const BAR_GAP = 6;

type Props = Omit<RefreshControlProps, "tintColor" | "colors"> & {
  refreshing: boolean;
  onRefresh: () => void;
};

/**
 * Branded pull-to-refresh using the native RefreshControl with a transparent spinner,
 * overlaid with a sound wave equalizer animation in Decibel brand colors.
 *
 * The native RefreshControl is kept under the hood for reliable gesture handling.
 * We make its tint transparent and show our own pulsing bars above it.
 */
export function DecibelRefreshControl({ refreshing, onRefresh, ...rest }: Props) {
  const colors = useThemeColors();
  const BAR_COLORS = [colors.pink, colors.purple, colors.blue];
  const bar0Height = useSharedValue(BAR_RESTING_HEIGHTS[0]);
  const bar1Height = useSharedValue(BAR_RESTING_HEIGHTS[1]);
  const bar2Height = useSharedValue(BAR_RESTING_HEIGHTS[2]);

  const barValues = [bar0Height, bar1Height, bar2Height];

  useEffect(() => {
    if (refreshing) {
      // Animate bars with staggered bounce
      bar0Height.value = withRepeat(
        withSequence(
          withTiming(BAR_PEAK_HEIGHTS[0], { duration: 300 }),
          withTiming(BAR_RESTING_HEIGHTS[0], { duration: 300 })
        ),
        -1,
        false
      );
      bar1Height.value = withRepeat(
        withSequence(
          withTiming(BAR_RESTING_HEIGHTS[1], { duration: 150 }),
          withTiming(BAR_PEAK_HEIGHTS[1], { duration: 300 }),
          withTiming(BAR_RESTING_HEIGHTS[1], { duration: 300 })
        ),
        -1,
        false
      );
      bar2Height.value = withRepeat(
        withSequence(
          withTiming(BAR_RESTING_HEIGHTS[2], { duration: 250 }),
          withTiming(BAR_PEAK_HEIGHTS[2], { duration: 300 }),
          withTiming(BAR_RESTING_HEIGHTS[2], { duration: 300 })
        ),
        -1,
        false
      );
    } else {
      // Reset to resting
      cancelAnimation(bar0Height);
      cancelAnimation(bar1Height);
      cancelAnimation(bar2Height);
      bar0Height.value = withTiming(BAR_RESTING_HEIGHTS[0], { duration: 200 });
      bar1Height.value = withTiming(BAR_RESTING_HEIGHTS[1], { duration: 200 });
      bar2Height.value = withTiming(BAR_RESTING_HEIGHTS[2], { duration: 200 });
    }
  }, [refreshing]);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="transparent"
      colors={["transparent"]}
      style={{ backgroundColor: "transparent" }}
      {...rest}
    >
      {refreshing && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "center",
            height: 40,
            gap: BAR_GAP,
            paddingBottom: 4,
          }}
        >
          {barValues.map((barHeight, i) => (
            <SoundBar key={i} height={barHeight} color={BAR_COLORS[i]} />
          ))}
        </View>
      )}
    </RefreshControl>
  );
}

function SoundBar({
  height,
  color,
}: {
  height: SharedValue<number>;
  color: string;
}) {
  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          width: BAR_WIDTH,
          borderRadius: BAR_WIDTH / 2,
          backgroundColor: color,
        },
      ]}
    />
  );
}
