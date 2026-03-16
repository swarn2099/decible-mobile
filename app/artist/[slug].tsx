import { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  Pressable,
  Text,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import {
  ChevronLeft,
  MapPin,
  Users,
  Crown,
  Calendar,
  ExternalLink,
  Headphones,
  Music,
  Music2,
} from "lucide-react-native";
import { Colors, useThemeColors } from "@/constants/colors";
import {
  useArtistProfile,
  useArtistEvents,
  useArtistFanCount,
  useArtistFounder,
  useMyArtistStatus,
  useArtistFans,
  type ArtistFan,
} from "@/hooks/useArtistProfile";
import { EmbeddedPlayer } from "@/components/jukebox/EmbeddedPlayer";
import { useCollect, useDiscover } from "@/hooks/useCollection";
import { useAuthStore } from "@/stores/authStore";
import { ConfirmationModal } from "@/components/collection/ConfirmationModal";
import { SharePrompt } from "@/components/collection/SharePrompt";
import { ArtistProfileSkeleton } from "@/components/ui/SkeletonLoader";
import { ErrorState } from "@/components/ui/ErrorState";
import type {
  CollectResult,
  DiscoverResult,
  TierName,
} from "@/hooks/useCollection";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_HEIGHT * 0.45;

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

function formatListeners(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.getDate().toString();
}

function formatFounderDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function detectPlatform(
  url: string
): "spotify" | "soundcloud" | "apple_music" | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("spotify")) return "spotify";
    if (host.includes("soundcloud")) return "soundcloud";
    if (host.includes("apple")) return "apple_music";
  } catch {}
  return null;
}

type ConfirmationData = {
  type: "collect" | "discover";
  tier: TierName;
  scanCount: number;
  tierUp: boolean;
  alreadyDone: boolean;
};

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "absolute",
        top: 54,
        left: 16,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ChevronLeft size={24} color="#FFFFFF" />
    </Pressable>
  );
}

