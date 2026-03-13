import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useThemeColors } from "@/constants/colors";
import { useValidateArtistLink } from "@/hooks/useValidateArtistLink";
import { apiCall } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { getLocalDate } from "@/hooks/useCheckIn";
import type { StampData } from "@/types";

// ---------- Types ----------

type Props = {
  lat: number;
  lng: number;
  localDate?: string;
  onStamped: (stamps: StampData[]) => void;
  onBack: () => void;
};

type VenueMatch = {
  id: string;
  name: string;
};

type CollectAllResult = {
  stamps: StampData[];
  founders: string[];
};

type LinkState = {
  input: string;
  status: "idle" | "validating" | "valid" | "invalid";
  performerId: string | null;
  performerName: string | null;
  photoUrl: string | null;
};

// ---------- Component ----------

export function ManualFallbackForm({ lat, lng, localDate, onStamped, onBack }: Props) {
  const colors = useThemeColors();
  const validateLink = useValidateArtistLink();

  // Venue state
  const [venueQuery, setVenueQuery] = useState("");
  const [venueMatches, setVenueMatches] = useState<VenueMatch[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<VenueMatch | null>(null);
  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);

  // Artist link state
  const [linkState, setLinkState] = useState<LinkState>({
    input: "",
    status: "idle",
    performerId: null,
    performerName: null,
    photoUrl: null,
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---------- Venue autocomplete ----------

  const handleVenueChange = useCallback(async (text: string) => {
    setVenueQuery(text);
    setSelectedVenue(null);

    if (text.trim().length < 2) {
      setVenueMatches([]);
      setIsVenueDropdownOpen(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("venues")
        .select("id, name")
        .ilike("name", `%${text.trim()}%`)
        .limit(6);

      setVenueMatches((data as VenueMatch[]) ?? []);
      setIsVenueDropdownOpen(true);
    } catch {
      setVenueMatches([]);
    }
  }, []);

  function handleSelectVenue(venue: VenueMatch) {
    setSelectedVenue(venue);
    setVenueQuery(venue.name);
    setVenueMatches([]);
    setIsVenueDropdownOpen(false);
  }

  // ---------- Artist link validation ----------

  async function handleValidateLink() {
    const url = linkState.input.trim();
    if (!url) return;

    setLinkState((prev) => ({ ...prev, status: "validating" }));

    try {
      const res = await validateLink.mutateAsync({ url });
      if (res.existing_performer) {
        setLinkState((prev) => ({
          ...prev,
          status: "valid",
          performerId: res.existing_performer!.id,
          performerName: res.existing_performer!.name,
          photoUrl: res.existing_performer!.photo_url,
        }));
      } else if (res.eligible && res.artist) {
        // Artist not yet in DB — we'll need to add them via tag-performer
        setLinkState((prev) => ({
          ...prev,
          status: "valid",
          performerId: null, // new artist, ID assigned by backend
          performerName: res.artist!.name,
          photoUrl: res.artist!.photo_url,
        }));
      } else {
        const reason =
          res.rejection_reason === "over_threshold"
            ? "This artist has over 1M monthly listeners and can't be added to Decibel."
            : "Couldn't verify this artist. Try a Spotify, Apple Music, or SoundCloud URL.";
        setLinkState((prev) => ({ ...prev, status: "invalid" }));
        setSubmitError(reason);
        return;
      }
      setSubmitError(null);
    } catch {
      setLinkState((prev) => ({ ...prev, status: "invalid" }));
      setSubmitError("Couldn't verify this artist. Check the link and try again.");
    }
  }

  // ---------- Submit ----------

  async function handleCheckIn() {
    if (!venueQuery.trim() || linkState.status !== "valid") return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const eventDate = localDate ?? getLocalDate();
      let venueId: string | null = selectedVenue?.id ?? null;

      // If the artist is new (not in DB yet), use tag-performer endpoint
      if (!linkState.performerId) {
        const tagResult = await apiCall<{ stamp: StampData; founder: boolean }>(
          "/mobile/tag-performer",
          {
            method: "POST",
            body: JSON.stringify({
              venue_name: venueQuery.trim(),
              venue_id: venueId,
              artist_url: linkState.input.trim(),
              event_date: eventDate,
              lat,
              lng,
            }),
          }
        );

        // Save crowdsource data
        await saveCrowdsourceData({
          venueName: venueQuery.trim(),
          venueId,
          performerName: linkState.performerName ?? "",
          platformUrl: linkState.input.trim(),
          eventDate,
        });

        onStamped([tagResult.stamp]);
        return;
      }

      // Known performer — call show-checkin PUT
      const result = await apiCall<CollectAllResult>("/mobile/show-checkin", {
        method: "PUT",
        body: JSON.stringify({
          venue_id: venueId,
          venue_name: venueId ? undefined : venueQuery.trim(),
          performer_ids: [linkState.performerId],
          local_date: eventDate,
          lat,
          lng,
        }),
      });

      // Save crowdsource data
      await saveCrowdsourceData({
        venueName: venueQuery.trim(),
        venueId,
        performerName: linkState.performerName ?? "",
        platformUrl: linkState.input.trim(),
        eventDate,
      });

      onStamped(result.stamps);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Check-in failed. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------- Crowdsource helper ----------

  async function saveCrowdsourceData({
    venueName,
    venueId,
    performerName,
    platformUrl,
    eventDate,
  }: {
    venueName: string;
    venueId: string | null;
    performerName: string;
    platformUrl: string;
    eventDate: string;
  }) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      // Get the fan_id from fans table
      const { data: fan } = await supabase
        .from("fans")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!fan) return;

      await supabase.from("venue_submissions").insert({
        fan_id: fan.id,
        venue_name: venueName,
        venue_id: venueId,
        lat,
        lng,
        performer_name: performerName,
        platform_url: platformUrl,
        event_date: eventDate,
      });
    } catch {
      // Crowdsource save is best-effort — don't block the user flow
    }
  }

  // ---------- Derived state ----------

  const venueDisplay = venueQuery.trim();
  const canSubmit =
    venueDisplay.length >= 2 && linkState.status === "valid" && !isSubmitting;

  // ---------- Render ----------

  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.header, { color: colors.text }]}>Add manually</Text>
      <Text style={[styles.subheader, { color: colors.textSecondary }]}>
        Tell us where you are and who's playing.
      </Text>

      {/* Venue field */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Venue</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBg,
              borderColor: selectedVenue ? colors.pink : colors.inputBorder,
              color: colors.text,
            },
          ]}
          placeholder="Search venues or enter a name"
          placeholderTextColor={colors.textTertiary}
          value={venueQuery}
          onChangeText={handleVenueChange}
          autoCapitalize="words"
          autoCorrect={false}
        />

        {/* Autocomplete dropdown */}
        {isVenueDropdownOpen && venueMatches.length > 0 && (
          <View
            style={[
              styles.dropdown,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {venueMatches.map((venue) => (
              <TouchableOpacity
                key={venue.id}
                onPress={() => handleSelectVenue(venue)}
                style={[
                  styles.dropdownItem,
                  { borderBottomColor: colors.divider },
                ]}
                activeOpacity={0.75}
              >
                <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                  {venue.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedVenue && (
          <Text style={[styles.selectedHint, { color: colors.pink }]}>
            Venue matched: {selectedVenue.name}
          </Text>
        )}
      </View>

      {/* Artist link paste */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          Artist Link
        </Text>
        <Text style={[styles.fieldHint, { color: colors.textTertiary }]}>
          Paste a Spotify, Apple Music, or SoundCloud URL
        </Text>
        <View style={styles.linkInputRow}>
          <TextInput
            style={[
              styles.input,
              {
                flex: 1,
                backgroundColor: colors.inputBg,
                borderColor:
                  linkState.status === "valid"
                    ? colors.pink
                    : linkState.status === "invalid"
                    ? "#FF6B6B"
                    : colors.inputBorder,
                color: colors.text,
              },
            ]}
            placeholder="https://open.spotify.com/artist/..."
            placeholderTextColor={colors.textTertiary}
            value={linkState.input}
            onChangeText={(text) =>
              setLinkState({
                input: text,
                status: "idle",
                performerId: null,
                performerName: null,
                photoUrl: null,
              })
            }
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity
            onPress={handleValidateLink}
            disabled={linkState.status === "validating" || !linkState.input.trim()}
            style={[
              styles.verifyButton,
              {
                backgroundColor:
                  linkState.status === "valid" ? colors.teal : colors.purple,
              },
            ]}
            activeOpacity={0.8}
          >
            {linkState.status === "validating" ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.verifyButtonText}>
                {linkState.status === "valid" ? "✓" : "Verify"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Validated artist preview */}
        {linkState.status === "valid" && linkState.performerName && (
          <View
            style={[
              styles.artistPreview,
              { backgroundColor: colors.card, borderColor: colors.pink + "44" },
            ]}
          >
            <Text style={[styles.artistPreviewName, { color: colors.text }]}>
              {linkState.performerName}
            </Text>
            <Text style={[styles.artistPreviewLabel, { color: colors.pink }]}>
              Eligible
            </Text>
          </View>
        )}
      </View>

      {/* Error */}
      {submitError && (
        <Text style={[styles.errorText, { color: "#FF6B6B" }]}>{submitError}</Text>
      )}

      {/* Check In button */}
      <TouchableOpacity
        onPress={handleCheckIn}
        disabled={!canSubmit}
        style={[
          styles.checkInButton,
          { backgroundColor: canSubmit ? colors.pink : colors.pink + "55" },
        ]}
        activeOpacity={0.85}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.checkInButtonText}>Check In</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  header: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    marginBottom: 4,
  },
  subheader: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginBottom: 24,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: 24,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    minHeight: 48,
  },
  linkInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
    zIndex: 10,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownItemText: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
  },
  selectedHint: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },
  verifyButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
    minHeight: 48,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  artistPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  artistPreviewName: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  artistPreviewLabel: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    marginBottom: 12,
    textAlign: "center",
  },
  checkInButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  checkInButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#FFFFFF",
  },
});
