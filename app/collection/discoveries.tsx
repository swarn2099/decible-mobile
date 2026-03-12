import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, Search } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { apiCall } from "@/lib/api";
import { DiscoveryGlassCard } from "@/components/passport/GlassCard/DiscoveryGlassCard";
import type { CollectionStamp } from "@/types/passport";

type CollectionsResponse = {
  collections: CollectionStamp[];
  hasMore: boolean;
};

export default function AllDiscoveriesScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery<CollectionsResponse>({
      queryKey: ["viewMore", "discovery"],
      initialPageParam: 0,
      queryFn: async ({ pageParam }) => {
        return apiCall<CollectionsResponse>(
          `/mobile/passport-collections?type=discovery&page=${pageParam as number}`
        );
      },
      getNextPageParam: (lastPage, allPages) =>
        lastPage.hasMore ? allPages.length : undefined,
    });

  const allItems = data?.pages.flatMap((p) => p.collections) ?? [];
  const filtered = search.trim()
    ? allItems.filter((c) =>
        c.performer.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : allItems;

  const searchBar = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.04)",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 40,
        marginBottom: 16,
        gap: 8,
      }}
    >
      <Search size={16} color={colors.textSecondary} />
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search artists..."
        placeholderTextColor={colors.textSecondary}
        style={{
          flex: 1,
          fontSize: 14,
          fontFamily: "Poppins_400Regular",
          color: colors.text,
        }}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  const emptyState = (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 60,
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          textAlign: "center",
        }}
      >
        {search.trim()
          ? `No discoveries matching "${search.trim()}"`
          : "No discoveries yet.\nDiscover artists to build your collection."}
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
          paddingTop: 8,
          paddingBottom: 12,
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
          All Discoveries
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.pink} size="large" />
        </View>
      ) : (
        <FlatList<CollectionStamp>
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <DiscoveryGlassCard item={item} simplified />
          )}
          columnWrapperStyle={{ gap: 16 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 120,
            gap: 16,
          }}
          ListHeaderComponent={searchBar}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                color={colors.pink}
                style={{ marginVertical: 16 }}
              />
            ) : null
          }
          ListEmptyComponent={emptyState}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage && !search.trim()) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
