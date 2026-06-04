import React from 'react';
import { GameState } from '../types/game';

interface ScoreBoardProps {
  gameState: GameState;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ gameState }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-8 py-4 pointer-events-none">
      <div className="flex items-center gap-4">
        <div className="pixel-panel px-6 py-3 bg-fever-red/90">
          <div className="pixel-text text-white text-xs mb-1">红队</div>
          <div className="pixel-text text-white text-4xl number-pop">
            {gameState.score.red}
          </div>
        </div>
      </div>

      <div className="pixel-panel px-8 py-4 bg-pixel-darker/90">
        <div className="pixel-text text-fever-yellow text-3xl text-center">
          {formatTime(gameState.time)}
        </div>
        {gameState.phase === 'paused' && gameState.time > 0 && (
          <div className="pixel-text text-fever-orange text-xs text-center mt-1 animate-pulse">
            暂停中
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="pixel-panel px-6 py-3 bg-fever-blue/90">
          <div className="pixel-text text-white text-xs mb-1 text-right">蓝队</div>
          <div className="pixel-text text-white text-4xl number-pop text-right">
            {gameState.score.blue}
          </div>
        </div>
      </div>
    </div>
  );
};
