import { View, Text, Pressable, Linking } from "react-native";
import { Play, Music2 } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";

type Props = {
  embedUrl: string;
  listenUrl: string | null;
  platform: "spotify" | "soundcloud" | "apple_music" | null;
  isActive: boolean;
  height?: number;
};

const PLATFORM_LABELS: Record<string, string> = {
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  apple_music: "Apple Music",
};

/**
 * Lightweight listen button that opens the artist's streaming page.
 * Replaces WebView embeds until the next native build includes react-native-webview.
 */
export function EmbeddedPlayer({ listenUrl, platform, isActive, height = 80 }: Props) {
  const colors = useThemeColors();

  if (!isActive || !listenUrl) {
    return (
      <View
        style={{
          height,
          borderRadius: 12,
          backgroundColor: colors.cardHover,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Music2 size={28} color={colors.textTertiary} />
      </View>
    );
  }

  const label = platform ? PLATFORM_LABELS[platform] ?? "Listen" : "Listen";

  return (
    <Pressable
      onPress={() => Linking.openURL(listenUrl)}
      style={({ pressed }) => ({
        height,
        borderRadius: 12,
        backgroundColor: pressed ? colors.cardHover : colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.pink,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
      </View>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 14,
          fontFamily: "Poppins_600SemiBold",
        }}
      >
        Listen on {label}
      </Text>
    </Pressable>
  );
}
