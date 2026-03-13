import { View, Text, Pressable, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Settings, Share2, UserPen } from "lucide-react-native";
import { useRouter } from "expo-router";

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
}: {
  value: string;
  label: string;
  onPress?: () => void;
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
          fontFamily: "Poppins_700Bold",
          color: "#FFFFFF",
          lineHeight: 22,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontFamily: "Poppins_400Regular",
          color: "#8E8E93",
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
  findsCount: number;
  stampsCount: number;
  fanId: string;
  onSettingsPress: () => void;
  onSharePress?: () => void;
  isSharing?: boolean;
};

export function PassportHeader({
  displayName,
  avatarUrl,
  memberSince,
  followersCount,
  findsCount,
  stampsCount,
  fanId,
  onSettingsPress,
  onSharePress,
  isSharing,
}: Props) {
  const router = useRouter();
  const name = displayName || "Fan";
  const initial = name.charAt(0).toUpperCase();
  const gradientColors = getGradientForName(name);

  const memberDate = new Date(memberSince);
  const memberLabel = memberDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>
      {/* Row 1: Avatar (left) + Stats (right) */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
        {/* Avatar — 60x60, no colored ring */}
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
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

        {/* Stats — 3 columns: Finds, Stamps, Followers */}
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
          <StatCell value={String(findsCount)} label="Finds" />
          <StatCell value={String(stampsCount)} label="Stamps" />
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
        </View>
      </View>

      {/* Row 2: Username + Settings gear */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Poppins_600SemiBold",
            color: "#FFFFFF",
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Pressable onPress={onSettingsPress} hitSlop={12}>
          <Settings size={20} color="#8E8E93" />
        </Pressable>
      </View>

      {/* Row 3: Member since */}
      <Text
        style={{
          fontSize: 13,
          fontFamily: "Poppins_400Regular",
          color: "#8E8E93",
          marginTop: 2,
        }}
      >
        Member since {memberLabel}
      </Text>

      {/* Row 4: Action buttons — Share Passport + Edit Profile */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        {/* Share Passport — gradient */}
        {onSharePress && (
          <TouchableOpacity
            onPress={onSharePress}
            disabled={isSharing}
            activeOpacity={0.85}
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={["#FF4D6A", "#9B6DFF"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                borderRadius: 8,
                height: 36,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Share2 size={14} color="#FFFFFF" />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: "Poppins_600SemiBold",
                  color: "#FFFFFF",
                }}
              >
                {isSharing ? "Generating..." : "Share Passport"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Edit Profile — dark fill */}
        <TouchableOpacity
          onPress={() => router.push("/settings" as any)}
          activeOpacity={0.85}
          style={{ flex: 1 }}
        >
          <View
            style={{
              borderRadius: 8,
              height: 36,
              backgroundColor: "#1A1A1F",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <UserPen size={14} color="#FFFFFF" />
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Poppins_600SemiBold",
                color: "#FFFFFF",
              }}
            >
              Edit Profile
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
