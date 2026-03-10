import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/constants/colors";

type Props = {
  followingCount: number;
  followersCount: number;
  stampCount: number;
  badgeCount: number;
  totalBadges: number;
  fanId: string;
};

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
          fontSize: 20,
          fontFamily: "Poppins_700Bold",
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
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </Wrapper>
  );
}

export function StatsBar({
  followingCount,
  followersCount,
  stampCount,
  badgeCount,
  totalBadges,
  fanId,
}: Props) {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 16,
        paddingHorizontal: 20,
        marginHorizontal: 16,
        backgroundColor: colors.card,
        borderRadius: 16,
      }}
    >
      <StatCell
        value={String(followingCount)}
        label="Following"
        onPress={() => router.push({ pathname: "/following" as any, params: { fanId } })}
      />
      <StatCell
        value={String(followersCount)}
        label="Followers"
        onPress={() => router.push({ pathname: "/followers" as any, params: { fanId } })}
      />
      <StatCell value={String(stampCount)} label="Stamps" />
      <StatCell value={`${badgeCount}/${totalBadges}`} label="Badges" />
    </View>
  );
}
