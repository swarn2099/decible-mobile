import { useEffect, useRef, useState } from "react";
import { Share, ActivityIndicator, View, Text, Modal, StyleSheet } from "react-native";
import { BlurView, BlurTargetView } from "expo-blur";
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
  const bgRef = useRef<View>(null);

  useEffect(() => {
    if (visible) {
      triggerShare();
    }
  }, [visible]);

  const triggerShare = async () => {
    setLoading(true);

    try {
      // Get auth session for Bearer token
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      // Try to generate a shareable card from the web API
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
        if (data.image_url) {
          await Share.share({
            message: `I just collected ${performerName} on Decibel! Check them out: https://decible.live/artist/${performerSlug}`,
            url: data.image_url,
          });
          return;
        }
      }

      // Fallback: text-only share
      await Share.share({
        message: `I just collected ${performerName} on Decibel! Check them out: https://decible.live/artist/${performerSlug}`,
      });
    } catch {
      // Fallback: text-only share (card generation failed or user cancelled)
      try {
        await Share.share({
          message: `I just collected ${performerName} on Decibel! Check them out: https://decible.live/artist/${performerSlug}`,
        });
      } catch {
        // User cancelled or share failed — that's fine
      }
    } finally {
      setLoading(false);
      onDone();
    }
  };

  if (!visible) return null;

  // Show a brief loading overlay while generating card
  if (loading) {
    return (
      <Modal visible transparent animationType="fade">
        <BlurTargetView
          ref={bgRef}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)" }}
        >
          <BlurView
            blurTarget={bgRef}
            intensity={30}
            tint="dark"
            blurMethod="dimezisBlurViewSdk31Plus"
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
          </View>
        </BlurTargetView>
      </Modal>
    );
  }

  return null;
}
