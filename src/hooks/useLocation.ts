import { useEffect, useState, useCallback } from "react";
import * as Location from "expo-location";

export type PermissionStatus = "granted" | "denied" | "undetermined";

export const LOCATION_EXPLANATION =
  "We use your location to detect when you're at a venue so you can collect artists on the spot. No tracking, no background access -- just the dancefloor.";

function mapStatus(
  status: Location.PermissionStatus
): PermissionStatus {
  switch (status) {
    case Location.PermissionStatus.GRANTED:
      return "granted";
    case Location.PermissionStatus.DENIED:
      return "denied";
    default:
      return "undetermined";
  }
}

export function useLocation() {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("undetermined");

  // Check current permission on mount (no request)
  useEffect(() => {
    let mounted = true;
    Location.getForegroundPermissionsAsync().then((result) => {
      if (mounted) {
        setPermissionStatus(mapStatus(result.status));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const hasPermission = permissionStatus === "granted";

  const requestPermission = useCallback(async (): Promise<PermissionStatus> => {
    const result = await Location.requestForegroundPermissionsAsync();
    const mapped = mapStatus(result.status);
    setPermissionStatus(mapped);
    return mapped;
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    if (permissionStatus !== "granted") return null;
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch {
      return null;
    }
  }, [permissionStatus]);

  return {
    permissionStatus,
    hasPermission,
    requestPermission,
    getCurrentPosition,
    explanationText: LOCATION_EXPLANATION,
  };
}
