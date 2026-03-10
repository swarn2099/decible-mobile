import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { BadgeWithStatus } from "@/types/badges";
import { RARITY_COLORS } from "@/constants/badges";
import { useThemeColors } from "@/constants/colors";

type Props = {
  badges: BadgeWithStatus[];
  onBadgeTap?: (badge: BadgeWithStatus) => void;
};

function getSheenOpacity(rarity: BadgeWithStatus["rarity"]): number {
  switch (rarity) {
    case "legendary": return 0.25;
    case "epic":      return 0.20;
    case "rare":      return 0.15;
    case "common":    return 0.10;
  }
}

export function BadgeGrid({ badges, onBadgeTap }: Props) {
  const colors = useThemeColors();
  const earnedCount = badges.filter((b) => b.earned).length;

  // Sort: earned first
  const sorted = [...badges].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    return 0;
  });

  // Build rows of 3
  const rows: BadgeWithStatus[][] = [];
  for (let i = 0; i < sorted.length; i += 3) {
    rows.push(sorted.slice(i, i + 3));
  }

  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
      <Text
        style={{
          fontFamily: "Poppins_700Bold",
          fontSize: 18,
          color: colors.text,
          marginBottom: 16,
        }}
      >
        Badges ({earnedCount}/{badges.length})
      </Text>

      {rows.map((row, rowIdx) => (
        <View
          key={rowIdx}
          style={{
            flexDirection: "row",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {row.map((badge) => {
            const rarityColor = RARITY_COLORS[badge.rarity];

            if (badge.earned) {
              const sheenOpacity = getSheenOpacity(badge.rarity);
              return (
                <TouchableOpacity
                  key={badge.id}
                  style={{ width: "30%", alignItems: "center" }}
                  onPress={() => onBadgeTap?.(badge)}
                  activeOpacity={0.7}
                >
                  {/* Badge circle with metallic sheen */}
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      overflow: "hidden",
                      borderWidth: 2,
                      borderColor: rarityColor,
                      alignItems: "center",
                      justifyContent: "center",
                      ...(!colors.isDark && {
                        shadowColor: rarityColor,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 4,
                      }),
                    }}
                  >
                    {/* Base rarity tint gradient */}
                    <LinearGradient
                      colors={[`${rarityColor}33`, `${rarityColor}15`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                      }}
                    />
                    {/* White sheen highlight -- simulates light hitting metal */}
                    <LinearGradient
                      colors={[
                        `rgba(255,255,255,${sheenOpacity})`,
                        "rgba(255,255,255,0)",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0.6, y: 0.6 }}
                      style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                      }}
                    />
                    <Text style={{ fontSize: 28 }}>{badge.icon}</Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: "Poppins_500Medium",
                      fontSize: 11,
                      color: colors.text,
                      marginTop: 6,
                      textAlign: "center",
                    }}
                    numberOfLines={1}
                  >
                    {badge.name}
                  </Text>
                </TouchableOpacity>
              );
            }

            // Locked badge — distinct from earned in both themes
            return (
              <TouchableOpacity
                key={badge.id}
                style={{ width: "30%", alignItems: "center" }}
                onPress={() => onBadgeTap?.(badge)}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.isDark ? colors.card : "#F5F0EB",
                    borderWidth: colors.isDark ? 0 : 1,
                    borderColor: "rgba(0,0,0,0.06)",
                  }}
                >
                  <Text style={{ fontSize: 28, opacity: 0.3 }}>
                    {badge.icon}
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: "Poppins_400Regular",
                    fontSize: 11,
                    color: colors.lightGray,
                    marginTop: 6,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {badge.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
