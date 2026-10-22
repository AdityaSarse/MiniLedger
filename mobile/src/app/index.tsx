import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";

import { apiRequest } from "../api/client";
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AddLoanScreen from "../screens/AddLoanScreen";

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
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#176B52" />
          <Text style={styles.loadingText}>Loading MiniLedger...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F5",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64756C",
  },
});
