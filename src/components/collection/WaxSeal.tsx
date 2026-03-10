import Svg, { Circle, Path, Text as SvgText, Defs, RadialGradient, Stop } from "react-native-svg";
import { View, Text } from "react-native";
import { TIER_COLORS, TIER_LABELS, type TierName } from "@/hooks/useCollection";
import { useThemeColors } from "@/constants/colors";

// Short labels that fit inside the seal circle
const TIER_SHORT_LABELS: Record<TierName, string> = {
  network: "N",
  early_access: "EA",
  secret: "S",
  inner_circle: "IC",
};

// Scalloped/notched edge: build an SVG path for a gear-like seal border
function buildSealEdgePath(cx: number, cy: number, outerR: number, innerR: number, notches: number): string {
  const points: string[] = [];
  const totalSteps = notches * 2;

  for (let i = 0; i <= totalSteps; i++) {
    const angle = (i / totalSteps) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) {
      points.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
    } else {
      points.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
  }
  points.push("Z");
  return points.join(" ");
}

type WaxSealProps = {
  tier: TierName;
  scanCount?: number;
  size?: number;
  // Optional: override the fill color (used for color transition animation — caller passes interpolated color string)
  colorOverride?: string;
  // When true, skip the tier label and scan count text below the seal SVG
  hideLabel?: boolean;
};

export function WaxSeal({ tier, scanCount = 0, size = 80, colorOverride, hideLabel = false }: WaxSealProps) {
  const colors = useThemeColors();
  const tierColor = colorOverride ?? TIER_COLORS[tier];
  const tierLabel = TIER_LABELS[tier];
  const shortLabel = TIER_SHORT_LABELS[tier];

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;      // gear outer radius
  const innerR = outerR - 4;        // gear inner notch depth
  const embossR = innerR - 5;       // inner decorative ring radius
  const coreR = embossR - 4;        // solid fill core

  const notches = 16;
  const edgePath = buildSealEdgePath(cx, cy, outerR, innerR, notches);

  // Font size scales with seal size
  const labelFontSize = shortLabel.length === 1 ? size * 0.28 : size * 0.2;

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id="sealGrad" cx="40%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <Stop offset="100%" stopColor={tierColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Scalloped outer edge — main fill */}
        <Path
          d={edgePath}
          fill={tierColor}
          opacity={0.9}
        />

        {/* Embossed inner decorative ring */}
        <Circle
          cx={cx}
          cy={cy}
          r={embossR}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={1}
          strokeOpacity={0.35}
        />

        {/* Solid core background */}
        <Circle
          cx={cx}
          cy={cy}
          r={coreR}
          fill={tierColor}
          opacity={0.95}
        />

        {/* Highlight sheen overlay */}
        <Circle
          cx={cx}
          cy={cy}
          r={coreR}
          fill="url(#sealGrad)"
        />

        {/* Tier short label — centered */}
        <SvgText
          x={cx}
          y={cy + labelFontSize * 0.38}
          textAnchor="middle"
          fontSize={labelFontSize}
          fontWeight="bold"
          fill="#FFFFFF"
          fillOpacity={0.95}
          fontFamily="Poppins-Bold"
        >
          {shortLabel}
        </SvgText>
      </Svg>

      {/* Tier label + scan count below the seal */}
      {!hideLabel && (
        <>
          <Text
            style={{
              color: tierColor,
              fontFamily: "Poppins_600SemiBold",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            {tierLabel}
          </Text>
          <Text
            style={{
              color: colors.gray,
              fontFamily: "Poppins_400Regular",
              fontSize: 11,
              textAlign: "center",
              marginTop: -4,
            }}
          >
            {scanCount} {scanCount === 1 ? "scan" : "scans"}
          </Text>
        </>
      )}
    </View>
  );
}
