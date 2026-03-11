import { View, Text, FlatList, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { usePassportCollections } from "@/hooks/usePassport";
import { PassportStamp } from "@/components/passport/PassportStamp";
import { PassportSkeleton } from "@/components/ui/SkeletonLoader";
import type { CollectionStamp } from "@/types/passport";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDisplayDate(dateString: string | null): string {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Unknown date";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

type StampRowProps = {
  stamp: CollectionStamp;
  onPress: (stamp: CollectionStamp) => void;
  isLast: boolean;
};

function StampRow({ stamp, onPress, isLast }: StampRowProps) {
  const colors = useThemeColors();
  const monoFont = Platform.OS === "ios" ? "Courier" : "monospace";

  return (
    <TouchableOpacity
      onPress={() => onPress(stamp)}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.divider,
      }}
    >
      {/* Small stamp thumbnail */}
      <View style={{ flexShrink: 0 }}>
        <PassportStamp stamp={stamp} size={56} />
      </View>

      {/* Info */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{
            fontSize: 15,
            fontFamily: "Poppins_600SemiBold",
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {stamp.venue?.name ?? "Unknown Venue"}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: monoFont,
            color: colors.textSecondary,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {formatDisplayDate(stamp.event_date ?? stamp.created_at)}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: "Poppins_400Regular",
            color: colors.pink,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {stamp.performer.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AllStampsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { data: collectionPages, isLoading } = usePassportCollections();

  const collections = collectionPages?.pages.flat() ?? [];
  // Stamps = verified live collections, already sorted most recent first
  const stamps = collections.filter((c) => c.verified);

  const handleStampPress = (stamp: CollectionStamp) => {
    router.push(`/artist/${stamp.performer.slug}`);
  };

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
          }}
        >
          All Stamps ({stamps.length})
        </Text>
      </View>

      {isLoading ? (
        <PassportSkeleton />
      ) : (
        <FlatList<CollectionStamp>
          data={stamps}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <StampRow
              stamp={item}
              onPress={handleStampPress}
              isLast={index === stamps.length - 1}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </SafeAreaView>
  );
}
