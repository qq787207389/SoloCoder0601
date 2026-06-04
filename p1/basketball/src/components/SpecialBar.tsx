import React from 'react';
import { Player } from '../game/entities/Player';
import { GAME_CONFIG, ITEM_CONFIG } from '../types/game';

interface SpecialBarProps {
  player: Player | undefined;
  playerNumber: 1 | 2;
}

export const SpecialBar: React.FC<SpecialBarProps> = ({ player, playerNumber }) => {
  if (!player) return null;

  const gaugePercent = (player.state.specialGauge / GAME_CONFIG.MAX_SPECIAL) * 100;
  const isFull = player.state.specialGauge >= GAME_CONFIG.MAX_SPECIAL;
  const teamColorHex = player.team === 'red' ? '#FF4444' : '#4488FF';

  return (
    <div 
      className={`absolute bottom-4 ${playerNumber === 1 ? 'left-4' : 'right-4'} pointer-events-none`}
    >
      <div className="pixel-panel p-3 bg-pixel-darker/80">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ backgroundColor: teamColorHex }}
          >
            <span className="pixel-text text-white text-xs">P{playerNumber}</span>
          </div>
          <div>
            <div className="pixel-text text-white text-xs">
              {player.team === 'red' ? '红队' : '蓝队'}
            </div>
            {player.state.currentItem && player.state.currentItem !== 'banana' && (
              <div className="flex items-center gap-1 mt-1">
                <span 
                  className="text-lg"
                  style={{ color: ITEM_CONFIG[player.state.currentItem].color }}
                >
                  {ITEM_CONFIG[player.state.currentItem].icon}
                </span>
                <span className="pixel-text text-xs" style={{ color: ITEM_CONFIG[player.state.currentItem].color }}>
                  {Math.ceil(player.state.itemTimer / 60)}s
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="w-48 h-6 bg-pixel-darker border-2 border-pixel-dark relative overflow-hidden">
          <div 
            className={`h-full transition-all duration-100 ${isFull ? 'animate-pulse' : ''}`}
            style={{ 
              width: `${gaugePercent}%`,
              background: isFull 
                ? `linear-gradient(90deg, #FF4444, #FF8800, #FFFF00, #FF8800, #FF4444)`
                : `linear-gradient(90deg, ${teamColorHex}88, ${teamColorHex})`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`pixel-text text-xs ${isFull ? 'text-black font-bold' : 'text-white'}`}>
              {isFull ? '★ 必杀技就绪 ★' : `必杀槽 ${Math.floor(gaugePercent)}%`}
            </span>
          </div>
          {isFull && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-fever-yellow rounded-full animate-bounce flex items-center justify-center">
              <span className="text-xs">!</span>
            </div>
          )}
        </div>

        {player.state.isCharging && (
          <div className="mt-2 w-full h-3 bg-pixel-darker border-2 border-pixel-dark">
            <div 
              className="h-full transition-all duration-50"
              style={{ 
                width: `${player.state.chargePower * 100}%`,
                background: player.state.chargePower > 0.7 
                  ? 'linear-gradient(90deg, #FF4444, #FF0000)' 
                  : 'linear-gradient(90deg, #FFFF00, #FFAA00)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
