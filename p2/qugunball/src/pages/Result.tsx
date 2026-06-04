import { useGameStore } from '@/store/gameStore';
import { RED_TEAM_PLAYERS, BLUE_TEAM_PLAYERS, SPECIAL_NAMES } from '@/data/players';

export default function Result() {
  const finalScore = useGameStore((s) => s.finalScore);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const startGame = useGameStore((s) => s.startGame);

  const winner = finalScore
    ? finalScore.red > finalScore.blue
      ? 'red'
      : finalScore.blue > finalScore.red
        ? 'blue'
        : 'draw'
    : 'draw';

  const mvpRed = RED_TEAM_PLAYERS.reduce((a, b) => (a.stats.shot > b.stats.shot ? a : b));
  const mvpBlue = BLUE_TEAM_PLAYERS.reduce((a, b) => (a.stats.shot > b.stats.shot ? a : b));

  return (
    <div className="result-page">
      <div className="result-bg" />

      <div className="result-content">
        <h1 className="result-title pixel-text">
          {winner === 'draw' ? '平局！' : winner === 'red' ? '红队获胜！' : '蓝队获胜！'}
        </h1>

        <div className="result-score">
          <div className="score-team red-team">
            <div className="score-number pixel-text">{finalScore?.red ?? 0}</div>
            <div className="score-label">红队</div>
          </div>
          <div className="score-vs pixel-text">:</div>
          <div className="score-team blue-team">
            <div className="score-number pixel-text">{finalScore?.blue ?? 0}</div>
            <div className="score-label">蓝队</div>
          </div>
        </div>

        <div className="result-mvp">
          <h2 className="mvp-title pixel-text">MVP</h2>
          <div className="mvp-players">
            <div className="mvp-card red-mvp">
              <div className="mvp-portrait" style={{ background: mvpRed.colors.body, borderColor: mvpRed.colors.stripe }}>
                <div className="mvp-helmet" style={{ background: mvpRed.colors.helmet }} />
              </div>
              <div className="mvp-name">{mvpRed.name}</div>
              <div className="mvp-special pixel-text">{SPECIAL_NAMES[mvpRed.special]}</div>
            </div>
            <div className="mvp-card blue-mvp">
              <div className="mvp-portrait" style={{ background: mvpBlue.colors.body, borderColor: mvpBlue.colors.stripe }}>
                <div className="mvp-helmet" style={{ background: mvpBlue.colors.helmet }} />
              </div>
              <div className="mvp-name">{mvpBlue.name}</div>
              <div className="mvp-special pixel-text">{SPECIAL_NAMES[mvpBlue.special]}</div>
            </div>
          </div>
        </div>

        <div className="result-actions">
          <button className="pixel-btn btn-red" onClick={startGame}>
            再来一局
          </button>
          <button className="pixel-btn btn-blue" onClick={goToMenu}>
            返回菜单
          </button>
        </div>
      </div>
    </div>
  );
}
