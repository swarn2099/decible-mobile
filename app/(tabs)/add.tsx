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
import { useThemeColors } from "@/constants/colors";
import { useValidateArtistLink } from "@/hooks/useValidateArtistLink";
import { ArtistPreviewCard } from "@/components/add/ArtistPreviewCard";

type AddMode = "artist" | "show";

function AddArtistView() {
  const colors = useThemeColors();
  const [pastedUrl, setPastedUrl] = useState("");
  const validateMutation = useValidateArtistLink();

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
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
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
            onAdd={() => console.log("Add flow — wired in Plan 02-03")}
            onDiscover={() => console.log("Discover flow — wired in Plan 02-03")}
            isLoading={false}
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
  );
}

function ImAtAShowView() {
  const colors = useThemeColors();

  return (
    <View style={styles.modeContent}>
      <View
        style={[
          styles.pasteArea,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            opacity: 0.6,
          },
        ]}
      >
        <MapPin size={32} color={colors.textTertiary} />
        <Text
          style={{
            fontSize: 15,
            fontFamily: "Poppins_500Medium",
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: 12,
          }}
        >
          Check in at a venue to stamp your passport
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: "Poppins_400Regular",
            color: colors.textTertiary,
            textAlign: "center",
            marginTop: 8,
            paddingHorizontal: 24,
          }}
        >
          We'll detect your location and find tonight's lineup
        </Text>
        <View
          style={[
            styles.comingSoonBadge,
            { backgroundColor: colors.purple + "33", borderColor: colors.purple + "55" },
          ]}
        >
          <Text style={[styles.comingSoonText, { color: colors.purple }]}>Coming soon</Text>
        </View>
      </View>
    </View>
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
        {mode === "artist" ? <AddArtistView /> : <ImAtAShowView />}
      </View>

      {/* Bottom padding for tab bar */}
      <View style={{ height: 100 }} />
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
  modeContent: {
    flex: 1,
    paddingTop: 16,
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
  comingSoonBadge: {
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  comingSoonText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
});
