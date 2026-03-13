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
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Check } from "lucide-react-native";
import { supabase } from "@/lib/supabase";

const REVIEW_EMAIL = "apple-review@decibel.app";
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// ─── Animated Gradient Orb ───────────────────────────────────────────
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
        RNAnimated.timing(translateX, {
          toValue: 40,
          duration,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateX, {
          toValue: -30,
          duration: duration * 0.8,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateX, {
          toValue: 0,
          duration: duration * 0.6,
          useNativeDriver: true,
        }),
      ]),
    );
    const driftY = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.delay(delay + 500),
        RNAnimated.timing(translateY, {
          toValue: -35,
          duration: duration * 0.9,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateY, {
          toValue: 25,
          duration,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateY, {
          toValue: 0,
          duration: duration * 0.7,
          useNativeDriver: true,
        }),
      ]),
    );
    driftX.start();
    driftY.start();
    return () => {
      driftX.stop();
      driftY.stop();
    };
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

// ─── Login Screen ────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Stagger fade-in
  const wordmarkOpacity = useRef(new RNAnimated.Value(0)).current;
  const wordmarkY = useRef(new RNAnimated.Value(20)).current;
  const taglineOpacity = useRef(new RNAnimated.Value(0)).current;
  const inputOpacity = useRef(new RNAnimated.Value(0)).current;
  const inputY = useRef(new RNAnimated.Value(20)).current;
  const buttonOpacity = useRef(new RNAnimated.Value(0)).current;
  const buttonY = useRef(new RNAnimated.Value(20)).current;
  const footerOpacity = useRef(new RNAnimated.Value(0)).current;
  const buttonScale = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    RNAnimated.stagger(150, [
      RNAnimated.parallel([
        RNAnimated.timing(wordmarkOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        RNAnimated.timing(wordmarkY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      RNAnimated.timing(taglineOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      RNAnimated.parallel([
        RNAnimated.timing(inputOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        RNAnimated.timing(inputY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
      RNAnimated.parallel([
        RNAnimated.timing(buttonOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        RNAnimated.timing(buttonY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
      RNAnimated.timing(footerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSendLink = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email");
      return;
    }

    setError("");
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (trimmed === REVIEW_EMAIL) {
        router.push({
          pathname: "/(auth)/verify",
          params: { email: trimmed, reviewMode: "1" },
        });
        return;
      }

      const redirectUrl = Linking.createURL("auth/callback");
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: true, emailRedirectTo: redirectUrl },
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      setSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        router.push({ pathname: "/(auth)/verify", params: { email: trimmed } });
      }, 1200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onPressIn = () => {
    RNAnimated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };
  const onPressOut = () => {
    RNAnimated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const isDisabled = !email.trim() || loading || sent;

  return (
    <View style={{ flex: 1, backgroundColor: "#0B0B0F" }}>
      <StatusBar barStyle="light-content" />

      {/* Animated gradient orbs */}
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
          {/* Wordmark */}
          <RNAnimated.View
            style={{
              alignItems: "center",
              marginBottom: 8,
              opacity: wordmarkOpacity,
              transform: [{ translateY: wordmarkY }],
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_700Bold",
                fontSize: 28,
                letterSpacing: 8,
                color: "#FFFFFF",
              }}
            >
              D E C I B E L
            </Text>
          </RNAnimated.View>

          {/* Tagline */}
          <RNAnimated.View style={{ alignItems: "center", marginBottom: 48, opacity: taglineOpacity }}>
            <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 14, color: "#8E8E93" }}>
              Your Live Music Passport
            </Text>
          </RNAnimated.View>

          {/* Email input with icon */}
          <RNAnimated.View
            style={{
              marginBottom: 16,
              opacity: inputOpacity,
              transform: [{ translateY: inputY }],
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#1A1A1F",
                borderRadius: 12,
                height: 52,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: error
                  ? "#FF4D6A"
                  : isFocused
                    ? "#FF4D6A"
                    : "rgba(255,255,255,0.12)",
                ...(isFocused && !error
                  ? {
                      shadowColor: "#FF4D6A",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }
                  : {}),
              }}
            >
              <Mail size={20} color="#8E8E93" style={{ marginRight: 12 }} />
              <TextInput
                style={{
                  flex: 1,
                  fontFamily: "Poppins_400Regular",
                  fontSize: 16,
                  color: "#FFFFFF",
                  height: "100%",
                  padding: 0,
                }}
                placeholder="Email address"
                placeholderTextColor="#8E8E93"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>
            {error ? (
              <Text
                style={{
                  fontFamily: "Poppins_400Regular",
                  fontSize: 13,
                  color: "#FF4D6A",
                  marginTop: 6,
                  marginLeft: 4,
                }}
              >
                {error}
              </Text>
            ) : null}
          </RNAnimated.View>

          {/* Send Magic Link button */}
          <RNAnimated.View
            style={{
              marginBottom: 16,
              opacity: buttonOpacity,
              transform: [{ translateY: buttonY }, { scale: buttonScale }],
            }}
          >
            <Pressable
              onPress={handleSendLink}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={isDisabled}
              style={{ opacity: isDisabled ? 0.5 : 1 }}
            >
              <LinearGradient
                colors={sent ? ["#22C55E", "#16A34A"] : ["#FF4D6A", "#9B6DFF"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  height: 52,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : sent ? (
                  <>
                    <Check size={20} color="#FFFFFF" />
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#FFFFFF" }}>
                      Check your email
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#FFFFFF" }}>
                    Send Magic Link
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </RNAnimated.View>

          {/* Helper text */}
          <RNAnimated.View style={{ opacity: footerOpacity }}>
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 12,
                color: "#8E8E93",
                textAlign: "center",
                marginBottom: 48,
              }}
            >
              We'll send a sign-in link to your email
            </Text>
          </RNAnimated.View>

          {/* Footer */}
          <RNAnimated.View style={{ opacity: footerOpacity, marginBottom: 24 }}>
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 11,
                color: "#6E6E73",
                textAlign: "center",
              }}
            >
              By continuing, you agree to{" "}
              <Text style={{ color: "#FF4D6A" }}>Terms of Service</Text>
              {" & "}
              <Text style={{ color: "#FF4D6A" }}>Privacy Policy</Text>
            </Text>
          </RNAnimated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
