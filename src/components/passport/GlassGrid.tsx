import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { StampGlassCard } from "./GlassCard/StampGlassCard";
import { FindGlassCard } from "./GlassCard/FindGlassCard";
import { DiscoveryGlassCard } from "./GlassCard/DiscoveryGlassCard";
import type { CollectionStamp } from "@/types/passport";

interface GlassGridProps {
  items: CollectionStamp[];
  type: "stamp" | "find" | "discovery";
  onViewMore: () => void;
}

export function GlassGrid({ items, type, onViewMore }: GlassGridProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const visibleItems = items.slice(0, 8);

  const accentColor =
    type === "stamp"
      ? colors.pink
      : type === "find"
      ? colors.purple
      : colors.blue;

  if (items.length === 0) {
    return <EmptyState type={type} colors={colors} router={router} />;
  }

  return (
    <View>
      {/* 2-column grid — no empty placeholders */}
      <View style={styles.grid}>
        {visibleItems.map((item) => {
          if (type === "stamp") {
            return <StampGlassCard key={item.id} item={item} />;
          } else if (type === "find") {
            return <FindGlassCard key={item.id} item={item} />;
          } else {
            return <DiscoveryGlassCard key={item.id} item={item} />;
          }
        })}
      </View>

      {/* View More button */}
      {items.length > 0 && (
        <Pressable
          onPress={onViewMore}
          style={({ pressed }) => [
            styles.viewMoreButton,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text
            style={[styles.viewMoreText, { color: accentColor }]}
          >
            View More
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function EmptyState({
  type,
  colors,
  router,
}: {
  type: "stamp" | "find" | "discovery";
  colors: ReturnType<typeof useThemeColors>;
  router: ReturnType<typeof useRouter>;
}) {
  const config = {
    stamp: {
      message: "Check in at a live show to start collecting stamps",
      cta: "Check In",
      onPress: () => router.push("/(tabs)/add"),
      color: colors.pink,
    },
    find: {
      message: "Be the first to find an underground artist",
      cta: "Add an Artist",
      onPress: () => router.push("/(tabs)/add"),
      color: colors.purple,
    },
    discovery: {
      message: "Discover artists on Decibel",
      cta: "Explore",
      onPress: () => router.push("/(tabs)/index"),
      color: colors.blue,
    },
  }[type];

  return (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        {config.message}
      </Text>
      <Pressable
        onPress={config.onPress}
        style={({ pressed }) => [
          styles.emptyButton,
          { backgroundColor: config.color, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Text style={styles.emptyButtonText}>{config.cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingHorizontal: 16,
  },
  viewMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 4,
  },
  viewMoreText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 16,
  },
  emptyMessage: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyButton: {
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
});
