import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Search as SearchIcon, X } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { useDecibelSearch } from "@/hooks/useSearch";
import { useUserSearch } from "@/hooks/useUserSearch";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { UserResultCard } from "@/components/search/UserResultCard";

export default function SearchScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { data: artists, isLoading: artistsLoading } = useDecibelSearch(query);
  const { data: users, isLoading: usersLoading } = useUserSearch(query);

  const isLoading = artistsLoading || usersLoading;
  const hasResults = (artists?.length ?? 0) > 0 || (users?.length ?? 0) > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header with back + search input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.inputBg,
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 44,
            borderWidth: 1,
            borderColor: colors.inputBorder,
          }}
        >
          <SearchIcon size={18} color={colors.textTertiary} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search artists or people..."
            placeholderTextColor={colors.textTertiary}
            style={{
              flex: 1,
              fontSize: 15,
              fontFamily: "Poppins_400Regular",
              color: colors.text,
              marginLeft: 8,
            }}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
              <X size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.length < 2 ? (
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Poppins_400Regular",
              color: colors.textTertiary,
            }}
          >
            Search for artists or people on Decibel
          </Text>
        </View>
      ) : isLoading ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator color={colors.pink} />
        </View>
      ) : (
        <FlatList
          data={[
            ...(artists ?? []).map((a) => ({ type: "artist" as const, data: a })),
            ...(users ?? []).map((u) => ({ type: "user" as const, data: u })),
          ]}
          keyExtractor={(item, i) =>
            item.type === "artist"
              ? `a-${item.data.id}`
              : `u-${item.data.id}`
          }
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16 }}>
              {item.type === "artist" ? (
                <SearchResultCard
                  performer={item.data}
                  onPress={() =>
                    router.push(`/artist/${item.data.slug}`)
                  }
                />
              ) : (
                <UserResultCard
                  user={item.data}
                  onPress={(u) =>
                    router.push({
                      pathname: "/profile/[id]",
                      params: { id: u.id },
                    })
                  }
                />
              )}
            </View>
          )}
          ListHeaderComponent={
            artists && artists.length > 0 ? (
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Poppins_600SemiBold",
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  paddingHorizontal: 16,
                  paddingTop: 8,
                  paddingBottom: 8,
                }}
              >
                Artists
              </Text>
            ) : null
          }
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
              No results found
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}
