const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score'); 
const levelElement = document.getElementById('level');
const finalScoreElement = document.getElementById('final-score');
const sidePanelElements = document.querySelector('.side-panel');

const menuOverlay = document.getElementById('menu');
const gameOverOverlay = document.getElementById('game-over');
const pauseMenuOverlay = document.getElementById('pause-menu');
const rulesOverlay = document.getElementById('rules');
const countdownOverlay = document.getElementById('countdown');
const countdownText = document.getElementById('countdown-text');
const pauseBtn = document.getElementById('btn-pause');
const soundBtn = document.getElementById('btn-sound');
const gameContainer = document.querySelector('.game-container');

context.scale(20, 20);
nextContext.scale(20, 20);

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const sounds = {
    bgm: new Audio('sounds/music.mp3'),
    clear: new Audio('sounds/clear.mp3'),
    gameover: new Audio('sounds/gameover.mp3')
};

sounds.bgm.loop = true; 
sounds.bgm.volume = 0.5;

let isMuted = false;

const iconSoundOn = `
    <svg viewBox="0 0 24 24" width="24" height="24">
        <path d="M3 9v6h4l5 5V4L7 9H3z" fill="white"></path>
        <path d="M14.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" fill="white"></path>
        <path d="M16.5 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="white"></path>
    </svg>
`;

const iconSoundOff = `
    <svg viewBox="0 0 24 24" width="24" height="24">
        <path d="M3 9v6h4l5 5V4L7 9H3z" fill="white"></path>
        <line x1="16" y1="9" x2="22" y2="15" stroke="red" stroke-width="3" stroke-linecap="round"></line>
        <line x1="22" y1="9" x2="16" y2="15" stroke="red" stroke-width="3" stroke-linecap="round"></line>
    </svg>
`;

function playTone(freq, duration, type = 'square') {
    if (isMuted) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playDropSound() {
    if (isMuted) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime); 
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playClickSound() {
    if (isMuted) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.type = 'sine'; 
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

function playCountdownBeep(isGo = false) {
    if (isGo) {
        playTone(880, 0.6, 'square'); 
    } else {
        playTone(440, 0.1, 'square'); 
    }
}

function playMusic() {    
    sounds.bgm.play().catch(e => console.log("Music prevented:", e));
}

function pauseMusic() {
    sounds.bgm.pause();
}

function stopMusic() {
    sounds.bgm.pause();
    sounds.bgm.currentTime = 0;
}

function playSound(name) {
    if (isMuted) 
        return;

    if (name === 'drop') { 
        playDropSound(); 
        return; 
    } if (name === 'click') { 
        playClickSound(); 
        return; 
    }

    const sound = sounds[name];
    if (sound && name !== 'bgm') {
        sound.currentTime = 0;
        sound.play().catch(e => console.log(e));
    }
}

soundBtn.addEventListener('click', () => {
    isMuted = !isMuted;    
    
    sounds.bgm.muted = isMuted;

    if (isMuted) {
        soundBtn.innerHTML = iconSoundOff;
    } else {
        soundBtn.innerHTML = iconSoundOn;
        playClickSound();        
        if (gameRunning && !isPaused && !isCountdown && sounds.bgm.paused) {
            playMusic();
        }
    }
    soundBtn.blur();
});

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameRunning = false; 
let isPaused = false;     
let isAnimating = false; 
let isCountdown = false; 
let difficultyMultiplier = 1;
let currentDifficulty = 'medium';
const MIN_DROP_INTERVAL = 100;
let countdownTimer = null; 

const colors = [
    null, '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', 
    '#FF8E0D', '#FFE138', '#3877FF', '#FFFFFF' 
];

function updateHighScore() {
    const savedScore = localStorage.getItem('tetris_high_score') || 0;
    
    if (player.score > savedScore) {
        localStorage.setItem('tetris_high_score', player.score);
        highScoreElement.innerText = player.score;
    } else {
        highScoreElement.innerText = savedScore;
    }
}

function startSequence(difficulty) {
    currentDifficulty = difficulty;

    gameContainer.classList.remove('menu-mode');
    
    isPaused = false;       
    isAnimating = false;    
    gameRunning = false;    
    
    menuOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    pauseMenuOverlay.classList.add('hidden');
    pauseBtn.classList.add('hidden'); 

    setupDifficulty(difficulty);
    
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore(); 
    updateHighScore();

    player.matrix = null;
    nextPiece = null; 

    sidePanelElements.classList.add('invisible');

    draw(); 
    stopMusic();    
    runCountdown(true); 
}

function setupDifficulty(difficulty) {
    if (difficulty === 'easy') {
        dropInterval = 1000; difficultyMultiplier = 1;
    } else if (difficulty === 'medium') {
        dropInterval = 700; difficultyMultiplier = 1.5;
    } else if (difficulty === 'hard') {
        dropInterval = 400; difficultyMultiplier = 2;
    }
}

function runCountdown(isNewGame = false) {
    if (countdownTimer) 
        clearInterval(countdownTimer);

    isCountdown = true; 
    gameRunning = true; 
    isPaused = true;    
    
    countdownOverlay.classList.remove('hidden');
    pauseBtn.classList.add('hidden'); 
    
    let count = 3;
    countdownText.innerText = count;
    playCountdownBeep(false); 

    countdownTimer = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.innerText = count;
            playCountdownBeep(false); 
        } else if (count === 0) {
            countdownText.innerText = "GO!";
            playCountdownBeep(true); 
            
            if (isNewGame) {
                nextPiece = getRandomPiece(); 
                playerReset();
            }
        } else {
            clearInterval(countdownTimer);
            countdownTimer = null;
            
            countdownOverlay.classList.add('hidden');
            pauseBtn.classList.remove('hidden'); 
            sidePanelElements.classList.remove('invisible');

            isCountdown = false;
            isPaused = false;             
            
            playMusic();            
            lastTime = performance.now(); 
            update();
        }
    }, 1000);
}

