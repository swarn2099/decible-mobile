import React from "react";
import { View, Text, Pressable } from "react-native";
import { WifiOff } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  hideRetry?: boolean;
  icon?: React.ReactNode;
};

export function ErrorState({
  message,
  onRetry,
  hideRetry = false,
  icon,
}: ErrorStateProps) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
        paddingBottom: 40,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: `${colors.pink}1F`,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        {icon ?? <WifiOff size={32} color={colors.pink} />}
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
        Connection Error
      </Text>

      <Text
        style={{
          fontSize: 14,
          fontFamily: "Poppins_400Regular",
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 20,
          maxWidth: 280,
          marginBottom: hideRetry ? 0 : 24,
        }}
      >
        {message || "Something went wrong. Check your connection and try again."}
      </Text>

      {!hideRetry && onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "#E63D5A" : colors.pink,
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 32,
          })}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: "Poppins_700Bold",
              color: "#FFFFFF",
            }}
          >
            Retry
          </Text>
        </Pressable>
      )}
    </View>
  );
}
