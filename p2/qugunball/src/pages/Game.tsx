import { useRef, useEffect, useCallback } from 'react';
import { GameEngine } from '@/game/engine';
import { Renderer } from '@/game/renderer';
import { useGameStore } from '@/store/gameStore';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const periodLength = useGameStore((s) => s.periodLength);
  const endGame = useGameStore((s) => s.endGame);

  const onGameOver = useCallback(
    (score: { red: number; blue: number }) => {
      endGame(score);
    },
    [endGame]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 960;
    canvas.height = 540;

    const renderer = new Renderer(canvas);
    rendererRef.current = renderer;

    const engine = new GameEngine();
    engineRef.current = engine;

    engine.init((state) => {
      renderer.render(state);
      if (state.isGameOver && !engine._gameOverFired) {
        engine._gameOverFired = true;
        setTimeout(() => {
          onGameOver(state.score);
        }, 2000);
      }
    });

    engine.initGame(periodLength);
    engine.start();

    const handlePause = (e: KeyboardEvent) => {
      if (e.code === 'KeyP') {
        if (engine.state.isPaused) {
          engine.state.isPaused = false;
        } else if (!engine.state.isGameOver) {
          engine.state.isPaused = true;
        }
      }
      if (e.code === 'Escape') {
        engine.stop();
        onGameOver(engine.state.score);
      }
    };
    window.addEventListener('keydown', handlePause);

    return () => {
      engine.stop();
      engine.inputManager.destroy();
      window.removeEventListener('keydown', handlePause);
    };
  }, [periodLength, onGameOver]);

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
      />
      <div className="game-controls-hint">
        <span>P1: WASD移动 Q切换 E射门 Space打架 R必杀 F道具</span>
        <span>P2: 方向键移动 /切换 .射门 RShift打架 ;必杀 '道具</span>
        <span>P暂停 ESC退出</span>
      </div>
    </div>
  );
}
