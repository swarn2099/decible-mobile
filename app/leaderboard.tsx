import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import {
  useLeaderboard,
  getTierColor,
  getTierLabel,
} from "@/hooks/useLeaderboard";
import { LeaderboardSkeleton } from "@/components/ui/SkeletonLoader";
import type {
  FanLeaderboardEntry,
  PerformerLeaderboardEntry,
  LeaderboardTab,
  TimePeriod,
} from "@/types/index";

export default function LeaderboardScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [tab, setTab] = useState<LeaderboardTab>("fans");
  const [period, setPeriod] = useState<TimePeriod>("allTime");

  const { data, isLoading, isError, refetch, currentFanId } = useLeaderboard({
    tab,
    period,
  });

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 22,
      fontFamily: "Poppins_600SemiBold",
      color: colors.text,
    },
    headerSpacer: { width: 40 },
    backBtn: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
    },
    tabRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      gap: 8,
      marginBottom: 8,
    },
    tabPill: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 20,
      alignItems: "center",
    },
    tabPillActive: { backgroundColor: colors.pink },
    tabPillInactive: { backgroundColor: colors.card },
    tabPillText: { fontSize: 14, fontFamily: "Poppins_600SemiBold" },
    tabPillTextActive: { color: colors.white },
    tabPillTextInactive: { color: colors.textSecondary },
    periodRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      gap: 6,
      marginBottom: 12,
    },
    periodPill: {
      flex: 1,
      paddingVertical: 5,
      borderRadius: 16,
      alignItems: "center",
    },
    periodPillActive: { backgroundColor: colors.pink },
    periodPillInactive: { backgroundColor: colors.card },
    periodPillText: { fontSize: 12, fontFamily: "Poppins_500Medium" },
    periodPillTextActive: { color: colors.white },
    periodPillTextInactive: { color: colors.textSecondary },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 14,
    },
    rowHighlighted: {
      borderLeftWidth: 3,
      borderLeftColor: colors.pink,
      backgroundColor: `${colors.pink}18`,
    },
    rankText: {
      width: 32,
      fontSize: 20,
      fontFamily: "Poppins_700Bold",
      color: colors.textSecondary,
      textAlign: "center",
      marginRight: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: colors.cardBorder,
    },
    avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarInitial: {
      fontSize: 16,
      fontFamily: "Poppins_700Bold",
      color: colors.textSecondary,
    },
    entryInfo: { flex: 1 },
    entryName: {
      fontSize: 15,
      fontFamily: "Poppins_500Medium",
      color: colors.text,
    },
    entryMeta: {
      fontSize: 12,
      fontFamily: "Poppins_400Regular",
      color: colors.textSecondary,
      marginTop: 2,
    },
    tierPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 100,
      marginLeft: 8,
    },
    tierText: {
      fontSize: 10,
      fontFamily: "Poppins_600SemiBold",
      color: colors.white,
    },
    genreRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      marginTop: 4,
    },
    genrePill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 100,
      backgroundColor: `${colors.textSecondary}22`,
    },
    genreText: {
      fontSize: 10,
      fontFamily: "Poppins_400Regular",
      color: colors.textSecondary,
    },
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    errorText: {
      fontSize: 15,
      fontFamily: "Poppins_500Medium",
      color: colors.textSecondary,
      marginBottom: 12,
    },
    retryBtn: {
      backgroundColor: colors.pink,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 12,
    },
    retryText: {
      fontSize: 14,
      fontFamily: "Poppins_600SemiBold",
      color: colors.white,
    },
    emptyText: {
      fontSize: 15,
      fontFamily: "Poppins_500Medium",
      color: colors.textSecondary,
    },
  });

  const renderFanRow = ({ item }: { item: FanLeaderboardEntry }) => {
    const isMe = item.fanId === currentFanId;
    const tierColor = getTierColor(item.topTier);
    return (
      <View style={[styles.row, isMe && styles.rowHighlighted]}>
        <Text style={styles.rankText}>{item.rank}</Text>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {(item.name ?? "?").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.entryInfo}>
          <Text style={styles.entryName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.entryMeta}>{item.count} finds</Text>
        </View>
        <View style={[styles.tierPill, { backgroundColor: tierColor }]}>
          <Text style={styles.tierText}>{getTierLabel(item.topTier)}</Text>
        </View>
      </View>
    );
  };

  const renderPerformerRow = ({
    item,
  }: {
    item: PerformerLeaderboardEntry;
  }) => {
    return (
      <Pressable
        style={styles.row}
        onPress={() => router.push(`/artist/${item.slug}`)}
        android_ripple={{ color: colors.cardBorder }}
      >
        <Text style={styles.rankText}>{item.rank}</Text>
        {item.photoUrl ? (
          <Image
            source={{ uri: item.photoUrl }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(item.name ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.entryInfo}>
          <Text style={styles.entryName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.entryMeta}>
            {item.fanCount} {item.fanCount === 1 ? "fan" : "fans"}
          </Text>
          {item.genres && item.genres.length > 0 && (
            <View style={styles.genreRow}>
              {item.genres.slice(0, 2).map((genre) => (
                <View key={genre} style={styles.genrePill}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const isFanTab = tab === "fans";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {(["fans", "performers"] as LeaderboardTab[]).map((t) => (
          <Pressable
            key={t}
            style={[
              styles.tabPill,
              tab === t ? styles.tabPillActive : styles.tabPillInactive,
            ]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[
                styles.tabPillText,
                tab === t
                  ? styles.tabPillTextActive
                  : styles.tabPillTextInactive,
              ]}
            >
              {t === "fans" ? "Fans" : "Performers"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Period switcher */}
      <View style={styles.periodRow}>
        {(
          [
            { value: "weekly" as TimePeriod, label: "Weekly" },
            { value: "monthly" as TimePeriod, label: "Monthly" },
            { value: "allTime" as TimePeriod, label: "All Time" },
          ] as { value: TimePeriod; label: string }[]
        ).map(({ value, label }) => (
          <Pressable
            key={value}
            style={[
              styles.periodPill,
              period === value
                ? styles.periodPillActive
                : styles.periodPillInactive,
            ]}
            onPress={() => setPeriod(value)}
          >
            <Text
              style={[
                styles.periodPillText,
                period === value
                  ? styles.periodPillTextActive
                  : styles.periodPillTextInactive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <LeaderboardSkeleton />
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load leaderboard</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : !data || data.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No entries yet</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) =>
            isFanTab
              ? (item as FanLeaderboardEntry).fanId
              : (item as PerformerLeaderboardEntry).performerId
          }
          renderItem={
            isFanTab
              ? ({ item }) =>
                  renderFanRow({ item: item as FanLeaderboardEntry })
              : ({ item }) =>
                  renderPerformerRow({
                    item: item as PerformerLeaderboardEntry,
                  })
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
        />
      )}
    </SafeAreaView>
  );
}
