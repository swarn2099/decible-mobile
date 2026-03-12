import { View, Text, Pressable, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Star } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useThemeColors } from "@/constants/colors";
import { Colors } from "@/constants/colors";
import type { CollectionStamp } from "@/types/passport";

const GRADIENT_PAIRS: [string, string][] = [
  [Colors.pink, Colors.purple],
  [Colors.purple, Colors.blue],
  [Colors.blue, Colors.teal],
  [Colors.teal, Colors.pink],
  [Colors.yellow, Colors.pink],
  [Colors.purple, Colors.teal],
];

function getGradientForName(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length];
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function formatListenerCount(url: string | null): string {
  // Returns a placeholder — actual listener count would come from API data
  return "";
}

function getPlatformLabel(url: string | null): { color: string; label: string } {
  if (!url) return { color: "#1DB954", label: "Spotify" };
  if (url.includes("spotify.com")) return { color: "#1DB954", label: "Spotify" };
  if (url.includes("soundcloud.com")) return { color: "#FF5500", label: "SoundCloud" };
  if (url.includes("music.apple.com")) return { color: "#FC3C44", label: "Apple Music" };
  return { color: "#9B6DFF", label: "Music" };
}

type Props = {
  item: CollectionStamp;
  onPress?: (item: CollectionStamp) => void;
  /** Skip BlurView for performance in long FlatLists (uses LinearGradient overlay instead) */
  simplified?: boolean;
};

export function FindGlassCard({ item, onPress, simplified = false }: Props) {
  const router = useRouter();
  const colors = useThemeColors();
  const { width: screenWidth } = useWindowDimensions();

  const cardWidth = (screenWidth - 48) / 2;
  const cardHeight = cardWidth * 1.4;
  const rotation = ((hashCode(item.id) % 5) - 2);

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation}deg` }, { scale: scale.value }],
  }));

  const gradientColors = getGradientForName(item.performer.name);
  const platform = getPlatformLabel(item.performer.platform_url);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1.0, { damping: 12, stiffness: 200 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress(item);
    } else {
      router.push(`/artist/${item.performer.slug}`);
    }
  };

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
  });

  return (
    <Animated.View style={[animatedStyle, shadowStyle]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={{
          width: cardWidth,
          height: cardHeight,
          borderRadius: 16,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.06)",
        }}
      >
        {/* Full-bleed artist photo or gradient fallback */}
        {item.performer.photo_url ? (
          <Image
            source={{ uri: item.performer.photo_url }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={gradientColors}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {/* Purple-tinted frosted glass strip at bottom */}
        <View style={styles.glassStrip}>
          {simplified ? (
            <LinearGradient
              colors={["transparent", "rgba(155,109,255,0.75)"]}
              style={StyleSheet.absoluteFillObject}
            />
          ) : (
            <>
              <BlurView
                intensity={40}
                tint={colors.isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Purple tint overlay */}
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: "rgba(155,109,255,0.3)" },
                ]}
              />
            </>
          )}
          {/* Content */}
          <View style={styles.stripContent}>
            {/* Artist name + gold star (always for finds) */}
            <View style={styles.nameRow}>
              <Star size={12} color="#FFD700" fill="#FFD700" />
              <Text
                style={styles.artistName}
                numberOfLines={1}
              >
                {item.performer.name}
              </Text>
            </View>
            {/* Platform + listener count row */}
            <View style={styles.platformRow}>
              <View
                style={[
                  styles.platformDot,
                  { backgroundColor: platform.color },
                ]}
              />
              <Text style={styles.platformLabel} numberOfLines={1}>
                {platform.label}
              </Text>
              {item.fan_count > 0 ? (
                <Text style={styles.listenerCount}>
                  {item.fan_count} fan{item.fan_count !== 1 ? "s" : ""}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glassStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: 64,
    overflow: "hidden",
  },
  stripContent: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  artistName: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
    flex: 1,
  },
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  platformLabel: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  listenerCount: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginLeft: "auto",
  },
});
