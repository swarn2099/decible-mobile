import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { LeaderboardSkeleton } from "@/components/ui/SkeletonLoader";
import type { LeaderboardView, LeaderboardEntry, TimePeriod } from "@/types/index";

const VIEWS: { value: LeaderboardView; label: string }[] = [
  { value: "founders", label: "Most Founders" },
  { value: "influence", label: "Highest Influence" },
  { value: "trending", label: "Trending" },
];

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: "allTime", label: "All Time" },
  { value: "monthly", label: "This Month" },
  { value: "weekly", label: "This Week" },
];

const GOLD = "#FFD700";
const SILVER = "#C0C0C0";
const BRONZE = "#CD7F32";

function metricLabel(view: LeaderboardView): string {
  if (view === "founders") return "founders";
  if (view === "influence") return "influence";
  return "this week";
}

function PodiumAvatar({
  entry,
  size,
  accentColor,
  onPress,
}: {
  entry: LeaderboardEntry;
  size: number;
  accentColor: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable onPress={onPress} style={{ alignItems: "center" }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2.5,
          borderColor: accentColor,
          overflow: "hidden",
          backgroundColor: colors.card,
        }}
      >
        {entry.avatarUrl ? (
          <Image
            source={{ uri: entry.avatarUrl }}
            style={{ width: size, height: size }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: size * 0.38,
                fontFamily: "Poppins_700Bold",
                color: accentColor,
              }}
            >
              {(entry.name ?? "?").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={{
          marginTop: 6,
          fontSize: 12,
          fontFamily: "Poppins_600SemiBold",
          color: accentColor,
          textAlign: "center",
          maxWidth: size + 16,
        }}
        numberOfLines={1}
      >
        {entry.name}
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontFamily: "Poppins_500Medium",
          color: accentColor,
          opacity: 0.85,
        }}
      >
        {entry.metric}
      </Text>
    </Pressable>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [view, setView] = useState<LeaderboardView>("founders");
  const [period, setPeriod] = useState<TimePeriod>("allTime");

  const { entries, userPosition, isLoading, isError, refetch, currentFanId } =
    useLeaderboard({ view, period });

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
    tabPillText: { fontSize: 11, fontFamily: "Poppins_600SemiBold" },
    tabPillTextActive: { color: "#FFFFFF" },
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
    periodPillTextActive: { color: "#FFFFFF" },
    periodPillTextInactive: { color: colors.textSecondary },
    podiumSection: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "flex-end",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
      gap: 24,
    },
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
      fontSize: 18,
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
      borderWidth: 1,
      borderColor: colors.cardBorder,
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
    metricText: {
      fontSize: 15,
      fontFamily: "Poppins_600SemiBold",
      color: colors.pink,
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
      color: "#FFFFFF",
    },
    emptyText: {
      fontSize: 15,
      fontFamily: "Poppins_500Medium",
      color: colors.textSecondary,
    },
    stickyUserBar: {
      position: "absolute",
      bottom: 100,
      left: 16,
      right: 16,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderLeftWidth: 3,
      borderLeftColor: colors.pink,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 6,
    },
  });

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const label = metricLabel(view);

  const renderRow = ({
    item,
    isUserBar,
  }: {
    item: LeaderboardEntry;
    isUserBar?: boolean;
  }) => {
    const isMe = item.fanId === currentFanId;
    return (
      <Pressable
        style={[
          styles.row,
          (isMe || isUserBar) && styles.rowHighlighted,
        ]}
        onPress={() => router.push(`/profile/${item.fanId}`)}
        android_ripple={{ color: colors.cardBorder }}
      >
        <Text style={styles.rankText}>{item.rank}</Text>
        {item.avatarUrl ? (
          <Image
            source={{ uri: item.avatarUrl }}
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
        </View>
        <Text style={styles.metricText}>
          {item.metric} {label}
        </Text>
      </Pressable>
    );
  };

  const PodiumSection =
    top3.length > 0 ? (
      <View style={styles.podiumSection}>
        {/* Rank 2 (left, silver) */}
        {top3[1] ? (
          <View style={{ marginBottom: 0 }}>
            <PodiumAvatar
              entry={top3[1]}
              size={52}
              accentColor={SILVER}
              onPress={() => router.push(`/profile/${top3[1].fanId}`)}
            />
          </View>
        ) : (
          <View style={{ width: 52 }} />
        )}
        {/* Rank 1 (center, gold, tallest) */}
        {top3[0] ? (
          <View style={{ marginBottom: 8 }}>
            <PodiumAvatar
              entry={top3[0]}
              size={64}
              accentColor={GOLD}
              onPress={() => router.push(`/profile/${top3[0].fanId}`)}
            />
          </View>
        ) : null}
        {/* Rank 3 (right, bronze) */}
        {top3[2] ? (
          <View style={{ marginBottom: 0 }}>
            <PodiumAvatar
              entry={top3[2]}
              size={52}
              accentColor={BRONZE}
              onPress={() => router.push(`/profile/${top3[2].fanId}`)}
            />
          </View>
        ) : (
          <View style={{ width: 52 }} />
        )}
      </View>
    ) : null;

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

      {/* View tabs */}
      <View style={styles.tabRow}>
        {VIEWS.map((v) => (
          <Pressable
            key={v.value}
            style={[
              styles.tabPill,
              view === v.value ? styles.tabPillActive : styles.tabPillInactive,
            ]}
            onPress={() => setView(v.value)}
          >
            <Text
              style={[
                styles.tabPillText,
                view === v.value
                  ? styles.tabPillTextActive
                  : styles.tabPillTextInactive,
              ]}
            >
              {v.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Period pills (hidden for trending) */}
      {view !== "trending" && (
        <View style={styles.periodRow}>
          {PERIODS.map(({ value, label: pLabel }) => (
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
                {pLabel}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

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
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No entries yet</Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item) => item.fanId}
          renderItem={({ item }) => renderRow({ item })}
          ListHeaderComponent={PodiumSection}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 4,
            paddingBottom: userPosition ? 180 : 100,
          }}
        />
      )}

      {/* Sticky user position bar */}
      {userPosition && (
        <View style={styles.stickyUserBar}>
          <Text style={[styles.rankText, { color: colors.pink }]}>
            {userPosition.rank}
          </Text>
          {userPosition.avatarUrl ? (
            <Image
              source={{ uri: userPosition.avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {(userPosition.name ?? "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.entryInfo}>
            <Text style={styles.entryName} numberOfLines={1}>
              {userPosition.name}
            </Text>
          </View>
          <Text style={styles.metricText}>
            {userPosition.metric} {label}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
