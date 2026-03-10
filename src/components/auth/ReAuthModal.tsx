import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Mail, X } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useThemeColors } from "@/constants/colors";

type Step = "email" | "code";

/**
 * Bottom sheet re-auth modal. Shown when sessionExpired flag is set in authStore.
 * After successful OTP verification, Supabase fires SIGNED_IN, which useAuthRecovery
 * catches to dismiss the modal (sets sessionExpired to false) and retry failed queries.
 * This modal does NOT manually dismiss itself.
 */
export function ReAuthModal() {
  const colors = useThemeColors();
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const currentUserEmail = useAuthStore((s) => s.user?.email ?? "");

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(currentUserEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your email address");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: false },
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      setEmail(trimmed);
      setCode("");
      setStep("code");
    } catch {
      setError("Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: trimmedCode,
        type: "email",
      });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      // Success — Supabase fires SIGNED_IN event, which useAuthRecovery
      // catches to set sessionExpired = false and refetch queries.
      // Reset local state for next time this modal is shown.
      setStep("email");
      setCode("");
      setError("");
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("email");
    setCode("");
    setError("");
  };

  return (
    <Modal
      visible={sessionExpired}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Semi-transparent dark overlay */}
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "flex-end",
          }}
        >
          {/* Bottom sheet card */}
          <View
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: Platform.OS === "ios" ? 40 : 24,
              borderTopWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            {/* Header row */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 20,
                  color: colors.text,
                }}
              >
                Session Expired
              </Text>

              {step === "code" && (
                <TouchableOpacity onPress={handleBack} hitSlop={8}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Subtitle */}
            <Text
              style={{
                fontFamily: "Poppins_400Regular",
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 24,
              }}
            >
              {step === "email"
                ? "Please verify your email to continue"
                : `Enter the 6-digit code sent to ${email}`}
            </Text>

            {step === "email" ? (
              <>
                {/* Email icon + input row */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.inputBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: error ? colors.pink : colors.inputBorder,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginBottom: 8,
                    gap: 10,
                  }}
                >
                  <Mail size={18} color={colors.textSecondary} />
                  <TextInput
                    style={{
                      flex: 1,
                      fontFamily: "Poppins_400Regular",
                      fontSize: 15,
                      color: colors.text,
                    }}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.textTertiary}
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (error) setError("");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="send"
                    onSubmitEditing={handleSendCode}
                  />
                </View>

                {/* Inline error */}
                {!!error && (
                  <Text
                    style={{
                      fontFamily: "Poppins_400Regular",
                      fontSize: 13,
                      color: colors.pink,
                      marginBottom: 12,
                    }}
                  >
                    {error}
                  </Text>
                )}

                {/* Send Code button */}
                <TouchableOpacity
                  onPress={handleSendCode}
                  disabled={loading || !email.trim()}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: colors.purple,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: "center",
                    opacity: loading || !email.trim() ? 0.6 : 1,
                    marginTop: error ? 0 : 8,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text
                      style={{
                        fontFamily: "Poppins_600SemiBold",
                        fontSize: 15,
                        color: "#FFFFFF",
                      }}
                    >
                      Send Code
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* 6-digit code input */}
                <TextInput
                  style={{
                    backgroundColor: colors.inputBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: error ? colors.pink : colors.inputBorder,
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 24,
                    color: colors.text,
                    letterSpacing: 12,
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                  placeholder="------"
                  placeholderTextColor={colors.textTertiary}
                  value={code}
                  onChangeText={(t) => {
                    // Digits only, max 6
                    const digits = t.replace(/[^0-9]/g, "").slice(0, 6);
                    setCode(digits);
                    if (error) setError("");
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={handleVerify}
                  autoFocus
                />

                {/* Inline error */}
                {!!error && (
                  <Text
                    style={{
                      fontFamily: "Poppins_400Regular",
                      fontSize: 13,
                      color: colors.pink,
                      marginBottom: 12,
                    }}
                  >
                    {error}
                  </Text>
                )}

                {/* Verify button */}
                <TouchableOpacity
                  onPress={handleVerify}
                  disabled={loading || code.length !== 6}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: colors.purple,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: "center",
                    opacity: loading || code.length !== 6 ? 0.6 : 1,
                    marginTop: error ? 0 : 8,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text
                      style={{
                        fontFamily: "Poppins_600SemiBold",
                        fontSize: 15,
                        color: "#FFFFFF",
                      }}
                    >
                      Verify
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
