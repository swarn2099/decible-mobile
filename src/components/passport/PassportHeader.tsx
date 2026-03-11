import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Settings } from "lucide-react-native";
import { useRouter } from "expo-router";
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

export const HEADER_HEIGHT = 200;

function StatCell({
  value,
  label,
  onPress,
}: {
  value: string;
  label: string;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      {...(onPress ? { onPress, hitSlop: 8 } : {})}
      style={{ alignItems: "center", flex: 1 }}
    >
      <Text
        style={{
          fontSize: 18,
          fontFamily: "Poppins_700Bold",
          color: colors.text,
          lineHeight: 24,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          marginTop: 1,
        }}
      >
        {label}
      </Text>
    </Wrapper>
  );
}

type Props = {
  displayName: string | null;
  avatarUrl: string | null;
  memberSince: string;
  followingCount: number;
  followersCount: number;
  findsCount: number;
  stampsCount: number;
  fanId: string;
  onSettingsPress: () => void;
  scrollY?: SharedValue<number>;
};

export function PassportHeader({
  displayName,
  avatarUrl,
  memberSince,
  followingCount,
  followersCount,
  findsCount,
  stampsCount,
  fanId,
  onSettingsPress,
  scrollY,
}: Props) {
  const colors = useThemeColors();
  const router = useRouter();
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
          paddingBottom: 12,
        },
        scrollY ? parallaxStyle : undefined,
      ]}
    >
      {/* Settings gear — top right */}
      <View style={{ position: "absolute", top: 16, right: 16, zIndex: 1 }}>
        <Pressable onPress={onSettingsPress} hitSlop={12}>
          <Settings size={24} color={colors.gray} />
        </Pressable>
      </View>

      {/* Row 1: Avatar (left) | Stats (right) */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Avatar */}
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

        {/* Stats columns */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "space-around",
          }}
        >
          <StatCell
            value={String(followingCount)}
            label="Following"
            onPress={() =>
              router.push({
                pathname: "/following" as any,
                params: { fanId },
              })
            }
          />
          <StatCell
            value={String(followersCount)}
            label="Followers"
            onPress={() =>
              router.push({
                pathname: "/followers" as any,
                params: { fanId },
              })
            }
          />
          <StatCell value={String(findsCount)} label="Finds" />
          <StatCell value={String(stampsCount)} label="Stamps" />
        </View>
      </View>

      {/* Row 2: Username */}
      <Text
        style={{
          fontSize: 18,
          fontFamily: "Poppins_700Bold",
          color: colors.text,
          marginTop: 14,
        }}
        numberOfLines={1}
      >
        {name}
      </Text>

      {/* Row 3: Member since */}
      <Text
        style={{
          fontSize: 12,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          marginTop: 2,
        }}
      >
        Member since {memberLabel}
      </Text>
    </Animated.View>
  );
}
