import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { usePassportCollections } from "@/hooks/usePassport";
import { CollectionStamp } from "@/components/passport/CollectionStamp";
import { PassportSkeleton } from "@/components/ui/SkeletonLoader";
import type { CollectionStamp as CollectionStampType } from "@/types/passport";

export default function CollectionScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { data: collectionPages, isLoading } = usePassportCollections();

  const collections = collectionPages?.pages.flat() ?? [];

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
          All Artists ({collections.length})
        </Text>
      </View>

      {isLoading ? (
        <PassportSkeleton />
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CollectionStamp
              stamp={item}
              onPress={(s: CollectionStampType) =>
                router.push(`/artist/${s.performer.slug}`)
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}
