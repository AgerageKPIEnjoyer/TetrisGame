const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

const scoreElement = document.getElementById('score');
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

context.scale(20, 20);
nextContext.scale(20, 20);

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

function startSequence(difficulty) {
    currentDifficulty = difficulty;    
   
    isPaused = false;       
    isAnimating = false;    
    gameRunning = false;    
    
    // Hiding all overlays
    menuOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    pauseMenuOverlay.classList.add('hidden');
    pauseBtn.classList.add('hidden'); 

    setupDifficulty(difficulty);
    
    // Clearing arena and score
    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();

    // Resetting player and next piece
    player.matrix = null;
    nextPiece = null; 

    // Hiding side panel during countdown
    sidePanelElements.classList.add('invisible');

    draw(); 

    // Starting countdown for new game
    runCountdown(true); 
}

function setupDifficulty(difficulty) {
    if (difficulty === 'easy') {
        dropInterval = 1000; 
        difficultyMultiplier = 1;
    } else if (difficulty === 'medium') {
        dropInterval = 700; 
        difficultyMultiplier = 1.5;
    } else if (difficulty === 'hard') {
        dropInterval = 400; 
        difficultyMultiplier = 2;
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

    countdownTimer = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.innerText = count;
        } else if (count === 0) {
            countdownText.innerText = "GO!";            
            
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
            // Resume game loop
            lastTime = performance.now(); 
            update();
        }
    }, 1000);
}

pauseBtn.addEventListener('click', () => {
    if (gameRunning && !isAnimating && !isCountdown) {
        togglePause();
    }
});

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseMenuOverlay.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        sidePanelElements.classList.add('invisible'); 
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
    startSequence(currentDifficulty);
}

function resetToMenu() {
    gameRunning = false;
    isPaused = false;
    isCountdown = false;
    isAnimating = false;
    
    // Clearing countdown timer if active
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
        while (!collide(arena, ghost)) { 
            ghost.pos.y++; 
        }
        ghost.pos.y--; // Move back to last valid position
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
    if (dir > 0) 
        matrix.forEach(row => row.reverse());
    else 
        matrix.reverse();
}

function playerRotate(dir) {
    if (isAnimating || isPaused || isCountdown) 
        return; 

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
        finalScoreElement.innerText = Math.floor(player.score);
        gameOverOverlay.classList.remove('hidden');
        pauseBtn.classList.add('hidden');
        sidePanelElements.classList.add('invisible'); 
    }
}

function playerDrop() {
    if (isAnimating || isPaused || isCountdown) 
        return; 

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
while (arena.length < 20) arena.push(new Array(12).fill(0));
let nextPiece = null; 
const player = { pos: {x: 0, y: 0}, matrix: null, score: 0 };

document.addEventListener('keydown', event => {
    if (!gameRunning || isAnimating || isPaused || isCountdown) 
        return; 

    if (event.key === 'ArrowLeft') 
        playerMove(-1);

    else if (event.key === 'ArrowRight') 
        playerMove(1);

    else if (event.key === 'ArrowDown') 
        playerDrop();

    else if (event.key === 'ArrowUp') 
        playerRotate(1);
});

function bindMobileControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnDown = document.getElementById('btn-down');
    const btnRotate = document.getElementById('btn-rotate');

    const handleInput = (action) => (e) => {
        e.preventDefault();
        if (gameRunning && !isAnimating && !isPaused && !isCountdown) 
            action();
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
draw();