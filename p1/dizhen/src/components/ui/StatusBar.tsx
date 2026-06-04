import { useEarthquakeStore } from '../../store/useEarthquakeStore';
import { Activity, Globe, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '../../lib/utils';

function StatusBar() {
  const { totalCount, maxMagnitude, lastUpdated, isLoading, newCount } = useEarthquakeStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md rounded-full border border-white/10 px-6 py-2.5 shadow-2xl">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-white/60 text-sm">全球地震监测</span>
        </div>

        <div className="w-px h-4 bg-white/20" />

        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-white/60 text-xs">总数</span>
          <span className="text-white font-mono font-bold">{totalCount}</span>
        </div>

        <div className="w-px h-4 bg-white/20" />

        <div className="flex items-center gap-2">
          <AlertTriangle
            className={cn(
              'w-4 h-4',
              maxMagnitude >= 6 ? 'text-red-400' : 'text-orange-400'
            )}
          />
          <span className="text-white/60 text-xs">最大震级</span>
          <span
            className={cn(
              'font-mono font-bold',
              maxMagnitude >= 6 ? 'text-red-400' : 'text-orange-400'
            )}
          >
            M{maxMagnitude.toFixed(1)}
          </span>
        </div>

        {newCount > 0 && (
          <>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-red-500/30 text-red-300 text-xs rounded-full animate-pulse">
                +{newCount} 新
              </span>
            </div>
          </>
        )}

        <div className="w-px h-4 bg-white/20" />

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-cyan-400 rounded-full animate-spin" />
          ) : (
            <Clock className="w-4 h-4 text-white/40" />
          )}
          <span className="text-white/60 text-xs">
            {lastUpdated
              ? formatDistanceToNow(lastUpdated, {
                  addSuffix: true,
                  locale: zhCN,
                })
              : '加载中...'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default StatusBar;