export default function ArtistProfileScreen() {
  const colors = useThemeColors();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] =
    useState<ConfirmationData | null>(null);
  const [showSharePrompt, setShowSharePrompt] = useState(false);

  const {
    data: artist,
    isLoading,
    isError,
    refetch,
  } = useArtistProfile(slug ?? "");
  const { data: rawEvents } = useArtistEvents(artist?.id);
  const { data: fanCount } = useArtistFanCount(artist?.id);
  const { data: founder } = useArtistFounder(artist?.id);
  const { data: myStatus } = useMyArtistStatus(artist?.id);
  const { data: fans } = useArtistFans(artist?.id);

  const collect = useCollect();
  const discover = useDiscover();

  const events = useMemo(() => {
    if (!rawEvents) return [];
    return rawEvents
      .filter((ev, i, arr) => arr.findIndex((e) => e.id === ev.id) === i)
      .slice(0, 6);
  }, [rawEvents]);

  const normalizeUrl = (url: string): string => {
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
      return trimmed;
    return `https://${trimmed}`;
  };

  const getPlatformLabel = (url: string): string => {
    try {
      const host = new URL(normalizeUrl(url)).hostname.toLowerCase();
      if (host.includes("spotify")) return "Listen on Spotify";
      if (host.includes("soundcloud")) return "Listen on SoundCloud";
      if (host.includes("mixcloud")) return "Listen on Mixcloud";
      if (host.includes("apple")) return "Listen on Apple Music";
    } catch {}
    return "Listen";
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(normalizeUrl(url));
      return true;
    } catch {
      return false;
    }
  };

  const musicLinks = useMemo(() => {
    if (!artist) return [];
    const links: { url: string; label: string; icon: React.ReactNode }[] = [];
    const allUrls = [
      artist.spotify_url,
      artist.soundcloud_url,
      artist.mixcloud_url,
      artist.apple_music_url,
    ].filter(Boolean) as string[];
    const seen = new Set<string>();
    for (const rawUrl of allUrls) {
      // Skip invalid URLs before rendering any link button
      if (!isValidUrl(rawUrl)) continue;
      const url = normalizeUrl(rawUrl);
      if (seen.has(url)) continue;
      seen.add(url);
      // Deezer is not supported per CLAUDE.md — skip silently
      const hostname = new URL(url).hostname.toLowerCase();
      if (hostname.includes("deezer")) continue;
      const label = getPlatformLabel(url);
      const host = url.toLowerCase();
      const icon = host.includes("soundcloud") ? (
        <Headphones size={22} color={colors.pink} />
      ) : host.includes("mixcloud") ? (
        <Music size={22} color={colors.blue} />
      ) : host.includes("apple") ? (
        <Music2 size={22} color={colors.pink} />
      ) : (
        <Music2 size={22} color={colors.teal} />
      );
      links.push({ url, label, icon });
    }
    return links;
  }, [artist, colors]); // isValidUrl is a pure function defined above — no closure deps

  const isCurrentUserFounder = useMemo(() => {
    if (!founder || !user) return false;
    return myStatus === "founded";
  }, [founder, user, myStatus]);

  const primaryUrl = useMemo(() => {
    if (!artist) return null;
    const candidates = [
      artist.spotify_url,
      artist.soundcloud_url,
      artist.apple_music_url,
    ].filter(Boolean) as string[];
    for (const raw of candidates) {
      if (isValidUrl(raw)) return normalizeUrl(raw);
    }
    return null;
  }, [artist]);

  const primaryPlatform = useMemo(() => {
    if (!primaryUrl) return null;
    return detectPlatform(primaryUrl);
  }, [primaryUrl]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="light" />
        <BackButton onPress={() => router.back()} />
        <ArtistProfileSkeleton />
      </View>
    );
  }

  if (!artist || isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="light" />
        <BackButton onPress={() => router.back()} />
        <ErrorState
          message="Could not load artist profile."
          onRetry={() => refetch()}
        />
      </View>
    );
  }

  const handleAction = () => {
    if (!artist?.id) return;
    if (myStatus === "none" || myStatus === undefined) {
      discover.mutate(
        { performerId: artist.id },
        {
          onSuccess: (result: DiscoverResult) => {
            setConfirmationData({
              type: "discover",
              tier: "network",
              scanCount: 1,
              tierUp: false,
              alreadyDone: result.already_discovered,
            });
            setShowConfirmation(true);
          },
          onError: (error: Error) => {
            Alert.alert("Discover failed", error.message || "Try again.");
          },
        }
      );
    }
  };

  const actionButton = (() => {
    switch (myStatus) {
      case "founded":
        return {
          label: "\u2605 Founded",
          bg: colors.gold,
          textColor: "#0B0B0F",
          borderColor: "transparent",
          outlined: false,
        };
      case "collected":
        return {
          label: "Collected \u2713",
          bg: "transparent",
          textColor: colors.pink,
          borderColor: colors.pink,
          outlined: true,
        };
      case "discovered":
        return {
          label: "Discovered \u2713",
          bg: "transparent",
          textColor: colors.purple,
          borderColor: colors.purple,
          outlined: true,
        };
      default:
        return {
          label: "Discover",
          bg: colors.purple,
          textColor: "#FFFFFF",
          borderColor: "transparent",
          outlined: false,
        };
    }
  })();

  const gradientColors = getGradientForName(artist.name);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <BackButton onPress={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero Image */}
        <View style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}>
          {artist.photo_url ? (
            <Image
              source={{ uri: artist.photo_url }}
              style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: SCREEN_WIDTH,
                height: HERO_HEIGHT,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 72,
                  fontFamily: "Poppins_700Bold",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                {artist.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          <LinearGradient
            colors={["transparent", `${colors.bg}99`, colors.bg]}
            locations={[0, 0.6, 1]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: HERO_HEIGHT * 0.6,
            }}
          />
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: -48 }}>
          {/* Artist Name */}
          <Text
            style={{
              fontSize: 28,
              fontFamily: "Poppins_700Bold",
              color: colors.text,
              marginBottom: 8,
            }}
          >
            {artist.name}
          </Text>

          {/* Genre Tags */}
          {artist.genres && artist.genres.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 10,
              }}
            >
              {artist.genres.map((genre) => (
                <View
                  key={genre}
                  style={{
                    backgroundColor: `${colors.gray}33`,
                    borderRadius: 100,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: "Poppins_500Medium",
                      color: colors.textSecondary,
                    }}
                  >
                    {genre}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Location + Fan Count */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
            }}
          >
            {artist.city && artist.claimed && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <MapPin size={14} color={colors.textSecondary} />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Poppins_400Regular",
                    color: colors.textSecondary,
                  }}
                >
                  {artist.city}
                </Text>
              </View>
            )}
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/artist/fans",
                  params: {
                    performerId: artist.id,
                    artistName: artist.name,
                    artistSlug: artist.slug,
                  },
                })
              }
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Users size={14} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: "Poppins_400Regular",
                  color: colors.textSecondary,
                }}
              >
                {fanCount ?? 0} {(fanCount ?? 0) === 1 ? "fan" : "fans"}
              </Text>
            </Pressable>
          </View>

          {/* Stats Card */}
          <View
            style={{
              borderRadius: 16,
              backgroundColor: colors.card,
              flexDirection: "row",
              paddingVertical: 20,
              paddingHorizontal: 16,
              marginBottom: 20,
            }}
          >
            {[
              { value: fanCount ?? 0, label: "Fans" },
              ...(artist.spotify_monthly_listeners
                ? [{ value: formatListeners(artist.spotify_monthly_listeners), label: "Listeners" }]
                : []),
              { value: events.length, label: "Shows" },
              { value: artist.genres?.length ?? 0, label: "Genres" },
            ].map((stat, i) => (
              <View key={stat.label} style={{ flex: 1, flexDirection: "row" }}>
                {i > 0 && (
                  <View
                    style={{
                      width: 1,
                      backgroundColor: colors.divider,
                      marginVertical: 4,
                    }}
                  />
                )}
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontFamily: "Poppins_700Bold",
                      color: colors.text,
                    }}
                  >
                    {stat.value}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: "Poppins_500Medium",
                      color: colors.textSecondary,
                      textTransform: "uppercase",
                    }}
                  >
                    {stat.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Action Button */}
          <Pressable
            onPress={handleAction}
            disabled={
              (myStatus !== "none" && myStatus !== undefined) ||
              collect.isPending ||
              discover.isPending
            }
            style={{
              height: 48,
              borderRadius: 16,
              backgroundColor: actionButton.outlined
                ? "transparent"
                : actionButton.bg,
              borderWidth: actionButton.outlined ? 1.5 : 0,
              borderColor: actionButton.borderColor,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
              opacity: collect.isPending || discover.isPending ? 0.7 : 1,
            }}
          >
            {collect.isPending || discover.isPending ? (
              <ActivityIndicator color={actionButton.textColor} />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Poppins_700Bold",
                  color: actionButton.textColor,
                }}
              >
                {actionButton.label}
              </Text>
            )}
          </Pressable>

          {/* Founder Attribution */}
          {founder && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Crown size={16} color={colors.gold} />
              {isCurrentUserFounder ? (
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Poppins_500Medium",
                    color: colors.gold,
                    flex: 1,
                  }}
                >
                  You founded this artist on{" "}
                  {formatFounderDate(founder.awarded_at)}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: "Poppins_500Medium",
                    color: colors.gold,
                    flex: 1,
                  }}
                >
                  Founded by{" "}
                  <Text
                    onPress={() => {
                      const founderFan = fans?.find(
                        (f) => f.type === "founded"
                      );
                      if (founderFan?.id) {
                        router.push({
                          pathname: "/profile/[id]",
                          params: { id: founderFan.id },
                        });
                      }
                    }}
                    style={{
                      textDecorationLine: "underline",
                      color: colors.gold,
                    }}
                  >
                    @{founder.name ?? "a fan"}
                  </Text>{" "}
                  on {formatFounderDate(founder.awarded_at)}
                </Text>
              )}
            </View>
          )}

          {/* Collector Count Social Proof */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/artist/fans",
                params: {
                  performerId: artist.id,
                  artistName: artist.name,
                  artistSlug: artist.slug,
                },
              })
            }
            style={{ marginBottom: 20 }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: "Poppins_400Regular",
                color: colors.textSecondary,
              }}
            >
              Collected by {fanCount ?? 0}{" "}
              {(fanCount ?? 0) === 1 ? "person" : "people"} on Decibel
            </Text>
          </Pressable>

          {/* Embedded Listen Button (primary CTA) */}
          {primaryUrl && (
            <View style={{ marginBottom: 20 }}>
              <EmbeddedPlayer
                embedUrl={primaryUrl}
                listenUrl={primaryUrl}
                platform={primaryPlatform}
                isActive={true}
                height={80}
              />
            </View>
          )}

          {/* Listen Section */}
          {musicLinks.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Poppins_600SemiBold",
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 12,
                }}
              >
                Listen
              </Text>
              {musicLinks.map((link) => (
                <Pressable
                  key={link.url}
                  onPress={() => {
                    Linking.openURL(link.url).catch(() => {
                      Alert.alert(
                        "Could not open link",
                        "The URL may be invalid."
                      );
                    });
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: colors.card,
                    borderRadius: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                  }}
                >
                  {link.icon}
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: "Poppins_500Medium",
                      color: colors.text,
                      flex: 1,
                    }}
                  >
                    {link.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Collectors Avatar Row */}
          {fans && fans.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Poppins_600SemiBold",
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 12,
                }}
              >
                Collectors
              </Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={fans.slice(0, 8)}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                renderItem={({ item }: { item: ArtistFan }) => {
                  const isFounder = item.type === "founded";
                  return (
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/profile/[id]",
                          params: { id: item.id },
                        })
                      }
                      style={{ alignItems: "center", width: 56 }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          overflow: "hidden",
                          backgroundColor: colors.card,
                          borderWidth: isFounder ? 2 : 0,
                          borderColor: isFounder ? colors.gold : "transparent",
                        }}
                      >
                        {item.avatar_url ? (
                          <Image
                            source={{ uri: item.avatar_url }}
                            style={{ width: 44, height: 44 }}
                            contentFit="cover"
                          />
                        ) : (
                          <LinearGradient
                            colors={getGradientForName(item.name ?? "?")}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              width: 44,
                              height: 44,
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 16,
                                fontFamily: "Poppins_700Bold",
                                color: "rgba(255,255,255,0.85)",
                              }}
                            >
                              {(item.name ?? "?").charAt(0).toUpperCase()}
                            </Text>
                          </LinearGradient>
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 10,
                          fontFamily: "Poppins_400Regular",
                          color: colors.textSecondary,
                          marginTop: 4,
                          textAlign: "center",
                        }}
                        numberOfLines={1}
                      >
                        {item.name ?? "Fan"}
                      </Text>
                    </Pressable>
                  );
                }}
                ListFooterComponent={
                  (fanCount ?? 0) > 8 ? (
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/artist/fans",
                          params: {
                            performerId: artist.id,
                            artistName: artist.name,
                            artistSlug: artist.slug,
                          },
                        })
                      }
                      style={{
                        width: 56,
                        alignItems: "center",
                        justifyContent: "center",
                        marginLeft: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: colors.card,
                          justifyContent: "center",
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: colors.cardBorder,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontFamily: "Poppins_600SemiBold",
                            color: colors.textSecondary,
                          }}
                        >
                          All
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 10,
                          fontFamily: "Poppins_400Regular",
                          color: colors.textSecondary,
                          marginTop: 4,
                          textAlign: "center",
                        }}
                      >
                        See all
                      </Text>
                    </Pressable>
                  ) : null
                }
              />
            </View>
          )}

          {/* Upcoming Shows */}
          {events.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Poppins_600SemiBold",
                  color: colors.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 16,
                }}
              >
                Upcoming Shows
              </Text>
              {events.map((event) => (
                <Pressable
                  key={event.id}
                  onPress={() =>
                    event.external_url
                      ? Linking.openURL(event.external_url)
                      : undefined
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: colors.card,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: "Poppins_600SemiBold",
                        color: colors.pink,
                        textTransform: "uppercase",
                      }}
                    >
                      {formatMonth(event.event_date)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 18,
                        fontFamily: "Poppins_700Bold",
                        color: colors.text,
                        lineHeight: 22,
                      }}
                    >
                      {formatDay(event.event_date)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontFamily: "Poppins_600SemiBold",
                        color: colors.text,
                      }}
                      numberOfLines={1}
                    >
                      {event.venue?.name ?? "TBA"}
                    </Text>
                    {event.venue?.address && (
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Poppins_400Regular",
                          color: colors.textSecondary,
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {event.venue.address}
                      </Text>
                    )}
                  </View>
                  {event.external_url && (
                    <ExternalLink size={16} color={colors.textSecondary} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={showConfirmation}
        type={confirmationData?.type ?? "collect"}
        performer={{ name: artist.name, photo_url: artist.photo_url }}
        result={{
          scan_count: confirmationData?.scanCount ?? 1,
          current_tier: confirmationData?.tier ?? "network",
          tierUp: confirmationData?.tierUp ?? false,
          alreadyDone: confirmationData?.alreadyDone ?? false,
        }}
        onShare={() => {
          setShowConfirmation(false);
          setShowSharePrompt(true);
        }}
        onDismiss={() => {
          setShowConfirmation(false);
          setConfirmationData(null);
        }}
      />

      <SharePrompt
        visible={showSharePrompt}
        performerName={artist.name}
        performerSlug={artist.slug}
        onDone={() => setShowSharePrompt(false)}
      />
    </View>
  );
}
