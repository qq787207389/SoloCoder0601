import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CourtType, Team } from '../types/game';

interface CourtOption {
  type: CourtType;
  name: string;
  description: string;
  color: string;
  icon: string;
}

const courts: CourtOption[] = [
  { type: 'street', name: '街头球场', description: '带电铁丝网，碰到就弹飞！', color: '#2C3E50', icon: '🏙️' },
  { type: 'beach', name: '海滨球场', description: '沙滩陷脚，跑动变慢！', color: '#87CEEB', icon: '🏖️' },
  { type: 'highway', name: '高速公路', description: '小心卡车！球会被带走！', color: '#1A1A2E', icon: '🚛' },
];

export const MainMenu: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCourt, setSelectedCourt] = useState<CourtType>('street');
  const [selectedTeam, setSelectedTeam] = useState<Team>('red');
  const [showControls, setShowControls] = useState(false);
  const [titleBounce, setTitleBounce] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleBounce(prev => (prev + 1) % 60);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const startGame = () => {
    navigate('/game', { 
      state: { 
        court: selectedCourt, 
        team: selectedTeam 
      } 
    });
  };

  const bounceOffset = Math.sin(titleBounce * 0.2) * 5;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute pixel-text text-fever-yellow/10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${20 + Math.random() * 30}px`,
              transform: `rotate(${Math.random() * 30 - 15}deg)`,
            }}
          >
            🏀
          </div>
        ))}
      </div>

      <div 
        className="relative mb-12 text-center"
        style={{ transform: `translateY(${bounceOffset}px)` }}
      >
        <div className="relative">
          <h1 className="pixel-text text-6xl md:text-7xl font-bold mb-4">
            <span className="text-fever-red drop-shadow-lg">热血</span>
            <span className="text-fever-orange drop-shadow-lg">篮球</span>
          </h1>
          <div className="pixel-text text-2xl text-fever-yellow mb-2">
            BASKETBALL FEVER
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <span className="text-4xl animate-bounce" style={{ animationDelay: '0s' }}>🔥</span>
            <span className="text-5xl animate-bounce" style={{ animationDelay: '0.1s' }}>🏀</span>
            <span className="text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🔥</span>
          </div>
        </div>
      </div>

      <div className="pixel-panel p-8 bg-pixel-dark/90 max-w-2xl w-full mb-8">
        <h2 className="pixel-text text-xl text-fever-yellow mb-6 text-center">选择球队</h2>
        <div className="flex gap-4 justify-center mb-8">
          <button
            className={`pixel-btn flex-1 py-6 transition-all ${selectedTeam === 'red' ? 'pixel-btn-red scale-105 glow-red' : 'bg-gray-700 opacity-70'}`}
            onClick={() => setSelectedTeam('red')}
          >
            <div className="text-4xl mb-2">🔴</div>
            <div className="pixel-text text-sm">红队</div>
            <div className="pixel-text text-xs mt-1 opacity-75">WASD + J/K/L</div>
          </button>
          <button
            className={`pixel-btn flex-1 py-6 transition-all ${selectedTeam === 'blue' ? 'pixel-btn-blue scale-105 glow-blue' : 'bg-gray-700 opacity-70'}`}
            onClick={() => setSelectedTeam('blue')}
          >
            <div className="text-4xl mb-2">🔵</div>
            <div className="pixel-text text-sm">蓝队</div>
            <div className="pixel-text text-xs mt-1 opacity-75">方向键 + 1/2/3</div>
          </button>
        </div>

        <h2 className="pixel-text text-xl text-fever-yellow mb-6 text-center">选择场地</h2>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {courts.map((court) => (
            <button
              key={court.type}
              className={`pixel-btn p-4 transition-all h-full ${selectedCourt === court.type ? 'scale-105 ring-4 ring-fever-yellow' : 'opacity-80 hover:opacity-100'}`}
              style={{ backgroundColor: selectedCourt === court.type ? court.color : '#333' }}
              onClick={() => setSelectedCourt(court.type)}
            >
              <div className="text-3xl mb-2">{court.icon}</div>
              <div className="pixel-text text-xs mb-1">{court.name}</div>
              <div className="pixel-text text-[8px] opacity-75 leading-relaxed">{court.description}</div>
            </button>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <button
            className="pixel-btn-green px-12 py-5 text-lg hover:scale-105 transition-transform"
            onClick={startGame}
          >
            <span className="text-2xl mr-2">🏀</span>
            开始游戏
          </button>
          <button
            className="pixel-btn-blue px-8 py-5 hover:scale-105 transition-transform"
            onClick={() => setShowControls(!showControls)}
          >
            <span className="text-xl mr-2">🎮</span>
            操作说明
          </button>
        </div>
      </div>

      {showControls && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowControls(false)}>
          <div className="pixel-panel p-8 bg-pixel-dark max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="pixel-text text-2xl text-fever-yellow mb-6 text-center">🎮 操作说明</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-pixel-darker p-4 rounded">
                <h3 className="pixel-text text-fever-red mb-4 text-center">玩家1 (红队)</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <kbd className="px-3 py-2 bg-gray-700 rounded pixel-text text-xs">W</kbd>
                      <kbd className="px-3 py-2 bg-gray-700 rounded pixel-text text-xs">A</kbd>
                      <kbd className="px-3 py-2 bg-gray-700 rounded pixel-text text-xs">S</kbd>
                      <kbd className="px-3 py-2 bg-gray-700 rounded pixel-text text-xs">D</kbd>
                    </div>
                    <span className="pixel-text text-xs">移动</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <kbd className="px-4 py-2 bg-gray-700 rounded pixel-text text-xs">K</kbd>
                    <span className="pixel-text text-xs">跳跃 / 盖帽</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <kbd className="px-4 py-2 bg-gray-700 rounded pixel-text text-xs">J</kbd>
                    <span className="pixel-text text-xs">传球 / 抢断</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <kbd className="px-4 py-2 bg-gray-700 rounded pixel-text text-xs">L</kbd>
                    <span className="pixel-text text-xs">投篮 / 必杀技</span>
                  </div>
                </div>
              </div>

              <div className="bg-pixel-darker p-4 rounded">
                <h3 className="pixel-text text-fever-blue mb-4 text-center">玩家2 (蓝队)</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <kbd className="px-3 py-2 bg-gray-700 rounded pixel-text text-xs">↑</kbd>
                      <kbd className="px-3 py-2 bg-gray-700 rounded pixel-text text-xs">←</kbd>
                      <kbd className="px-3 py-2 bg-gray-700 rounded pixel-text text-xs">↓</kbd>
                      <kbd className="px-3 py-2 bg-gray-700 rounded pixel-text text-xs">→</kbd>
                    </div>
                    <span className="pixel-text text-xs">移动</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <kbd className="px-4 py-2 bg-gray-700 rounded pixel-text text-xs">2</kbd>
                    <span className="pixel-text text-xs">跳跃 / 盖帽</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <kbd className="px-4 py-2 bg-gray-700 rounded pixel-text text-xs">1</kbd>
                    <span className="pixel-text text-xs">传球 / 抢断</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <kbd className="px-4 py-2 bg-gray-700 rounded pixel-text text-xs">3</kbd>
                    <span className="pixel-text text-xs">投篮 / 必杀技</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-pixel-darker p-4 rounded mb-6">
              <h3 className="pixel-text text-fever-yellow mb-3">💡 游戏技巧</h3>
              <ul className="space-y-2 pixel-text text-xs text-gray-300">
                <li>• 按住投篮键可以蓄力，蓄力越满投篮力量越大</li>
                <li>• 跑动、传球、运球都会积累必杀槽，满槽后按投篮释放必杀技</li>
                <li>• 跳起来接近篮筐时投篮会变成扣篮，还能扣碎篮板！</li>
                <li>• 拾取场地上的道具可以获得临时增益</li>
                <li>• 防守时按传球键可以抢断，按跳跃键可以盖帽</li>
                <li>• 必杀技无法被普通盖帽，只能用防守必杀技拦截</li>
              </ul>
            </div>

            <button
              className="pixel-btn-red w-full py-4"
              onClick={() => setShowControls(false)}
            >
              知道了！
            </button>
          </div>
        </div>
      )}

      <div className="pixel-text text-xs text-gray-500 text-center">
        双人同屏对战 · 无规则街头篮球 · 热血搞笑
      </div>
    </div>
  );
};
