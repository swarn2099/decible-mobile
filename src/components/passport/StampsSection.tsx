import { View, Text, TouchableOpacity, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { PassportStamp } from "./PassportStamp";
import type { CollectionStamp } from "@/types/passport";

const SCATTER_OFFSETS = [
  { marginTop: 0, marginLeft: 8 },
  { marginTop: -10, marginLeft: 16 },
  { marginTop: 6, marginLeft: 4 },
  { marginTop: -6, marginLeft: 20 },
  { marginTop: 10, marginLeft: 0 },
];

type Props = {
  stamps: CollectionStamp[];
  totalCount: number;
  fanId?: string; // when viewing another user's profile
};

export function StampsSection({ stamps, totalCount, fanId }: Props) {
  const colors = useThemeColors();
  const router = useRouter();

  // Theme-conditional texture
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const textureSource = colors.isDark
    ? require("../../../assets/textures/leather-dark.png")
    : require("../../../assets/textures/paper-grain-light.png");

  const visibleStamps = stamps.slice(0, 5);

  return (
    <View>
      {/* Textured background — edge-to-edge */}
      <ImageBackground
        source={textureSource}
        resizeMode="repeat"
        imageStyle={{ opacity: colors.isDark ? 0.15 : 0.25 }}
        style={{
          width: "100%",
          paddingTop: 24,
          paddingBottom: 24,
          paddingHorizontal: 8,
        }}
      >
        {/* Stamps scattered in a row-wrap layout */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {visibleStamps.map((stamp, index) => {
            const offset = SCATTER_OFFSETS[index % SCATTER_OFFSETS.length];
            return (
              <View
                key={stamp.id}
                style={{
                  transform: [{ rotate: `${stamp.rotation}deg` }],
                  marginTop: offset.marginTop,
                  marginLeft: offset.marginLeft,
                  marginRight: 4,
                  marginBottom: 4,
                }}
              >
                <PassportStamp stamp={stamp} />
              </View>
            );
          })}
        </View>
      </ImageBackground>

      {/* View All link — outside the texture, clean separation */}
      {totalCount > 5 && (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/collection/stamps",
              params: fanId ? { fanId } : {},
            })
          }
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            paddingVertical: 14,
            marginHorizontal: 16,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: "Poppins_600SemiBold",
              color: colors.pink,
            }}
          >
            View All {totalCount} Stamps
          </Text>
          <ChevronRight size={16} color={colors.pink} />
        </TouchableOpacity>
      )}
    </View>
  );
}
