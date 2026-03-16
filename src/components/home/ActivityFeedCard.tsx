import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Star, CheckCircle, Compass } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { formatRelativeTime } from "@/lib/formatDate";
import type { ActivityFeedItem, ActivityFeedAction } from "@/types";

const ACTION_CONFIG: Record<
  ActivityFeedAction,
  { verb: string; verbPast: string; colorKey: "gold" | "pink" | "purple"; Icon: typeof Star }
> = {
  founded: { verb: "founded", verbPast: "founded", colorKey: "gold", Icon: Star },
  collected: { verb: "collected", verbPast: "collected", colorKey: "pink", Icon: CheckCircle },
  discovered: { verb: "discovered", verbPast: "discovered", colorKey: "purple", Icon: Compass },
};

function AvatarCircle({
  uri,
  name,
  size,
  borderColor,
}: {
  uri: string | null;
  name: string;
  size: number;
  borderColor?: string;
}) {
  const colors = useThemeColors();
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.card,
        borderWidth: borderColor ? 2 : 0,
        borderColor: borderColor || "transparent",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          contentFit="cover"
        />
      ) : (
        <Text
          style={{ color: colors.textSecondary, fontSize: size * 0.35 }}
          className="font-poppins-semibold"
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

type ActivityFeedCardProps = {
  item: ActivityFeedItem;
  onCollect?: (performerId: string) => void;
  isCollected?: boolean;
};

export function ActivityFeedCard({ item, onCollect, isCollected = false }: ActivityFeedCardProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const config = ACTION_CONFIG[item.action];
  const actionColor = colors[config.colorKey];

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Fan avatar — taps to fan profile */}
      <Pressable onPress={() => router.push(`/passport?fan_id=${item.fan_id}`)}>
        <AvatarCircle uri={item.fan_avatar} name={item.fan_name} size={32} />
      </Pressable>

      {/* Content */}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: colors.textPrimary }} className="font-poppins text-sm" numberOfLines={2}>
          <Text
            className="font-poppins-semibold"
            onPress={() => router.push(`/passport?fan_id=${item.fan_id}`)}
          >
            {item.fan_name}
          </Text>
          {" "}
          <Text style={{ color: actionColor }} className="font-poppins-semibold">
            {config.verbPast}
          </Text>
          {" "}
          <Text className="font-poppins-semibold">{item.performer_name}</Text>
          {item.action === "collected" && item.venue_name && (
            <Text style={{ color: colors.textSecondary }}> at {item.venue_name}</Text>
          )}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Text
            style={{ color: colors.textTertiary }}
            className="font-poppins text-xs"
          >
            {formatRelativeTime(item.timestamp)}
          </Text>
          {item.performer_genres && item.performer_genres.length > 0 &&
            item.performer_genres.slice(0, 2).map((genre) => (
              <View
                key={genre}
                style={{
                  backgroundColor: colors.isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.04)",
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: colors.isDark
                      ? "rgba(255,255,255,0.4)"
                      : "rgba(0,0,0,0.35)",
                  }}
                  className="font-poppins"
                >
                  {genre}
                </Text>
              </View>
            ))}
        </View>
      </View>

      {/* Right side: artist thumbnail + collect button */}
      <View style={{ alignItems: "center", gap: 6 }}>
        {/* Artist thumbnail — taps to artist profile */}
        <Pressable onPress={() => router.push(`/artist/${item.performer_slug}`)}>
          <AvatarCircle
            uri={item.performer_image}
            name={item.performer_name}
            size={40}
            borderColor={actionColor}
          />
        </Pressable>

        {/* Collect / In Passport button */}
        {onCollect && (
          isCollected ? (
            <Text
              style={{
                color: colors.textTertiary,
                fontSize: 11,
                fontFamily: "Poppins_500Medium",
              }}
            >
              In Passport
            </Text>
          ) : (
            <Pressable
              onPress={() => onCollect(item.performer_id)}
              style={{
                backgroundColor: colors.pink,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontFamily: "Poppins_600SemiBold",
                }}
              >
                Collect
              </Text>
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}

export function ActivityFeedEmpty() {
  const colors = useThemeColors();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        gap: 8,
      }}
    >
      <Compass size={32} color={colors.purple} />
      <Text
        style={{ color: colors.textPrimary }}
        className="font-poppins-semibold text-sm"
      >
        No discoveries yet
      </Text>
      <Text
        style={{ color: colors.textSecondary, textAlign: "center" }}
        className="font-poppins text-xs"
      >
        Be the first to find someone new! Head to Search to discover artists.
      </Text>
    </View>
  );
}
