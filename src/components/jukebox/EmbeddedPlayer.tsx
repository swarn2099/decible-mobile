import { useEffect, useRef } from "react";
import { View } from "react-native";
import WebView from "react-native-webview";
import { Music2 } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";

type Props = {
  embedUrl: string;
  isActive: boolean;
  height?: number;
};

export function EmbeddedPlayer({ embedUrl, isActive, height = 152 }: Props) {
  const colors = useThemeColors();
  const webViewRef = useRef<WebView>(null);

  // Pause audio/video when this player is deactivated (pool eviction — JBX-08)
  useEffect(() => {
    if (!isActive && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        "document.querySelectorAll('audio,video').forEach(el => el.pause()); true;"
      );
    }
  }, [isActive]);

  if (!isActive) {
    // Placeholder — same dimensions, no active WebView
    return (
      <View
        style={{
          height,
          borderRadius: 12,
          backgroundColor: colors.cardHover,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Music2 size={28} color={colors.textTertiary} />
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: embedUrl }}
      style={{ height, borderRadius: 12 }}
      // JBX-07: CRITICAL — prevents embed autoplay from interrupting background music
      mediaPlaybackRequiresUserAction={true}
      allowsInlineMediaPlayback={true}
      javaScriptEnabled={true}
      scrollEnabled={false}
    />
  );
}
