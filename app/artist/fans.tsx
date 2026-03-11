import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Crown, Share2 } from "lucide-react-native";
import { Image } from "expo-image";
import * as Sharing from "expo-sharing";
import { useThemeColors } from "@/constants/colors";
import { useArtistFans, type ArtistFan } from "@/hooks/useArtistProfile";

function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

type Section = {
  title: string;
  data: ArtistFan[];
};

function buildSections(fans: ArtistFan[]): Section[] {
  const founded = fans.filter((f) => f.type === "founded");
  const collected = fans.filter((f) => f.type === "collected");
  const discovered = fans.filter((f) => f.type === "discovered");

  const sections: Section[] = [];
  if (founded.length > 0)
    sections.push({ title: `Founder (${founded.length})`, data: founded });
  if (collected.length > 0)
    sections.push({ title: `Collected (${collected.length})`, data: collected });
  if (discovered.length > 0)
    sections.push({
      title: `Discovered (${discovered.length})`,
      data: discovered,
    });
  return sections;
}

export default function ArtistFansScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { performerId, artistName, artistSlug } = useLocalSearchParams<{
    performerId: string;
    artistName: string;
    artistSlug: string;
  }>();

  const { data: fans, isLoading } = useArtistFans(performerId);

  const sections = buildSections(fans ?? []);

  // Show founder-only CTA when only 1 fan and they're the founder
  const showFounderCTA =
    (fans?.length === 1 && fans[0].type === "founded") ?? false;

  const handleShareArtist = async () => {
    const slug = artistSlug ?? "";
    const url = `https://decible.live/artist/${slug}`;
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(url, {
        dialogTitle: `Share ${artistName ?? "this artist"}`,
      });
    }
  };

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

  const renderItem = ({ item }: { item: ArtistFan }) => {
    const typeColor = getTypeColor(item.type);
    const isFounder = item.type === "founded";
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
          // Gold left border for founder rows
          borderLeftWidth: isFounder ? 3 : 0,
          borderLeftColor: isFounder ? colors.gold : "transparent",
          backgroundColor: isFounder
            ? `rgba(255,215,0,0.04)`
            : "transparent",
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

        {/* Name + tier label */}
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

        {/* Date column */}
        {item.date ? (
          <Text
            style={{
              fontSize: 11,
              fontFamily: "Poppins_400Regular",
              color: colors.textSecondary,
            }}
          >
            {formatDate(item.date)}
          </Text>
        ) : null}

        {/* Crown for founder */}
        {isFounder && <Crown size={16} color={colors.gold} />}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.bg,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: "Poppins_600SemiBold",
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {section.title}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
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
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
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
          ListFooterComponent={
            showFounderCTA ? (
              <View
                style={{
                  marginHorizontal: 16,
                  marginTop: 24,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 20,
                  alignItems: "center",
                  gap: 12,
                  borderWidth: 1,
                  borderColor: `${colors.gold}33`,
                }}
              >
                <Crown size={28} color={colors.gold} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: "Poppins_600SemiBold",
                    color: colors.text,
                    textAlign: "center",
                  }}
                >
                  You're the first fan of this artist
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Poppins_400Regular",
                    color: colors.textSecondary,
                    textAlign: "center",
                  }}
                >
                  Share this artist to grow their fanbase
                </Text>
                <Pressable
                  onPress={handleShareArtist}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: colors.pink,
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    marginTop: 4,
                  }}
                >
                  <Share2 size={16} color="#FFFFFF" />
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: "Poppins_600SemiBold",
                      color: "#FFFFFF",
                    }}
                  >
                    Share
                  </Text>
                </Pressable>
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </SafeAreaView>
  );
}
