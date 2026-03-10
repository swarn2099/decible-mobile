import React, { useEffect } from "react";
import { View, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useThemeColors } from "@/constants/colors";

// ---------- Base animation hook ----------

function useSkeletonPulse() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

// ---------- Primitive shapes ----------

type SkeletonRectProps = {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function SkeletonRect({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonRectProps) {
  const animatedStyle = useSkeletonPulse();
  const colors = useThemeColors();
  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.card,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

type SkeletonCircleProps = {
  size: number;
  style?: ViewStyle;
};

export function SkeletonCircle({ size, style }: SkeletonCircleProps) {
  const animatedStyle = useSkeletonPulse();
  const colors = useThemeColors();
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.card,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

type SkeletonLineProps = {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
};

export function SkeletonLine({
  width = "100%",
  height = 14,
  style,
}: SkeletonLineProps) {
  const animatedStyle = useSkeletonPulse();
  const colors = useThemeColors();
  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: 4,
          backgroundColor: colors.card,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

type SkeletonGroupProps = {
  gap?: number;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function SkeletonGroup({ gap = 12, children, style }: SkeletonGroupProps) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

// ---------- Preset compositions ----------

export function HomeFeedSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
      {/* Section header */}
      <SkeletonLine width={120} height={12} style={{ marginBottom: 16 }} />

      {/* Event cards */}
      <SkeletonGroup gap={12} style={{ marginBottom: 32 }}>
        {[1, 2].map((i) => (
          <View key={i} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <SkeletonRect width={64} height={64} borderRadius={12} />
            <View style={{ flex: 1, gap: 8 }}>
              <SkeletonLine width="80%" height={16} />
              <SkeletonLine width="50%" height={12} />
            </View>
          </View>
        ))}
      </SkeletonGroup>

      {/* Section header */}
      <SkeletonLine width={140} height={12} style={{ marginBottom: 16 }} />

      {/* Horizontal artist row */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 32 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={{ alignItems: "center", gap: 8 }}>
            <SkeletonCircle size={56} />
            <SkeletonLine width={48} height={10} />
          </View>
        ))}
      </View>

      {/* Another section */}
      <SkeletonLine width={130} height={12} style={{ marginBottom: 16 }} />
      <View style={{ flexDirection: "row", gap: 16 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={{ alignItems: "center", gap: 8 }}>
            <SkeletonCircle size={56} />
            <SkeletonLine width={48} height={10} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function ArtistProfileSkeleton() {
  return (
    <View>
      {/* Hero */}
      <SkeletonRect width="100%" height={250} borderRadius={0} />

      {/* Stats row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 20,
          paddingHorizontal: 16,
        }}
      >
        {[1, 2].map((i) => (
          <SkeletonCircle key={i} size={56} />
        ))}
      </View>

      {/* Content lines */}
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <SkeletonLine width="90%" height={16} />
        <SkeletonLine width="60%" height={14} />
        <SkeletonLine width="75%" height={14} />
      </View>
    </View>
  );
}

export function PassportSkeleton() {
  const colors = useThemeColors();
  return (
    <View style={{ paddingTop: 60 }}>
      {/* Avatar + name */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
      >
        <SkeletonCircle size={80} />
        <View style={{ gap: 8 }}>
          <SkeletonLine width={140} height={20} />
          <SkeletonLine width={80} height={14} />
        </View>
      </View>

      {/* Stats bar */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 16,
          paddingHorizontal: 20,
          marginHorizontal: 16,
          backgroundColor: colors.card,
          borderRadius: 16,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ alignItems: "center", gap: 6 }}>
            <SkeletonRect width={36} height={36} borderRadius={4} />
            <SkeletonLine width={40} height={12} />
          </View>
        ))}
      </View>

      {/* Stamp grid */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          paddingHorizontal: 20,
          paddingTop: 24,
          gap: 16,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonRect key={i} width={100} height={100} borderRadius={12} />
        ))}
      </View>
    </View>
  );
}

export function LeaderboardSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      {/* Podium rects */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <SkeletonRect width={80} height={100} borderRadius={12} />
        <SkeletonRect width={80} height={130} borderRadius={12} />
        <SkeletonRect width={80} height={80} borderRadius={12} />
      </View>

      {/* Rank rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingVertical: 10,
          }}
        >
          <SkeletonCircle size={40} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonLine width="60%" height={14} />
            <SkeletonLine width="30%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function CollectSkeleton() {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
      <SkeletonRect width="100%" height={120} borderRadius={16} style={{ marginBottom: 16 }} />
      <SkeletonLine width="60%" height={14} style={{ marginBottom: 12 }} />
      <SkeletonRect width="100%" height={80} borderRadius={12} />
    </View>
  );
}

export function SearchSkeleton() {
  return (
    <View style={{ paddingTop: 12 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <SkeletonCircle size={48} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonLine width="60%" height={14} />
            <SkeletonLine width="40%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function MapSkeleton() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <SkeletonRect width="100%" height={400} borderRadius={0} />
      <View style={{ position: "absolute", top: 80, left: 60 }}>
        <SkeletonCircle size={24} />
      </View>
      <View style={{ position: "absolute", top: 160, right: 80 }}>
        <SkeletonCircle size={24} />
      </View>
      <View style={{ position: "absolute", top: 220, left: 120 }}>
        <SkeletonCircle size={24} />
      </View>
    </View>
  );
}
