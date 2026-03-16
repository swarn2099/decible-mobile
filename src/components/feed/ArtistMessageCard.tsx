import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Megaphone } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { formatRelativeTime } from "@/lib/formatDate";

type ArtistMessageCardProps = {
  artistName: string;
  artistPhoto: string | null;
  artistSlug: string;
  message: string;
  createdAt: string;
};

function ArtistAvatar({
  uri,
  name,
  size,
}: {
  uri: string | null;
  name: string;
  size: number;
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
        borderWidth: 2,
        borderColor: colors.pink,
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

export function ArtistMessageCard({
  artistName,
  artistPhoto,
  artistSlug,
  message,
  createdAt,
}: ArtistMessageCardProps) {
  const colors = useThemeColors();
  const router = useRouter();

  const handlePress = () => {
    router.push(`/artist/${artistSlug}`);
  };

  return (
    <Pressable onPress={handlePress}>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 14,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
          borderLeftWidth: 4,
          borderLeftColor: colors.pink,
        }}
      >
        {/* Artist avatar */}
        <ArtistAvatar uri={artistPhoto} name={artistName} size={40} />

        {/* Content */}
        <View style={{ flex: 1, gap: 4 }}>
          {/* Artist name + icon */}
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Text
              style={{ color: colors.textPrimary }}
              className="font-poppins-semibold text-sm"
            >
              {artistName}
            </Text>
            <Megaphone size={13} color={colors.pink} />
          </View>

          {/* Message text */}
          <Text
            style={{ color: colors.textSecondary }}
            className="font-poppins text-sm"
            numberOfLines={3}
          >
            {message}
          </Text>

          {/* Timestamp */}
          <Text
            style={{ color: colors.textTertiary }}
            className="font-poppins text-xs"
          >
            {formatRelativeTime(createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
