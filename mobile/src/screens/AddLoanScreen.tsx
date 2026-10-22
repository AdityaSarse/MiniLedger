import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { apiRequest } from "../api/client";
import { colors, typography, spacing, radii, shadows, sizes } from "../theme";

type Props = {
  onBack: () => void;
  onCreated: () => void;
};

export default function AddLoanScreen({ onBack, onCreated }: Props) {
  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const name = friendName.trim();
    const value = Number(amount);

    if (!name) {
      Alert.alert("Missing name", "Enter your friend's name.");
      return;
    }

    if (!Number.isFinite(value) || value <= 0 || !/^\d+(\.\d{1,2})?$/.test(amount.trim())) {
      Alert.alert("Invalid amount", "Enter an amount greater than zero with up to two decimal places.");
      return;
    }

    // Expected format: YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      Alert.alert("Invalid due date", "Use YYYY-MM-DD, for example 2026-11-30.");
      return;
    }

    const date = new Date(`${dueDate}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== dueDate
    ) {
      Alert.alert("Invalid due date", "Enter a real calendar date.");
      return;
    }

    const token = await SecureStore.getItemAsync("miniledger_token");

    if (!token) {
      Alert.alert("Session expired", "Please log in again.");
      return;
    }

    setLoading(true);

    try {
      await apiRequest(
        "/loans",
        {
          method: "POST",
          body: JSON.stringify({
            friendName: name,
            amount: value,
            dueDate: date.toISOString(),
          }),
        },
        token,
      );

      Alert.alert("Success", "Loan entry added successfully.");
      onCreated();
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        await SecureStore.deleteItemAsync("miniledger_token");
        Alert.alert("Session expired", "Please log in again.");
        onBack();
        return;
      }
      Alert.alert(
        "Could not add loan",
        error instanceof Error && error.message === "NETWORK_ERROR"
          ? "Network error. Please check your connection."
          : error instanceof Error
            ? error.message
            : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={[colors.bgGradientTop, colors.bgGradientBottom]}
      style={styles.gradientFill}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back link at top-left in blue */}
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>← Back to dashboard</Text>
            </TouchableOpacity>

            {/* Header / titles */}
            <Text style={styles.eyebrow}>NEW TRANSACTION</Text>
            <Text style={styles.title}>Add a loan</Text>
            <Text style={styles.subtitle}>
              Keep a clear record of money you've lent.
            </Text>

            {/* Clean white form card */}
            <View style={styles.card}>
              {/* Label-above-input for Friend's Name */}
              <Text style={styles.label}>Friend's Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={colors.textHint}
                value={friendName}
                onChangeText={setFriendName}
                maxLength={100}
                autoCapitalize="words"
              />

              {/* Label-above-input for Amount */}
              <Text style={styles.label}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2500"
                placeholderTextColor={colors.textHint}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />

              {/* Label-above-input for Due Date */}
              <Text style={styles.label}>Due Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textHint}
                value={dueDate}
                onChangeText={setDueDate}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
              <Text style={styles.hint}>
                Enter the date in YYYY-MM-DD format (e.g. 2026-11-30).
              </Text>

              {/* Green full-width CTA button */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.disabled]}
                disabled={loading}
                onPress={handleSubmit}
                activeOpacity={0.88}
              >
                <Text style={styles.submitText}>
                  {loading ? "Saving…" : "Save loan entry"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientFill: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },

  /* Back Button */
  backBtn: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  backText: {
    ...typography.link,
    fontSize: 15,
    fontWeight: "700",
  },

  /* Heading */
  eyebrow: {
    ...typography.eyebrow,
  },
  title: {
    ...typography.title,
    fontSize: 28,
    marginTop: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 14,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    color: colors.textMuted,
    lineHeight: 20,
  },

  /* Form Card: 20px radius, subtle border, soft shadow */
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },

  /* Form Inputs */
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
    marginBottom: spacing.md + 2,
  },
  hint: {
    ...typography.caption,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
    color: colors.textHint,
  },

  /* Submit Button: Green, 52px tall, 12px radius, full width */
  submitBtn: {
    height: sizes.buttonHeight,
    backgroundColor: colors.success,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
    ...shadows.button,
  },
  disabled: { opacity: 0.6 },
  submitText: {
    ...typography.button,
    fontSize: 16,
    fontWeight: "800",
  },
});
