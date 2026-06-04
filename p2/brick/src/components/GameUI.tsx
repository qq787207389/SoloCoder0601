import { GameState } from '@/types/game';

interface GameUIProps {
  gameState: GameState;
  onStart: () => void;
  onPause: () => void;
  onNextLevel: () => void;
  onRestart: () => void;
}

export const GameUI = ({ gameState, onStart, onPause, onNextLevel, onRestart }: GameUIProps) => {
  return (
    <div className="relative">
      <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-4 z-10">
        <div className="flex items-center gap-6">
          <div className="text-cyan-400 font-mono">
            <span className="text-gray-400 text-sm">分数</span>
            <div className="text-2xl font-bold tracking-wider text-shadow">{gameState.score}</div>
          </div>
          <div className="text-purple-400 font-mono">
            <span className="text-gray-400 text-sm">关卡</span>
            <div className="text-2xl font-bold tracking-wider">{gameState.level}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm mr-2">生命</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full transition-all duration-300 ${
                i < gameState.lives
                  ? 'bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/50'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {gameState.ball.isPiercing && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
          <div className="px-4 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full text-yellow-400 text-sm font-bold animate-pulse">
            ⚡ 穿透模式
          </div>
        </div>
      )}

      {gameState.status === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
          <h1 className="text-5xl font-bold mb-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            敲砖块
          </h1>
          <p className="text-gray-400 mb-4 text-sm">经典街机游戏</p>
          <div className="flex flex-col items-center gap-1 mb-5">
            <p className="text-gray-500 text-xs">🎮 ← → 方向键移动挡板 &nbsp;|&nbsp; ⚡ 接住道具获得能力 &nbsp;|&nbsp; 🎯 消除砖块通关</p>
          </div>
          <button
            onClick={onStart}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30"
          >
            开始游戏
          </button>
          <p className="text-gray-500 text-xs mt-3">按 空格键 开始</p>
        </div>
      )}

      {gameState.status === 'paused' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
          <h2 className="text-4xl font-bold mb-8 text-cyan-400">游戏暂停</h2>
          <button
            onClick={onPause}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:scale-105"
          >
            继续游戏
          </button>
          <p className="text-gray-500 text-sm mt-4">按 P 键 继续</p>
        </div>
      )}

      {gameState.status === 'levelComplete' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent">
            关卡完成！
          </h2>
          <p className="text-2xl text-white mb-2">当前分数: <span className="text-cyan-400 font-bold">{gameState.score}</span></p>
          <p className="text-gray-400 mb-8">准备进入第 {gameState.level + 1} 关</p>
          <button
            onClick={onNextLevel}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-cyan-600 text-white font-bold rounded-lg hover:from-green-400 hover:to-cyan-500 transition-all transform hover:scale-105 shadow-lg shadow-green-500/30"
          >
            下一关
          </button>
        </div>
      )}

      {gameState.status === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20">
          <div className="text-6xl mb-4">💔</div>
          <h2 className="text-4xl font-bold mb-4 text-red-500">游戏结束</h2>
          <p className="text-xl text-gray-300 mb-2">最终关卡: <span className="text-purple-400 font-bold">{gameState.level}</span></p>
          <p className="text-2xl text-white mb-8">最终分数: <span className="text-cyan-400 font-bold">{gameState.score}</span></p>
          <button
            onClick={onRestart}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold rounded-lg hover:from-red-400 hover:to-orange-500 transition-all transform hover:scale-105 shadow-lg shadow-red-500/30"
          >
            重新开始
          </button>
        </div>
      )}
    </div>
  );
};
