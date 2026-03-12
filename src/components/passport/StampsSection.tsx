import { View, Text, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Ticket } from "lucide-react-native";
import { Image } from "expo-image";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { useThemeColors } from "@/constants/colors";
import { Colors } from "@/constants/colors";
import type { CollectionStamp } from "@/types/passport";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function formatStampDate(dateString: string | null): string {
  if (!dateString) return "UNKNOWN";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "UNKNOWN";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

type Props = {
  stamps: CollectionStamp[];
  totalCount: number;
  fanId?: string;
};

function VenueStampMark({ venueName, rotation }: { venueName: string; rotation: number }) {
  const initial = venueName.charAt(0).toUpperCase();
  const size = 40;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={{ transform: [{ rotate: `${rotation}deg` }], opacity: 0.25 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={cx} cy={cy} r={17} stroke={Colors.pink} strokeWidth={2} strokeDasharray="3 2" fill="none" />
        <Circle cx={cx} cy={cy} r={13} stroke={Colors.pink} strokeWidth={0.5} fill="none" />
        <SvgText
          x={cx}
          y={cy + 5}
          textAnchor="middle"
          fontFamily="Poppins-Bold, Poppins_700Bold, sans-serif"
          fontWeight="700"
          fontSize={14}
          fill={Colors.pink}
        >
          {initial}
        </SvgText>
      </Svg>
    </View>
  );
}

function StampCard({ stamp, onPress }: { stamp: CollectionStamp; onPress: () => void }) {
  const colors = useThemeColors();
  const monoFont = Platform.OS === "ios" ? "Courier" : "monospace";
  const venueName = stamp.venue?.name ?? "Unknown Venue";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: Colors.pink,
        borderWidth: 1,
        borderColor: colors.cardBorder,
      }}
    >
      {/* Artist photo */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          overflow: "hidden",
          borderWidth: 2,
          borderColor: Colors.pink,
          flexShrink: 0,
        }}
      >
        {stamp.performer.photo_url ? (
          <Image
            source={{ uri: stamp.performer.photo_url }}
            style={{ width: 52, height: 52 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={{
              width: 52,
              height: 52,
              backgroundColor: colors.isDark ? "#1E1E28" : "#F0F0F4",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 22, fontFamily: "Poppins_700Bold", color: Colors.pink }}>
              {stamp.performer.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{
            fontSize: 15,
            fontFamily: "Poppins_600SemiBold",
            color: colors.text,
          }}
          numberOfLines={1}
        >
          {stamp.performer.name}
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: "Poppins_400Regular",
            color: colors.textSecondary,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {venueName}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 }}>
          <Text
            style={{
              fontSize: 10,
              fontFamily: monoFont,
              color: colors.textSecondary,
              opacity: 0.7,
            }}
          >
            {formatStampDate(stamp.event_date ?? stamp.created_at)}
          </Text>
          <Text
            style={{
              fontSize: 9,
              fontFamily: monoFont,
              fontWeight: "700",
              color: Colors.pink,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            COLLECTED
          </Text>
        </View>
      </View>

      {/* Faded stamp mark */}
      <View style={{ marginLeft: 8 }}>
        <VenueStampMark
          venueName={venueName}
          rotation={stamp.rotation}
        />
      </View>
    </TouchableOpacity>
  );
}

function EmptyStamps() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View style={{ alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 }}>
      <Ticket size={40} color={colors.textSecondary} strokeWidth={1.5} />
      <Text
        style={{
          fontSize: 16,
          fontFamily: "Poppins_600SemiBold",
          color: colors.text,
          marginTop: 12,
        }}
      >
        No stamps yet
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: 4,
          lineHeight: 18,
        }}
      >
        Check in at a live show to earn your first stamp
      </Text>
      <TouchableOpacity
        onPress={() => router.push("/(tabs)")}
        activeOpacity={0.7}
        style={{
          marginTop: 16,
          paddingHorizontal: 24,
          paddingVertical: 10,
          backgroundColor: Colors.pink,
          borderRadius: 20,
        }}
      >
        <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#FFFFFF" }}>
          Find a Show
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function StampsSection({ stamps, totalCount, fanId }: Props) {
  const colors = useThemeColors();
  const router = useRouter();

  if (stamps.length === 0) {
    return <EmptyStamps />;
  }

  const visibleStamps = stamps.slice(0, 5);

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {visibleStamps.map((stamp, index) => (
        <View key={stamp.id} style={{ marginBottom: index < visibleStamps.length - 1 ? 12 : 0 }}>
          <StampCard
            stamp={stamp}
            onPress={() => router.push(`/artist/${stamp.performer.slug}`)}
          />
        </View>
      ))}

      {/* View All link */}
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
            View All {totalCount} Stamps
          </Text>
          <ChevronRight size={16} color={colors.pink} />
        </TouchableOpacity>
      )}
    </View>
  );
}
