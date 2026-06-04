import { useEarthquakeStore } from '../../store/useEarthquakeStore';
import { formatDistanceToNow } from 'date-fns';
import { Clock, MapPin, Thermometer, Waves, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

function InfoCard() {
  const { hoveredEarthquake } = useEarthquakeStore();

  if (!hoveredEarthquake) return null;

  const depthColor = hoveredEarthquake.depth < 70
    ? 'text-green-400'
    : hoveredEarthquake.depth < 300
    ? 'text-yellow-400'
    : 'text-red-400';

  const magColor = hoveredEarthquake.magnitude >= 6
    ? 'text-red-400'
    : hoveredEarthquake.magnitude >= 4
    ? 'text-orange-400'
    : 'text-emerald-400';

  return (
    <div className="fixed top-24 right-4 z-50 pointer-events-none">
      <div className="w-72 bg-black/70 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-white/60" />
              <span className="text-white/60 text-xs uppercase tracking-wide">地震事件</span>
            </div>
            <div className={cn('text-3xl font-bold font-mono mt-1', magColor)}>
              M{hoveredEarthquake.magnitude.toFixed(1)}
            </div>
          </div>
          {hoveredEarthquake.isNew && (
            <span className="px-2 py-1 bg-red-500/30 text-red-300 text-xs rounded-full animate-pulse">
              新
            </span>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-white/80">
            <MapPin className="w-4 h-4 text-white/40 flex-shrink-0" />
            <span className="truncate">{hoveredEarthquake.place}</span>
          </div>

          <div className="flex items-center gap-2 text-white/80">
            <Clock className="w-4 h-4 text-white/40 flex-shrink-0" />
            <span>{formatDistanceToNow(hoveredEarthquake.time, { addSuffix: true })}</span>
          </div>

          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-white/40 flex-shrink-0" />
            <span className="text-white/60">震源深度:</span>
            <span className={cn('font-mono', depthColor)}>
              {hoveredEarthquake.depth.toFixed(1)} km
            </span>
          </div>

          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white/40 flex-shrink-0" />
            <span className="text-white/60">坐标:</span>
            <span className="font-mono text-white/80">
              {hoveredEarthquake.latitude.toFixed(2)}°, {hoveredEarthquake.longitude.toFixed(2)}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InfoCard;
