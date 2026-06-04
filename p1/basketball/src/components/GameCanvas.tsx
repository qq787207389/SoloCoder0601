import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GameEngine } from '../game/engine/GameEngine';
import { CourtRenderer } from '../game/rendering/CourtRenderer';
import { PlayerRenderer } from '../game/rendering/PlayerRenderer';
import { EffectRenderer } from '../game/rendering/EffectRenderer';
import { GameState, GAME_CONFIG } from '../types/game';
import { ScoreBoard } from './ScoreBoard';
import { SpecialBar } from './SpecialBar';
import { useGameLoop } from '../hooks/useGameLoop';

export const GameCanvas: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const courtRendererRef = useRef<CourtRenderer | null>(null);
  const playerRendererRef = useRef<PlayerRenderer | null>(null);
  const effectRendererRef = useRef<EffectRenderer | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showPauseMenu, setShowPauseMenu] = useState(false);

  const court = (location.state as any)?.court || 'street';
  const team = (location.state as any)?.team || 'red';

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = GAME_CONFIG.WIDTH;
    canvas.height = GAME_CONFIG.HEIGHT;

    engineRef.current = new GameEngine(court, team);
    engineRef.current.setOnStateChange((state) => {
      setGameState({ ...state });
      if (state.phase === 'gameover') {
        setTimeout(() => {
          navigate('/gameover', { state: { score: state.score, team } });
        }, 2000);
      }
    });

    courtRendererRef.current = new CourtRenderer(ctx);
    playerRendererRef.current = new PlayerRenderer(ctx);
    effectRendererRef.current = new EffectRenderer(ctx);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (engineRef.current) {
          const state = engineRef.current.getState();
          if (state.phase === 'playing') {
            engineRef.current.pause();
            setShowPauseMenu(true);
          } else if (state.phase === 'paused') {
            engineRef.current.resume();
            setShowPauseMenu(false);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, [court, team, navigate]);

  const update = useCallback((deltaTime: number) => {
    if (engineRef.current && !showPauseMenu) {
      engineRef.current.update(deltaTime);
    }
  }, [showPauseMenu]);

  const render = useCallback(() => {
    if (!canvasRef.current || !engineRef.current) return;
    if (!courtRendererRef.current || !playerRendererRef.current || !effectRendererRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const engine = engineRef.current;
    const state = engine.getState();
    const screenShake = engine.getScreenShake();

    ctx.clearRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);

    const items = engine.getItemSystem().getItems();
    const bananaPeels = engine.getItemSystem().getBananaPeels();
    courtRendererRef.current.render(engine.getCourt(), engine.getHoops(), items, bananaPeels);

    const players = engine.getPlayers();
    const sortedPlayers = [...players].sort((a, b) => a.position.y - b.position.y);
    
    sortedPlayers.forEach(player => {
      playerRendererRef.current!.render(player, screenShake.x, screenShake.y);
    });

    effectRendererRef.current.renderBall(engine.getBall(), screenShake.x, screenShake.y);
    effectRendererRef.current.renderEffects(engine.getEffects(), screenShake.x, screenShake.y);

    if (state.phase === 'countdown') {
      const count = engine.getCountdownDisplay();
      effectRendererRef.current.renderCountdown(count);
    }
  }, []);

  const isPlaying = gameState ? ['countdown', 'playing', 'paused'].includes(gameState.phase) : true;
  useGameLoop(update, render, isPlaying);

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resume();
      setShowPauseMenu(false);
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.reset();
      setShowPauseMenu(false);
    }
  };

  const handleQuit = () => {
    navigate('/');
  };

  const player1 = engineRef.current?.getPlayers().find(p => p.id === 'player1');
  const player4 = engineRef.current?.getPlayers().find(p => p.id === 'player4');

  return (
    <div className="w-full h-full flex items-center justify-center bg-pixel-darker relative overflow-hidden">
      <div className="relative" style={{ width: GAME_CONFIG.WIDTH, height: GAME_CONFIG.HEIGHT }}>
        <canvas
          ref={canvasRef}
          className="pixel-border crt-scanlines"
          style={{ 
            width: '100%', 
            height: '100%',
            imageRendering: 'pixelated',
          }}
        />
        
        {gameState && <ScoreBoard gameState={gameState} />}
        
        {gameState?.phase === 'playing' && (
          <>
            <SpecialBar player={player1} playerNumber={1} />
            <SpecialBar player={player4} playerNumber={2} />
          </>
        )}

        {showPauseMenu && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
            <div className="pixel-panel p-8 bg-pixel-dark text-center">
              <h2 className="pixel-text text-3xl text-fever-yellow mb-8">游戏暂停</h2>
              <div className="space-y-4">
                <button
                  className="pixel-btn-green w-full py-4"
                  onClick={handleResume}
                >
                  继续游戏
                </button>
                <button
                  className="pixel-btn-blue w-full py-4"
                  onClick={handleRestart}
                >
                  重新开始
                </button>
                <button
                  className="pixel-btn-red w-full py-4"
                  onClick={handleQuit}
                >
                  返回主菜单
                </button>
              </div>
              <p className="pixel-text text-xs text-gray-500 mt-4">按 ESC 继续</p>
            </div>
          </div>
        )}

        {gameState?.phase === 'gameover' && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
            <div className="pixel-panel p-8 bg-pixel-dark text-center bounce-in">
              <h2 className="pixel-text text-4xl text-fever-yellow mb-4">比赛结束!</h2>
              <div className="pixel-text text-lg text-gray-300 mb-6">正在返回结算页面...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
