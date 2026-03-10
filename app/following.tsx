import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { apiCall } from "@/lib/api";
import { UserResultCard } from "@/components/search/UserResultCard";
import type { UserSearchResult } from "@/hooks/useUserSearch";

type FollowingResponse = { users: UserSearchResult[] };

export default function FollowingScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { fanId } = useLocalSearchParams<{ fanId: string }>();

  const { data, isLoading } = useQuery<UserSearchResult[]>({
    queryKey: ["following", fanId],
    queryFn: async () => {
      const res = await apiCall<FollowingResponse>(
        `/mobile/following?fan_id=${fanId}`
      );
      return res.users;
    },
    enabled: !!fanId,
  });

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
          }}
        >
          Following
        </Text>
      </View>
      {isLoading ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}>
          <ActivityIndicator color={colors.pink} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16 }}>
              <UserResultCard
                user={item}
                onPress={(u) =>
                  router.push({
                    pathname: "/profile/[id]",
                    params: { id: u.id },
                  })
                }
              />
            </View>
          )}
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
              Not following anyone yet
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}
