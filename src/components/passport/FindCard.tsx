import { View, Text, Pressable, TouchableOpacity, Linking, Platform } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Star, Compass, Headphones } from "lucide-react-native";
import { useThemeColors, Colors } from "@/constants/colors";
import type { CollectionStamp } from "@/types/passport";

// Deterministic gradient from name
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
};

export function FindCard({ stamp, cardWidth }: Props) {
  const router = useRouter();
  const colors = useThemeColors();

  // 3:4 aspect ratio
  const cardHeight = cardWidth * 1.33;
  const gradientColors = getGradientForName(stamp.performer.name);

  const isFounder = stamp.is_founder === true;
  const borderColor = isFounder ? colors.gold : colors.purple;

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: borderColor,
      shadowOpacity: colors.isDark ? (isFounder ? 0.5 : 0.4) : 0.25,
      shadowRadius: colors.isDark ? 8 : 6,
      shadowOffset: { width: 0, height: colors.isDark ? 0 : 3 },
    },
    android: {
      elevation: 6,
    },
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
        borderColor: borderColor,
        borderWidth: 2,
        overflow: "hidden",
        ...shadowStyle,
      }}
    >
      {/* Full-bleed photo or gradient fallback */}
      {stamp.performer.photo_url ? (
        <Image
          source={{ uri: stamp.performer.photo_url }}
          style={{ width: "100%", height: "100%", position: "absolute" }}
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
        {/* Dark gradient fade into blur */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          style={{ height: 24 }}
        />
        <View
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
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
            {isFounder ? (
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
