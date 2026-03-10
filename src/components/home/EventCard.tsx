import { View, Text, Pressable, Linking } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MapPin, ExternalLink } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import type { HomeFeedEvent } from "@/types";

function ArtistInitial({ name }: { name: string }) {
  const colors = useThemeColors();
  return (
    <LinearGradient
      colors={[colors.pink, colors.purple]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#FFFFFF", fontSize: 18, fontFamily: "Poppins_700Bold" }}>
        {name.charAt(0).toUpperCase()}
      </Text>
    </LinearGradient>
  );
}

export function EventCard({ event }: { event: HomeFeedEvent }) {
  const router = useRouter();
  const colors = useThemeColors();
  const { performer, venue, external_url } = event;

  const handlePress = () => {
    if (performer?.slug) {
      router.push(`/artist/${performer.slug}` as never);
    } else if (external_url) {
      Linking.openURL(external_url);
    }
  };

  const handleExternalPress = () => {
    if (external_url) Linking.openURL(external_url);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="rounded-xl border px-5 py-4 flex-row items-center"
    >
      {/* Artist Photo */}
      <View className="mr-4">
        {performer?.photo_url ? (
          <Image
            source={{ uri: performer.photo_url }}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <ArtistInitial name={performer?.name || "?"} />
        )}
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text
          className="font-poppins-semibold text-base"
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {performer?.name || "TBA"}
        </Text>
        {venue && (
          <View className="flex-row items-center mt-1">
            <MapPin size={12} color={colors.textSecondary} />
            <Text
              className="font-poppins text-xs ml-1"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {venue.name}
            </Text>
          </View>
        )}
      </View>

      {/* External URL indicator */}
      {external_url && (
        <Pressable onPress={handleExternalPress} hitSlop={8}>
          <ExternalLink size={16} color={colors.textDim} />
        </Pressable>
      )}
    </Pressable>
  );
}
