import { useEffect, useState } from 'react';
import { loadGoogleMapsScript } from '../utils/googleMapsLoader';

export type TravelMode = 'DRIVING' | 'WALKING' | 'TRANSIT' | 'BICYCLING';

export interface DayRouteResult {
  loading: boolean;
  distanceMi: number | null;
  durationText: string | null;
  /** true when we fell back to straight-line haversine (Directions unavailable). */
  isApprox: boolean;
  /** number of stops that had usable coordinates. */
  stopCount: number;
}

const EARTH_RADIUS_M = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

const metersToMiles = (m: number) => m / 1609.344;

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Computes total travel distance (and, when Directions is available, duration)
 * across a day's ordered stops. Uses the Google Maps JS DirectionsService with
 * the existing Maps key; falls back to straight-line haversine (labelled
 * approximate) when Directions isn't enabled/available, so it never blocks the
 * UI and upgrades automatically once the Directions API + billing are live.
 */
export function useDayRoute(spots: any[], mode: TravelMode = 'DRIVING'): DayRouteResult {
  const [state, setState] = useState<DayRouteResult>({
    loading: false,
    distanceMi: null,
    durationText: null,
    isApprox: false,
    stopCount: 0,
  });

  const coordsKey = JSON.stringify((spots || []).map((s: any) => [s?.lat, s?.lng]));

  useEffect(() => {
    const located = (spots || [])
      .filter((s: any) => s && s.lat != null && s.lng != null)
      .map((s: any) => ({ lat: Number(s.lat), lng: Number(s.lng) }));

    if (located.length < 2) {
      setState({ loading: false, distanceMi: null, durationText: null, isApprox: false, stopCount: located.length });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, stopCount: located.length }));

    const haversineFallback = () => {
      let meters = 0;
      for (let i = 1; i < located.length; i++) meters += haversineMeters(located[i - 1], located[i]);
      if (!cancelled) {
        setState({ loading: false, distanceMi: metersToMiles(meters), durationText: null, isApprox: true, stopCount: located.length });
      }
    };

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      haversineFallback();
      return () => { cancelled = true; };
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        const win = window as any;
        if (!win.google?.maps?.DirectionsService) {
          haversineFallback();
          return;
        }
        const svc = new win.google.maps.DirectionsService();
        const origin = located[0];
        const destination = located[located.length - 1];
        const waypoints = located.slice(1, -1).map((p) => ({ location: p, stopover: true }));
        svc.route(
          {
            origin,
            destination,
            waypoints,
            travelMode: win.google.maps.TravelMode[mode] || win.google.maps.TravelMode.DRIVING,
          },
          (result: any, status: string) => {
            if (cancelled) return;
            if (status === 'OK' && result?.routes?.[0]?.legs) {
              let meters = 0;
              let secs = 0;
              result.routes[0].legs.forEach((leg: any) => {
                meters += leg.distance?.value || 0;
                secs += leg.duration?.value || 0;
              });
              setState({
                loading: false,
                distanceMi: metersToMiles(meters),
                durationText: secs > 0 ? formatDuration(secs) : null,
                isApprox: false,
                stopCount: located.length,
              });
            } else {
              // REQUEST_DENIED (Directions not enabled), OVER_QUERY_LIMIT, etc.
              haversineFallback();
            }
          }
        );
      })
      .catch(() => {
        if (!cancelled) haversineFallback();
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordsKey, mode]);

  return state;
}
