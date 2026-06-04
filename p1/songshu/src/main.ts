import './style.css';
import { Game } from './Game';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="game-container">
    <canvas id="gameCanvas"></canvas>
    <div class="game-info">
      <h1>🐿️ 松鼠大战 🐿️</h1>
      <div class="controls">
        <div class="player-controls">
          <h3>玩家 1</h3>
          <p><span class="key">W</span><span class="key">A</span><span class="key">S</span><span class="key">D</span> 移动</p>
          <p><span class="key">空格</span> 跳跃</p>
          <p><span class="key">F</span> 举/扔</p>
        </div>
        <div class="player-controls">
          <h3>玩家 2</h3>
          <p><span class="key">↑</span><span class="key">←</span><span class="key">↓</span><span class="key">→</span> 移动</p>
          <p><span class="key">回车</span> 跳跃</p>
          <p><span class="key">Shift</span> 举/扔</p>
        </div>
      </div>
    </div>
  </div>
`;

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const game = new Game(canvas);
game.start();
