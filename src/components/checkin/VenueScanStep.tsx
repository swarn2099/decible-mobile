import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { MapPin } from "lucide-react-native";
import { useThemeColors } from "@/constants/colors";
import type { WizardStep, ActiveVenueEvent, StampData } from "@/types";

type Props = {
  step: WizardStep;
  onRetry: () => void;
  onBack: () => void;
  onSelectVenue: (event: ActiveVenueEvent) => void;
  onConfirmVenue: (event: ActiveVenueEvent) => void;
};

/**
 * Format distance as a human-readable string, e.g. "~45m away" or "~1.2km away".
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `~${Math.round(meters)}m away`;
  }
  return `~${(meters / 1000).toFixed(1)}km away`;
}

export function VenueScanStep({ step, onRetry, onBack, onSelectVenue, onConfirmVenue }: Props) {
  const colors = useThemeColors();

  // --- Scanning ---
  if (step.type === 'scanning') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.pink} />
        <Text style={[styles.scanningText, { color: colors.textSecondary }]}>
          Scanning for nearby venues...
        </Text>
      </View>
    );
  }

  // --- GPS too weak ---
  if (step.type === 'gps_weak') {
    return (
      <View style={styles.centerContainer}>
        <View style={[styles.iconCircle, { backgroundColor: colors.pink + '22' }]}>
          <MapPin size={32} color={colors.pink} />
        </View>
        <Text style={[styles.headingText, { color: colors.text }]}>
          GPS Signal Too Weak
        </Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          We need a stronger GPS signal to find your venue. Move near a window or outside and try again.
        </Text>
        <TouchableOpacity
          onPress={onRetry}
          style={[styles.primaryButton, { backgroundColor: colors.pink }]}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- No venues found ---
  if (step.type === 'no_venues') {
    return (
      <View style={styles.centerContainer}>
        <View style={[styles.iconCircle, { backgroundColor: colors.purple + '22' }]}>
          <MapPin size={32} color={colors.purple} />
        </View>
        <Text style={[styles.headingText, { color: colors.text }]}>
          No Venues Nearby
        </Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          Head to a live show and try again!
        </Text>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.secondaryButton, { borderColor: colors.cardBorder }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
            Back to Add
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Multiple venues — pick one ---
  if (step.type === 'venue_select') {
    return (
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Nearby Venues
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Which one are you at?
        </Text>
        <FlatList
          data={step.venues}
          keyExtractor={(item) => item.venue.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelectVenue(item)}
              activeOpacity={0.7}
              style={[
                styles.venueRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.venueName, { color: colors.text }]}>
                  {item.venue.name}
                </Text>
                {item.venue.address && (
                  <Text style={[styles.venueAddress, { color: colors.textSecondary }]}>
                    {item.venue.address}
                  </Text>
                )}
              </View>
              <View style={[styles.distanceBadge, { backgroundColor: colors.pink + '22' }]}>
                <Text style={[styles.distanceText, { color: colors.pink }]}>
                  {formatDistance(item.distance)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // --- Confirm single venue ---
  if (step.type === 'venue_confirm') {
    const { event } = step;
    return (
      <View style={styles.confirmContainer}>
        <View style={[styles.iconCircle, { backgroundColor: colors.pink + '22' }]}>
          <MapPin size={32} color={colors.pink} />
        </View>
        <Text style={[styles.venueConfirmName, { color: colors.text }]}>
          {event.venue.name}
        </Text>
        {event.venue.address && (
          <Text style={[styles.venueConfirmAddress, { color: colors.textSecondary }]}>
            {event.venue.address}
          </Text>
        )}
        <View style={[styles.distanceBadge, { backgroundColor: colors.pink + '22', alignSelf: 'center', marginTop: 8 }]}>
          <Text style={[styles.distanceText, { color: colors.pink }]}>
            {formatDistance(event.distance)}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={() => onConfirmVenue(event)}
          style={[styles.primaryButton, { backgroundColor: colors.pink }]}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Yes, I'm Here</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onBack}
          style={styles.textButton}
          activeOpacity={0.7}
        >
          <Text style={[styles.textButtonLabel, { color: colors.textSecondary }]}>
            That's not right — go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Already checked in ---
  if (step.type === 'already_checked_in') {
    const { stamps } = step;
    const venueName = stamps[0]?.venue_name ?? 'this venue';
    return (
      <View style={styles.centerContainer}>
        <View style={[styles.iconCircle, { backgroundColor: colors.teal + '22' }]}>
          <MapPin size={32} color={colors.teal} />
        </View>
        <Text style={[styles.headingText, { color: colors.text }]}>
          Already Checked In
        </Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          You already checked in at {venueName} tonight!
        </Text>
        {stamps.map((stamp) => (
          <Text
            key={stamp.performer_id}
            style={[styles.stampPerformerText, { color: colors.textSecondary }]}
          >
            {stamp.performer_name}
          </Text>
        ))}
        <TouchableOpacity
          onPress={onBack}
          style={[styles.secondaryButton, { borderColor: colors.cardBorder }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
            Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  confirmContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningText: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    marginTop: 16,
    textAlign: 'center',
  },
  headingText: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  bodyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 16,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  venueName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  venueAddress: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  distanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  venueConfirmName: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginTop: 16,
  },
  venueConfirmAddress: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  textButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  textButtonLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textDecorationLine: 'underline',
  },
  stampPerformerText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
});
