import { View, Text, Pressable, Modal } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { X, Check, Share2 } from "lucide-react-native";
import { Colors, useThemeColors } from "@/constants/colors";
import {
  TIER_COLORS,
  TIER_LABELS,
  type TierName,
} from "@/hooks/useCollection";
import { useArtistTierProgress, type TierProgress } from "@/hooks/usePassport";

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

const TIER_ROADMAP: { tier: TierName; scans: number }[] = [
  { tier: "network", scans: 1 },
  { tier: "early_access", scans: 3 },
  { tier: "secret", scans: 5 },
  { tier: "inner_circle", scans: 10 },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  performerId: string;
  performerName: string;
  performerPhotoUrl: string | null;
  onShare?: () => void;
};

export function TierProgressModal({
  visible,
  onClose,
  performerId,
  performerName,
  performerPhotoUrl,
  onShare,
}: Props) {
  const colors = useThemeColors();
  const { data: progress } = useArtistTierProgress(
    visible ? performerId : undefined
  );
  const gradientColors = getGradientForName(performerName);
  const initial = performerName.charAt(0).toUpperCase();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.8)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 40,
          }}
        >
          {/* Close button */}
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={{ position: "absolute", right: 20, top: 20, zIndex: 10 }}
          >
            <X size={24} color={colors.gray} />
          </Pressable>

          {/* Artist photo + name */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              {performerPhotoUrl ? (
                <Image
                  source={{ uri: performerPhotoUrl }}
                  style={{ width: 72, height: 72 }}
                  contentFit="cover"
                />
              ) : (
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 72,
                    height: 72,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontFamily: "Poppins_700Bold",
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    {initial}
                  </Text>
                </LinearGradient>
              )}
            </View>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "Poppins_700Bold",
                color: colors.text,
              }}
            >
              {performerName}
            </Text>
          </View>

          {progress && (
            <>
              {/* Current tier badge */}
              <View
                style={{
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: TIER_COLORS[progress.currentTier],
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Poppins_700Bold",
                      color: "#FFFFFF",
                    }}
                  >
                    {progress.scanCount}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Poppins_600SemiBold",
                    color: TIER_COLORS[progress.currentTier],
                  }}
                >
                  {TIER_LABELS[progress.currentTier]} Tier
                </Text>
              </View>

              {/* Progress bar to next tier */}
              {progress.nextTier && (
                <View style={{ marginBottom: 24, paddingHorizontal: 8 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: "Poppins_400Regular",
                      color: colors.gray,
                      textAlign: "center",
                      marginBottom: 10,
                    }}
                  >
                    {progress.scansNeeded} more scan
                    {progress.scansNeeded !== 1 ? "s" : ""} to{" "}
                    <Text
                      style={{ color: TIER_COLORS[progress.nextTier] }}
                    >
                      {TIER_LABELS[progress.nextTier]}
                    </Text>{" "}
                    tier
                  </Text>
                  <View
                    style={{
                      height: 6,
                      backgroundColor: colors.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: TIER_COLORS[progress.currentTier],
                        width: `${getProgressPercent(progress)}%`,
                      }}
                    />
                  </View>
                </View>
              )}

              {/* Tier roadmap */}
              <View style={{ gap: 12 }}>
                {TIER_ROADMAP.map((step) => {
                  const achieved =
                    progress.scanCount >= step.scans;
                  const isCurrent = step.tier === progress.currentTier;

                  return (
                    <View
                      key={step.tier}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        opacity: achieved || isCurrent ? 1 : 0.4,
                      }}
                    >
                      {/* Status icon */}
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: achieved
                            ? TIER_COLORS[step.tier]
                            : colors.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                          justifyContent: "center",
                          alignItems: "center",
                          borderWidth: isCurrent && !achieved ? 2 : 0,
                          borderColor: TIER_COLORS[step.tier],
                        }}
                      >
                        {achieved && (
                          <Check size={14} color={"#FFFFFF"} />
                        )}
                      </View>

                      {/* Tier info */}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontFamily: isCurrent
                              ? "Poppins_700Bold"
                              : "Poppins_500Medium",
                            color: achieved || isCurrent
                              ? colors.text
                              : colors.lightGray,
                          }}
                        >
                          {TIER_LABELS[step.tier]}
                        </Text>
                      </View>

                      {/* Scan threshold */}
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Poppins_400Regular",
                          color: colors.lightGray,
                        }}
                      >
                        {step.scans === 10
                          ? "10+"
                          : step.scans}{" "}
                        scan{step.scans !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Loading state */}
          {!progress && (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Poppins_400Regular",
                  color: colors.gray,
                }}
              >
                Loading tier progress...
              </Text>
            </View>
          )}

          {/* Share button */}
          {onShare && progress && (
            <Pressable
              onPress={onShare}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 24,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: `${colors.purple}26`,
              }}
            >
              <Share2 size={16} color={colors.purple} />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Poppins_600SemiBold",
                  color: colors.purple,
                }}
              >
                Share
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

function getProgressPercent(progress: TierProgress): number {
  if (!progress.nextTier) return 100;
  const currentThreshold =
    TIER_ROADMAP.find((t) => t.tier === progress.currentTier)?.scans ?? 0;
  const nextThreshold =
    TIER_ROADMAP.find((t) => t.tier === progress.nextTier)?.scans ?? 10;
  const range = nextThreshold - currentThreshold;
  if (range <= 0) return 100;
  const within = progress.scanCount - currentThreshold;
  return Math.min(100, Math.max(0, (within / range) * 100));
}
