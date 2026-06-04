import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Team } from '../types/game';

interface GameOverState {
  score: { red: number; blue: number };
  team: Team;
}

export const GameOver: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showStats, setShowStats] = useState(false);
  const [confetti, setConfetti] = useState<{ x: number; y: number; color: string; emoji: string }[]>([]);

  const { score, team } = (location.state as GameOverState) || { 
    score: { red: 0, blue: 0 }, 
    team: 'red' as Team 
  };

  const playerTeamScore = team === 'red' ? score.red : score.blue;
  const opponentScore = team === 'red' ? score.blue : score.red;
  const isWin = playerTeamScore > opponentScore;
  const isDraw = playerTeamScore === opponentScore;

  useEffect(() => {
    const emojis = ['🏀', '🔥', '⭐', '💥', '🏆', '🎊', '🎉', '✨'];
    const colors = ['#FF4444', '#FF8800', '#FFFF00', '#44FF44', '#4488FF', '#FF44FF'];
    
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    
    setConfetti(particles);

    setTimeout(() => setShowStats(true), 500);
  }, []);

  const handlePlayAgain = () => {
    navigate('/game', { state: { court: 'street', team } });
  };

  const handleBackToMenu = () => {
    navigate('/');
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {confetti.map((p, i) => (
        <div
          key={i}
          className="absolute text-3xl pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: `fall ${3 + Math.random() * 2}s linear infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          {p.emoji}
        </div>
      ))}

      <div className={`pixel-panel p-10 bg-pixel-dark/95 max-w-xl w-full text-center ${showStats ? 'bounce-in' : 'opacity-0'}`}>
        <div className="mb-8">
          <div className="text-8xl mb-4 animate-bounce">
            {isWin ? '🏆' : isDraw ? '🤝' : '💪'}
          </div>
          <h1 className={`pixel-text text-4xl mb-2 ${isWin ? 'text-fever-yellow' : isDraw ? 'text-fever-blue' : 'text-fever-red'}`}>
            {isWin ? '胜利!' : isDraw ? '平局!' : '惜败!'}
          </h1>
          <p className="pixel-text text-sm text-gray-400">
            {isWin ? '你带领队伍取得了胜利！' : isDraw ? '势均力敌，再战一场！' : '不要气馁，下次加油！'}
          </p>
        </div>

        <div className="flex justify-center items-center gap-8 mb-8">
          <div className="text-center">
            <div className="pixel-text text-xs text-fever-red mb-2">红队</div>
            <div 
              className={`pixel-text text-6xl font-bold ${isWin && team === 'red' ? 'text-fever-yellow animate-pulse' : 'text-white'}`}
              style={{ textShadow: '4px 4px 0 #000' }}
            >
              {score.red}
            </div>
          </div>
          
          <div className="pixel-text text-3xl text-gray-500">VS</div>
          
          <div className="text-center">
            <div className="pixel-text text-xs text-fever-blue mb-2">蓝队</div>
            <div 
              className={`pixel-text text-6xl font-bold ${isWin && team === 'blue' ? 'text-fever-yellow animate-pulse' : 'text-white'}`}
              style={{ textShadow: '4px 4px 0 #000' }}
            >
              {score.blue}
            </div>
          </div>
        </div>

        <div className="bg-pixel-darker p-4 rounded mb-8">
          <div className="pixel-text text-fever-yellow text-sm mb-3">📊 比赛数据</div>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <div className="pixel-text text-xs text-gray-400">你的队伍</div>
              <div className="pixel-text text-lg text-white">
                {team === 'red' ? '🔴 红队' : '🔵 蓝队'}
              </div>
            </div>
            <div>
              <div className="pixel-text text-xs text-gray-400">分差</div>
              <div className={`pixel-text text-lg ${playerTeamScore > opponentScore ? 'text-fever-green' : playerTeamScore < opponentScore ? 'text-fever-red' : 'text-gray-400'}`}>
                {playerTeamScore > opponentScore ? '+' : ''}{playerTeamScore - opponentScore}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="pixel-text text-fever-yellow text-xs mb-2">MVP</div>
          <div className="text-6xl mb-2 animate-bounce">
            {team === 'red' ? '🔴' : '🔵'}
          </div>
          <div className="pixel-text text-sm text-white">
            {isWin ? '就是你！' : '继续努力！'}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            className="pixel-btn-green flex-1 py-5 text-lg hover:scale-105 transition-transform"
            onClick={handlePlayAgain}
          >
            <span className="text-2xl mr-2">🔄</span>
            再来一局
          </button>
          <button
            className="pixel-btn-blue flex-1 py-5 text-lg hover:scale-105 transition-transform"
            onClick={handleBackToMenu}
          >
            <span className="text-2xl mr-2">🏠</span>
            主菜单
          </button>
        </div>
      </div>

      <div className="pixel-text text-xs text-gray-600 mt-6">
        按任意键返回主菜单
      </div>

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
