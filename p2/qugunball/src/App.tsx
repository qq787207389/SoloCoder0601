import { useGameStore } from '@/store/gameStore';
import Home from '@/pages/Home';
import Game from '@/pages/Game';
import Result from '@/pages/Result';

export default function App() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className="app-root">
      {screen === 'menu' && <Home />}
      {screen === 'game' && <Game />}
      {screen === 'result' && <Result />}
    </div>
  );
}
