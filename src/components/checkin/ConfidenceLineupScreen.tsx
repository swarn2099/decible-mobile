import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useThemeColors } from "@/constants/colors";
import { useValidateArtistLink } from "@/hooks/useValidateArtistLink";
import type { ShowSearchResult } from "@/types";

// ---------- Types ----------

type Props = {
  result: ShowSearchResult;
  onCollect: (performerIds: string[]) => void;
  onManualFallback: () => void;
  onBack: () => void;
};

// ---------- High-confidence variant ----------

function HighConfidenceView({
  result,
  onCollect,
}: Pick<Props, "result" | "onCollect">) {
  const colors = useThemeColors();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(result.artists.map((a) => a.performer_id ?? "").filter(Boolean))
  );

  function toggleArtist(performerId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(performerId)) {
        next.delete(performerId);
      } else {
        next.add(performerId);
      }
      return next;
    });
  }

  function handleCollectAll() {
    const ids = [...selected];
    if (ids.length > 0) onCollect(ids);
  }

  const selectedCount = selected.size;

  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.venueLabel, { color: colors.text }]}>
        {result.venue_name ?? "Tonight's Show"}
      </Text>
      <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
        Tonight's Lineup
      </Text>

      <ScrollView
        style={{ flex: 1, marginTop: 16 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {result.artists.map((artist) => {
          if (!artist.performer_id) return null;
          const isChecked = selected.has(artist.performer_id);
          return (
            <TouchableOpacity
              key={artist.performer_id}
              style={styles.artistRow}
              onPress={() => toggleArtist(artist.performer_id!)}
              activeOpacity={0.75}
            >
              {/* Checkbox */}
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isChecked ? colors.pink : "transparent",
                    borderColor: isChecked ? colors.pink : colors.border,
                  },
                ]}
              >
                {isChecked && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>

              {/* Artist info */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.artistName, { color: colors.text }]}>
                  {artist.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        onPress={handleCollectAll}
        disabled={selectedCount === 0}
        style={[
          styles.primaryButton,
          { backgroundColor: selectedCount > 0 ? colors.pink : colors.pink + "55" },
        ]}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>
          Collect All ({selectedCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------- Medium-confidence variant ----------

function MediumConfidenceView({
  result,
  onCollect,
  onManualFallback,
}: Pick<Props, "result" | "onCollect" | "onManualFallback">) {
  const colors = useThemeColors();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(result.artists.map((a) => a.performer_id ?? "").filter(Boolean))
  );

  function toggleArtist(performerId: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(performerId)) {
        next.delete(performerId);
      } else {
        next.add(performerId);
      }
      return next;
    });
  }

  const selectedCount = selected.size;

  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.confidenceHeader, { color: colors.text }]}>
        Does this look right?
      </Text>
      {result.venue_name && (
        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
          {result.venue_name}
        </Text>
      )}

      <ScrollView
        style={{ flex: 1, marginTop: 16 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {result.artists.map((artist) => {
          if (!artist.performer_id) return null;
          const isChecked = selected.has(artist.performer_id);
          return (
            <TouchableOpacity
              key={artist.performer_id}
              style={styles.artistRow}
              onPress={() => toggleArtist(artist.performer_id!)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isChecked ? colors.pink : "transparent",
                    borderColor: isChecked ? colors.pink : colors.border,
                  },
                ]}
              >
                {isChecked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.artistName, { color: colors.text }]}>
                {artist.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Source attribution */}
        <Text style={[styles.sourceText, { color: colors.textTertiary }]}>
          Found via {result.source}
        </Text>
      </ScrollView>

      <TouchableOpacity
        onPress={() => onCollect([...selected])}
        disabled={selectedCount === 0}
        style={[
          styles.primaryButton,
          { backgroundColor: selectedCount > 0 ? colors.pink : colors.pink + "55" },
        ]}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>Yes, Collect ({selectedCount})</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onManualFallback}
        style={styles.textButton}
        activeOpacity={0.7}
      >
        <Text style={[styles.textButtonLabel, { color: colors.textSecondary }]}>
          No, enter manually
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------- Low-confidence variant ----------

type LinkState = {
  input: string;
  status: "idle" | "validating" | "valid" | "invalid";
  validatedPerformerId: string | null;
  artistName: string;
};

function LowConfidenceView({
  result,
  onCollect,
  onManualFallback,
}: Pick<Props, "result" | "onCollect" | "onManualFallback">) {
  const colors = useThemeColors();
  const validate = useValidateArtistLink();

  // Per-artist link state
  const [linkStates, setLinkStates] = useState<Record<string, LinkState>>(() => {
    const init: Record<string, LinkState> = {};
    result.artists.forEach((a) => {
      init[a.name] = {
        input: a.platform_url ?? "",
        status: "idle",
        validatedPerformerId: a.performer_id,
        artistName: a.name,
      };
    });
    return init;
  });

  function setLinkField(name: string, input: string) {
    setLinkStates((prev) => ({
      ...prev,
      [name]: { ...prev[name], input, status: "idle", validatedPerformerId: null },
    }));
  }

  async function handleValidate(name: string) {
    const link = linkStates[name].input.trim();
    if (!link) return;

    setLinkStates((prev) => ({
      ...prev,
      [name]: { ...prev[name], status: "validating" },
    }));

    try {
      const res = await validate.mutateAsync({ url: link });
      if (res.eligible && res.existing_performer) {
        setLinkStates((prev) => ({
          ...prev,
          [name]: {
            ...prev[name],
            status: "valid",
            validatedPerformerId: res.existing_performer!.id,
          },
        }));
      } else {
        setLinkStates((prev) => ({
          ...prev,
          [name]: { ...prev[name], status: "invalid", validatedPerformerId: null },
        }));
      }
    } catch {
      setLinkStates((prev) => ({
        ...prev,
        [name]: { ...prev[name], status: "invalid", validatedPerformerId: null },
      }));
    }
  }

  const validatedIds = Object.values(linkStates)
    .filter((s) => s.validatedPerformerId && s.status === "valid")
    .map((s) => s.validatedPerformerId as string);

  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.confidenceHeader, { color: colors.text }]}>
        We found some possibilities
      </Text>
      {result.venue_name && (
        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
          {result.venue_name}
        </Text>
      )}

      <ScrollView
        style={{ flex: 1, marginTop: 16 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {result.artists.map((artist) => {
          const ls = linkStates[artist.name];
          const isValid = ls?.status === "valid";
          const isValidating = ls?.status === "validating";
          const isInvalid = ls?.status === "invalid";

          return (
            <View
              key={artist.name}
              style={[
                styles.lowConfArtistCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isValid ? colors.pink : colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.artistName, { color: colors.text }]}>
                {artist.name}
              </Text>
              <Text style={[styles.pastePrompt, { color: colors.textSecondary }]}>
                Paste a link to verify
              </Text>
              <View style={styles.linkRow}>
                <TextInput
                  style={[
                    styles.linkInput,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: isValid
                        ? colors.pink
                        : isInvalid
                        ? "#FF6B6B"
                        : colors.inputBorder,
                      color: colors.text,
                      flex: 1,
                    },
                  ]}
                  placeholder="Spotify, Apple Music, or SoundCloud URL"
                  placeholderTextColor={colors.textTertiary}
                  value={ls?.input ?? ""}
                  onChangeText={(text) => setLinkField(artist.name, text)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <TouchableOpacity
                  onPress={() => handleValidate(artist.name)}
                  disabled={isValidating || !ls?.input}
                  style={[
                    styles.verifyButton,
                    { backgroundColor: isValid ? colors.teal : colors.purple },
                  ]}
                  activeOpacity={0.8}
                >
                  {isValidating ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>
                      {isValid ? "✓" : "Verify"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              {isInvalid && (
                <Text style={[styles.errorMsg, { color: "#FF6B6B" }]}>
                  Couldn't verify this artist. Check the link and try again.
                </Text>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          onPress={onManualFallback}
          style={styles.textButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.textButtonLabel, { color: colors.textSecondary }]}>
            Enter manually instead
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {validatedIds.length > 0 && (
        <TouchableOpacity
          onPress={() => onCollect(validatedIds)}
          style={[styles.primaryButton, { backgroundColor: colors.pink }]}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>
            Collect ({validatedIds.length} verified)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---------- Main export ----------

export function ConfidenceLineupScreen({ result, onCollect, onManualFallback, onBack }: Props) {
  if (result.confidence === "high") {
    return <HighConfidenceView result={result} onCollect={onCollect} />;
  }
  if (result.confidence === "medium") {
    return (
      <MediumConfidenceView
        result={result}
        onCollect={onCollect}
        onManualFallback={onManualFallback}
      />
    );
  }
  // low
  return (
    <LowConfidenceView
      result={result}
      onCollect={onCollect}
      onManualFallback={onManualFallback}
    />
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  venueLabel: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
  },
  confidenceHeader: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
  },
  subLabel: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sourceText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 12,
    textAlign: "center",
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    lineHeight: 18,
  },
  artistName: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#FFFFFF",
  },
  textButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  textButtonLabel: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  lowConfArtistCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 6,
  },
  pastePrompt: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  linkInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    minHeight: 42,
  },
  verifyButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
    minHeight: 42,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  errorMsg: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },
});
