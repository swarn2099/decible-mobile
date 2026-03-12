import { View, Text, Pressable, TouchableOpacity, Linking, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Star, Compass, Headphones } from "lucide-react-native";
import { Colors, useThemeColors } from "@/constants/colors";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from "react-native-reanimated";
import type { CollectionStamp } from "@/types/passport";

const AnimatedImage = Animated.createAnimatedComponent(
  require("expo-image").Image
);

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

type Props = {
  stamp: CollectionStamp;
  cardWidth: number;
  scrollY?: SharedValue<number>;
  cardOffsetY?: number;
};

export function FindCard({ stamp, cardWidth, scrollY, cardOffsetY = 0 }: Props) {
  const router = useRouter();
  const colors = useThemeColors();

  const cardHeight = cardWidth * 1.33;
  const gradientColors = getGradientForName(stamp.performer.name);

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: colors.isDark ? 0.5 : 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    android: {
      elevation: 8,
    },
  });

  const parallaxStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const translateY = interpolate(
      scrollY.value,
      [cardOffsetY - 300, cardOffsetY, cardOffsetY + 300],
      [15, 0, -15],
      Extrapolation.CLAMP
    );
    return { transform: [{ translateY }] };
  });

  const handleCardPress = () => {
    router.push(`/artist/${stamp.performer.slug}`);
  };

  const handleListenPress = () => {
    if (stamp.performer.platform_url) {
      Linking.openURL(stamp.performer.platform_url);
    }
  };

  const genres = stamp.performer.genres?.slice(0, 2) ?? [];

  return (
    <Pressable
      onPress={handleCardPress}
      style={{
        width: cardWidth,
        height: cardHeight,
        borderRadius: 16,
        overflow: "hidden",
        ...shadowStyle,
      }}
    >
      {/* Full-bleed photo with parallax or gradient fallback */}
      {stamp.performer.photo_url ? (
        <AnimatedImage
          source={{ uri: stamp.performer.photo_url }}
          style={[
            {
              width: "100%",
              height: "120%",
              position: "absolute",
              top: -10,
            },
            parallaxStyle,
          ]}
          contentFit="cover"
        />
      ) : (
        <LinearGradient
          colors={gradientColors}
          style={{ width: "100%", height: "100%", position: "absolute" }}
        />
      )}

      {/* Genre pills — top area */}
      {genres.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            right: 8,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 4,
          }}
        >
          {genres.map((genre) => (
            <View
              key={genre}
              style={{
                backgroundColor: "rgba(0,0,0,0.45)",
                borderRadius: 8,
                paddingHorizontal: 7,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: "Poppins_500Medium",
                  color: "rgba(255,255,255,0.9)",
                }}
                numberOfLines={1}
              >
                {genre}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Bottom frosted glass overlay */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.75)"]}
          style={{ height: 40 }}
        />
        <View
          style={{
            backgroundColor: "rgba(0,0,0,0.65)",
            paddingHorizontal: 10,
            paddingTop: 2,
            paddingBottom: 10,
          }}
        >
          {/* Artist name + badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
            }}
          >
            {stamp.is_founder ? (
              <Star size={12} color="#FFD700" fill="#FFD700" />
            ) : (
              <Compass size={12} color="#9B6DFF" />
            )}
            <Text
              style={{
                fontSize: 15,
                fontFamily: "Poppins_600SemiBold",
                color: "#FFFFFF",
                flex: 1,
              }}
              numberOfLines={1}
            >
              {stamp.performer.name}
            </Text>
          </View>

          {/* Fan count + Listen button row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 3,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Poppins_400Regular",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {stamp.fan_count} fan{stamp.fan_count !== 1 ? "s" : ""}
            </Text>

            {stamp.performer.platform_url ? (
              <TouchableOpacity
                onPress={handleListenPress}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                  backgroundColor: Colors.pink,
                  borderRadius: 12,
                  paddingVertical: 3,
                  paddingHorizontal: 8,
                }}
              >
                <Headphones size={10} color="#FFFFFF" />
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "Poppins_600SemiBold",
                    color: "#FFFFFF",
                  }}
                >
                  Listen
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
