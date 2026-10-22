import React, { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { authApi } from "../api/client";
import { colors, typography, spacing, radii, shadows, sizes } from "../theme";

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [resendTimer, setResendTimer] = useState<number>(30);

  /* OTP individual-box refs */
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const otpDigits = otp.split("").concat(Array(6 - otp.length).fill(""));

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  const handleSendOtp = async () => {
    setError(null);
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setLoading(true);
    try {
      await authApi.sendOtp(phone.trim());
      setOtpSent(true);
      setResendTimer(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!otp.trim() || otp.length < 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      await authApi.verifyOtp(phone.trim(), otp.trim());
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  function handleOtpBoxChange(text: string, index: number) {
    const cleaned = text.replace(/[^0-9]/g, "");
    const newDigits = otp.split("");

    if (cleaned.length === 0) {
      newDigits[index] = "";
      setOtp(newDigits.join(""));
      if (index > 0) {
        otpRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
      return;
    }

    if (cleaned.length === 1) {
      newDigits[index] = cleaned;
      const next = newDigits.join("");
      setOtp(next);
      if (index < 5) {
        otpRefs.current[index + 1]?.focus();
        setFocusedIndex(index + 1);
      }
    } else {
      /* Pasted a full code */
      const pasted = cleaned.slice(0, 6);
      setOtp(pasted);
      const targetFocus = Math.min(pasted.length, 5);
      otpRefs.current[targetFocus]?.focus();
      setFocusedIndex(targetFocus);
    }
  }

  function handleOtpKeyPress(key: string, index: number) {
    if (key === "Backspace" && !otpDigits[index] && index > 0) {
      const newDigits = otp.split("");
      newDigits[index - 1] = "";
      setOtp(newDigits.join(""));
      otpRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  }

  return (
    <LinearGradient
      colors={[colors.bgGradientTop, colors.bgGradientBottom]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          {/* Top-left Back button when on OTP step */}
          <View style={styles.topBar}>
            {otpSent ? (
              <TouchableOpacity
                onPress={() => {
                  setOtpSent(false);
                  setOtp("");
                  setError(null);
                }}
                style={styles.backButton}
              >
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backButtonPlaceholder} />
            )}
          </View>

          {/* App logo / branding */}
          <View style={styles.brandWrap}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>₹</Text>
            </View>
            <Text style={styles.brand}>MiniLedger</Text>
          </View>

          {/* Friendly heading and short muted subtitle */}
          <Text style={styles.heading}>
            {otpSent ? "Verify your number" : "Welcome back"}
          </Text>
          <Text style={styles.subtitle}>
            {otpSent
              ? `Enter the 6-digit code sent to ${phone}`
              : "Sign in with your mobile number to manage loans"}
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Card */}
          <View style={styles.card}>
            {!otpSent ? (
              <>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+919876543210"
                  placeholderTextColor={colors.textHint}
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    setError(null);
                  }}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.textWhite} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>6-Digit OTP</Text>

                {/* Individual OTP boxes */}
                <View style={styles.otpRow}>
                  {otpDigits.slice(0, 6).map((digit, i) => {
                    const isFocused = focusedIndex === i;
                    return (
                      <TextInput
                        key={i}
                        ref={(ref) => {
                          otpRefs.current[i] = ref;
                        }}
                        style={[
                          styles.otpBox,
                          digit ? styles.otpBoxFilled : null,
                          isFocused ? styles.otpBoxFocused : null,
                        ]}
                        value={digit || ""}
                        onChangeText={(text) => handleOtpBoxChange(text, i)}
                        onKeyPress={({ nativeEvent }) =>
                          handleOtpKeyPress(nativeEvent.key, i)
                        }
                        onFocus={() => setFocusedIndex(i)}
                        keyboardType="number-pad"
                        maxLength={i === 0 ? 6 : 1}
                        selectTextOnFocus
                        autoFocus={i === 0}
                      />
                    );
                  })}
                </View>

                {/* Resend timer */}
                <View style={styles.timerWrap}>
                  {resendTimer > 0 ? (
                    <Text style={styles.timerText}>
                      Resend code in {resendTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleSendOtp}
                      disabled={loading}
                    >
                      <Text style={styles.resendLinkText}>Resend code</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.btnDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.textWhite} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Verify & Login</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  /* Top Bar */
  topBar: {
    height: 40,
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  backButtonPlaceholder: {
    height: 24,
  },
  backText: {
    ...typography.link,
    fontSize: 15,
    fontWeight: "700",
  },

  /* Branding */
  brandWrap: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    ...shadows.button,
    shadowColor: colors.primary,
  },
  logoText: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.textWhite,
  },
  brand: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },

  /* Heading */
  heading: {
    ...typography.title,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
    color: colors.textMuted,
  },

  /* Error */
  errorBanner: {
    backgroundColor: colors.dangerLight,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  /* Card */
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },

  /* Form */
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  input: {
    height: sizes.inputHeight,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    ...typography.input,
    marginBottom: spacing.md,
  },

  /* OTP boxes */
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  otpBox: {
    flex: 1,
    height: sizes.inputHeight + 4,
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: radii.md,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  otpBoxFilled: {
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg,
  },
  otpBoxFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryLight,
  },

  /* Timer */
  timerWrap: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  timerText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textMuted,
  },
  resendLinkText: {
    ...typography.link,
    fontSize: 13,
    fontWeight: "700",
  },

  /* Primary button */
  primaryBtn: {
    height: sizes.buttonHeight,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xs,
    ...shadows.button,
    shadowColor: colors.primary,
  },
  btnDisabled: { opacity: 0.65 },
  primaryBtnText: {
    ...typography.button,
  },
});
