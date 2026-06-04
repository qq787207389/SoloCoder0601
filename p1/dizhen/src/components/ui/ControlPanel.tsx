import { useEarthquakeStore } from '../../store/useEarthquakeStore';
import { Layers, Globe, RefreshCw, Settings, Play, Pause } from 'lucide-react';
import { cn } from '../../lib/utils';

function ControlPanel() {
  const {
    showPlateBoundaries,
    togglePlateBoundaries,
    timeWindow,
    setTimeWindow,
    refreshData,
    isLoading,
  } = useEarthquakeStore();

  return (
    <div className="fixed top-24 left-4 z-50">
      <div className="bg-black/70 backdrop-blur-md rounded-xl border border-white/10 p-3 shadow-2xl w-56">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
          <Settings className="w-4 h-4 text-cyan-400" />
          <span className="text-white/80 text-sm font-medium">控制面板</span>
        </div>

        <div className="space-y-2">
          <button
            onClick={togglePlateBoundaries}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
              showPlateBoundaries
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            )}
          >
            <Layers className="w-4 h-4" />
            <span>板块边界</span>
            {showPlateBoundaries && <span className="ml-auto text-xs">已开启</span>}
          </button>

          <div className="pt-2 border-t border-white/10">
            <div className="text-white/50 text-xs mb-2">时间轴播放</div>
            <button
              onClick={() => setTimeWindow({ isPlaying: !timeWindow.isPlaying })}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/5 text-white/70 hover:bg-white/10 rounded-lg text-sm transition-all"
            >
              {timeWindow.isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>暂停播放</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>开始播放</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={refreshData}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            <span>刷新数据</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;
