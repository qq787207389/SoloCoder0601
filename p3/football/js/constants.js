const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;
const PITCH_WIDTH = 1100;
const PITCH_HEIGHT = 600;
const PITCH_X = 50;
const PITCH_Y = 50;

const GOAL_WIDTH = 150;
const GOAL_HEIGHT = 100;
const GOAL_DEPTH = 30;

const PLAYER_RADIUS = 18;
const PLAYER_SPEED = 4;
const PLAYER_MAX_SPEED = 8;
const KICK_POWER = 12;
const TACKLE_POWER = 15;

const BALL_RADIUS = 10;
const BALL_FRICTION = 0.98;
const BALL_AIR_FRICTION = 0.995;
const GRAVITY = 0.3;

const TEAMS = [
    { name: '火焰队', color: '#ff6b6b', secondary: '#fff', accent: '#ffd93d' },
    { name: '冰霜队', color: '#4ecdc4', secondary: '#fff', accent: '#45b7d1' },
    { name: '雷电队', color: '#ffd93d', secondary: '#000', accent: '#ff6b6b' },
    { name: '暗影队', color: '#a855f7', secondary: '#fff', accent: '#8b5cf6' }
];

const PLAYER_NAMES = [
    '火焰', '暴龙', '猛虎', '闪电', '暴风',
    '寒冰', '烈风', '雷霆', '陨石', '旋风'
];

const POWERUP_TYPES = {
    SPEED: { name: '加速鞋', color: '#4ecdc4', duration: 8000 },
    POWER: { name: '铁棍', color: '#ffd93d', duration: 10000 },
    BANANA: { name: '香蕉皮', color: '#f4d03f', duration: 0 },
    HEALTH: { name: '能量饮料', color: '#ff6b6b', duration: 0 }
};

const WEATHER_TYPES = {
    SUNNY: { name: '晴朗', icon: '☀️', effect: null },
    RAIN: { name: '暴雨', icon: '🌧️', effect: 'slippery' },
    WIND: { name: '台风', icon: '🌀', effect: 'wind' },
    TORNADO: { name: '龙卷风', icon: '🌪️', effect: 'tornado' },
    EARTHQUAKE: { name: '地震', icon: '🌋', effect: 'holes' }
};

const SPECIAL_MOVES = {
    FIRE_SHOT: { name: '火焰射门', cost: 30, power: 2 },
    PHANTOM_SHOT: { name: '幻影射门', cost: 35, power: 1.5 },
    METEOR_SHOT: { name: '陨石射门', cost: 40, power: 2.5 },
    GOALKEEPER_SAVE: { name: '分身扑救', cost: 25, power: 1 },
    COMBINATION: { name: '合体必杀', cost: 50, power: 3 }
};

const GAME_DURATION = 180;
const POWERUP_SPAWN_INTERVAL = 8000;
const WEATHER_CHANGE_INTERVAL = 30000;

const PLAYER_STATES = {
    IDLE: 'idle',
    RUNNING: 'running',
    KICKING: 'kicking',
    TACKLING: 'tackling',
    FALLEN: 'fallen',
    CELEBRATING: 'celebrating',
    PETRIFIED: 'petrified',
    CHARGING: 'charging'
};
