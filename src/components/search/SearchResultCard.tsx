import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Users, Check } from "lucide-react-native";
import { Colors, useThemeColors } from "@/constants/colors";
import type { DecibelSearchResult } from "@/hooks/useSearch";

// Deterministic gradient from name (same pattern as ArtistHero)
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

type Props = {
  performer: DecibelSearchResult;
  onPress: () => void;
  isCollected?: boolean;
};

export function SearchResultCard({ performer, onPress, isCollected }: Props) {
  const colors = useThemeColors();
  const initial = performer.name.charAt(0).toUpperCase();
  const gradientColors = getGradientForName(performer.name);
  const genres = performer.genres?.slice(0, 2).join(", ") ?? "";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      {/* Avatar */}
      <View style={{ width: 48, height: 48 }}>
        {performer.photo_url ? (
          <Image
            source={{ uri: performer.photo_url }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontFamily: "Poppins_700Bold",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {initial}
            </Text>
          </LinearGradient>
        )}
        {isCollected && (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: colors.teal,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: colors.bg,
            }}
          >
            <Check size={9} color={colors.bg} strokeWidth={3} />
          </View>
        )}
      </View>

      {/* Name + genres */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{
            fontSize: 15,
            fontFamily: "Poppins_600SemiBold",
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {performer.name}
        </Text>
        {genres.length > 0 && (
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Poppins_400Regular",
              color: colors.gray,
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {genres}
          </Text>
        )}
      </View>

      {/* Fan count */}
      {performer.follower_count != null && performer.follower_count > 0 && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Users size={13} color={colors.gray} />
          <Text
            style={{
              fontSize: 12,
              fontFamily: "Poppins_400Regular",
              color: colors.gray,
            }}
          >
            {performer.follower_count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
