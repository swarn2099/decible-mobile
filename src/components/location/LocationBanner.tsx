import { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  SlideInUp,
  SlideOutUp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Colors, useThemeColors } from "@/constants/colors";
import { useVenueDetection } from "@/hooks/useVenueDetection";
import { useCollect, type CollectResult } from "@/hooks/useCollection";
import { useMyCollectedIds } from "@/hooks/useMyCollectedIds";
import { useLocationStore } from "@/stores/locationStore";
import { ConfirmationModal } from "@/components/collection/ConfirmationModal";
import type { ActiveVenueEvent, Performer } from "@/types";

/**
 * Deterministic gradient pair from name hash (same pattern as Phase 17).
 */
const GRADIENT_PAIRS = [
  [Colors.pink, Colors.purple],
  [Colors.purple, Colors.blue],
  [Colors.blue, Colors.teal],
  [Colors.teal, Colors.yellow],
  [Colors.yellow, Colors.pink],
];

function getGradientColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  const pair = GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length];
  return pair[0];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ArtistAvatar({
  photo_url,
  name,
  size = 32,
}: {
  photo_url: string | null;
  name: string;
  size?: number;
}) {
  const colors = useThemeColors();
  if (photo_url) {
    return (
      <Image
        source={{ uri: photo_url }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: getGradientColor(name),
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontFamily: "Poppins_700Bold",
          fontSize: size * 0.35,
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

type CollectingState = {
  performerId: string;
};

type ConfirmState = {
  performer: Pick<Performer, "id" | "name" | "slug" | "photo_url">;
  result: CollectResult;
};

export function LocationBanner() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { nearbyEvents } = useVenueDetection();
  const { isEventDismissed, dismissEvent } = useLocationStore();
  const { collectedIds } = useMyCollectedIds();
  const collect = useCollect();

  const [expanded, setExpanded] = useState(false);
  const [collecting, setCollecting] = useState<CollectingState | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmState | null>(null);

  // Find the first non-dismissed event with uncollected artists
  const activeEvent = useMemo(() => {
    const event = nearbyEvents.find((e) => !isEventDismissed(e.eventId));
    if (!event) return null;
    const uncollected = event.performers.filter((p) => !collectedIds.has(p.id));
    if (uncollected.length === 0) return null; // all collected = no banner
    return { ...event, performers: uncollected };
  }, [nearbyEvents, isEventDismissed, collectedIds]);

  if (!activeEvent) return null;

  const { venue, performers, eventId } = activeEvent;
  const isSingleArtist = performers.length === 1;
  const isMultiArtist = performers.length > 1;

  const handleDismiss = () => {
    dismissEvent(eventId);
  };

  const handleCollect = (
    performer: Pick<Performer, "id" | "name" | "slug" | "photo_url">
  ) => {
    setCollecting({ performerId: performer.id });
    collect.mutate(
      { performerId: performer.id, capture_method: 'location' },
      {
        onSuccess: (result) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setCollecting(null);
          setConfirmation({ performer, result });
        },
        onError: () => {
          setCollecting(null);
        },
      }
    );
  };

  return (
    <>
      <Animated.View
        entering={SlideInUp.springify().damping(12).stiffness(180)}
        exiting={SlideOutUp.duration(200)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: insets.top,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.lightGray,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        {/* Single artist layout */}
        {isSingleArtist && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              gap: 10,
            }}
          >
            <ArtistAvatar
              photo_url={performers[0].photo_url}
              name={performers[0].name}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text,
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 13,
                }}
                numberOfLines={1}
              >
                {performers[0].name}
              </Text>
              <Text
                style={{
                  color: colors.gray,
                  fontFamily: "Poppins_400Regular",
                  fontSize: 11,
                }}
                numberOfLines={1}
              >
                playing at {venue.name}
              </Text>
            </View>
            <Pressable
              onPress={() => handleCollect(performers[0])}
              disabled={collecting?.performerId === performers[0].id}
              style={({ pressed }) => ({
                backgroundColor: pressed ? "#00B890" : colors.teal,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 6,
              })}
            >
              {collecting?.performerId === performers[0].id ? (
                <ActivityIndicator size="small" color={colors.decibel} />
              ) : (
                <Text
                  style={{
                    color: colors.decibel,
                    fontFamily: "Poppins_700Bold",
                    fontSize: 12,
                  }}
                >
                  Collect
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={handleDismiss}
              hitSlop={12}
              style={{ padding: 4 }}
            >
              <X size={18} color={colors.gray} />
            </Pressable>
          </View>
        )}

        {/* Multi-artist layout */}
        {isMultiArtist && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            {/* Header row */}
            <Pressable
              onPress={() => setExpanded(!expanded)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 13,
                  }}
                  numberOfLines={1}
                >
                  {venue.name}
                </Text>
                <Text
                  style={{
                    color: colors.gray,
                    fontFamily: "Poppins_400Regular",
                    fontSize: 11,
                  }}
                >
                  {performers.length} artists performing
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: `${colors.teal}20`,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    color: colors.teal,
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 11,
                  }}
                >
                  {expanded ? "Hide" : "Show"}
                </Text>
              </View>

              <Pressable
                onPress={handleDismiss}
                hitSlop={12}
                style={{ padding: 4 }}
              >
                <X size={18} color={colors.gray} />
              </Pressable>
            </Pressable>

            {/* Expanded artist list */}
            {expanded && (
              <View style={{ marginTop: 10, gap: 8 }}>
                {performers.map((performer) => (
                  <View
                    key={performer.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <ArtistAvatar
                      photo_url={performer.photo_url}
                      name={performer.name}
                      size={28}
                    />
                    <Text
                      style={{
                        flex: 1,
                        color: colors.text,
                        fontFamily: "Poppins_500Medium",
                        fontSize: 13,
                      }}
                      numberOfLines={1}
                    >
                      {performer.name}
                    </Text>
                    <Pressable
                      onPress={() => handleCollect(performer)}
                      disabled={collecting?.performerId === performer.id}
                      style={({ pressed }) => ({
                        backgroundColor: pressed ? "#00B890" : colors.teal,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                      })}
                    >
                      {collecting?.performerId === performer.id ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.decibel}
                        />
                      ) : (
                        <Text
                          style={{
                            color: colors.decibel,
                            fontFamily: "Poppins_700Bold",
                            fontSize: 11,
                          }}
                        >
                          Collect
                        </Text>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </Animated.View>

      {/* Confirmation modal after collecting */}
      {confirmation && (
        <ConfirmationModal
          visible={!!confirmation}
          type="collect"
          performer={{
            name: confirmation.performer.name,
            photo_url: confirmation.performer.photo_url,
          }}
          result={{
            scan_count: confirmation.result.scan_count,
            current_tier: confirmation.result.current_tier,
            tierUp: confirmation.result.tierUp,
            alreadyDone: confirmation.result.already_collected,
          }}
          onShare={() => setConfirmation(null)}
          onDismiss={() => setConfirmation(null)}
        />
      )}
    </>
  );
}
