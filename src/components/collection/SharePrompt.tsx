import { useEffect, useState } from "react";
import { Share, ActivityIndicator, View, Text, Modal, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { useThemeColors } from "@/constants/colors";

type SharePromptProps = {
  visible: boolean;
  performerName: string;
  performerSlug: string;
  onDone: () => void;
};

export function SharePrompt({
  visible,
  performerName,
  performerSlug,
  onDone,
}: SharePromptProps) {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      triggerShare();
    }
  }, [visible]);

  const triggerShare = async () => {
    setLoading(true);

    try {
      // Try to generate a shareable card from the web API
      const res = await fetch(
        "https://decibel-three.vercel.app/api/social/collection-card",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ performer_slug: performerSlug }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.image_url) {
          await Share.share({
            message: `I just collected ${performerName} on Decibel! Check them out: https://decible.live/artist/${performerSlug}`,
            url: data.image_url,
          });
          onDone();
          return;
        }
      }
    } catch {
      // Fall through to text-only share
    }

    // Fallback: text-only share
    try {
      await Share.share({
        message: `I just collected ${performerName} on Decibel! Check them out: https://decible.live/artist/${performerSlug}`,
      });
    } catch {
      // User cancelled or share failed — that's fine
    }

    setLoading(false);
    onDone();
  };

  if (!visible) return null;

  // Show a brief loading overlay while generating card
  if (loading) {
    return (
      <Modal visible transparent animationType="fade">
        <BlurView
          intensity={30}
          tint="dark"
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
          }}
        >
          <View style={{ alignItems: "center", gap: 16 }}>
            <ActivityIndicator size="large" color={colors.purple} />
            <Text
              style={{
                color: colors.white,
                fontFamily: "Poppins_500Medium",
                fontSize: 16,
              }}
            >
              Preparing share...
            </Text>
          </View>
        </BlurView>
      </Modal>
    );
  }

  return null;
}
