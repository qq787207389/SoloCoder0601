import { Game } from './Game';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game('gameCanvas');
  game.start();
});
