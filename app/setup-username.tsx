import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";

import { useThemeColors } from "@/constants/colors";
import { apiCall } from "@/lib/api";

export default function SetupUsernameScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleContinue = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a name");
      return;
    }

    setError("");
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await apiCall("/mobile/settings", {
        method: "POST",
        body: JSON.stringify({ name: trimmed.slice(0, 50) }),
      });

      // Invalidate fan profile so _layout picks up the new name
      queryClient.invalidateQueries({ queryKey: ["fanProfile"] });
      queryClient.invalidateQueries({ queryKey: ["passport"] });

      router.replace("/(tabs)");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isDisabled = !username.trim() || saving;
  const inputBorderColor = error
    ? colors.pink
    : isFocused
      ? colors.pink
      : colors.inputBorder;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          {/* Wordmark */}
          <View style={{ alignItems: "center", marginBottom: 48 }}>
            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 20,
                letterSpacing: 6,
                color: colors.textPrimary,
              }}
            >
              D E C I B E L
            </Text>
          </View>

          {/* Heading */}
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 22,
              color: colors.text,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            What should we call you?
          </Text>

          {/* Username input */}
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.inputBg,
                borderRadius: 12,
                height: 52,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: inputBorderColor,
                ...(isFocused && !error
                  ? {
                      shadowColor: colors.pink,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }
                  : {}),
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  fontFamily: "Poppins_400Regular",
                  fontSize: 16,
                  color: colors.textPrimary,
                  height: 52,
                  padding: 0,
                }}
                placeholder="Your name"
                placeholderTextColor={colors.gray}
                value={username}
                onChangeText={(t) => {
                  setUsername(t);
                  if (error) setError("");
                }}
                autoCapitalize="words"
                autoComplete="name"
                maxLength={50}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </View>
            {error ? (
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 13,
                  color: colors.pink,
                  marginTop: 6,
                  marginLeft: 4,
                }}
              >
                {error}
              </Text>
            ) : null}
          </View>

          {/* Continue button */}
          <Pressable
            onPress={handleContinue}
            disabled={isDisabled}
            style={{ opacity: isDisabled ? 0.5 : 1 }}
          >
            <LinearGradient
              colors={["#FF4D6A", "#9B6DFF"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{
                height: 52,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 16,
                    color: "#FFFFFF",
                  }}
                >
                  Continue
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
