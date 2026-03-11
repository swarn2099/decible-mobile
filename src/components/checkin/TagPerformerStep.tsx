import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from "react-native";
import { ChevronLeft, Music, X } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { useThemeColors } from "@/constants/colors";
import { useValidateArtistLink } from "@/hooks/useValidateArtistLink";
import { useTagPerformer } from "@/hooks/useTagPerformer";
import { getLocalDate } from "@/hooks/useCheckIn";
import { ArtistPreviewCard } from "@/components/add/ArtistPreviewCard";
import { apiCall } from "@/lib/api";
import type { ActiveVenueEvent, StampData } from "@/types";

// ---------- Types ----------

type SubState = "no_lineup_prompt" | "tag_input";

type TagPerformerStepProps = {
  event: ActiveVenueEvent;
  onStamp: (stamps: StampData[]) => void;
  onNoMusic: () => void;
  onBack: () => void;
};

// ---------- Component ----------

export function TagPerformerStep({ event, onStamp, onNoMusic, onBack }: TagPerformerStepProps) {
  const colors = useThemeColors();
  const [subState, setSubState] = useState<SubState>("no_lineup_prompt");
  const [pastedUrl, setPastedUrl] = useState("");
  const [isTagging, setIsTagging] = useState(false);

  const validateMutation = useValidateArtistLink();
  const tagPerformerMutation = useTagPerformer();

  async function handlePaste() {
    if (validateMutation.isPending) return;
    Keyboard.dismiss();
    const text = await Clipboard.getStringAsync();
    if (text) {
      setPastedUrl(text);
      validateMutation.mutate({ url: text });
    }
  }

  function handleSubmitUrl() {
    if (!pastedUrl.trim() || validateMutation.isPending) return;
    Keyboard.dismiss();
    validateMutation.mutate({ url: pastedUrl.trim() });
  }

  function handleReset() {
    setPastedUrl("");
    validateMutation.reset();
    tagPerformerMutation.reset();
  }

  async function handleTagAndCheckIn() {
    const validateData = validateMutation.data;
    if (!validateData) return;

    setIsTagging(true);
    const localDate = getLocalDate();

    try {
      let performerId: string;

      if (validateData.existing_performer) {
        // Artist already exists in Decibel
        performerId = validateData.existing_performer.id;
      } else {
        // Artist is new to Decibel — add them first
        const artist = validateData.artist;
        if (!artist) throw new Error("No artist data");

        const addResult = await apiCall<{ performer: { id: string; name: string; slug: string; photo_url: string | null } }>(
          "/mobile/add-artist",
          {
            method: "POST",
            body: JSON.stringify({
              platform: artist.platform,
              spotifyId: artist.spotify_id,
              soundcloudUsername: artist.soundcloud_username,
              appleMusicUrl: artist.apple_music_url,
              name: artist.name,
              photoUrl: artist.photo_url,
              genres: artist.genres,
              followers: artist.follower_count ?? 0,
              monthlyListeners: artist.monthly_listeners ?? undefined,
            }),
          }
        );
        performerId = addResult.performer.id;
      }

      // Now tag the performer at the venue
      const tagResult = await tagPerformerMutation.mutateAsync({
        venue_id: event.venue.id,
        performer_id: performerId,
        local_date: localDate,
      });

      onStamp([tagResult.stamp]);
    } catch (err) {
      // Error is surfaced through tagPerformerMutation.error or shown inline
      console.error("[TagPerformerStep] handleTagAndCheckIn error:", err);
    } finally {
      setIsTagging(false);
    }
  }

  const isLoading = validateMutation.isPending || isTagging;
  const artist = validateMutation.data?.artist;
  const validationSucceeded = validateMutation.isSuccess && validateMutation.data;
  const isEligible = validateMutation.data?.eligible === true;

  // ---------- No-lineup prompt sub-state ----------

  if (subState === "no_lineup_prompt") {
    return (
      <View style={styles.container}>
        {/* Back button */}
        <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ChevronLeft size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Venue context */}
        <Text style={[styles.venueLabel, { color: colors.textTertiary }]}>
          At {event.venue.name}
        </Text>

        {/* Prompt */}
        <View style={[styles.promptCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Music size={28} color={colors.textTertiary} />
          <Text style={[styles.promptTitle, { color: colors.text }]}>
            No lineup found for tonight.
          </Text>
          <Text style={[styles.promptSubtitle, { color: colors.textSecondary }]}>
            Is there live music?
          </Text>

          {/* Yes / No buttons */}
          <View style={styles.promptButtons}>
            <TouchableOpacity
              onPress={() => setSubState("tag_input")}
              activeOpacity={0.8}
              style={[styles.promptButton, styles.promptButtonYes, { backgroundColor: colors.pink }]}
            >
              <Text style={[styles.promptButtonText, { color: "#FFFFFF" }]}>Yes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNoMusic}
              activeOpacity={0.8}
              style={[styles.promptButton, styles.promptButtonNo, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }]}
            >
              <Text style={[styles.promptButtonText, { color: colors.textSecondary }]}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ---------- Tag input sub-state ----------

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Back button */}
      <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <ChevronLeft size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Venue context */}
      <Text style={[styles.venueLabel, { color: colors.textTertiary }]}>
        At {event.venue.name}
      </Text>

      <Text style={[styles.tagTitle, { color: colors.text }]}>
        Tag the performer
      </Text>
      <Text style={[styles.tagSubtitle, { color: colors.textSecondary }]}>
        Paste a Spotify, Apple Music, or SoundCloud link
      </Text>

      {/* Paste area */}
      <TouchableOpacity
        onPress={handlePaste}
        disabled={validateMutation.isPending}
        activeOpacity={0.7}
        style={[
          styles.pasteArea,
          {
            backgroundColor: colors.inputBg,
            borderColor: validateMutation.isError ? colors.pink : colors.inputBorder,
          },
        ]}
      >
        {validateMutation.isPending ? (
          <ActivityIndicator color={colors.pink} size="large" />
        ) : (
          <>
            <Music size={28} color={colors.textTertiary} />
            <Text style={[styles.pasteText, { color: colors.textSecondary }]}>
              Tap to paste a link
            </Text>
            <Text style={[styles.pasteSubtext, { color: colors.textTertiary }]}>
              Spotify · Apple Music · SoundCloud
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Manual URL input */}
      {!validateMutation.isSuccess && (
        <View style={styles.inputRow}>
          <TextInput
            value={pastedUrl}
            onChangeText={setPastedUrl}
            onSubmitEditing={handleSubmitUrl}
            placeholder="or type / paste a link here..."
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            editable={!validateMutation.isPending}
            style={[
              styles.urlInput,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                color: colors.text,
              },
            ]}
          />
          {pastedUrl.length > 0 && (
            <TouchableOpacity
              onPress={handleReset}
              style={styles.clearButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Error state */}
      {(validateMutation.isError || tagPerformerMutation.isError) && (
        <View style={[styles.errorBanner, { backgroundColor: colors.pink + "22" }]}>
          <Text style={[styles.errorText, { color: colors.pink }]}>
            {tagPerformerMutation.error?.message ??
              validateMutation.error?.message ??
              "Something went wrong. Check the link and try again."}
          </Text>
          <TouchableOpacity onPress={handleReset} style={styles.retryButton}>
            <Text style={[styles.retryText, { color: colors.pink }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Artist preview card */}
      {validationSucceeded && validateMutation.data && (
        <>
          <ArtistPreviewCard
            result={validateMutation.data}
            onAdd={handleTagAndCheckIn}
            onDiscover={handleTagAndCheckIn}
            isLoading={isLoading}
          />

          {/* Override action button with "Tag & Check In" when eligible */}
          {isEligible && (
            <TouchableOpacity
              onPress={handleTagAndCheckIn}
              disabled={isLoading}
              activeOpacity={0.8}
              style={[
                styles.tagCheckInButton,
                { backgroundColor: colors.pink },
                isLoading && { opacity: 0.6 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.tagCheckInButtonText}>Tag & Check In</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Clear / search again */}
          <TouchableOpacity onPress={handleReset} style={styles.searchAgainRow}>
            <X size={14} color={colors.textTertiary} />
            <Text style={[styles.searchAgainText, { color: colors.textTertiary }]}>
              Search a different artist
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  backButton: {
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  venueLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // --- No-lineup prompt ---
  promptCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  promptTitle: {
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
    lineHeight: 24,
  },
  promptSubtitle: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginBottom: 8,
  },
  promptButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 4,
  },
  promptButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  promptButtonYes: {},
  promptButtonNo: {},
  promptButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  // --- Tag input ---
  tagTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    marginBottom: 4,
  },
  tagSubtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    marginBottom: 20,
  },
  pasteArea: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 130,
  },
  pasteText: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    marginTop: 10,
  },
  pasteSubtext: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  urlInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  clearButton: {
    padding: 8,
  },
  errorBanner: {
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: "flex-start",
  },
  retryText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    textDecorationLine: "underline",
  },
  tagCheckInButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
  },
  tagCheckInButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#FFFFFF",
  },
  searchAgainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
  },
  searchAgainText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
});
