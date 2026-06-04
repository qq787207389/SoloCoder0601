import { useGameStore } from '@/store/gameStore';
import { useState } from 'react';
import { RED_TEAM_PLAYERS, BLUE_TEAM_PLAYERS, SPECIAL_NAMES } from '@/data/players';

export default function Home() {
  const startGame = useGameStore((s) => s.startGame);
  const setPeriodLength = useGameStore((s) => s.setPeriodLength);
  const [showHelp, setShowHelp] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [selectedTime, setSelectedTime] = useState(120);

  const handleStart = () => {
    setPeriodLength(selectedTime);
    startGame();
  };

  return (
    <div className="menu-page">
      <div className="menu-bg" />

      <div className="menu-content">
        <div className="title-section">
          <h1 className="game-title pixel-text">
            <span className="title-hot">热血</span>
            <span className="title-main">曲棍球</span>
          </h1>
          <div className="title-sub pixel-text">HOT BLOOD HOCKEY</div>
          <div className="title-puck" />
        </div>

        <div className="menu-buttons">
          <button className="pixel-btn btn-start" onClick={handleStart}>
            开始比赛
          </button>

          <div className="time-select">
            <span className="pixel-text time-label">比赛时长：</span>
            <button
              className={`pixel-btn btn-time ${selectedTime === 120 ? 'active' : ''}`}
              onClick={() => setSelectedTime(120)}
            >
              2分钟
            </button>
            <button
              className={`pixel-btn btn-time ${selectedTime === 180 ? 'active' : ''}`}
              onClick={() => setSelectedTime(180)}
            >
              3分钟
            </button>
            <button
              className={`pixel-btn btn-time ${selectedTime === 300 ? 'active' : ''}`}
              onClick={() => setSelectedTime(300)}
            >
              5分钟
            </button>
          </div>

          <button className="pixel-btn btn-secondary" onClick={() => setShowRoster(!showRoster)}>
            {showRoster ? '收起阵容' : '查看阵容'}
          </button>

          <button className="pixel-btn btn-secondary" onClick={() => setShowHelp(!showHelp)}>
            {showHelp ? '收起说明' : '操作说明'}
          </button>
        </div>

        {showHelp && (
          <div className="help-panel pixel-border">
            <div className="help-section">
              <h3 className="pixel-text help-title">🎮 红队（玩家1）</h3>
              <div className="help-grid">
                <span>移动</span><span>W A S D</span>
                <span>切换球员</span><span>Q</span>
                <span>射门/抢断</span><span>E</span>
                <span>打架/冲撞</span><span>Space</span>
                <span>必杀技</span><span>R</span>
                <span>使用道具</span><span>F</span>
              </div>
            </div>
            <div className="help-section">
              <h3 className="pixel-text help-title">🎮 蓝队（玩家2）</h3>
              <div className="help-grid">
                <span>移动</span><span>↑ ← ↓ →</span>
                <span>切换球员</span><span>/</span>
                <span>射门/抢断</span><span>.</span>
                <span>打架/冲撞</span><span>Right Shift</span>
                <span>必杀技</span><span>;</span>
                <span>使用道具</span><span>'</span>
              </div>
            </div>
            <div className="help-section">
              <h3 className="pixel-text help-title">📖 规则</h3>
              <p>把冰球打进对方球门就能得分！可以打架、用道具、放必杀，无所不用！</p>
              <p>蓄力条满了按必杀键释放专属必杀技！靠近队友时可以触发连携必杀！</p>
              <p>场上散落各种道具：加速冰刀、加长球杆、冰冻球、电击球</p>
            </div>
            <div className="help-section">
              <h3 className="pixel-text help-title">⏸️ 通用操作</h3>
              <div className="help-grid">
                <span>暂停</span><span>P</span>
                <span>退出比赛</span><span>ESC</span>
              </div>
            </div>
          </div>
        )}

        {showRoster && (
          <div className="roster-panel pixel-border">
            <div className="roster-team">
              <h3 className="pixel-text roster-title red-title">🔴 红队</h3>
              {RED_TEAM_PLAYERS.map((p) => (
                <div key={p.role} className="roster-player">
                  <div className="roster-color" style={{ background: p.colors.body }} />
                  <span className="roster-name">{p.name}</span>
                  <span className="roster-role">
                    {p.role === 'goalie' ? '守门员' : p.role.startsWith('forward') ? '前锋' : '后卫'}
                  </span>
                  <span className="roster-special pixel-text">{SPECIAL_NAMES[p.special]}</span>
                  <div className="roster-stats">
                    <span>速{p.stats.speed}</span>
                    <span>力{p.stats.power}</span>
                    <span>射{p.stats.shot}</span>
                    <span>传{p.stats.pass}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="roster-team">
              <h3 className="pixel-text roster-title blue-title">🔵 蓝队</h3>
              {BLUE_TEAM_PLAYERS.map((p) => (
                <div key={p.role} className="roster-player">
                  <div className="roster-color" style={{ background: p.colors.body }} />
                  <span className="roster-name">{p.name}</span>
                  <span className="roster-role">
                    {p.role === 'goalie' ? '守门员' : p.role.startsWith('forward') ? '前锋' : '后卫'}
                  </span>
                  <span className="roster-special pixel-text">{SPECIAL_NAMES[p.special]}</span>
                  <div className="roster-stats">
                    <span>速{p.stats.speed}</span>
                    <span>力{p.stats.power}</span>
                    <span>射{p.stats.shot}</span>
                    <span>传{p.stats.pass}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
