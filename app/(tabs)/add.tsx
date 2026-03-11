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
import { SafeAreaView } from "react-native-safe-area-context";
import { Music, MapPin, X } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { useValidateArtistLink } from "@/hooks/useValidateArtistLink";
import { useAddArtist } from "@/hooks/useAddArtist";
import { useDiscoverArtist } from "@/hooks/useDiscoverArtist";
import { useFounderShareCard } from "@/hooks/useShareCard";
import { useAuthStore } from "@/stores/authStore";
import { ArtistPreviewCard } from "@/components/add/ArtistPreviewCard";
import { CheckInWizard } from "@/components/checkin/CheckInWizard";
import { ConfirmationModal } from "@/components/collection/ConfirmationModal";
import { ShareSheet } from "@/components/passport/ShareSheet";
import type { TierName } from "@/hooks/useCollection";

type AddMode = "artist" | "show";

type CelebrationState = {
  visible: boolean;
  type: "founded" | "discover" | "collect";
  performerName: string;
  performerPhoto: string | null;
  result: {
    scan_count: number;
    current_tier: TierName;
    tierUp: boolean;
    alreadyDone: boolean;
  };
};

const DEFAULT_CELEBRATION: CelebrationState = {
  visible: false,
  type: "collect",
  performerName: "",
  performerPhoto: null,
  result: {
    scan_count: 1,
    current_tier: "network",
    tierUp: false,
    alreadyDone: false,
  },
};

