import { View, Text, Pressable, TouchableOpacity, Linking, Platform } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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

  const cardHeight = cardWidth * 1.4;
  const photoHeight = cardHeight * 0.6;
  const gradientColors = getGradientForName(stamp.performer.name);

  const isFounder = stamp.is_founder === true;
  const glowColor = isFounder ? colors.gold : colors.purple;

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: glowColor,
      shadowOpacity: isFounder ? 0.6 : 0.5,
      shadowRadius: isFounder ? 8 : 6,
      shadowOffset: { width: 0, height: 0 },
    },
    android: {
      elevation: 4,
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

  return (
    <Pressable
      onPress={handleCardPress}
      style={{
        width: cardWidth,
        height: cardHeight,
        borderRadius: 12,
        backgroundColor: colors.card,
        borderColor: glowColor,
        borderWidth: 1.5,
        overflow: "hidden",
        ...shadowStyle,
      }}
    >
      {/* Hero photo */}
      <View style={{ height: photoHeight, overflow: "hidden" }}>
        {stamp.performer.photo_url ? (
          <Image
            source={{ uri: stamp.performer.photo_url }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={gradientColors}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </View>

      {/* Info section */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: 8,
          paddingTop: 6,
          paddingBottom: 8,
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Poppins_600SemiBold",
              color: colors.text,
              lineHeight: 18,
            }}
            numberOfLines={1}
          >
            {stamp.performer.name}
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Poppins_400Regular",
              color: colors.textSecondary,
              lineHeight: 16,
            }}
          >
            {stamp.fan_count} fan{stamp.fan_count !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Listen button */}
        {stamp.performer.platform_url ? (
          <TouchableOpacity
            onPress={handleListenPress}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.pink,
              borderRadius: 20,
              paddingVertical: 4,
              paddingHorizontal: 10,
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: "Poppins_600SemiBold",
                color: "#FFFFFF",
              }}
            >
              Listen
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Pressable>
  );
}
