import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { Mail, KeyRound } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { useThemeColors } from "@/constants/colors";

const RESEND_COOLDOWN = 60;
const REVIEW_EMAIL = "apple-review@decibel.app";
const REVIEW_CODE = "123456";

export default function VerifyScreen() {
  const colors = useThemeColors();
  const { email, reviewMode } = useLocalSearchParams<{
    email: string;
    reviewMode?: string;
  }>();
  const router = useRouter();
  const isReview = reviewMode === "1" && email === REVIEW_EMAIL;
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [reviewCode, setReviewCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleReviewLogin = async () => {
    const trimmedCode = reviewCode.trim();
    if (trimmedCode.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setError("");
    setVerifying(true);

    try {
      const API_BASE =
        process.env.EXPO_PUBLIC_API_URL ?? "https://decibel-three.vercel.app/api";
      const res = await fetch(`${API_BASE}/mobile/review-auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: REVIEW_EMAIL, code: trimmedCode }),
      });

      const data = await res.json();

      if (!res.ok || !data.access_token) {
        setError(data.error ?? "Invalid code");
        return;
      }

      // Set the session in Supabase client
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

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
            {isReview ? (
              <KeyRound size={40} color={colors.pink} />
            ) : (
              <Mail size={40} color={colors.pink} />
            )}
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
            {isReview ? "Enter access code" : "Check your email"}
          </Text>
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 16,
              color: colors.gray,
              textAlign: "center",
            }}
          >
            {isReview
              ? "Enter the 6-digit code to sign in"
              : "We sent a magic link to"}
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

        {isReview ? (
          <>
            {/* Review mode: 6-digit code input */}
            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <TextInput
                style={{
                  width: "100%",
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: error ? colors.pink : colors.cardBorder,
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 24,
                  color: colors.text,
                  letterSpacing: 12,
                  textAlign: "center",
                }}
                placeholder="------"
                placeholderTextColor={colors.gray}
                value={reviewCode}
                onChangeText={(t) => {
                  const digits = t.replace(/[^0-9]/g, "").slice(0, 6);
                  setReviewCode(digits);
                  if (error) setError("");
                }}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                onSubmitEditing={handleReviewLogin}
                autoFocus
              />
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

            <Button
              title="Sign In"
              onPress={handleReviewLogin}
              loading={verifying}
              disabled={reviewCode.length !== 6}
            />

            <Pressable
              onPress={() => router.back()}
              style={{ alignSelf: "center", marginTop: 24 }}
            >
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
          </>
        ) : (
          <>
            {/* Normal magic link flow */}
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

              <Pressable
                onPress={() => router.back()}
                style={{ marginTop: 24 }}
              >
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
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
