import { View, Text, FlatList, TouchableOpacity, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { usePassportCollections } from "@/hooks/usePassport";
import { apiCall } from "@/lib/api";
import { FindCard } from "@/components/passport/FindCard";
import { PassportSkeleton } from "@/components/ui/SkeletonLoader";
import type { CollectionStamp } from "@/types/passport";

type PassportApiResponse = {
  fan: { id: string; name: string | null; avatar_url: string | null; city: string | null; created_at: string };
  collections: CollectionStamp[];
  stats: unknown;
  hasMore: boolean;
};

export default function AllFindsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { fanId } = useLocalSearchParams<{ fanId?: string }>();

  // If fanId is provided, fetch that user's collections; otherwise use current user's
  const { data: collectionPages, isLoading: ownLoading } = usePassportCollections();
  const { data: otherUserData, isLoading: otherLoading } = useQuery<PassportApiResponse>({
    queryKey: ["userProfile", fanId],
    queryFn: () => apiCall<PassportApiResponse>(`/mobile/passport?fan_id=${fanId}&page=0`),
    enabled: !!fanId,
  });

  const isLoading = fanId ? otherLoading : ownLoading;

  const collections = fanId
    ? (otherUserData?.collections ?? [])
    : (collectionPages?.pages.flat() ?? []);

  // 16px horizontal padding on each side, 8px gap between columns
  const cardWidth = (screenWidth - 16 * 2 - 8) / 2;

  // Finds = unverified (online discoveries: Founded or Discovered)
  const finds = collections.filter((c) => !c.verified);

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
          All Finds ({finds.length})
        </Text>
      </View>

      {isLoading ? (
        <PassportSkeleton />
      ) : (
        <FlatList<CollectionStamp>
          data={finds}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <FindCard stamp={item} cardWidth={cardWidth} />
          )}
          columnWrapperStyle={{ gap: 8, paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
        />
      )}
    </SafeAreaView>
  );
}
