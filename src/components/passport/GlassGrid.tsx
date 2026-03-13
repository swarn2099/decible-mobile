import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Star, Stamp, Compass, Music } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import type { CollectionStamp } from "@/types/passport";

const CELL_GAP = 2;
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
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function getPlatformDot(url: string | null): { color: string } {
  if (!url) return { color: "#1DB954" };
  if (url.includes("spotify.com")) return { color: "#1DB954" };
  if (url.includes("soundcloud.com")) return { color: "#FF5500" };
  if (url.includes("music.apple.com")) return { color: "#FC3C44" };
  return { color: "#9B6DFF" };
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

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={{
          width: cellSize,
          height: cellSize,
          overflow: "hidden",
          opacity: type === "discovery" ? 0.85 : 1,
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

        {/* Founder badge — top right */}
        {item.is_founder && (
          <View style={styles.founderBadge}>
            <Star size={12} color="#FFD700" fill="#FFD700" />
          </View>
        )}

        {/* Bottom gradient overlay with metadata */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.overlay}
        >
          <Text style={styles.cellName} numberOfLines={1}>
            {item.performer.name}
          </Text>

          {/* Type-specific secondary info */}
          {type === "stamp" && (
            <Text style={styles.cellSecondary} numberOfLines={1}>
              {item.venue?.name
                ? `${item.venue.name} · ${formatDate(item.event_date)}`
                : formatDate(item.event_date)}
            </Text>
          )}
          {type === "find" && (
            <View style={styles.platformRow}>
              <View
                style={[
                  styles.platformDot,
                  { backgroundColor: getPlatformDot(item.performer.platform_url).color },
                ]}
              />
              <Text style={styles.cellSecondary} numberOfLines={1}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          )}
          {type === "discovery" && (
            <Text style={styles.cellSecondary} numberOfLines={1}>
              {item.finder_username
                ? `via @${item.finder_username}`
                : formatDate(item.created_at)}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────
function EmptyState({ type }: { type: "stamp" | "find" | "discovery" }) {
  const router = useRouter();

  const config = {
    stamp: {
      icon: <Stamp size={48} color="#8E8E93" />,
      message: "No stamps yet",
      cta: "Go to a show to earn stamps",
      color: "#FF4D6A",
      onPress: () => router.push("/(tabs)/add"),
    },
    find: {
      icon: <Music size={48} color="#8E8E93" />,
      message: "No finds yet",
      cta: "Add an artist to start finding",
      color: "#9B6DFF",
      onPress: () => router.push("/(tabs)/add"),
    },
    discovery: {
      icon: <Compass size={48} color="#8E8E93" />,
      message: "No discoveries yet",
      cta: "Follow people to discover artists",
      color: "#4D9AFF",
      onPress: () => router.push("/(tabs)/index" as any),
    },
  }[type];

  return (
    <View style={styles.emptyState}>
      {config.icon}
      <Text style={styles.emptyMessage}>{config.message}</Text>
      <Text style={styles.emptyCta}>{config.cta}</Text>
    </View>
  );
}

// ─── GlassGrid (3-column Instagram grid) ─────────────────────────────
interface GlassGridProps {
  items: CollectionStamp[];
  type: "stamp" | "find" | "discovery";
  onViewMore: () => void;
}

export function GlassGrid({ items, type }: GlassGridProps) {
  const { width: screenWidth } = useWindowDimensions();
  // Grid takes full width with minimal gap
  const cellSize = (screenWidth - CELL_GAP * (COLUMNS - 1)) / COLUMNS;

  if (items.length === 0) {
    return <EmptyState type={type} />;
  }

  // Build rows of 3
  const rows: CollectionStamp[][] = [];
  for (let i = 0; i < items.length; i += COLUMNS) {
    rows.push(items.slice(i, i + COLUMNS));
  }

  return (
    <View>
      {rows.map((row, rowIdx) => (
        <View
          key={rowIdx}
          style={{
            flexDirection: "row",
            gap: CELL_GAP,
            marginBottom: CELL_GAP,
          }}
        >
          {row.map((item) => (
            <GridCell
              key={item.id}
              item={item}
              type={type}
              cellSize={cellSize}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingBottom: 6,
    paddingTop: 24,
    justifyContent: "flex-end",
  },
  cellName: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },
  cellSecondary: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: 1,
  },
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  platformDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  founderBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 12,
  },
  emptyMessage: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: "#8E8E93",
  },
  emptyCta: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.4)",
  },
});
