import { useEffect, useCallback } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { GameCanvas } from './GameCanvas';
import { GameUI } from './GameUI';

export const BrickBreaker = () => {
  const { gameState, startGame, pauseGame, nextLevel, restartGame, setKey } = useGameEngine();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      setKey('left', true);
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      setKey('right', true);
    }
    if (e.key === ' ' && gameState.status === 'idle') {
      e.preventDefault();
      startGame();
    }
    if (e.key === 'p' || e.key === 'P') {
      if (gameState.status === 'playing' || gameState.status === 'paused') {
        pauseGame();
      }
    }
  }, [gameState.status, setKey, startGame, pauseGame]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      setKey('left', false);
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      setKey('right', false);
    }
  }, [setKey]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="relative">
        <GameCanvas gameState={gameState} />
        <GameUI
          gameState={gameState}
          onStart={startGame}
          onPause={pauseGame}
          onNextLevel={nextLevel}
          onRestart={restartGame}
        />
      </div>
      
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
          <span className="text-gray-400">变长</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 bg-gradient-to-r from-red-400 to-red-600 rounded"></div>
          <span className="text-gray-400">变短</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
          <span className="text-gray-400">减速</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded"></div>
          <span className="text-gray-400">穿透</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 bg-gradient-to-r from-purple-400 to-purple-600 rounded"></div>
          <span className="text-gray-400">加命</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 bg-gradient-to-br from-gray-200 to-gray-400 rounded"></div>
          <span className="text-gray-400">银色砖块 (2次击碎)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-4 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded"></div>
          <span className="text-gray-400">金色砖块 (不可摧毁)</span>
        </div>
      </div>

      <div className="mt-4 text-gray-500 text-xs text-center">
        <p>提示：用挡板边缘接球可以改变小球角度，创造极限救球的机会！</p>
      </div>
    </div>
  );
};
