import { Navigation } from 'lucide-react';
import { useDayRoute, TravelMode } from '../hooks/useDayRoute';

interface DayTravelSummaryProps {
  spots: any[];
  mode?: TravelMode;
  className?: string;
}

/**
 * Shows a day's total travel distance (and duration when Directions is
 * available) as a small pill, e.g. "18 mi · ~1h 10m" or "~18 mi (approx)".
 * Renders nothing when there aren't at least two located stops to route.
 */
export default function DayTravelSummary({ spots, mode = 'DRIVING', className = '' }: DayTravelSummaryProps) {
  const { loading, distanceMi, durationText, isApprox } = useDayRoute(spots, mode);

  if (!loading && distanceMi == null) return null;

  const miles =
    distanceMi == null
      ? ''
      : distanceMi < 10
        ? distanceMi.toFixed(1)
        : Math.round(distanceMi).toLocaleString();

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${className}`}>
      <Navigation size={12} className="text-orange-500" />
      {loading ? (
        <span className="text-zinc-400">Calculating route…</span>
      ) : (
        <span className="text-zinc-500">
          {isApprox ? '~' : ''}{miles} mi{durationText ? ` · ~${durationText}` : ''}{isApprox ? ' (approx)' : ''}
        </span>
      )}
    </div>
  );
}
