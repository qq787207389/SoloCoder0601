import { useRef, useEffect, useState } from 'react';
import { GameEngine, type GameStats } from '@/game/GameEngine';
import { GameState } from '@/game/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/game/constants';

interface GameCanvasProps {
  onGameStateChange?: (state: GameState) => void;
  onStatsUpdate?: (stats: GameStats) => void;
}

export default function GameCanvas({ onGameStateChange, onStatsUpdate }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [canvasScale, setCanvasScale] = useState(0.8);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
    }

    const gameEngine = new GameEngine();
    gameEngine.init(canvas);
    gameEngine.start();

    gameEngineRef.current = gameEngine;

    const stateCheckInterval = setInterval(() => {
      if (gameEngineRef.current) {
        const state = gameEngineRef.current.getGameState();
        const stats = gameEngineRef.current.getStats();
        
        onGameStateChange?.(state);
        onStatsUpdate?.(stats);
      }
    }, 100);

    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const scaleX = containerWidth / CANVAS_WIDTH;
      const scaleY = containerHeight / CANVAS_HEIGHT;
      const scale = Math.min(scaleX, scaleY, 1.5);

      setCanvasScale(scale);

      const canvas = canvasRef.current;
      canvas.style.width = `${CANVAS_WIDTH * scale}px`;
      canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(stateCheckInterval);
      window.removeEventListener('resize', handleResize);
      gameEngine.destroy();
      gameEngineRef.current = null;
    };
  }, [onGameStateChange, onStatsUpdate]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black"
    >
      <div
        className="relative"
        style={{
          width: `${CANVAS_WIDTH * canvasScale}px`,
          height: `${CANVAS_HEIGHT * canvasScale}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="pixel-canvas"
          style={{
            imageRendering: 'pixelated' as const,
          }}
        />
        <div className="crt-overlay absolute inset-0 pointer-events-none" />
        <div className="crt-scanlines absolute inset-0 pointer-events-none" />
      </div>
    </div>
  );
}
