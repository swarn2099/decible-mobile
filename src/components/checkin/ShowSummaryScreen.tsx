import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { CheckCircle } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import type { StampData } from "@/types";

// ---------- Types ----------

type Props = {
  stamps: StampData[];
  founders: string[]; // performer_ids that earned Founder badge
  venueName: string;
  eventDate: string;
  onViewPassport: () => void;
  onDone: () => void;
};

// ---------- Helper ----------

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------- Component ----------

export function ShowSummaryScreen({
  stamps,
  founders,
  venueName,
  eventDate,
  onViewPassport,
  onDone,
}: Props) {
  const colors = useThemeColors();
  const foundersSet = new Set(founders);
  const formattedDate = formatDate(eventDate);

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.headerRow}>
        <CheckCircle size={28} color={colors.pink} />
        <Text style={[styles.title, { color: colors.text }]}>You're checked in!</Text>
      </View>

      <Text style={[styles.venueLine, { color: colors.textSecondary }]}>
        {venueName}
      </Text>
      <Text style={[styles.dateLine, { color: colors.textTertiary }]}>
        {formattedDate}
      </Text>

      {/* Artist list */}
      <ScrollView
        style={{ flex: 1, marginTop: 20 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {stamps.map((stamp, idx) => {
          const isFounder = foundersSet.has(stamp.performer_id);
          return (
            <View
              key={`${stamp.performer_id}-${idx}`}
              style={[
                styles.artistRow,
                {
                  borderBottomColor: colors.divider,
                  borderBottomWidth: idx < stamps.length - 1 ? StyleSheet.hairlineWidth : 0,
                },
              ]}
            >
              {/* Avatar */}
              {stamp.performer_photo ? (
                <Image
                  source={{ uri: stamp.performer_photo }}
                  style={[styles.avatar, { backgroundColor: colors.card }]}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.card },
                  ]}
                >
                  <Text style={[styles.avatarInitial, { color: colors.textSecondary }]}>
                    {stamp.performer_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              {/* Name */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.artistName, { color: colors.text }]}>
                  {stamp.performer_name}
                </Text>
              </View>

              {/* Badge indicator */}
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isFounder
                      ? colors.gold + "22"
                      : colors.pink + "22",
                    borderColor: isFounder ? colors.gold : colors.pink,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeIcon,
                    { color: isFounder ? colors.gold : colors.pink },
                  ]}
                >
                  {isFounder ? "★" : "✓"}
                </Text>
                <Text
                  style={[
                    styles.badgeLabel,
                    { color: isFounder ? colors.gold : colors.pink },
                  ]}
                >
                  {isFounder ? "Founder" : "Stamped"}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Footer buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onViewPassport}
          style={[styles.primaryButton, { backgroundColor: colors.pink }]}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>View Passport</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDone}
          style={styles.textButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.textButtonLabel, { color: colors.textSecondary }]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
  },
  venueLine: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 2,
  },
  dateLine: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  artistName: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeIcon: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
  },
  badgeLabel: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  footer: {
    paddingTop: 8,
    gap: 4,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#FFFFFF",
  },
  textButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  textButtonLabel: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
  },
});
