import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import { Camera, MessageCircle, Link2, Download } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";

const SCREEN_WIDTH = Dimensions.get("window").width;

type Props = {
  visible: boolean;
  onClose: () => void;
  imageUri: string | null;
  shareUrl?: string;
  isGenerating?: boolean;
};

export function ShareSheet({
  visible,
  onClose,
  imageUri,
  shareUrl,
  isGenerating = false,
}: Props) {
  const colors = useThemeColors();
  const [copiedLink, setCopiedLink] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleInstagramStories = async () => {
    if (!imageUri) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (Platform.OS === "ios") {
        // Check if Instagram is installed before attempting Stories share
        const igInstalled = await Linking.canOpenURL("instagram-stories://share");
        if (igInstalled) {
          // UTI approach is most reliable on iOS with IG installed
          await Sharing.shareAsync(imageUri, {
            mimeType: "image/png",
            UTI: "com.instagram.exclusivegram",
          });
        } else {
          // IG not installed — fall back to generic system share sheet
          await Share.share({
            url: imageUri,
            message: shareUrl ?? "",
          });
        }
      } else {
        // Android: IG appears in the system share sheet naturally
        // UTI approach doesn't work on Android
        await Share.share({
          url: imageUri,
          message: shareUrl ?? "",
        });
      }
    } catch {
      // Any error → generic share sheet as final fallback
      await Share.share({
        url: imageUri,
        message: shareUrl ?? "",
      });
    }
  };

  const handleMessage = async () => {
    if (!imageUri) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        url: imageUri,
        message: shareUrl
          ? `Check out my Decibel passport! ${shareUrl}`
          : "Check out my Decibel passport!",
      });
    } catch {
      // User cancelled or error — no-op
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSave = async () => {
    if (!imageUri) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") return;
      await MediaLibrary.saveToLibraryAsync(imageUri);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Permission denied or save failed
    }
  };

  const handleClose = () => {
    setCopiedLink(false);
    setSaved(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={[styles.sheet, { backgroundColor: colors.card }]}
          activeOpacity={1}
          onPress={() => {}}
        >
          {/* Drag handle */}
          <View style={[styles.handle, { backgroundColor: colors.lightGray }]} />

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>Share</Text>

          {/* Preview */}
          <View style={styles.previewContainer}>
            {isGenerating ? (
              <View style={[styles.previewPlaceholder, { backgroundColor: colors.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }]}>
                <ActivityIndicator color={colors.pink} size="large" />
                <Text style={[styles.generatingText, { color: colors.gray }]}>Generating card...</Text>
              </View>
            ) : imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                contentFit="contain"
              />
            ) : (
              <View style={[styles.previewPlaceholder, { backgroundColor: colors.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }]}>
                <Text style={[styles.generatingText, { color: colors.pink }]}>Failed to generate card. Try again.</Text>
              </View>
            )}
          </View>

          {/* Share options row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.option}
              onPress={handleInstagramStories}
              disabled={!imageUri}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: `${colors.purple}26` },
                ]}
              >
                <Camera size={22} color={colors.purple} />
              </View>
              <Text style={[styles.optionLabel, { color: colors.text }]}>Stories</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={handleMessage}
              disabled={!imageUri}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: `${colors.blue}26` },
                ]}
              >
                <MessageCircle size={22} color={colors.blue} />
              </View>
              <Text style={[styles.optionLabel, { color: colors.text }]}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={handleCopyLink}
              disabled={!shareUrl}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: `${colors.teal}26` },
                ]}
              >
                <Link2 size={22} color={colors.teal} />
              </View>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                {copiedLink ? "Copied!" : "Copy Link"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={handleSave}
              disabled={!imageUri}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: `${colors.pink}26` },
                ]}
              >
                <Download size={22} color={colors.pink} />
              </View>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                {saved ? "Saved!" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  previewPlaceholder: {
    width: SCREEN_WIDTH - 80,
    height: 200,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  generatingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  previewImage: {
    width: SCREEN_WIDTH - 80,
    height: 200,
    borderRadius: 16,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  option: {
    alignItems: "center",
    gap: 8,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  optionLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
});
