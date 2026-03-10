import { View, Text } from "react-native";
import { TIER_COLORS, TIER_LABELS, type TierName } from "@/hooks/useCollection";

type Props = {
  tier: TierName;
};

export function TierPill({ tier }: Props) {
  const color = TIER_COLORS[tier];
  const label = TIER_LABELS[tier];

  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: `${color}26`,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontFamily: "Poppins_500Medium",
          color,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
