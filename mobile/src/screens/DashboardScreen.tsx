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
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect } from "expo-router";
import { apiRequest } from "../api/client";
import { colors, typography, spacing, radii, shadows, sizes } from "../theme";

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
      <LinearGradient
        colors={[colors.bgGradientTop, colors.bgGradientBottom]}
        style={styles.gradientFill}
      >
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your ledger…</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.bgGradientTop, colors.bgGradientBottom]}
      style={styles.gradientFill}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR PERSONAL LEDGER</Text>
            <Text style={styles.title}>MiniLedger</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutPill}>
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
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Dark Navy Hero Summary Card with faint glow border */}
              <LinearGradient
                colors={[colors.heroStart, colors.heroEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <Text style={styles.heroEyebrow}>OVERVIEW</Text>
                <Text style={styles.heroLabel}>Total Lent</Text>
                <Text style={styles.heroAmount}>
                  ₹{summary.totalLent.toLocaleString("en-IN")}
                </Text>

                <View style={styles.heroRow}>
                  {/* Total Repaid Stat */}
                  <View style={styles.heroMetric}>
                    <Text style={styles.heroMetricLabel}>Total Repaid</Text>
                    <Text style={styles.heroMetricValue}>
                      ₹{summary.totalRepaid.toLocaleString("en-IN")}
                    </Text>
                  </View>

                  {/* Overdue Stat */}
                  <View style={styles.heroMetric}>
                    <Text style={styles.heroMetricLabel}>Overdue</Text>
                    <Text style={styles.heroOverdueValue}>
                      ₹{summary.overdueAmount.toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your loans</Text>
                <Text style={styles.sectionCount}>{loans.length} entries</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>No loans yet</Text>
              <Text style={styles.emptyCaption}>
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
                {/* Top Row: Avatar, Friend Name, Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.friendCol}>
                    <View
                      style={[
                        styles.avatar,
                        isOverdue && styles.avatarOverdue,
                        item.status === "REPAID" && styles.avatarRepaid,
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          isOverdue && styles.avatarTextOverdue,
                          item.status === "REPAID" && styles.avatarTextRepaid,
                        ]}
                      >
                        {item.friendName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.nameBlock}>
                      <Text style={styles.metaLabel}>FRIEND</Text>
                      <Text style={styles.friendName}>{item.friendName}</Text>
                    </View>
                  </View>

                  {/* Status Tag */}
                  <View
                    style={[
                      styles.statusBadge,
                      isOverdue && styles.statusBadgeOverdue,
                      item.status === "REPAID" && styles.statusBadgeRepaid,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isOverdue && styles.statusTextOverdue,
                        item.status === "REPAID" && styles.statusTextRepaid,
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

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Bottom Row with Label-Above-Value pattern */}
                <View style={styles.cardValuesRow}>
                  <View style={styles.valueBlock}>
                    <Text style={styles.metaLabel}>DUE DATE</Text>
                    <Text style={[styles.metaValue, isOverdue && styles.metaValueOverdue]}>
                      {new Date(item.dueDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>

                  <View style={[styles.valueBlock, styles.alignRight]}>
                    <Text style={styles.metaLabel}>AMOUNT</Text>
                    <Text style={styles.boldAmount}>
                      ₹{Number(item.amount).toLocaleString("en-IN")}
                    </Text>
                  </View>
                </View>

                {/* Check button to mark as repaid */}
                {item.status === "PENDING" && (
                  <TouchableOpacity
                    style={styles.repayBtn}
                    onPress={() => markRepaid(item.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.checkIconCircle}>
                      <Text style={styles.checkIconText}>✓</Text>
                    </View>
                    <Text style={styles.repayBtnText}>Mark as repaid</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />

        {/* Bottom Full-Width Green CTA Button */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={onAddLoan}
            activeOpacity={0.88}
          >
            <Text style={styles.fabText}>+ Add a loan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientFill: { flex: 1 },
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.caption,
    marginTop: spacing.sm,
  },

  /* Header */
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    ...typography.eyebrow,
  },
  title: {
    ...typography.title,
    marginTop: spacing.xs,
  },
  logoutPill: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    backgroundColor: colors.cardBg,
    ...shadows.card,
  },
  logoutText: {
    ...typography.label,
    fontSize: 12,
    color: colors.textMuted,
  },

  /* List */
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 110,
    flexGrow: 1,
  },

  /* Hero Summary Card */
  heroCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.heroGlow,
    ...shadows.hero,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.heroEyebrow,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  heroLabel: {
    color: colors.heroMuted,
    fontSize: 13,
    fontWeight: "500",
  },
  heroAmount: {
    ...typography.heroAmount,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  heroRow: {
    flexDirection: "row",
    gap: spacing.sm + 2,
  },
  heroMetric: {
    flex: 1,
    backgroundColor: colors.heroMetricBg,
    borderRadius: radii.md,
    padding: spacing.md - 2,
    borderWidth: 1,
    borderColor: colors.heroMetricBorder,
  },
  heroMetricLabel: {
    color: colors.heroMuted,
    fontSize: 11,
    fontWeight: "500",
  },
  heroMetricValue: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  heroOverdueValue: {
    color: colors.heroOverdue,
    fontSize: 16,
    fontWeight: "700",
    marginTop: spacing.xs,
  },

  /* Section header */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.sectionTitle },
  sectionCount: { ...typography.caption },

  /* Loan cards (16px radius, subtle border) */
  loanCard: {
    backgroundColor: colors.cardBg,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  overdueCard: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.cardOverdueBg,
  },

  /* Card Header */
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  friendCol: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  nameBlock: {
    marginLeft: spacing.sm + 2,
  },
  friendName: {
    ...typography.body,
    marginTop: 2,
  },

  /* Avatar */
  avatar: {
    width: sizes.avatarSize,
    height: sizes.avatarSize,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverdue: { backgroundColor: colors.dangerLight },
  avatarRepaid: { backgroundColor: colors.successLight },
  avatarText: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.primary,
  },
  avatarTextOverdue: { color: colors.danger },
  avatarTextRepaid: { color: colors.success },

  /* Status Badge */
  statusBadge: {
    backgroundColor: colors.badgeWarningBg,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusBadgeOverdue: { backgroundColor: colors.dangerLight },
  statusBadgeRepaid: { backgroundColor: colors.successLight },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.badgeWarningText,
  },
  statusTextOverdue: { color: colors.danger },
  statusTextRepaid: { color: colors.success },

  /* Divider */
  cardDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md - 4,
  },

  /* Values Row: Label-above-value pattern */
  cardValuesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  valueBlock: {
    flex: 1,
  },
  alignRight: {
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaValueOverdue: {
    color: colors.danger,
    fontWeight: "700",
  },
  boldAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 2,
  },

  /* Repay Button */
  repayBtn: {
    marginTop: spacing.md - 2,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm + 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs + 2,
  },
  checkIconCircle: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    backgroundColor: colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIconText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "800",
  },
  repayBtnText: {
    color: colors.success,
    fontWeight: "700",
    fontSize: 13,
  },

  /* Empty state */
  emptyCard: {
    padding: spacing.xl,
    backgroundColor: colors.cardBg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    ...shadows.card,
  },
  emptyEmoji: { fontSize: 32, marginBottom: spacing.sm },
  emptyTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.xs,
  },
  emptyCaption: {
    ...typography.caption,
    textAlign: "center",
    lineHeight: 18,
  },

  /* Floating CTA */
  fabContainer: {
    position: "absolute",
    bottom: spacing.md,
    left: spacing.lg,
    right: spacing.lg,
  },
  fab: {
    backgroundColor: colors.success,
    height: sizes.buttonHeight,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.button,
  },
  fabText: {
    ...typography.button,
    fontSize: 16,
    fontWeight: "800",
  },
});
