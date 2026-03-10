import { useState, useEffect } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { Mail } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { useThemeColors } from "@/constants/colors";

const RESEND_COOLDOWN = 60;

export default function VerifyScreen() {
  const colors = useThemeColors();
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setError("");

    try {
      const redirectUrl = Linking.createURL("auth/callback");

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectUrl,
        },
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError("Failed to resend link.");
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.decibel }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${colors.pink}26`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Mail size={40} color={colors.pink} />
          </View>
        </View>

        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Text
            style={{
              fontFamily: "Poppins_700Bold",
              fontSize: 24,
              color: colors.text,
              marginBottom: 8,
            }}
          >
            Check your email
          </Text>
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 16,
              color: colors.gray,
              textAlign: "center",
            }}
          >
            We sent a magic link to
          </Text>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 16,
              color: colors.pink,
              marginTop: 4,
            }}
          >
            {email}
          </Text>
        </View>

        {/* Instructions */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 14,
              color: colors.gray,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Tap the link in your email to sign in.{"\n"}
            The app will open automatically.
          </Text>
        </View>

        {/* Error */}
        {error ? (
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 14,
              color: colors.pink,
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {error}
          </Text>
        ) : null}

        {/* Resend + Back */}
        <View style={{ alignItems: "center" }}>
          {cooldown > 0 ? (
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 14,
                color: colors.gray,
              }}
            >
              Resend link in {cooldown}s
            </Text>
          ) : (
            <Button
              title={resending ? "Sending..." : "Resend Magic Link"}
              onPress={handleResend}
              variant="secondary"
              loading={resending}
            />
          )}

          <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
            <Text
              style={{
                fontFamily: "Poppins_500Medium",
                fontSize: 14,
                color: colors.gray,
              }}
            >
              Back to login
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
