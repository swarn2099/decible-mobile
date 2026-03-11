import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { useThemeColors } from "@/constants/colors";
import { useCheckIn, getLocalDate } from "@/hooks/useCheckIn";
import type { ActiveVenueEvent, WizardStep, StampData } from "@/types";

type Props = {
  event: ActiveVenueEvent;
  onStamped: (stamps: StampData[]) => void;
  onAlreadyCheckedIn: (stamps: StampData[]) => void;
};

export function LineupStep({ event, onStamped, onAlreadyCheckedIn }: Props) {
  const colors = useThemeColors();
  const checkIn = useCheckIn();

  function handleCheckIn() {
    const performerIds = event.performers.map((p) => p.id);
    checkIn.mutate(
      {
        venue_id: event.venue.id,
        performer_ids: performerIds,
        local_date: getLocalDate(),
      },
      {
        onSuccess: (result) => {
          if (result.already_checked_in) {
            onAlreadyCheckedIn(result.stamps);
          } else {
            onStamped(result.stamps);
          }
        },
      }
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Venue name */}
      <Text style={[styles.venueName, { color: colors.text }]}>
        {event.venue.name}
      </Text>
      <Text style={[styles.lineupLabel, { color: colors.textSecondary }]}>
        Tonight's Lineup
      </Text>

      {/* Performer list */}
      <FlatList
        data={event.performers}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.divider }]} />
        )}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, marginTop: 16 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.performerRow}>
            {item.photo_url ? (
              <Image
                source={{ uri: item.photo_url }}
                style={[styles.performerAvatar, { backgroundColor: colors.card }]}
              />
            ) : (
              <View
                style={[
                  styles.performerAvatar,
                  styles.performerAvatarPlaceholder,
                  { backgroundColor: colors.card },
                ]}
              >
                <Text style={[styles.avatarInitial, { color: colors.textSecondary }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.performerName, { color: colors.text }]}>
                {item.name}
              </Text>
              {item.slug && (
                <Text style={[styles.performerSlug, { color: colors.textTertiary }]}>
                  @{item.slug}
                </Text>
              )}
            </View>
          </View>
        )}
      />

      {/* Check In CTA */}
      <View style={styles.ctaContainer}>
        {checkIn.isError && (
          <Text style={[styles.errorText, { color: colors.pink }]}>
            {checkIn.error?.message ?? "Something went wrong. Try again."}
          </Text>
        )}
        <TouchableOpacity
          onPress={handleCheckIn}
          disabled={checkIn.isPending}
          style={[
            styles.checkInButton,
            {
              backgroundColor: checkIn.isPending ? colors.pink + 'AA' : colors.pink,
            },
          ]}
          activeOpacity={0.8}
        >
          {checkIn.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.checkInButtonText}>
              Check In ({event.performers.length}{' '}
              {event.performers.length === 1 ? 'Artist' : 'Artists'})
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  venueName: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
  },
  lineupLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    marginLeft: 60,
  },
  performerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  performerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  performerAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  performerName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  performerSlug: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },
  ctaContainer: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  checkInButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  checkInButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
});
