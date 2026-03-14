import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Star, Ticket, Music, Compass } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useThemeColors } from "@/constants/colors";
import type { CollectionStamp } from "@/types/passport";

const CELL_GAP = 4;
const COLUMNS = 3;

// ─── Gradient fallback colors ────────────────────────────────────────
const GRADIENT_PAIRS: [string, string][] = [
  ["#FF4D6A", "#9B6DFF"],
  ["#9B6DFF", "#4D9AFF"],
  ["#4D9AFF", "#00D4AA"],
  ["#00D4AA", "#FF4D6A"],
  ["#FFD700", "#FF4D6A"],
  ["#9B6DFF", "#00D4AA"],
];

function getGradientForName(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPlatformInfo(url: string | null): { color: string; name: string } {
  if (!url) return { color: "#1DB954", name: "Music" };
  if (url.includes("spotify.com")) return { color: "#1DB954", name: "Spotify" };
  if (url.includes("soundcloud.com")) return { color: "#FF5500", name: "SoundCloud" };
  if (url.includes("music.apple.com")) return { color: "#FC3C44", name: "Apple Music" };
  return { color: "#9B6DFF", name: "Music" };
}

// ─── Grid Cell ───────────────────────────────────────────────────────
function GridCell({
  item,
  type,
  cellSize,
}: {
  item: CollectionStamp;
  type: "stamp" | "find" | "discovery";
  cellSize: number;
}) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const gradientColors = getGradientForName(item.performer.name);
  const platformInfo = getPlatformInfo(item.performer.platform_url);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1.0, { damping: 12, stiffness: 200 });
  };
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/artist/${item.performer.slug}`);
  };

  // Line 2: context varies by type
  const renderContextLine = () => {
    if (type === "stamp") {
      return (
        <Text style={styles.cellSecondary} numberOfLines={1}>
          {item.venue?.name ?? "Live Show"}
        </Text>
      );
    }
    if (type === "find") {
      return (
        <View style={styles.platformRow}>
          <View
            style={[styles.platformDot, { backgroundColor: platformInfo.color }]}
          />
          <Text style={styles.cellSecondary} numberOfLines={1}>
            {platformInfo.name}
          </Text>
        </View>
      );
    }
    // discovery
    return (
      <Text style={styles.cellSecondary} numberOfLines={1}>
        {item.finder_username ? `via @${item.finder_username}` : "Discovered"}
      </Text>
    );
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={{
          width: cellSize,
          height: cellSize * 1.25,
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        {/* Full-bleed artist image */}
        {item.performer.photo_url ? (
          <Image
            source={{ uri: item.performer.photo_url }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            recyclingKey={item.performer.slug}
          />
        ) : (
          <LinearGradient
            colors={gradientColors}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {/* Founder badge — top right with shadow */}
        {item.is_founder && (
          <View style={styles.founderBadge}>
            <Star size={16} color="#FFD700" fill="#FFD700" />
          </View>
        )}

        {/* Frosted glass bottom section (~35%) */}
        <View style={styles.frostWrapper}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
          {/* Android fallback overlay */}
          <View style={styles.frostOverlay} />
          <View style={styles.frostContent}>
            {/* Line 1: Artist name */}
            <Text style={styles.cellName} numberOfLines={1}>
              {item.performer.name}
            </Text>
            {/* Line 2: Context */}
            {renderContextLine()}
            {/* Line 3: Date */}
            <Text style={styles.cellDate} numberOfLines={1}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────
function EmptyState({ type }: { type: "stamp" | "find" | "discovery" }) {
  const router = useRouter();
  const colors = useThemeColors();

  const config = {
    stamp: {
      icon: <Ticket size={48} color={colors.textTertiary} />,
      message: "No shows yet",
      cta: "Check in at a show",
      onPress: () => router.push("/(tabs)/add"),
    },
    find: {
      icon: <Music size={48} color={colors.textTertiary} />,
      message: "No finds yet",
      cta: "Add an artist",
      onPress: () => router.push("/(tabs)/add"),
    },
    discovery: {
      icon: <Compass size={48} color={colors.textTertiary} />,
      message: "No discoveries yet",
      cta: "Discover artists",
      onPress: () => router.push("/(tabs)/index" as any),
    },
  }[type];

  return (
    <View style={styles.emptyState}>
      {config.icon}
      <Text
        style={[styles.emptyMessage, { color: colors.textSecondary }]}
      >
        {config.message}
      </Text>
      <Pressable onPress={config.onPress} style={styles.ctaButton}>
        <Text style={styles.ctaText}>{config.cta}</Text>
      </Pressable>
    </View>
  );
}

// ─── CollectionGrid (new primary export) ─────────────────────────────
interface CollectionGridProps {
  items: CollectionStamp[];
  type: "stamp" | "find" | "discovery";
  onEndReached?: () => void;
  isLoadingMore?: boolean;
}

export function CollectionGrid({
  items,
  type,
  onEndReached,
  isLoadingMore,
}: CollectionGridProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cellSize = (screenWidth - CELL_GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={COLUMNS}
      columnWrapperStyle={{ gap: CELL_GAP }}
      contentContainerStyle={{ gap: CELL_GAP, paddingTop: 8, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => (
        <GridCell item={item} type={type} cellSize={cellSize} />
      )}
      ListEmptyComponent={<EmptyState type={type} />}
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator color="#8E8E93" />
          </View>
        ) : null
      }
    />
  );
}

// Backward compatibility alias
export { CollectionGrid as GlassGrid };

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  frostWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "35%",
    overflow: "hidden",
  },
  frostOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  frostContent: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: "center",
    gap: 1,
  },
  cellName: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
  cellSecondary: {
    fontSize: 9,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  cellDate: {
    fontSize: 9,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  platformDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  founderBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 12,
  },
  emptyMessage: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
  },
  ctaButton: {
    backgroundColor: "#FF4D6A",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 8,
  },
  ctaText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#FFFFFF",
  },
  loadingMore: {
    padding: 16,
    alignItems: "center",
  },
});
