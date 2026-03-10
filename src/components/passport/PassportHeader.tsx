import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Settings } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  type SharedValue,
} from "react-native-reanimated";
import { Colors, useThemeColors } from "@/constants/colors";

// Deterministic gradient from name hash (same pattern as ArtistHero)
const GRADIENT_PAIRS = [
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
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length] as [
    string,
    string,
  ];
}

export const HEADER_HEIGHT = 160;

type Props = {
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;
  memberSince: string;
  stampCount?: number;
  onSettingsPress: () => void;
  scrollY?: SharedValue<number>;
};

export function PassportHeader({
  displayName,
  avatarUrl,
  city,
  memberSince,
  stampCount,
  onSettingsPress,
  scrollY,
}: Props) {
  const colors = useThemeColors();
  const name = displayName || "Fan";
  const initial = name.charAt(0).toUpperCase();
  const gradientColors = getGradientForName(name);

  const memberDate = new Date(memberSince);
  const memberLabel = memberDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const parallaxStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};

    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT * 0.4],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT * 0.6, HEADER_HEIGHT],
      [1, 0.8, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [1, 0.95],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          paddingHorizontal: 20,
          paddingTop: 60,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
        },
        scrollY ? parallaxStyle : undefined,
      ]}
    >
      {/* Avatar with stamp count badge */}
      <View style={{ position: "relative" }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            overflow: "hidden",
          }}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 80, height: 80 }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 80,
                height: 80,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  fontFamily: "Poppins_700Bold",
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                {initial}
              </Text>
            </LinearGradient>
          )}
        </View>
        {stampCount != null && stampCount > 0 && (
          <View
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              minWidth: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.pink,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 6,
              borderWidth: 2,
              borderColor: colors.bg,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: "Poppins_700Bold",
                color: "#FFFFFF",
              }}
            >
              {stampCount}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 22,
            fontFamily: "Poppins_700Bold",
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        {city && (
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Poppins_400Regular",
              color: colors.textSecondary,
              marginTop: 2,
            }}
          >
            {city}
          </Text>
        )}
        <Text
          style={{
            fontSize: 12,
            fontFamily: "Poppins_400Regular",
            color: colors.textDim,
            marginTop: 2,
          }}
        >
          Member since {memberLabel}
        </Text>
      </View>

      {/* Settings gear */}
      <Pressable onPress={onSettingsPress} hitSlop={12}>
        <Settings size={24} color={colors.gray} />
      </Pressable>
    </Animated.View>
  );
}