pauseBtn.addEventListener('click', () => {
    playSound('click');
    if (gameRunning && !isAnimating && !isCountdown) {
        togglePause();
    }
    pauseBtn.blur();
});

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseMenuOverlay.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        sidePanelElements.classList.add('invisible');         
        pauseMusic(); 
    } else {
        resumeGame();
    }
}

function resumeGame() {
    isPaused = false;
    pauseMenuOverlay.classList.add('hidden');
    runCountdown(false); 
}

function restartGame() {
    stopMusic(); 
    startSequence(currentDifficulty);
}

function resetToMenu() {
    gameRunning = false;

    gameContainer.classList.add('menu-mode');

    isPaused = false;
    isCountdown = false;
    isAnimating = false;
    
    if (countdownTimer) 
        clearInterval(countdownTimer);

    countdownOverlay.classList.add('hidden');    
    gameOverOverlay.classList.add('hidden');
    pauseMenuOverlay.classList.add('hidden');
    menuOverlay.classList.remove('hidden');
    pauseBtn.classList.add('hidden'); 

    arena.forEach(row => row.fill(0));
    player.matrix = null;
    nextPiece = null;
    player.score = 0;
    
    sidePanelElements.classList.add('invisible');    
    stopMusic();     
    draw();
}

function openRules() { rulesOverlay.classList.remove('hidden'); }
function closeRules() { rulesOverlay.classList.add('hidden'); }

function update(time = 0) {
    if (!gameRunning) 
        return;

    if (isPaused) {
        draw(); 
        requestAnimationFrame(update);
        return; 
    }

    const deltaTime = time - lastTime;
    lastTime = time;

    if (!isAnimating) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
    }

    draw();
    requestAnimationFrame(update);
}

function createPiece(type) {
    if (type === 'I') return [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]];
    if (type === 'L') return [[0, 2, 0], [0, 2, 0], [0, 2, 2]];
    if (type === 'J') return [[0, 3, 0], [0, 3, 0], [3, 3, 0]];
    if (type === 'O') return [[4, 4], [4, 4]];
    if (type === 'Z') return [[5, 5, 0], [0, 5, 5], [0, 0, 0]];
    if (type === 'S') return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
    if (type === 'T') return [[0, 7, 0], [7, 7, 7], [0, 0, 0]];
}

function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMatrix(arena, {x: 0, y: 0});

    if (player.matrix) {
        const ghost = { pos: { ...player.pos }, matrix: player.matrix };
        while (!collide(arena, ghost)) { ghost.pos.y++; }
        ghost.pos.y--;
        context.globalAlpha = 0.2;
        drawMatrix(ghost.matrix, ghost.pos);
        context.globalAlpha = 1;

        drawMatrix(player.matrix, player.pos);
    }
    drawNext();
}

function drawNext() {
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextPiece) return; 
    const offsetX = (5 - nextPiece.length) / 2;
    const offsetY = (5 - nextPiece.length) / 2;
    drawMatrix(nextPiece, {x: offsetX, y: offsetY}, nextContext);
}

