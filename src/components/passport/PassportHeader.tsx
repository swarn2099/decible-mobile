import { useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Share2, UserPen } from "lucide-react-native";
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
          fontSize: 17,
          fontFamily: "Poppins_600SemiBold",
          color: colors.text,
          lineHeight: 22,
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
  followersCount: number;
  followingCount: number;
  findsCount: number;
  stampsCount: number;
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
  stampsCount,
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
  }));

  // Press animation for Edit button
  const editScale = useSharedValue(1);
  const editAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: editScale.value }],
  }));

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>
      {/* Row 1: Avatar (left) + Stats (right) */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        {/* Avatar — 60x60, plain circle */}
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 60, height: 60 }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 60,
                height: 60,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: "Poppins_700Bold",
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                {initial}
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* Stats — 4 columns: Followers / Following / Stamps / Finds */}
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
            value={String(stampsCount)}
            label="Stamps"
            colors={colors}
          />
          <StatCell
            value={String(findsCount)}
            label="Finds"
            colors={colors}
          />
        </View>
      </View>

      {/* Row 2: Username + Member since (left) + icon buttons (right) */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Poppins_600SemiBold",
              color: colors.text,
            }}
            numberOfLines={1}
          >
            {name}
          </Text>
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
        </View>

        {/* Icon buttons */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {/* Share — gradient circle */}
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
            >
              <LinearGradient
                colors={["#FF4D6A", "#9B6DFF"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Share2 size={14} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Edit — surface circle */}
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
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserPen size={14} color={colors.text} />
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
