import { useState, useCallback } from 'react';
import GameCanvas from '@/components/GameCanvas';
import { GameState } from '@/game/types';
import type { GameStats } from '@/game/GameEngine';
import { Gamepad2, Info, X } from 'lucide-react';

export default function GamePage() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    combo: 0,
    currentLevel: 0,
    totalEnemiesDefeated: 0,
    maxCombo: 0
  });
  const [showControls, setShowControls] = useState(false);

  const handleGameStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleStatsUpdate = useCallback((newStats: GameStats) => {
    setStats(newStats);
  }, []);

  const getStateText = (state: GameState): string => {
    switch (state) {
      case GameState.MENU:
        return '主菜单';
      case GameState.PLAYING:
        return '游戏中';
      case GameState.PAUSED:
        return '已暂停';
      case GameState.BOSS_INTRO:
        return 'BOSS登场';
      case GameState.VICTORY:
        return '胜利!';
      case GameState.DEFEAT:
        return '战败...';
      case GameState.TRANSITION:
        return '加载中...';
      default:
        return '';
    }
  };

  const getStateColor = (state: GameState): string => {
    switch (state) {
      case GameState.PLAYING:
        return 'text-green-400';
      case GameState.PAUSED:
        return 'text-yellow-400';
      case GameState.VICTORY:
        return 'text-yellow-300';
      case GameState.DEFEAT:
        return 'text-red-400';
      case GameState.BOSS_INTRO:
        return 'text-red-500';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <GameCanvas
        onGameStateChange={handleGameStateChange}
        onStatsUpdate={handleStatsUpdate}
      />

      <div className="absolute top-4 left-4 z-10">
        <div className="bg-black/60 backdrop-blur-sm border border-yellow-600/50 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-yellow-500" />
            <span className={`font-bold ${getStateColor(gameState)}`}>
              {getStateText(gameState)}
            </span>
          </div>
        </div>
      </div>

      {gameState === GameState.PLAYING && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-black/60 backdrop-blur-sm border border-yellow-600/50 rounded-lg px-4 py-2 text-right">
            <div className="text-yellow-400 font-bold text-lg">
              得分: {stats.score.toLocaleString()}
            </div>
            <div className="text-gray-300 text-sm">
              第 {stats.currentLevel + 1} 关
            </div>
            {stats.combo > 1 && (
              <div className="text-red-400 font-bold animate-pulse">
                {stats.combo} 连击!
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute bottom-4 right-4 z-10 bg-black/60 backdrop-blur-sm border border-yellow-600/50 rounded-lg p-3 hover:bg-black/80 transition-colors"
      >
        {showControls ? (
          <X className="w-6 h-6 text-yellow-500" />
        ) : (
          <Info className="w-6 h-6 text-yellow-500" />
        )}
      </button>

      {showControls && (
        <div className="absolute bottom-20 right-4 z-10 bg-black/80 backdrop-blur-sm border border-yellow-600/50 rounded-lg p-4 max-w-xs">
          <h3 className="text-yellow-400 font-bold mb-3 text-lg">操作说明</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">移动</span>
              <span className="text-gray-200">W A S D / 方向键</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">跳跃</span>
              <span className="text-gray-200">空格</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">拳</span>
              <span className="text-gray-200">J</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">脚</span>
              <span className="text-gray-200">K</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">技能</span>
              <span className="text-gray-200">L</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">防御</span>
              <span className="text-gray-200">Shift</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">暂停</span>
              <span className="text-gray-200">ESC</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">确认</span>
              <span className="text-gray-200">Enter</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-yellow-600/30">
            <p className="text-yellow-500 text-xs">
              连击技巧: 方向键 + 攻击键 = 特殊招式
            </p>
          </div>
        </div>
      )}

      {gameState === GameState.MENU && (
        <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-sm border border-yellow-600/50 rounded-lg px-4 py-2">
          <p className="text-gray-300 text-sm">
            按 <span className="text-yellow-400 font-bold">↑↓</span> 选择 | 
            <span className="text-yellow-400 font-bold"> Enter</span> 开始
          </p>
        </div>
      )}

      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-sm px-8 py-4 rounded-lg border border-yellow-600/30">
            <p className="text-yellow-400 text-xl font-bold animate-pulse">
              按 ESC 继续游戏
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