function updateScore() {
    scoreElement.innerText = Math.floor(player.score);
    levelElement.innerText = 11 - Math.floor(dropInterval / 100); 
}

function arenaSweep() {
    let rowsToRemove = [];
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) continue outer;
        }
        rowsToRemove.push(y);
    }

    if (rowsToRemove.length > 0) {
        isAnimating = true;
        playSound('clear'); 
        
        rowsToRemove.forEach(y => { arena[y].fill(8); });
        draw(); 
        
        setTimeout(() => {
            let rowCount = 0;
            for (let y = arena.length - 1; y >= 0; --y) {
                 if (arena[y][0] === 8) { 
                     const row = arena.splice(y, 1)[0].fill(0);
                     arena.unshift(row);
                     y++;
                     rowCount++;
                 }
            }
            if (rowCount > 0) {
                player.score += rowCount * 10 * difficultyMultiplier * rowCount; 
                dropInterval = Math.max(dropInterval - 20, MIN_DROP_INTERVAL);
                updateScore();
            }
            isAnimating = false; 
        }, 300);
    } else {
        playSound('drop'); 
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) matrix.forEach(row => row.reverse());
    else matrix.reverse();
}

function playerRotate(dir) {
    if (isAnimating || isPaused || isCountdown) return; 
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function playerReset() {
    player.matrix = nextPiece;
    nextPiece = getRandomPiece();
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    
    if (collide(arena, player)) {
        player.matrix = null; 
        gameRunning = false;
        
        stopMusic();
        playSound('gameover');        
        
        updateHighScore();

        finalScoreElement.innerText = Math.floor(player.score);
        gameOverOverlay.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        sidePanelElements.classList.add('invisible'); 
    }
}

function playerDrop() {
    if (isAnimating || isPaused || isCountdown) return; 
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep(); 
        dropCounter = 0;
    }
    dropCounter = 0;
}

function playerMove(dir) {
    if (isAnimating || isPaused || isCountdown) return;
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

const pieces = 'ILJOTSZ';
let lastPieceType = null;
function getRandomPiece() {
    let type;
    do {
        type = pieces[pieces.length * Math.random() | 0];
    } while (type === lastPieceType);
    lastPieceType = type;
    return createPiece(type);
}

const arena = [];
while (arena.length < 20) 
    arena.push(new Array(12).fill(0));

let nextPiece = null; 
const player = { pos: {x: 0, y: 0}, matrix: null, score: 0 };

document.addEventListener('keydown', event => {
    if (!gameRunning || isAnimating || isPaused || isCountdown) return; 

    if (event.key === 'ArrowLeft') playerMove(-1);
    else if (event.key === 'ArrowRight') playerMove(1);
    else if (event.key === 'ArrowDown') playerDrop();
    else if (event.key === 'ArrowUp') playerRotate(1);
});

function bindMobileControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnDown = document.getElementById('btn-down');
    const btnRotate = document.getElementById('btn-rotate');

    const handleInput = (action) => (e) => {
        e.preventDefault();
        if (gameRunning && !isAnimating && !isPaused && !isCountdown) action();
    };

    btnLeft.addEventListener('touchstart', handleInput(() => playerMove(-1)));
    btnRight.addEventListener('touchstart', handleInput(() => playerMove(1)));
    btnDown.addEventListener('touchstart', handleInput(() => playerDrop()));
    btnRotate.addEventListener('touchstart', handleInput(() => playerRotate(1)));

    btnLeft.addEventListener('mousedown', () => { if (gameRunning && !isAnimating && !isPaused && !isCountdown) playerMove(-1); });
    btnRight.addEventListener('mousedown', () => { if (gameRunning && !isAnimating && !isPaused && !isCountdown) playerMove(1); });
    btnDown.addEventListener('mousedown', () => { if (gameRunning && !isAnimating && !isPaused && !isCountdown) playerDrop(); });
    btnRotate.addEventListener('mousedown', () => { if (gameRunning && !isAnimating && !isPaused && !isCountdown) playerRotate(1); });
}

bindMobileControls();
sidePanelElements.classList.add('invisible'); 
gameContainer.classList.add('menu-mode');
draw(); 

function attachButtonSounds() {
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => {
        if (btn.classList.contains('control-btn')) return;
        btn.addEventListener('click', () => {
            playSound('click');
        });
    });
}
attachButtonSounds();

window.addEventListener('blur', () => {   
    if (gameRunning && !isPaused && !isCountdown && !gameOverOverlay.classList.contains('hidden') === false) {
        togglePause();
    }
});