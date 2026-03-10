import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Music, MapPin } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";

type AddMode = "artist" | "show";

function AddArtistView() {
  const colors = useThemeColors();

  return (
    <View style={styles.modeContent}>
      <View
        style={[
          styles.pasteArea,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          },
        ]}
      >
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
          Paste a Spotify, Apple Music, or SoundCloud link...
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
          Be the first to add an artist to Decibel and earn the Founder badge
        </Text>
      </View>
    </View>
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
  },
});
