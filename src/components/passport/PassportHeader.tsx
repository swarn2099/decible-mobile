import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/constants/colors";

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

function StatCell({
  value,
  label,
  onPress,
  colors,
}: {
  value: string;
  label: string;
  onPress?: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      {...(onPress ? { onPress, hitSlop: 8 } : {})}
      style={{ alignItems: "center", flex: 1 }}
    >
      <Text
        style={{
          fontSize: 20,
          fontFamily: "Poppins_600SemiBold",
          color: colors.text,
          lineHeight: 26,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 12,
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
  followersCount: number;
  followingCount: number;
  findsCount: number;
  discoveriesCount: number;
  fanId: string;
  onSharePress?: () => void;
  isSharing?: boolean;
};

export function PassportHeader({
  displayName,
  avatarUrl,
  memberSince,
  followersCount,
  followingCount,
  findsCount,
  discoveriesCount,
  fanId,
  onSharePress,
  isSharing,
}: Props) {
  const router = useRouter();
  const colors = useThemeColors();
  const name = displayName || "Fan";
  const initial = name.charAt(0).toUpperCase();
  const gradientColors = getGradientForName(name);

  const memberDate = new Date(memberSince);
  const memberLabel = memberDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Press animation for Share button
  const shareScale = useSharedValue(1);
  const shareAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareScale.value }],
    flex: 1,
  }));

  // Press animation for Edit button
  const editScale = useSharedValue(1);
  const editAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: editScale.value }],
    flex: 1,
  }));

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
      {/* Row 1: Avatar (left) + Stats (right) */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        {/* Avatar — 80x80, plain circle with cardBorder ring */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.cardBorder,
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

        {/* Stats — 4 columns: Followers / Following / Finds / Founders */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "space-around",
          }}
        >
          <StatCell
            value={String(followersCount)}
            label="Followers"
            colors={colors}
            onPress={() =>
              router.push({
                pathname: "/followers" as any,
                params: { fanId },
              })
            }
          />
          <StatCell
            value={String(followingCount)}
            label="Following"
            colors={colors}
            onPress={() =>
              router.push({
                pathname: "/following" as any,
                params: { fanId },
              })
            }
          />
          <StatCell
            value={String(findsCount)}
            label="Finds"
            colors={colors}
          />
          <StatCell
            value={String(discoveriesCount)}
            label="Discoveries"
            colors={colors}
          />
        </View>
      </View>

      {/* Row 2: Username + Member since */}
      <View style={{ marginTop: 10 }}>
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Poppins_600SemiBold",
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Poppins_400Regular",
            color: colors.textSecondary,
            marginTop: 2,
          }}
        >
          Member since {memberLabel}
        </Text>
      </View>

      {/* Row 3: Side-by-side text buttons — Share Passport + Edit Profile */}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        {/* Share Passport — gradient fill */}
        <Animated.View style={shareAnimStyle}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSharePress?.();
            }}
            onPressIn={() => {
              shareScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              shareScale.value = withSpring(1.0, { damping: 15, stiffness: 300 });
            }}
            disabled={isSharing}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={["#FF4D6A", "#9B6DFF"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                height: 34,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                opacity: isSharing ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 13,
                  color: "#FFFFFF",
                }}
              >
                Share Passport
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Edit Profile — surface fill */}
        <Animated.View style={editAnimStyle}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/settings" as any);
            }}
            onPressIn={() => {
              editScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              editScale.value = withSpring(1.0, { damping: 15, stiffness: 300 });
            }}
            style={{ flex: 1 }}
          >
            <View
              style={{
                height: 34,
                borderRadius: 8,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 13,
                  color: colors.text,
                }}
              >
                Edit Profile
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
