let game = null;
let selectedTeam1 = 0;
let selectedTeam2 = 1;

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    game = new FootballGame(canvas);
    
    setupEventListeners();
});

function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (game) {
            game.input[e.code] = true;
            
            if (e.code === 'Escape') {
                if (game.isRunning && !game.isPaused) {
                    game.pause();
                    document.getElementById('pauseScreen').classList.remove('hidden');
                } else if (game.isPaused) {
                    game.resume();
                    document.getElementById('pauseScreen').classList.add('hidden');
                }
            }
        }
        
        e.preventDefault();
    });
    
    document.addEventListener('keyup', (e) => {
        if (game) {
            game.input[e.code] = false;
        }
    });
    
    document.querySelectorAll('.team-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const teamIndex = parseInt(card.dataset.team);
            
            document.querySelectorAll('.team-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedTeam1 = teamIndex;
            
            const otherTeams = [0, 1, 2, 3].filter(t => t !== teamIndex);
            selectedTeam2 = otherTeams[0];
        });
    });
    
    document.getElementById('start2v2').addEventListener('click', () => {
        startGame('2v2');
    });
    
    document.getElementById('start4p').addEventListener('click', () => {
        startGame('4p');
    });
    
    document.getElementById('resumeBtn').addEventListener('click', () => {
        game.resume();
        document.getElementById('pauseScreen').classList.add('hidden');
    });
    
    document.getElementById('restartBtn').addEventListener('click', () => {
        document.getElementById('pauseScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('scoreBoard').classList.add('hidden');
        document.getElementById('timer').classList.add('hidden');
        document.getElementById('weatherIndicator').classList.add('hidden');
        document.getElementById('staminaBars').classList.add('hidden');
    });
}

function startGame(mode) {
    initAudio();
    
    game.init(mode, [selectedTeam1, selectedTeam2]);
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('scoreBoard').classList.remove('hidden');
    document.getElementById('timer').classList.remove('hidden');
    document.getElementById('weatherIndicator').classList.remove('hidden');
    document.getElementById('staminaBars').classList.remove('hidden');
    
    game.start();
}
