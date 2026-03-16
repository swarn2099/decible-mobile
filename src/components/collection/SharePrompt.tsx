import { useEffect, useState } from "react";
import { Share, ActivityIndicator, View, Text, Modal, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useThemeColors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

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

    // Determine share content (with optional image card)
    let imageUrl: string | null = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(
        "https://decibel-three.vercel.app/api/social/collection-card",
        {
          method: "POST",
          headers,
          body: JSON.stringify({ performer_slug: performerSlug }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data?.image_url) {
          imageUrl = data.image_url as string;
        }
      }
    } catch {
      // Card generation failed — proceed with text-only share
    }

    // Hide loading overlay BEFORE calling Share.share() to avoid modal conflicts on iOS
    setLoading(false);
    onDone();

    // Small delay ensures the loading modal is dismissed before the share sheet appears
    setTimeout(async () => {
      try {
        const shareContent = imageUrl
          ? {
              message: `I just collected ${performerName} on Decibel! Check them out: https://decible.live/artist/${performerSlug}`,
              url: imageUrl,
            }
          : {
              message: `I just collected ${performerName} on Decibel! Check them out: https://decible.live/artist/${performerSlug}`,
            };
        await Share.share(shareContent);
      } catch {
        // User cancelled or share not supported — no-op
      }
    }, 300);
  };

  if (!visible) return null;

  // Show a brief loading overlay while generating the share card
  if (loading) {
    return (
      <Modal visible transparent animationType="fade">
        <BlurView
          intensity={30}
          tint="dark"
          style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <View style={{ alignItems: "center", gap: 16 }}>
            <ActivityIndicator size="large" color={colors.purple} />
            <Text
              style={{
                color: "#FFFFFF",
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
