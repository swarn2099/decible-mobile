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
  Users,
  Crown,
  ExternalLink,
  Music2,
} from "lucide-react-native";
import { Colors, useThemeColors } from "@/constants/colors";
import {
  useArtistProfile,
  useArtistFanCount,
  useArtistFounder,
  useMyArtistStatus,
  useArtistFans,
  type ArtistFan,
} from "@/hooks/useArtistProfile";
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
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length] as [string, string];
}

function formatListeners(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
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

// Build a Spotify embed URL from a Spotify artist URL
function getSpotifyEmbedUrl(spotifyUrl: string): string | null {
  try {
    const url = new URL(spotifyUrl);
    if (!url.hostname.includes("spotify")) return null;
    // /artist/ID → /embed/artist/ID
    const path = url.pathname;
    return `https://open.spotify.com/embed${path}?utm_source=generator&theme=0`;
  } catch {
    return null;
  }
}

function SpotifyEmbed({ url }: { url: string }) {
  const colors = useThemeColors();
  try {
    const { WebView } = require("react-native-webview");
    return (
      <View style={{ marginBottom: 20, borderRadius: 12, overflow: "hidden", height: 152 }}>
        <WebView
          source={{ uri: url }}
          style={{ backgroundColor: "transparent" }}
          scrollEnabled={false}
          allowsInlineMediaPlayback
        />
      </View>
    );
  } catch {
    // Fallback if WebView not available
    return (
      <Pressable
        onPress={() => Linking.openURL(url.replace("/embed", ""))}
        style={{
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Music2 size={20} color="#1DB954" />
        <Text style={{ fontSize: 15, fontFamily: "Poppins_500Medium", color: colors.text }}>
          Listen on Spotify
        </Text>
      </Pressable>
    );
  }
}

export default function ArtistProfileScreen() {
  const colors = useThemeColors();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [showSharePrompt, setShowSharePrompt] = useState(false);

  const { data: artist, isLoading, isError, refetch } = useArtistProfile(slug ?? "");
  const { data: fanCount } = useArtistFanCount(artist?.id);
  const { data: founder } = useArtistFounder(artist?.id);
  const { data: myStatus } = useMyArtistStatus(artist?.id);
  const { data: fans } = useArtistFans(artist?.id);

  const collect = useCollect();
  const discover = useDiscover();

  const isCurrentUserFounder = useMemo(() => {
    if (!founder || !user) return false;
    return myStatus === "founded";
  }, [founder, user, myStatus]);

  const spotifyEmbedUrl = useMemo(() => {
    if (!artist?.spotify_url) return null;
    return getSpotifyEmbedUrl(artist.spotify_url);
  }, [artist?.spotify_url]);

  // Non-Spotify listen links
  const otherLinks = useMemo(() => {
    if (!artist) return [];
    const links: { url: string; label: string }[] = [];
    const candidates = [
      artist.soundcloud_url,
      artist.mixcloud_url,
      artist.apple_music_url,
    ].filter(Boolean) as string[];

    for (const rawUrl of candidates) {
      try {
        const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
        new URL(url); // validate
        const host = new URL(url).hostname.toLowerCase();
        if (host.includes("deezer")) continue;
        let label = "Listen";
        if (host.includes("soundcloud")) label = "SoundCloud";
        else if (host.includes("mixcloud")) label = "Mixcloud";
        else if (host.includes("apple")) label = "Apple Music";
        links.push({ url, label });
      } catch { /* skip invalid */ }
    }
    return links;
  }, [artist]);

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
        <ErrorState message="Could not load artist profile." onRetry={() => refetch()} />
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
        return { label: "\u2605 Founded", bg: colors.gold, textColor: "#0B0B0F", outlined: false };
      case "collected":
        return { label: "Collected \u2713", bg: "transparent", textColor: colors.pink, outlined: true, borderColor: colors.pink };
      case "discovered":
        return { label: "Discovered \u2713", bg: "transparent", textColor: colors.purple, outlined: true, borderColor: colors.purple };
      default:
        return { label: "Discover", bg: colors.purple, textColor: "#FFFFFF", outlined: false };
    }
  })();

  const gradientColors = getGradientForName(artist.name);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <BackButton onPress={() => router.back()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
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
              style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT, justifyContent: "center", alignItems: "center" }}
            >
              <Text style={{ fontSize: 72, fontFamily: "Poppins_700Bold", color: "rgba(255,255,255,0.3)" }}>
                {artist.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          <LinearGradient
            colors={["transparent", `${colors.bg}99`, colors.bg]}
            locations={[0, 0.6, 1]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: HERO_HEIGHT * 0.6 }}
          />
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: -48 }}>
          {/* Artist Name + Listeners */}
          <Text style={{ fontSize: 28, fontFamily: "Poppins_700Bold", color: colors.text, marginBottom: 4 }}>
            {artist.name}
          </Text>
          {artist.spotify_monthly_listeners && (
            <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: colors.textSecondary, marginBottom: 8 }}>
              {formatListeners(artist.spotify_monthly_listeners)} monthly listeners
            </Text>
          )}

          {/* Fan count */}
          <Pressable
            onPress={() => router.push({ pathname: "/artist/fans", params: { performerId: artist.id, artistName: artist.name, artistSlug: artist.slug } })}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 }}
          >
            <Users size={14} color={colors.textSecondary} />
            <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: colors.textSecondary }}>
              {fanCount ?? 0} {(fanCount ?? 0) === 1 ? "fan" : "fans"} on Decibel
            </Text>
          </Pressable>

          {/* Founder Card */}
          {founder && (
            <Pressable
              onPress={() => {
                if (isCurrentUserFounder) return;
                const founderFan = fans?.find((f) => f.type === "founded");
                if (founderFan?.id) router.push({ pathname: "/profile/[id]", params: { id: founderFan.id } });
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                backgroundColor: `${colors.gold}15`,
                borderWidth: 1,
                borderColor: `${colors.gold}30`,
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 14,
                marginBottom: 16,
              }}
            >
              <Crown size={18} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: "Poppins_600SemiBold", color: colors.gold }}>
                  {isCurrentUserFounder ? "You founded this artist" : `Founded by @${founder.name ?? "a fan"}`}
                </Text>
                <Text style={{ fontSize: 11, fontFamily: "Poppins_400Regular", color: colors.textSecondary, marginTop: 1 }}>
                  {formatFounderDate(founder.awarded_at)}
                </Text>
              </View>
            </Pressable>
          )}

          {/* Action Button */}
          <Pressable
            onPress={handleAction}
            disabled={(myStatus !== "none" && myStatus !== undefined) || collect.isPending || discover.isPending}
            style={{
              height: 48,
              borderRadius: 16,
              backgroundColor: actionButton.outlined ? "transparent" : actionButton.bg,
              borderWidth: actionButton.outlined ? 1.5 : 0,
              borderColor: actionButton.outlined ? (actionButton as any).borderColor : "transparent",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 24,
              opacity: collect.isPending || discover.isPending ? 0.7 : 1,
            }}
          >
            {collect.isPending || discover.isPending ? (
              <ActivityIndicator color={actionButton.textColor} />
            ) : (
              <Text style={{ fontSize: 16, fontFamily: "Poppins_700Bold", color: actionButton.textColor }}>
                {actionButton.label}
              </Text>
            )}
          </Pressable>

          {/* Spotify Embed Player */}
          {spotifyEmbedUrl && <SpotifyEmbed url={spotifyEmbedUrl} />}

          {/* Other Listen Links */}
          {otherLinks.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              {otherLinks.map((link) => (
                <Pressable
                  key={link.url}
                  onPress={() => Linking.openURL(link.url).catch(() => Alert.alert("Could not open link"))}
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
                  <Music2 size={20} color={colors.pink} />
                  <Text style={{ fontSize: 15, fontFamily: "Poppins_500Medium", color: colors.text, flex: 1 }}>
                    {link.label}
                  </Text>
                  <ExternalLink size={14} color={colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Collectors Avatar Row */}
          {fans && fans.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontFamily: "Poppins_600SemiBold", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
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
                      onPress={() => router.push({ pathname: "/profile/[id]", params: { id: item.id } })}
                      style={{ alignItems: "center", width: 56 }}
                    >
                      <View
                        style={{
                          width: 44, height: 44, borderRadius: 22, overflow: "hidden",
                          backgroundColor: colors.card,
                          borderWidth: isFounder ? 2 : 0,
                          borderColor: isFounder ? colors.gold : "transparent",
                        }}
                      >
                        {item.avatar_url ? (
                          <Image source={{ uri: item.avatar_url }} style={{ width: 44, height: 44 }} contentFit="cover" />
                        ) : (
                          <LinearGradient colors={getGradientForName(item.name ?? "?")} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={{ width: 44, height: 44, justifyContent: "center", alignItems: "center" }}>
                            <Text style={{ fontSize: 16, fontFamily: "Poppins_700Bold", color: "rgba(255,255,255,0.85)" }}>
                              {(item.name ?? "?").charAt(0).toUpperCase()}
                            </Text>
                          </LinearGradient>
                        )}
                      </View>
                      <Text style={{ fontSize: 10, fontFamily: "Poppins_400Regular", color: colors.textSecondary, marginTop: 4, textAlign: "center" }} numberOfLines={1}>
                        {item.name ?? "Fan"}
                      </Text>
                    </Pressable>
                  );
                }}
                ListFooterComponent={
                  (fanCount ?? 0) > 8 ? (
                    <Pressable
                      onPress={() => router.push({ pathname: "/artist/fans", params: { performerId: artist.id, artistName: artist.name, artistSlug: artist.slug } })}
                      style={{ width: 56, alignItems: "center", justifyContent: "center", marginLeft: 12 }}
                    >
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.cardBorder }}>
                        <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: colors.textSecondary }}>All</Text>
                      </View>
                      <Text style={{ fontSize: 10, fontFamily: "Poppins_400Regular", color: colors.textSecondary, marginTop: 4, textAlign: "center" }}>See all</Text>
                    </Pressable>
                  ) : null
                }
              />
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
        onShare={() => { setShowConfirmation(false); setShowSharePrompt(true); }}
        onDismiss={() => { setShowConfirmation(false); setConfirmationData(null); }}
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
