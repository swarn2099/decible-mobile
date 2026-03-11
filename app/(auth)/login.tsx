import { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useThemeColors } from "@/constants/colors";

export default function LoginScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendLink = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const redirectUrl = Linking.createURL("auth/callback");

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectUrl,
        },
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      router.push({ pathname: "/(auth)/verify", params: { email: trimmed } });
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
        {/* Branding */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <Text
            style={{
              fontFamily: "Poppins_700Bold",
              fontSize: 36,
              letterSpacing: 6,
              color: colors.text,
            }}
          >
            DECIBEL
          </Text>
          <Text
            style={{
              fontFamily: "Poppins_400Regular",
              fontSize: 16,
              marginTop: 8,
              color: colors.gray,
            }}
          >
            Your Live Music Passport
          </Text>
        </View>

        {/* Email input */}
        <View style={{ marginBottom: 24 }}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError("");
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
            error={error}
          />
        </View>

        {/* Send link button */}
        <Button
          title="Send Magic Link"
          onPress={handleSendLink}
          loading={loading}
          disabled={!email.trim()}
        />

        {/* Footer hint */}
        <Text
          style={{
            fontFamily: "Poppins_400Regular",
            fontSize: 14,
            color: colors.gray,
            textAlign: "center",
            marginTop: 24,
          }}
        >
          We'll send a sign-in link to your email
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
