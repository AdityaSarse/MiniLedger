import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "expo-router";
import { apiRequest } from "../api/client";

type Loan = {
  id: string;
  friendName: string;
  amount: string | number;
  dueDate: string;
  status: "PENDING" | "REPAID";
};

type Summary = {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
};

export default function DashboardScreen({
  onLogout,
  onAddLoan,
}: {
  onLogout: () => void;
  onAddLoan: () => void;
}) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalLent: 0,
    totalRepaid: 0,
    overdueAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    const token = await SecureStore.getItemAsync("miniledger_token");

    if (!token) {
      onLogout();
      return;
    }

    const [loanData, summaryData] = await Promise.all([
      apiRequest<{ loans: Loan[] }>("/loans", {}, token),
      apiRequest<Summary>("/loans/summary", {}, token),
    ]);

    setLoans(loanData.loans);
    setSummary(summaryData);
  }, [onLogout]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDashboard()
        .catch(async (error) => {
          if (error instanceof Error && error.message === "UNAUTHORIZED") {
            await SecureStore.deleteItemAsync("miniledger_token");
            onLogout();
            return;
          }
          Alert.alert(
            "Could not load dashboard",
            error instanceof Error && error.message === "NETWORK_ERROR"
              ? "Network error. Please check your connection."
              : error instanceof Error
                ? error.message
                : "Please try again.",
          );
        })
        .finally(() => setLoading(false));
    }, [loadDashboard, onLogout]),
  );

  async function refresh() {
    setRefreshing(true);
    try {
      await loadDashboard();
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        await SecureStore.deleteItemAsync("miniledger_token");
        onLogout();
        return;
      }
      Alert.alert(
        "Refresh failed",
        error instanceof Error && error.message === "NETWORK_ERROR"
          ? "Network error. Please check your connection."
          : error instanceof Error
            ? error.message
            : "Please try again.",
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function markRepaid(id: string) {
    const token = await SecureStore.getItemAsync("miniledger_token");
    if (!token) {
      onLogout();
      return;
    }

    try {
      await apiRequest(`/loans/${id}/repay`, { method: "PATCH" }, token);
      await loadDashboard();
    } catch (error) {
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        await SecureStore.deleteItemAsync("miniledger_token");
        onLogout();
        return;
      }
      Alert.alert(
        "Update failed",
        error instanceof Error && error.message === "NETWORK_ERROR"
          ? "Network error. Please check your connection."
          : error instanceof Error
            ? error.message
            : "Please try again.",
      );
    }
  }

  function logout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("miniledger_token");
          onLogout();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#176B52" />
        <Text style={styles.muted}>Loading your ledger...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR PERSONAL LEDGER</Text>
          <Text style={styles.title}>MiniLedger</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={loans}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total lent</Text>
              <Text style={styles.total}>
                ₹{summary.totalLent.toLocaleString("en-IN")}
              </Text>

              <View style={styles.summaryRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Repaid</Text>
                  <Text style={styles.metricValue}>
                    ₹{summary.totalRepaid.toLocaleString("en-IN")}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Overdue</Text>
                  <Text style={styles.overdueValue}>
                    ₹{summary.overdueAmount.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your loans</Text>
              <Text style={styles.count}>{loans.length} entries</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No loans yet</Text>
            <Text style={styles.muted}>
              Add your first entry to start tracking money you've lent.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isOverdue =
            item.status === "PENDING" &&
            new Date(item.dueDate).getTime() < Date.now();

          return (
            <View
              style={[
                styles.loanCard,
                isOverdue && styles.overdueCard,
              ]}
            >
              <View style={styles.loanTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.friendName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.loanInfo}>
                  <Text style={styles.friend}>{item.friendName}</Text>
                  <Text style={styles.dueDate}>
                    Due {new Date(item.dueDate).toLocaleDateString("en-IN")}
                  </Text>
                </View>

                <View style={styles.amountInfo}>
                  <Text style={styles.amount}>
                    ₹{Number(item.amount).toLocaleString("en-IN")}
                  </Text>
                  <Text
                    style={[
                      styles.status,
                      isOverdue && styles.overdueStatus,
                      item.status === "REPAID" && styles.repaidStatus,
                    ]}
                  >
                    {item.status === "REPAID"
                      ? "Repaid"
                      : isOverdue
                        ? "Overdue"
                        : "Pending"}
                  </Text>
                </View>
              </View>

              {item.status === "PENDING" && (
                <TouchableOpacity
                  style={styles.repayButton}
                  onPress={() => markRepaid(item.id)}
                >
                  <Text style={styles.repayText}>Mark as repaid</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      <TouchableOpacity style={styles.addButton} onPress={onAddLoan}>
        <Text style={styles.addButtonText}>+ Add a loan</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7F5" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7F5",
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    color: "#64756C",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#173F35", marginTop: 4 },
  logout: {
    borderWidth: 1,
    borderColor: "#D8E2DC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: { color: "#365B4E", fontWeight: "600" },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, flexGrow: 1 },
  summaryCard: {
    backgroundColor: "#173F35",
    borderRadius: 22,
    padding: 22,
    marginBottom: 26,
  },
  summaryLabel: { color: "#D0E1D7", fontSize: 14 },
  total: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 24,
  },
  summaryRow: { flexDirection: "row", gap: 12 },
  metric: {
    flex: 1,
    backgroundColor: "#285547",
    borderRadius: 13,
    padding: 12,
  },
  metricLabel: { color: "#D0E1D7", fontSize: 12 },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 6,
  },
  overdueValue: {
    color: "#FFD1A8",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#1B332A" },
  count: { fontSize: 12, color: "#748078" },
  loanCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5EBE6",
  },
  overdueCard: { borderColor: "#E5A078", backgroundColor: "#FFF9F5" },
  loanTop: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#E1EDE5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: "#245B45" },
  loanInfo: { flex: 1, marginLeft: 12 },
  friend: { fontSize: 15, fontWeight: "700", color: "#20372D" },
  dueDate: { fontSize: 12, color: "#7B867F", marginTop: 5 },
  amountInfo: { alignItems: "flex-end" },
  amount: { fontSize: 16, fontWeight: "800", color: "#20372D" },
  status: {
    marginTop: 5,
    color: "#8A6A29",
    fontSize: 11,
    fontWeight: "700",
  },
  overdueStatus: { color: "#B64E23" },
  repaidStatus: { color: "#24714B" },
  repayButton: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#EDF0ED",
    paddingTop: 12,
  },
  repayText: { color: "#176B52", fontWeight: "700", textAlign: "center" },
  empty: {
    padding: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#20372D",
    marginBottom: 7,
  },
  muted: { color: "#7B867F", marginTop: 8, textAlign: "center" },
  addButton: {
    position: "absolute",
    bottom: 16,
    left: 20,
    right: 20,
    backgroundColor: "#176B52",
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: "center",
    elevation: 4,
  },
  addButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
