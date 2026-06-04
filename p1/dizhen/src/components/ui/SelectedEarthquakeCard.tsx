import { useEarthquakeStore } from '../../store/useEarthquakeStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { X, Waves, MapPin, Clock, Thermometer, Activity, AlertTriangle, Play } from 'lucide-react';
import { cn } from '../../lib/utils';

function SelectedEarthquakeCard() {
  const { selectedEarthquake, setSelectedEarthquake, toggleSeismicWave, showSeismicWave } = useEarthquakeStore();

  if (!selectedEarthquake) return null;

  const depthColor = selectedEarthquake.depth < 70
    ? 'text-green-400'
    : selectedEarthquake.depth < 300
    ? 'text-yellow-400'
    : 'text-red-400';

  const magColor = selectedEarthquake.magnitude >= 6
    ? 'text-red-400'
    : selectedEarthquake.magnitude >= 4
    ? 'text-orange-400'
    : 'text-emerald-400';

  const depthClass = selectedEarthquake.depth < 70
    ? '浅源地震'
    : selectedEarthquake.depth < 300
    ? '中源地震'
    : '深源地震';

  return (
    <div className="fixed bottom-28 left-4 z-50">
      <div className="w-80 bg-black/75 backdrop-blur-md rounded-xl border border-white/10 p-5 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span className="text-white/60 text-sm font-medium">已选中地震</span>
            </div>
            <div className={cn('text-4xl font-bold font-mono mt-1', magColor)}>
              M{selectedEarthquake.magnitude.toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => setSelectedEarthquake(null)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-white/90 font-medium">{selectedEarthquake.place}</div>
              <div className="text-white/50 font-mono text-xs">
                {selectedEarthquake.latitude.toFixed(3)}°N, {selectedEarthquake.longitude.toFixed(3)}°E
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/40 flex-shrink-0" />
            <span className="text-white/80">
              {format(selectedEarthquake.time, 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-white/40" />
              <span className={cn('font-mono', depthColor)}>
                {selectedEarthquake.depth.toFixed(1)} km
              </span>
              <span className="text-white/50">({depthClass})</span>
            </div>
          </div>

          {selectedEarthquake.tsunami && (
            <div className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="w-4 h-4" />
              <span>海啸预警</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-white/50 text-xs">震级类型</div>
              <div className="text-white/80 font-mono">{selectedEarthquake.magType || '未知'}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <div className="text-white/50 text-xs">重要性</div>
              <div className="text-white/80 font-mono">{selectedEarthquake.significance}</div>
            </div>
          </div>

          {selectedEarthquake.magnitude >= 5 && (
            <button
              onClick={toggleSeismicWave}
              className={cn(
                'w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all',
                showSeismicWave
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              )}
            >
              <Play className="w-4 h-4" />
              {showSeismicWave ? '停止波传播模拟' : '播放地震波传播'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SelectedEarthquakeCard;
