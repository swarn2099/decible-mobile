import { View, Text, TouchableOpacity, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { FindCard } from "./FindCard";
import type { CollectionStamp } from "@/types/passport";
import type { SharedValue } from "react-native-reanimated";

type Props = {
  finds: CollectionStamp[];
  totalCount: number;
  scrollY?: SharedValue<number>;
  sectionOffsetY?: number;
};

export function FindsGrid({ finds, totalCount, scrollY, sectionOffsetY = 0 }: Props) {
  const colors = useThemeColors();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  // 16px horizontal padding on each side, 8px gap between columns
  const cardWidth = (screenWidth - 16 * 2 - 8) / 2;
  const cardHeight = cardWidth * 1.33;

  const visibleFinds = finds.slice(0, 6);

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* 2-column grid using flexWrap */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {visibleFinds.map((stamp, index) => {
          const row = Math.floor(index / 2);
          const cardOffsetY = sectionOffsetY + row * (cardHeight + 8);
          return (
            <FindCard
              key={stamp.id}
              stamp={stamp}
              cardWidth={cardWidth}
              scrollY={scrollY}
              cardOffsetY={cardOffsetY}
            />
          );
        })}
      </View>

      {/* View All link */}
      {totalCount > 6 && (
        <TouchableOpacity
          onPress={() => router.push("/collection/finds")}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            paddingVertical: 14,
            marginTop: 4,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: "Poppins_600SemiBold",
              color: colors.pink,
            }}
          >
            View All {totalCount} Finds
          </Text>
          <ChevronRight size={16} color={colors.pink} />
        </TouchableOpacity>
      )}
    </View>
  );
}
