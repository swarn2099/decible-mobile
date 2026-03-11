import { View, Platform } from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { useThemeColors } from "@/constants/colors";
import type { CollectionStamp } from "@/types/passport";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function formatStampDate(dateString: string | null): string {
  if (!dateString) return "UNKNOWN";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "UNKNOWN";
  const month = MONTHS[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "…";
}

type Props = {
  stamp: CollectionStamp;
  size?: number;
};

export function PassportStamp({ stamp, size = 110 }: Props) {
  const colors = useThemeColors();

  const venueName = stamp.venue?.name
    ? truncate(stamp.venue.name.toUpperCase(), 18)
    : "UNKNOWN VENUE";

  const dateLabel = formatStampDate(stamp.event_date ?? stamp.created_at);

  const artistName = truncate(stamp.performer.name, 16);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = size / 2 - 12;

  const monoFont = Platform.OS === "ios" ? "Courier" : "monospace";

  const glowStyle = colors.isDark
    ? {
        shadowColor: colors.pink,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      }
    : {};

  return (
    <View style={[{ opacity: 0.9 }, glowStyle]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer dashed circle */}
        <Circle
          cx={cx}
          cy={cy}
          r={outerR}
          stroke={colors.pink}
          strokeWidth={2}
          strokeDasharray="4 3"
          fill="none"
          opacity={0.9}
        />

        {/* Inner circle (subtle) */}
        <Circle
          cx={cx}
          cy={cy}
          r={innerR}
          stroke={colors.pink}
          strokeWidth={0.5}
          fill="none"
          opacity={0.4}
        />

        {/* Venue name near top */}
        <SvgText
          x={cx}
          y={size * 0.3}
          textAnchor="middle"
          fontFamily="Poppins-SemiBold, Poppins_600SemiBold, sans-serif"
          fontWeight="600"
          fontSize={8}
          fill={colors.pink}
        >
          {venueName}
        </SvgText>

        {/* Date in center */}
        <SvgText
          x={cx}
          y={size * 0.52}
          textAnchor="middle"
          fontFamily={monoFont}
          fontWeight="bold"
          fontSize={10}
          fill={colors.pink}
        >
          {dateLabel}
        </SvgText>

        {/* Artist name below center */}
        <SvgText
          x={cx}
          y={size * 0.68}
          textAnchor="middle"
          fontFamily="Poppins-Medium, Poppins_500Medium, sans-serif"
          fontSize={7}
          fill={colors.pink}
          opacity={0.8}
        >
          {artistName}
        </SvgText>
      </Svg>
    </View>
  );
}
