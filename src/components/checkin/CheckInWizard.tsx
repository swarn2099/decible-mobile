import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { useLocation } from "@/hooks/useLocation";
import { useVenueDetection } from "@/hooks/useVenueDetection";
import { LocationPermissionModal } from "@/components/location/LocationPermissionModal";
import { VenueScanStep } from "./VenueScanStep";
import { LineupStep } from "./LineupStep";
import { TagPerformerStep } from "./TagPerformerStep";
import { StampAnimationModal } from "./StampAnimationModal";
import type { WizardStep, ActiveVenueEvent, StampData } from "@/types";

type Props = {
  onBack: () => void;
};

export function CheckInWizard({ onBack }: Props) {
  const colors = useThemeColors();
  const router = useRouter();
  const {
    permissionStatus,
    hasPermission,
    requestPermission,
    getCurrentPosition,
    explanationText,
  } = useLocation();

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [step, setStep] = useState<WizardStep>({ type: 'idle' });
  const noMusicTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (noMusicTimer.current) clearTimeout(noMusicTimer.current);
    };
  }, []);

  const { nearbyEvents, isChecking, refetch } = useVenueDetection({
    enabled: hasPermission,
  });

  // ---------- Permission gate ----------
  // If permission is undetermined, show modal before doing anything GPS-related.
  useEffect(() => {
    if (permissionStatus === 'undetermined') {
      setShowPermissionModal(true);
    } else if (permissionStatus === 'granted') {
      setShowPermissionModal(false);
      // Permission already granted — kick off the scan immediately
      if (step.type === 'idle') {
        handleStartScan();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionStatus]);

  // ---------- Scan logic ----------
  const handleStartScan = useCallback(async () => {
    setStep({ type: 'scanning' });

    // Check GPS accuracy before proceeding
    const position = await getCurrentPosition();
    if (!position) {
      // Permission denied or error — can't get position
      setStep({ type: 'no_venues' });
      return;
    }

    if (position.accuracy !== null && position.accuracy > 200) {
      setStep({ type: 'gps_weak' });
      return;
    }

    // Trigger venue detection query
    refetch();
  }, [getCurrentPosition, refetch]);

  // When venue detection finishes (while we're in scanning state), advance to next step
  useEffect(() => {
    if (step.type !== 'scanning') return;
    if (isChecking) return; // still loading

    if (nearbyEvents.length === 0) {
      setStep({ type: 'no_venues' });
    } else if (nearbyEvents.length === 1) {
      setStep({ type: 'venue_confirm', event: nearbyEvents[0] });
    } else {
      // Sort by distance ascending
      const sorted = [...nearbyEvents].sort((a, b) => a.distance - b.distance);
      setStep({
        type: 'venue_select',
        venues: sorted as (ActiveVenueEvent & { distance: number })[],
      });
    }
  }, [step.type, isChecking, nearbyEvents]);

  // ---------- Permission modal handlers ----------
  async function handleEnableLocation() {
    setShowPermissionModal(false);
    const result = await requestPermission();
    if (result === 'granted') {
      handleStartScan();
    } else {
      // Denied — show "no venues" as fallback
      setStep({ type: 'no_venues' });
    }
  }

  function handleDismissPermissionModal() {
    setShowPermissionModal(false);
    onBack(); // Return to add mode toggle if user declines
  }

  // ---------- Venue selection / confirmation ----------
  function handleSelectVenue(event: ActiveVenueEvent) {
    setStep({ type: 'venue_confirm', event });
  }

  function handleConfirmVenue(event: ActiveVenueEvent) {
    if (event.performers.length > 0) {
      setStep({ type: 'lineup', event });
    } else {
      setStep({ type: 'no_lineup', event });
    }
  }

  // ---------- Check-in result handlers ----------
  function handleStamped(stamps: StampData[]) {
    setStep({ type: 'stamp', stamps });
  }

  function handleAlreadyCheckedIn(stamps: StampData[]) {
    setStep({ type: 'already_checked_in', stamps });
  }

  function handleNoMusic() {
    setStep({ type: 'no_music_dismiss' });
    if (noMusicTimer.current) clearTimeout(noMusicTimer.current);
    noMusicTimer.current = setTimeout(() => {
      resetWizard();
    }, 2000);
  }

  function resetWizard() {
    if (noMusicTimer.current) {
      clearTimeout(noMusicTimer.current);
      noMusicTimer.current = null;
    }
    setStep({ type: 'idle' });
    onBack();
  }

  // ---------- Back navigation within wizard ----------
  function handleWizardBack() {
    // Terminal / result states -> return to caller
    if (
      step.type === 'idle' ||
      step.type === 'no_venues' ||
      step.type === 'gps_weak' ||
      step.type === 'stamp' ||
      step.type === 'already_checked_in' ||
      step.type === 'no_music_dismiss'
    ) {
      onBack();
      return;
    }
    // lineup / no_lineup / venue_confirm -> re-run scan
    if (
      step.type === 'venue_confirm' ||
      step.type === 'lineup' ||
      step.type === 'no_lineup'
    ) {
      handleStartScan();
      return;
    }
    // venue_select -> re-run scan
    if (step.type === 'venue_select') {
      handleStartScan();
      return;
    }
    onBack();
  }

  // ---------- No-music dismiss ----------
  if (step.type === 'no_music_dismiss') {
    return (
      <View style={[styles.centerContainer, { flex: 1 }]}>
        <Text style={[styles.headingText, { color: colors.text }]}>
          No stamp without live music
        </Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          Decibel is for live shows only.
        </Text>
      </View>
    );
  }

  // ---------- Render ----------
  const showBackButton =
    step.type !== 'scanning' &&
    step.type !== 'idle' &&
    step.type !== 'stamp' &&
    step.type !== 'no_lineup'; // TagPerformerStep has its own back button

  const showStampModal = step.type === 'stamp';
  const stampModalStamps = step.type === 'stamp' ? step.stamps : [];

  return (
    <>
      <View style={{ flex: 1 }}>
        {/* Location Permission Modal */}
        <LocationPermissionModal
          visible={showPermissionModal}
          explanationText={explanationText}
          onEnable={handleEnableLocation}
          onClose={handleDismissPermissionModal}
        />

        {/* Back button header */}
        {showBackButton && (
          <TouchableOpacity
            onPress={handleWizardBack}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color={colors.textSecondary} />
            <Text style={[styles.backLabel, { color: colors.textSecondary }]}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Step content */}
        <View style={{ flex: 1, paddingTop: showBackButton ? 8 : 0 }}>
          {/* Venue scan, GPS weak, no venues, venue select, venue confirm, already_checked_in */}
          {(step.type === 'scanning' ||
            step.type === 'gps_weak' ||
            step.type === 'no_venues' ||
            step.type === 'venue_select' ||
            step.type === 'venue_confirm' ||
            step.type === 'already_checked_in') && (
            <VenueScanStep
              step={step}
              onRetry={handleStartScan}
              onBack={onBack}
              onSelectVenue={handleSelectVenue}
              onConfirmVenue={handleConfirmVenue}
            />
          )}

          {/* Lineup (Scenario A) */}
          {step.type === 'lineup' && (
            <LineupStep
              event={step.event}
              onStamped={handleStamped}
              onAlreadyCheckedIn={handleAlreadyCheckedIn}
            />
          )}

          {/* No lineup (Scenario B — tag performer via link paste) */}
          {step.type === 'no_lineup' && (
            <TagPerformerStep
              event={step.event}
              onStamp={handleStamped}
              onNoMusic={handleNoMusic}
              onBack={() => setStep({ type: 'venue_confirm', event: step.event })}
            />
          )}
        </View>
      </View>

      {/* Stamp animation modal — full-screen overlay */}
      <StampAnimationModal
        visible={showStampModal}
        stamps={stampModalStamps}
        onViewPassport={() => {
          router.push('/(tabs)/passport');
          resetWizard();
        }}
        onDismiss={resetWizard}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
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
});
