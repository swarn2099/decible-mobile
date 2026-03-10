import { View, Text, Pressable, Platform } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, useThemeColors } from "@/constants/colors";
import { formatDate } from "@/lib/formatDate";
import { type TierName } from "@/hooks/useCollection";
import { WaxSeal } from "@/components/collection/WaxSeal";
import type { CollectionStamp as CollectionStampType } from "@/types/passport";

// Deterministic gradient from name
const GRADIENT_PAIRS = [
  [Colors.pink, Colors.purple],
  [Colors.purple, Colors.blue],
  [Colors.blue, Colors.teal],
  [Colors.teal, Colors.pink],
  [Colors.yellow, Colors.pink],
  [Colors.purple, Colors.teal],
];

function getGradientForName(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length] as [
    string,
    string,
  ];
}

type Props = {
  stamp: CollectionStampType;
  onPress: (stamp: CollectionStampType) => void;
};

export function CollectionStamp({ stamp, onPress }: Props) {
  const colors = useThemeColors();
  const { performer, venue, verified, created_at, current_tier, is_founder } =
    stamp;
  const tier = (current_tier as TierName) ?? "network";
  const gradientColors = getGradientForName(performer.name);
  const initial = performer.name.charAt(0).toUpperCase();

  const dateLabel = formatDate(created_at);

  // Determine collection type and colors
  const collectionType = is_founder
    ? "founded"
    : verified
    ? "collected"
    : "discovered";

  const typeConfig = {
    founded: { label: "Founded", color: colors.gold },
    collected: { label: "Collected", color: colors.pink },
    discovered: { label: "Discovered", color: colors.purple },
  }[collectionType];

  const isDiscovered = collectionType === "discovered";
  const showWaxSeal = !isDiscovered;

  return (
    <Pressable
      onPress={() => onPress(stamp)}
      style={({ pressed }) => [
        {
          marginHorizontal: 16,
          opacity: pressed ? 0.75 : isDiscovered ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={{
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: colors.card,
          minHeight: 100,
        }}
      >
        {/* Stamp content */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 14,
            minHeight: 100,
          }}
        >
          {/* Artist photo — circular with ring */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              borderWidth: 2,
              borderColor: typeConfig.color,
              overflow: "hidden",
              justifyContent: "center",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            {performer.photo_url ? (
              <View style={{ width: 56, height: 56 }}>
                <Image
                  source={{ uri: performer.photo_url }}
                  style={{ width: 56, height: 56, borderRadius: 28 }}
                  contentFit="cover"
                  transition={200}
                />
                {/* Grayscale overlay for discovered */}
                {isDiscovered && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: colors.bg,
                      opacity: 0.5,
                    }}
                  />
                )}
              </View>
            ) : (
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 56,
                  height: 56,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontFamily: "Poppins_700Bold",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {initial}
                </Text>
              </LinearGradient>
            )}
          </View>

          {/* Info area */}
          <View style={{ flex: 1, marginLeft: 12, justifyContent: "center" }}>
            <Text
              style={{
                fontSize: 15,
                fontFamily: "Poppins_600SemiBold",
                color: colors.text,
              }}
              numberOfLines={1}
            >
              {performer.name}
            </Text>
            {venue?.name && (
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "Poppins_400Regular",
                  color: colors.textSecondary,
                  marginTop: 1,
                }}
                numberOfLines={1}
              >
                {venue.name}
              </Text>
            )}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                  color: typeConfig.color,
                  letterSpacing: 0.5,
                }}
              >
                {typeConfig.label.toUpperCase()}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
                  color: colors.textDim,
                  letterSpacing: 0.5,
                }}
              >
                {dateLabel}
              </Text>
            </View>
          </View>

          {/* Wax seal for verified/founded */}
          {showWaxSeal && (
            <View style={{ alignSelf: "center" }}>
              <WaxSeal tier={tier} size={28} hideLabel />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
