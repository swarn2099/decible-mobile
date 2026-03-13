import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Music2 } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { formatRelativeTime } from "@/lib/formatDate";
import { EmbeddedPlayer } from "./EmbeddedPlayer";
import type { JukeboxItem } from "@/types/jukebox";

// Platform badge colors
const PLATFORM_COLORS = {
  spotify: "#1DB954",
  soundcloud: "#FF5500",
  apple_music: "#FC3C44",
} as const;

const PLATFORM_LABELS = {
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  apple_music: "Apple Music",
} as const;

// SoundCloud embeds are taller than Spotify/Apple Music
function getPlayerHeight(platform: JukeboxItem["platform"]): number {
  return platform === "soundcloud" ? 166 : 152;
}

function AvatarCircle({
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
        backgroundColor: colors.cardHover,
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
          style={{
            color: colors.textSecondary,
            fontSize: size * 0.38,
            fontFamily: "Poppins_600SemiBold",
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

type Props = {
  item: JukeboxItem;
  isPlayerActive: boolean;
  isCollected: boolean;
  onDiscover: (performerId: string) => void;
};

export function JukeboxCard({ item, isPlayerActive, isCollected, onDiscover }: Props) {
  const colors = useThemeColors();
  const router = useRouter();

  const platformColor = item.platform ? PLATFORM_COLORS[item.platform] : colors.textTertiary;
  const platformLabel = item.platform ? PLATFORM_LABELS[item.platform] : null;
  const playerHeight = getPlayerHeight(item.platform);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        // Soft shadow for light mode
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: colors.isDark ? 0 : 0.06,
        shadowRadius: 6,
        elevation: colors.isDark ? 0 : 2,
      }}
    >
      {/* Top row: finder avatar + name + time ago */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <AvatarCircle uri={item.fan_avatar} name={item.fan_name} size={24} />
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 13,
            fontFamily: "Poppins_500Medium",
            marginLeft: 8,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {item.fan_name}
        </Text>
        <Text
          style={{
            color: colors.textTertiary,
            fontSize: 11,
            fontFamily: "Poppins_400Regular",
          }}
        >
          {formatRelativeTime(item.created_at)}
        </Text>
      </View>

      {/* Artist row: photo + name + platform badge */}
      <Pressable
        onPress={() => router.push(`/artist/${item.performer_slug}` as any)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: colors.cardHover,
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {item.performer_photo ? (
            <Image
              source={{ uri: item.performer_photo }}
              style={{ width: 48, height: 48 }}
              contentFit="cover"
            />
          ) : (
            <Music2 size={20} color={colors.textTertiary} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 15,
              fontFamily: "Poppins_600SemiBold",
            }}
            numberOfLines={1}
          >
            {item.performer_name}
          </Text>
          {platformLabel && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 2,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: platformColor,
                  marginRight: 5,
                }}
              />
              <Text
                style={{
                  color: platformColor,
                  fontSize: 11,
                  fontFamily: "Poppins_500Medium",
                }}
              >
                {platformLabel}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Embedded player */}
      {item.embed_url ? (
        <View style={{ marginBottom: 12 }}>
          <EmbeddedPlayer
            embedUrl={item.embed_url}
            isActive={isPlayerActive}
            height={playerHeight}
          />
        </View>
      ) : (
        <View
          style={{
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: 13,
              fontFamily: "Poppins_400Regular",
            }}
          >
            No preview available
          </Text>
        </View>
      )}

      {/* Discover / In Passport button */}
      {isCollected ? (
        <Text
          style={{
            color: colors.textTertiary,
            fontSize: 13,
            fontFamily: "Poppins_500Medium",
            textAlign: "center",
          }}
        >
          In Passport
        </Text>
      ) : (
        <Pressable
          onPress={() => onDiscover(item.performer_id)}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#e63d5a" : colors.pink,
            borderRadius: 8,
            paddingVertical: 10,
            alignItems: "center",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontFamily: "Poppins_600SemiBold",
            }}
          >
            Discover
          </Text>
        </Pressable>
      )}
    </View>
  );
}
