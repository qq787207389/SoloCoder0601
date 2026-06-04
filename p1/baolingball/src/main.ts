import './style.css';
import { BowlingGame } from './game';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new BowlingGame(canvas);

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  game.handleClick(x, y);
});
