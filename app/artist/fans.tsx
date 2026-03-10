import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Crown } from "lucide-react-native";
import { Image } from "expo-image";
import { useThemeColors } from "@/constants/colors";
import { useArtistFans, type ArtistFan } from "@/hooks/useArtistProfile";

export default function ArtistFansScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { performerId, artistName } = useLocalSearchParams<{
    performerId: string;
    artistName: string;
  }>();

  const { data: fans, isLoading } = useArtistFans(performerId);

  const getTypeColor = (type: ArtistFan["type"]) => {
    if (type === "founded") return colors.gold;
    if (type === "collected") return colors.pink;
    return colors.purple;
  };

  const getTypeLabel = (type: ArtistFan["type"]) => {
    if (type === "founded") return "\u2605 Founder";
    if (type === "collected") return "Collected";
    return "Discovered";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 16,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontFamily: "Poppins_700Bold",
            color: colors.text,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {artistName ?? "Artist"} Fans
        </Text>
      </View>

      {isLoading ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator color={colors.pink} />
        </View>
      ) : (
        <FlatList
          data={fans ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const typeColor = getTypeColor(item.type);
            return (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/profile/[id]",
                    params: { id: item.id },
                  })
                }
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.card,
                    overflow: "hidden",
                  }}
                >
                  {item.avatar_url ? (
                    <Image
                      source={{ uri: item.avatar_url }}
                      style={{ width: 44, height: 44 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontFamily: "Poppins_700Bold",
                          color: colors.textSecondary,
                        }}
                      >
                        {(item.name ?? "?").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: "Poppins_600SemiBold",
                      color: colors.text,
                    }}
                    numberOfLines={1}
                  >
                    {item.name ?? "Unknown"}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Poppins_500Medium",
                      color: typeColor,
                    }}
                  >
                    {getTypeLabel(item.type)}
                  </Text>
                </View>
                {item.type === "founded" && (
                  <Crown size={16} color={colors.gold} />
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                paddingTop: 40,
                fontSize: 14,
                fontFamily: "Poppins_400Regular",
              }}
            >
              No fans yet
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}
