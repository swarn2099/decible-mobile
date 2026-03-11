import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useThemeColors } from "@/constants/colors";
import type { ValidateArtistLinkResult } from "@/hooks/useValidateArtistLink";

// ---------- Types ----------

export type ArtistPreviewCardProps = {
  result: ValidateArtistLinkResult;
  onAdd: () => void;
  onDiscover: () => void;
  isLoading: boolean;
};

// ---------- Helpers ----------

function formatListeners(count: number | null | undefined): string {
  if (count == null) return "Listeners unverified";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M listeners`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}K listeners`;
  return `${count} listeners`;
}

function formatFollowers(count: number | undefined): string {
  if (count == null) return "Followers unverified";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M followers`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}K followers`;
  return `${count} followers`;
}

function getPlatformLabel(platform: "spotify" | "soundcloud" | "apple_music"): string {
  switch (platform) {
    case "spotify":
      return "Spotify";
    case "soundcloud":
      return "SoundCloud";
    case "apple_music":
      return "Apple Music";
  }
}

function getPlatformColor(platform: "spotify" | "soundcloud" | "apple_music"): string {
  switch (platform) {
    case "spotify":
      return "#1DB954";
    case "soundcloud":
      return "#FF5500";
    case "apple_music":
      return "#FC3C44";
  }
}

// ---------- Component ----------

export function ArtistPreviewCard({ result, onAdd, onDiscover, isLoading }: ArtistPreviewCardProps) {
  const colors = useThemeColors();
  const artist = result.artist;
  const existingPerformer = result.existing_performer;

  if (!artist) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Could not load artist info.
        </Text>
      </View>
    );
  }

  const platformColor = getPlatformColor(artist.platform);
  const platformLabel = getPlatformLabel(artist.platform);

  // Stats string — platform-aware
  const statsText =
    artist.platform === "soundcloud"
      ? formatFollowers(artist.follower_count)
      : formatListeners(artist.monthly_listeners);

  // Determine action button state
  function renderActionButton() {
    if (!result.eligible) return null;

    const relationship = existingPerformer?.user_relationship;

    if (relationship === "founded") {
      return (
        <View style={[styles.actionButton, { backgroundColor: colors.gold + "33" }]}>
          <Text style={[styles.actionButtonText, { color: colors.gold }]}>★ Founded</Text>
        </View>
      );
    }

    if (relationship === "collected") {
      return (
        <View style={[styles.actionButton, { backgroundColor: colors.pink + "33" }]}>
          <Text style={[styles.actionButtonText, { color: colors.pink }]}>✓ Collected</Text>
        </View>
      );
    }

    if (relationship === "discovered") {
      return (
        <View style={[styles.actionButton, { backgroundColor: colors.purple + "33" }]}>
          <Text style={[styles.actionButtonText, { color: colors.purple }]}>◉ Discovered</Text>
        </View>
      );
    }

    if (existingPerformer && relationship === "none") {
      // Artist exists in Decibel but user hasn't collected it
      return (
        <View>
          {existingPerformer.founder_name && (
            <Text style={[styles.founderText, { color: colors.textTertiary }]}>
              Founded by {existingPerformer.founder_name}
            </Text>
          )}
          <TouchableOpacity
            onPress={onDiscover}
            disabled={isLoading}
            activeOpacity={0.8}
            style={[
              styles.actionButton,
              { backgroundColor: colors.purple },
              isLoading && { opacity: 0.6 },
            ]}
          >
            <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>◉ Discover</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Artist is new to Decibel — user can become founder
    return (
      <TouchableOpacity
        onPress={onAdd}
        disabled={isLoading}
        activeOpacity={0.8}
        style={[
          styles.actionButton,
          { backgroundColor: colors.gold },
          isLoading && { opacity: 0.6 },
        ]}
      >
        <Text style={[styles.actionButtonText, { color: "#000000" }]}>★ Add + Found</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* Artist photo */}
      <View style={styles.photoContainer}>
        {artist.photo_url ? (
          <Image
            source={{ uri: artist.photo_url }}
            style={styles.photo}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.inputBg }]}>
            <Text style={{ fontSize: 32 }}>🎵</Text>
          </View>
        )}
      </View>

      {/* Artist info */}
      <View style={styles.infoContainer}>
        {/* Platform badge */}
        <View style={[styles.platformBadge, { backgroundColor: platformColor + "22" }]}>
          <View style={[styles.platformDot, { backgroundColor: platformColor }]} />
          <Text style={[styles.platformText, { color: platformColor }]}>{platformLabel}</Text>
        </View>

        {/* Name */}
        <Text style={[styles.artistName, { color: colors.text }]} numberOfLines={2}>
          {artist.name}
        </Text>

        {/* Stats */}
        <Text style={[styles.statsText, { color: colors.textSecondary }]}>{statsText}</Text>

        {/* Genres */}
        {artist.genres.length > 0 && (
          <View style={styles.genreRow}>
            {artist.genres.slice(0, 2).map((genre) => (
              <View
                key={genre}
                style={[styles.genrePill, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}
              >
                <Text style={[styles.genreText, { color: colors.textTertiary }]}>{genre}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Ineligibility message */}
        {!result.eligible && (
          <View style={[styles.rejectionBanner, { backgroundColor: colors.pink + "33" }]}>
            <Text style={[styles.rejectionText, { color: colors.pink }]}>
              {result.rejection_reason === "unsupported_platform"
                ? "This platform isn't supported by Decibel."
                : "This artist has over 1M monthly listeners and can't be added to Decibel."}
            </Text>
          </View>
        )}

        {/* Action button */}
        {renderActionButton()}
      </View>
    </View>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 16,
  },
  photoContainer: {
    width: "100%",
    height: 180,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    padding: 16,
    gap: 8,
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  platformDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  platformText: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  artistName: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    lineHeight: 28,
  },
  statsText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  genreRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  genrePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  genreText: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  rejectionBanner: {
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
  },
  rejectionText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    lineHeight: 18,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 4,
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  founderText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    padding: 16,
  },
});
