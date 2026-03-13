import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated as RNAnimated,
  Dimensions,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, KeyRound, ArrowLeft } from "lucide-react-native";
import { supabase } from "@/lib/supabase";

const RESEND_COOLDOWN = 60;
const REVIEW_EMAIL = "apple-review@decibel.app";
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Reuse the same orb component inline
function GradientOrb({
  color,
  size,
  startX,
  startY,
  duration,
  delay,
}: {
  color: string;
  size: number;
  startX: number;
  startY: number;
  duration: number;
  delay: number;
}) {
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const translateY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const driftX = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.delay(delay),
        RNAnimated.timing(translateX, { toValue: 40, duration, useNativeDriver: true }),
        RNAnimated.timing(translateX, { toValue: -30, duration: duration * 0.8, useNativeDriver: true }),
        RNAnimated.timing(translateX, { toValue: 0, duration: duration * 0.6, useNativeDriver: true }),
      ]),
    );
    const driftY = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.delay(delay + 500),
        RNAnimated.timing(translateY, { toValue: -35, duration: duration * 0.9, useNativeDriver: true }),
        RNAnimated.timing(translateY, { toValue: 25, duration, useNativeDriver: true }),
        RNAnimated.timing(translateY, { toValue: 0, duration: duration * 0.7, useNativeDriver: true }),
      ]),
    );
    driftX.start();
    driftY.start();
    return () => { driftX.stop(); driftY.stop(); };
  }, []);

  return (
    <RNAnimated.View
      style={{
        position: "absolute",
        left: startX - size / 2,
        top: startY - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.18,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
}

export default function VerifyScreen() {
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

  // Fade-in
  const contentOpacity = useRef(new RNAnimated.Value(0)).current;
  const contentY = useRef(new RNAnimated.Value(20)).current;
  const buttonScale = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    RNAnimated.parallel([
      RNAnimated.timing(contentOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      RNAnimated.timing(contentY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "https://decibel-three.vercel.app/api";
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
        options: { shouldCreateUser: true, emailRedirectTo: redirectUrl },
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setError("Failed to resend link.");
    } finally {
      setResending(false);
    }
  };

  const onPressIn = () => {
    RNAnimated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const onPressOut = () => {
    RNAnimated.spring(buttonScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0B0F" }}>
      <StatusBar barStyle="light-content" />

      {/* Gradient orbs */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
        <GradientOrb color="#FF4D6A" size={280} startX={SCREEN_W * 0.2} startY={SCREEN_H * 0.15} duration={8000} delay={0} />
        <GradientOrb color="#9B6DFF" size={320} startX={SCREEN_W * 0.75} startY={SCREEN_H * 0.3} duration={10000} delay={1000} />
        <GradientOrb color="#4D9AFF" size={240} startX={SCREEN_W * 0.5} startY={SCREEN_H * 0.65} duration={9000} delay={500} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <RNAnimated.View
            style={{
              opacity: contentOpacity,
              transform: [{ translateY: contentY }],
            }}
          >
            {/* Icon */}
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "rgba(255,77,106,0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isReview ? (
                  <KeyRound size={40} color="#FF4D6A" />
                ) : (
                  <Mail size={40} color="#FF4D6A" />
                )}
              </View>
            </View>

            {/* Header */}
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <Text
                style={{
                  fontFamily: "Poppins_700Bold",
                  fontSize: 24,
                  color: "#FFFFFF",
                  marginBottom: 8,
                }}
              >
                {isReview ? "Enter access code" : "Check your email"}
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 16,
                  color: "#8E8E93",
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
                  color: "#FF4D6A",
                  marginTop: 4,
                }}
              >
                {email}
              </Text>
            </View>

            {isReview ? (
              <>
                {/* Code input */}
                <View style={{ alignItems: "center", marginBottom: 24 }}>
                  <TextInput
                    style={{
                      width: "100%",
                      backgroundColor: "#1A1A1F",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: error ? "#FF4D6A" : "rgba(255,255,255,0.12)",
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      fontFamily: "Poppins_600SemiBold",
                      fontSize: 24,
                      color: "#FFFFFF",
                      letterSpacing: 12,
                      textAlign: "center",
                    }}
                    placeholder="------"
                    placeholderTextColor="#8E8E93"
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

                {error ? (
                  <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 14, color: "#FF4D6A", textAlign: "center", marginBottom: 16 }}>
                    {error}
                  </Text>
                ) : null}

                <RNAnimated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <Pressable
                    onPress={handleReviewLogin}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    disabled={reviewCode.length !== 6 || verifying}
                    style={{ opacity: reviewCode.length !== 6 || verifying ? 0.5 : 1 }}
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
                      {verifying ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#FFFFFF" }}>
                          Sign In
                        </Text>
                      )}
                    </LinearGradient>
                  </Pressable>
                </RNAnimated.View>

                <Pressable onPress={() => router.back()} style={{ alignSelf: "center", marginTop: 24, flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <ArrowLeft size={16} color="#8E8E93" />
                  <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 14, color: "#8E8E93" }}>
                    Back to login
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* Magic link flow */}
                <View style={{ alignItems: "center", marginBottom: 32 }}>
                  <Text
                    style={{
                      fontFamily: "Poppins_400Regular",
                      fontSize: 14,
                      color: "#8E8E93",
                      textAlign: "center",
                      lineHeight: 20,
                    }}
                  >
                    Tap the link in your email to sign in.{"\n"}
                    The app will open automatically.
                  </Text>
                </View>

                {error ? (
                  <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 14, color: "#FF4D6A", textAlign: "center", marginBottom: 16 }}>
                    {error}
                  </Text>
                ) : null}

                <View style={{ alignItems: "center" }}>
                  {cooldown > 0 ? (
                    <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 14, color: "#8E8E93" }}>
                      Resend link in {cooldown}s
                    </Text>
                  ) : (
                    <RNAnimated.View style={{ transform: [{ scale: buttonScale }], width: "100%" }}>
                      <Pressable
                        onPress={handleResend}
                        onPressIn={onPressIn}
                        onPressOut={onPressOut}
                        disabled={resending}
                        style={{ opacity: resending ? 0.5 : 1 }}
                      >
                        <View
                          style={{
                            height: 52,
                            borderRadius: 12,
                            backgroundColor: "#1A1A1F",
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.15)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {resending ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#FFFFFF" }}>
                              Resend Magic Link
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    </RNAnimated.View>
                  )}

                  <Pressable
                    onPress={() => router.back()}
                    style={{ marginTop: 24, flexDirection: "row", alignItems: "center", gap: 6 }}
                  >
                    <ArrowLeft size={16} color="#8E8E93" />
                    <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 14, color: "#8E8E93" }}>
                      Back to login
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </RNAnimated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
