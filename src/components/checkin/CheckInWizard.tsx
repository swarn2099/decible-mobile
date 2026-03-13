import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/constants/colors";
import { useLocation } from "@/hooks/useLocation";
import { useVenueDetection } from "@/hooks/useVenueDetection";
import { useShowCheckin } from "@/hooks/useShowCheckin";
import { LocationPermissionModal } from "@/components/location/LocationPermissionModal";
import { VenueScanStep } from "./VenueScanStep";
import { LineupStep } from "./LineupStep";
import { TagPerformerStep } from "./TagPerformerStep";
import { StampAnimationModal } from "./StampAnimationModal";
import { ScrapingWaitScreen } from "./ScrapingWaitScreen";
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

  // Store last known position so we can pass lat/lng to startCheckin
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  // ---------- Show check-in (VM scraper) ----------
  const { state: showCheckinState, startCheckin, reset: resetShowCheckin } = useShowCheckin();

  // Drive wizard step transitions from showCheckinState
  useEffect(() => {
    switch (showCheckinState.phase) {
      case 'layer1_hit':
        // VM Layer 1 enriched hit (shouldn't happen in normal flow — handled in handleConfirmVenue)
        // But handle gracefully if it fires after a rescan
        break;
      case 'waiting':
        setStep({
          type: 'show_waiting',
          searchId: showCheckinState.searchId,
          elapsed: showCheckinState.elapsed,
        });
        break;
      case 'result':
        setStep({ type: 'show_result', result: showCheckinState.result });
        break;
      case 'timeout':
        // No result after 15s — fall through to manual tag flow
        // Use a stub ActiveVenueEvent for the no_lineup path
        setStep({ type: 'show_timeout' });
        break;
      case 'error':
        // On error, fall back to no_venues so user isn't stuck
        setStep({ type: 'no_venues' });
        break;
      default:
        break;
    }
  }, [showCheckinState]);

  // Sync elapsed time into the show_waiting step (elapsed updates every second in hook state)
  useEffect(() => {
    if (
      showCheckinState.phase === 'waiting' &&
      step.type === 'show_waiting' &&
      showCheckinState.elapsed !== step.elapsed
    ) {
      setStep({
        type: 'show_waiting',
        searchId: showCheckinState.searchId,
        elapsed: showCheckinState.elapsed,
      });
    }
  // Including step here would cause an infinite loop — we only want to sync elapsed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCheckinState]);

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
  useEffect(() => {
    if (permissionStatus === 'undetermined') {
      setShowPermissionModal(true);
    } else if (permissionStatus === 'granted') {
      setShowPermissionModal(false);
      if (step.type === 'idle') {
        handleStartScan();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionStatus]);

  // ---------- Scan logic ----------
  const handleStartScan = useCallback(async () => {
    setStep({ type: 'scanning' });

    const position = await getCurrentPosition();
    if (!position) {
      setStep({ type: 'no_venues' });
      return;
    }

    if (position.accuracy !== null && position.accuracy > 200) {
      setStep({ type: 'gps_weak' });
      return;
    }

    // Store position for potential VM scraper call
    lastPositionRef.current = { lat: position.latitude, lng: position.longitude };

    refetch();
  }, [getCurrentPosition, refetch]);

  // When venue detection finishes (while we're in scanning state), advance to next step
  useEffect(() => {
    if (step.type !== 'scanning') return;
    if (isChecking) return;

    if (nearbyEvents.length === 0) {
      setStep({ type: 'no_venues' });
    } else if (nearbyEvents.length === 1) {
      setStep({ type: 'venue_confirm', event: nearbyEvents[0] });
    } else {
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
      setStep({ type: 'no_venues' });
    }
  }

  function handleDismissPermissionModal() {
    setShowPermissionModal(false);
    onBack();
  }

  // ---------- Venue selection / confirmation ----------
  function handleSelectVenue(event: ActiveVenueEvent) {
    setStep({ type: 'venue_confirm', event });
  }

  /**
   * Decision tree at venue confirmation:
   *   venue has DB lineup → LineupStep (existing happy path)
   *   venue has NO lineup → trigger VM scraper (show_waiting path)
   */
  function handleConfirmVenue(event: ActiveVenueEvent) {
    if (event.performers.length > 0) {
      // Happy path: DB has a lineup
      setStep({ type: 'lineup', event });
    } else {
      // No lineup in DB — trigger VM scraper
      const pos = lastPositionRef.current;
      if (pos) {
        startCheckin(pos.lat, pos.lng);
        // State machine drives the wizard step transition via useEffect above
      } else {
        // No position stored — fall back to manual tag
        setStep({ type: 'no_lineup', event });
      }
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
    resetShowCheckin();
    setStep({ type: 'idle' });
    onBack();
  }

  // ---------- Back navigation within wizard ----------
  function handleWizardBack() {
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
    if (
      step.type === 'venue_confirm' ||
      step.type === 'lineup' ||
      step.type === 'no_lineup'
    ) {
      handleStartScan();
      return;
    }
    if (step.type === 'venue_select') {
      handleStartScan();
      return;
    }
    if (
      step.type === 'show_waiting' ||
      step.type === 'show_result' ||
      step.type === 'show_timeout'
    ) {
      resetShowCheckin();
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

  // ---------- VM scraper wait screen ----------
  if (step.type === 'show_waiting') {
    return (
      <ScrapingWaitScreen
        elapsed={step.elapsed}
        onCancel={resetWizard}
      />
    );
  }

  // ---------- VM result / timeout ----------
  // Plan 05 adds confidence-aware UI. For now, route to existing fallback paths.
  if (step.type === 'show_result') {
    // Plan 05: render confidence-based confirmation UI.
    // Placeholder: fall through to no_venues until Plan 05 is built.
    return (
      <View style={[styles.centerContainer, { flex: 1 }]}>
        <Text style={[styles.headingText, { color: colors.text }]}>
          Lineup found!
        </Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          Confidence: {step.result.confidence}. Full UI coming in Phase 09-05.
        </Text>
      </View>
    );
  }

  if (step.type === 'show_timeout') {
    // No scrape result — show no_venues fallback
    return (
      <View style={[styles.centerContainer, { flex: 1 }]}>
        <Text style={[styles.headingText, { color: colors.text }]}>
          Couldn't find tonight's lineup
        </Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          Tag a performer manually to earn your stamp.
        </Text>
        <TouchableOpacity
          onPress={() => setStep({ type: 'no_venues' })}
          activeOpacity={0.7}
          style={[styles.actionButton, { backgroundColor: colors.pink }]}
        >
          <Text style={styles.actionButtonText}>Tag Manually</Text>
        </TouchableOpacity>
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

          {/* Lineup (Scenario A — DB has lineup) */}
          {step.type === 'lineup' && (
            <LineupStep
              event={step.event}
              onStamped={handleStamped}
              onAlreadyCheckedIn={handleAlreadyCheckedIn}
            />
          )}

          {/* No lineup (Scenario B — manual tag via link paste) */}
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
  actionButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});
