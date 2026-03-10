import React from "react";
import { View, Text, Pressable } from "react-native";
import { useThemeColors } from "@/constants/colors";

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export function EmptyState({ icon, title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        alignItems: "center",
        paddingTop: 60,
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        {icon}
      </View>

      <Text
        style={{
          fontSize: 18,
          fontFamily: "Poppins_600SemiBold",
          color: colors.text,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          fontSize: 14,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 20,
          maxWidth: 280,
          marginBottom: ctaLabel ? 24 : 0,
        }}
      >
        {subtitle}
      </Text>

      {ctaLabel && onCta && (
        <Pressable
          onPress={onCta}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#8A5CE6" : colors.purple,
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 28,
          })}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: "Poppins_700Bold",
              color: "#FFFFFF",
            }}
          >
            {ctaLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
