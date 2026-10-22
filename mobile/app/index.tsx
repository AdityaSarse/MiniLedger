import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";

import { apiRequest } from "../src/api/client";
import LoginScreen from "../src/screens/LoginScreen";
import DashboardScreen from "../src/screens/DashboardScreen";
import AddLoanScreen from "../src/screens/AddLoanScreen";
import { colors, typography, spacing } from "../src/theme";

export default function Index() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [dashboardKey, setDashboardKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const token = await SecureStore.getItemAsync("miniledger_token");

        if (!token) return;

        await apiRequest("/auth/me", {}, token);

        if (active) {
          setLoggedIn(true);
        }
      } catch (error) {
        // Only delete the token when the server explicitly rejects it.
        // A network error should not automatically log the user out.
        if (
          error instanceof Error &&
          error.message === "UNAUTHORIZED"
        ) {
          await SecureStore.deleteItemAsync("miniledger_token");
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const refreshDashboard = useCallback(() => {
    setDashboardKey((key) => key + 1);
    setShowAddLoan(false);
  }, []);

  const logout = useCallback(() => {
    setLoggedIn(false);
    setShowAddLoan(false);
  }, []);

  if (checkingSession) {
    return (
      <LinearGradient
        colors={[colors.bgGradientTop, colors.bgGradientBottom]}
        style={styles.gradientFill}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading MiniLedger…</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      {!loggedIn ? (
        <LoginScreen onLogin={() => setLoggedIn(true)} />
      ) : showAddLoan ? (
        <AddLoanScreen
          onBack={() => setShowAddLoan(false)}
          onCreated={refreshDashboard}
        />
      ) : (
        <DashboardScreen
          key={dashboardKey}
          onLogout={logout}
          onAddLoan={() => setShowAddLoan(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gradientFill: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    ...typography.caption,
    marginTop: spacing.md,
  },
});
