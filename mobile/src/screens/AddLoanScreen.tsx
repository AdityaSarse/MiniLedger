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
import * as SecureStore from "expo-secure-store";
import { apiRequest } from "../api/client";

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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back to dashboard</Text>
          </TouchableOpacity>

          <Text style={styles.eyebrow}>NEW TRANSACTION</Text>
          <Text style={styles.title}>Add a loan</Text>
          <Text style={styles.subtitle}>
            Keep a clear record of money you've lent.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Friend's name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#9CA3AF"
              value={friendName}
              onChangeText={setFriendName}
              maxLength={100}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2500"
              placeholderTextColor="#9CA3AF"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Due date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={dueDate}
              onChangeText={setDueDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <Text style={styles.hint}>
              Enter the date in year-month-day format.
            </Text>

            <TouchableOpacity
              style={[styles.submit, loading && styles.disabled]}
              disabled={loading}
              onPress={handleSubmit}
            >
              <Text style={styles.submitText}>
                {loading ? "Saving..." : "Save loan entry"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7F5" },
  flex: { flex: 1 },
  content: { padding: 22, paddingBottom: 40 },
  backButton: { marginBottom: 30 },
  backText: { color: "#176B52", fontWeight: "700", fontSize: 14 },
  eyebrow: {
    color: "#648071",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: {
    color: "#173F35",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 8,
  },
  subtitle: { color: "#718078", fontSize: 14, marginTop: 8, marginBottom: 24 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5EBE6",
  },
  label: {
    color: "#37483E",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 9,
  },
  input: {
    backgroundColor: "#FBFCFB",
    borderWidth: 1,
    borderColor: "#DFE7E1",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#20372D",
    marginBottom: 20,
  },
  hint: { color: "#7B867F", fontSize: 12, marginTop: -12, marginBottom: 22 },
  submit: {
    backgroundColor: "#176B52",
    paddingVertical: 16,
    borderRadius: 13,
    alignItems: "center",
    marginTop: 4,
  },
  disabled: { opacity: 0.6 },
  submitText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
});