function AddArtistView() {
  const colors = useThemeColors();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [pastedUrl, setPastedUrl] = useState("");
  const validateMutation = useValidateArtistLink();
  const addMutation = useAddArtist();
  const discoverMutation = useDiscoverArtist();
  const founderShareCard = useFounderShareCard();

  const [celebration, setCelebration] = useState<CelebrationState>(DEFAULT_CELEBRATION);
  const [shareCardUri, setShareCardUri] = useState<string | null>(null);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const fanSlug = user?.email?.split("@")[0] ?? "user";

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
    addMutation.reset();
    discoverMutation.reset();
    setShareCardUri(null);
    setPendingSlug(null);
  }

  function handleAdd() {
    const artist = validateMutation.data?.artist;
    if (!artist) return;

    addMutation.mutate(
      {
        platform: artist.platform,
        spotifyId: artist.spotify_id,
        soundcloudUsername: artist.soundcloud_username,
        appleMusicUrl: artist.apple_music_url,
        name: artist.name,
        photoUrl: artist.photo_url,
        genres: artist.genres,
        followers: artist.follower_count ?? 0,
        monthlyListeners: artist.monthly_listeners ?? undefined,
      },
      {
        onSuccess: (result) => {
          const celebType: "founded" | "collect" = result.is_founder ? "founded" : "collect";
          setPendingSlug(result.performer.slug);

          // Fire-and-forget: pre-generate share card for founded
          if (result.is_founder) {
            setShareCardUri(null);
            founderShareCard
              .generate({
                artistName: result.performer.name,
                artistPhoto: artist.photo_url,
                fanSlug,
              })
              .then((uri) => setShareCardUri(uri))
              .catch(() => setShareCardUri(null));
          }

          setCelebration({
            visible: true,
            type: celebType,
            performerName: result.performer.name,
            performerPhoto: artist.photo_url,
            result: {
              scan_count: 1,
              current_tier: "network",
              tierUp: false,
              alreadyDone: result.already_exists,
            },
          });
          setPastedUrl("");
          validateMutation.reset();
        },
      }
    );
  }

  function handleDiscover() {
    const existing = validateMutation.data?.existing_performer;
    if (!existing) return;

    discoverMutation.mutate(
      { performerId: existing.id },
      {
        onSuccess: (result) => {
          setPendingSlug(result.performer.slug);
          setCelebration({
            visible: true,
            type: "discover",
            performerName: result.performer.name,
            performerPhoto: null,
            result: {
              scan_count: 0,
              current_tier: "network",
              tierUp: false,
              alreadyDone: false,
            },
          });
          setPastedUrl("");
          validateMutation.reset();
        },
      }
    );
  }

  function handleCelebrationDismiss() {
    const slug = pendingSlug;
    setCelebration(DEFAULT_CELEBRATION);
    setShareCardUri(null);
    setPendingSlug(null);
    if (slug) {
      router.push(`/artist/${slug}`);
    }
  }

  function handleShare() {
    // Cancel auto-dismiss; open share sheet
    setCelebration((prev) => ({ ...prev, visible: false }));
    setShareSheetVisible(true);
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Paste area */}
        <TouchableOpacity
          onPress={handlePaste}
          disabled={validateMutation.isPending}
          activeOpacity={0.7}
          style={[
            styles.pasteArea,
            {
              backgroundColor: colors.inputBg,
              borderColor: validateMutation.isError
                ? colors.pink
                : colors.inputBorder,
            },
          ]}
        >
          {validateMutation.isPending ? (
            <ActivityIndicator color={colors.pink} size="large" />
          ) : (
            <>
              <Music size={32} color={colors.textTertiary} />
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "Poppins_500Medium",
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: 12,
                }}
              >
                Tap to paste a link
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Poppins_400Regular",
                  color: colors.textTertiary,
                  textAlign: "center",
                  marginTop: 4,
                }}
              >
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
        {validateMutation.isError && (
          <View style={[styles.errorBanner, { backgroundColor: colors.pink + "22" }]}>
            <Text style={[styles.errorText, { color: colors.pink }]}>
              {validateMutation.error?.message ?? "Something went wrong. Check the link and try again."}
            </Text>
            <TouchableOpacity onPress={handleReset} style={styles.retryButton}>
              <Text style={[styles.retryText, { color: colors.pink }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Preview card */}
        {validateMutation.isSuccess && validateMutation.data && (
          <>
            <ArtistPreviewCard
              result={validateMutation.data}
              onAdd={handleAdd}
              onDiscover={handleDiscover}
              isLoading={addMutation.isPending || discoverMutation.isPending}
            />

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

      {/* Post-found celebration modal */}
      <ConfirmationModal
        visible={celebration.visible}
        type={celebration.type}
        performer={{
          name: celebration.performerName,
          photo_url: celebration.performerPhoto,
        }}
        result={celebration.result}
        shareCardUri={shareCardUri}
        onShare={handleShare}
        onDismiss={handleCelebrationDismiss}
      />

      {/* Share sheet */}
      <ShareSheet
        visible={shareSheetVisible}
        onClose={() => {
          setShareSheetVisible(false);
          const slug = pendingSlug;
          setPendingSlug(null);
          if (slug) {
            router.push(`/artist/${slug}`);
          }
        }}
        imageUri={shareCardUri}
        isGenerating={founderShareCard.isLoading}
      />
    </>
  );
}


export default function AddScreen() {
  const colors = useThemeColors();
  const [mode, setMode] = useState<AddMode>("artist");

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top"]}
    >
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Header */}
        <Text
          style={{
            fontSize: 28,
            fontFamily: "Poppins_700Bold",
            color: colors.text,
            paddingTop: 16,
            paddingBottom: 20,
          }}
        >
          {mode === "artist" ? "Add an Artist" : "I'm at a Show"}
        </Text>

        {/* Toggle */}
        <View
          style={[
            styles.toggle,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => setMode("artist")}
            activeOpacity={0.7}
            style={[
              styles.toggleButton,
              mode === "artist" && {
                backgroundColor: colors.pink,
              },
            ]}
          >
            <Music
              size={16}
              color={mode === "artist" ? "#FFFFFF" : colors.textSecondary}
            />
            <Text
              style={[
                styles.toggleText,
                {
                  color:
                    mode === "artist" ? "#FFFFFF" : colors.textSecondary,
                },
              ]}
            >
              Add an Artist
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode("show")}
            activeOpacity={0.7}
            style={[
              styles.toggleButton,
              mode === "show" && {
                backgroundColor: colors.pink,
              },
            ]}
          >
            <MapPin
              size={16}
              color={mode === "show" ? "#FFFFFF" : colors.textSecondary}
            />
            <Text
              style={[
                styles.toggleText,
                {
                  color: mode === "show" ? "#FFFFFF" : colors.textSecondary,
                },
              ]}
            >
              I'm at a Show
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {mode === "artist" ? (
          <AddArtistView />
        ) : (
          <CheckInWizard onBack={() => setMode("artist")} />
        )}
      </View>

      {/* Bottom padding for tab bar */}
      <View style={{ height: 20 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  pasteArea: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
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
