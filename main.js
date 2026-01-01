const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const finalScoreElement = document.getElementById('final-score');

const menuOverlay = document.getElementById('menu');
const gameOverOverlay = document.getElementById('game-over');

context.scale(20, 20);
nextContext.scale(20, 20);

// --- НАЛАШТУВАННЯ ГРИ ---
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameRunning = false; 
let isAnimating = false; 
let difficultyMultiplier = 1; // Множник очок
let currentDifficulty = 'medium'; // Поточна складність

const MIN_DROP_INTERVAL = 100; // Максимальна швидкість (100мс)

// Кольори (9-й колір - білий для анімації)
const colors = [
    null,
    '#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', 
    '#FF8E0D', '#FFE138', '#3877FF', '#FFFFFF' 
];

// --- УПРАВЛІННЯ МЕНЮ ---

function startGame(difficulty) {
    currentDifficulty = difficulty; // Запам'ятовуємо вибір!

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

    arena.forEach(row => row.fill(0));
    player.score = 0;
    updateScore();
    
    menuOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    
    gameRunning = true;
    nextPiece = getRandomPiece(); // Генеруємо нову фігуру при старті
    playerReset();
    update();
}

function resetToMenu() {
    gameRunning = false;
    gameOverOverlay.classList.add('hidden');
    menuOverlay.classList.remove('hidden');
    
    arena.forEach(row => row.fill(0)); // Чистимо стакан
    player.matrix = null; // Прибираємо гравця
    nextPiece = null; // Прибираємо наступну фігуру
    
    player.score = 0;
    updateScore();

    draw(); // Перемальовуємо все (тепер буде чорна порожнеча)
}

function restartGame() {    
    startGame(currentDifficulty); 
}

function showGameOver() {
    gameRunning = false;
    finalScoreElement.innerText = Math.floor(player.score);
    gameOverOverlay.classList.remove('hidden');
}

// --- ФУНКЦІОНАЛ ГРИ ---

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
        const ghost = {
            pos: { ...player.pos }, // Копіюємо позицію (щоб не змінювати реального гравця)
            matrix: player.matrix   // Беремо ту ж саму форму
        };

        // Кидаємо тінь вниз до упору
        while (!collide(arena, ghost)) {
            ghost.pos.y++;
        }
        ghost.pos.y--; // Повертаємо на крок назад (бо цикл зупинився, коли вже відбулося зіткнення)

        // Малюємо тінь прозорою
        context.globalAlpha = 0.2; // 20% непрозорості
        drawMatrix(ghost.matrix, ghost.pos);
        context.globalAlpha = 1;   // Повертаємо непрозорість назад для решти гри
        // ---------------------------

        // 4. Малюємо реального гравця поверх тіні
        drawMatrix(player.matrix, player.pos);        
    }

    drawNext();
}

function drawNext() {
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPiece) 
        return;

    const offsetX = (5 - nextPiece.length) / 2;
    const offsetY = (5 - nextPiece.length) / 2;
    drawMatrix(nextPiece, {x: offsetX, y: offsetY}, nextContext);
}

function updateScore() {
    scoreElement.innerText = Math.floor(player.score);
    // Показуємо умовний "рівень швидкості" (чим менше інтервал, тим вище число)
    levelElement.innerText = 11 - Math.floor(dropInterval / 100); 
}

// --- ЛОГІКА АНІМАЦІЇ ТА ВИДАЛЕННЯ ---

function arenaSweep() {
    let rowsToRemove = [];
    
    // Шукаємо повні лінії
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) continue outer;
        }
        rowsToRemove.push(y);
    }

    if (rowsToRemove.length > 0) {
        isAnimating = true; // Блокуємо гру

        // 1. Фарбуємо лінії в білий (колір 8)
        rowsToRemove.forEach(y => {
            arena[y].fill(8); 
        });
        draw(); 

        // 2. Чекаємо, поки гравець побачить спалах
        setTimeout(() => {
            let rowCount = 0;
            
            // Проходимо по всій арені. Якщо бачимо білий рядок - видаляємо його.
            // Важливо йти з самих низів, щоб індекси не збивалися при видаленні.
            for (let y = arena.length - 1; y >= 0; --y) {
                 // Перевіряємо, чи це наш "білий" рядок (індекс 8)
                 if (arena[y][0] === 8) { 
                     const row = arena.splice(y, 1)[0].fill(0); // Вирізаємо і очищаємо
                     arena.unshift(row); // Кладемо порожній зверху
                     y++; // Оскільки ми видалили рядок, треба перевірити цю координату знову
                     rowCount++;
                 }
            }

            // Тільки тепер, коли ми точно знаємо rowCount, нараховуємо очки
            if (rowCount > 0) {
                player.score += rowCount * 10 * difficultyMultiplier * rowCount; 
                
                // Прискорення
                dropInterval = Math.max(dropInterval - 20, MIN_DROP_INTERVAL);
                
                updateScore();
            }

            isAnimating = false; // Розблокуємо гру
        }, 300);
    }
}

// --- СТАНДАРТНА ЛОГІКА ---

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
    if (isAnimating) return; // Не можна крутити під час анімації
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
    
    // Якщо одразу після появи є зіткнення
    if (collide(arena, player)) {
        player.matrix = null; // Прибираємо фігуру, щоб вона не малювалася
        showGameOver(); 
    }
}

function playerDrop() {
    if (isAnimating) return; // Не падаємо під час анімації

    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep(); // Це викличе анімацію
        dropCounter = 0;
    }
    dropCounter = 0;
}

function playerMove(dir) {
    if (isAnimating) return;
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

// Рандомайзер
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

// Ініціалізація змінних
const arena = [];
while (arena.length < 20) arena.push(new Array(12).fill(0)); // 12x20
let nextPiece = getRandomPiece();
const player = { pos: {x: 0, y: 0}, matrix: null, score: 0 };


// --- ІГРОВИЙ ЦИКЛ ---

function update(time = 0) {
    if (!gameRunning) {
        // Якщо гра не йде (меню), все одно викликаємо update, щоб працювала анімація меню (якщо буде)
        // Але тут просто чекаємо
        requestAnimationFrame(update);
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;

    // Якщо йде анімація знищення ліній - ми НЕ оновлюємо падіння фігури
    if (!isAnimating) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
        }
    }

    draw();
    requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    if (!gameRunning || isAnimating) return; // Блокуємо керування

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

    // Використовуємо 'touchstart' замість 'click' для миттєвої реакції на телефонах
    // (e.preventDefault() потрібен, щоб не спрацьовував зум або скрол при швидкому натисканні)

    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning && !isAnimating) playerMove(-1);
    });

    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning && !isAnimating) playerMove(1);
    });

    btnDown.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning && !isAnimating) playerDrop();
    });

    btnRotate.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning && !isAnimating) playerRotate(1);
    });

    // Додаємо дублювання для кліків мишкою (для тестування в браузері в режимі емуляції)
    btnLeft.addEventListener('mousedown', () => { if (gameRunning && !isAnimating) playerMove(-1); });
    btnRight.addEventListener('mousedown', () => { if (gameRunning && !isAnimating) playerMove(1); });
    btnDown.addEventListener('mousedown', () => { if (gameRunning && !isAnimating) playerDrop(); });
    btnRotate.addEventListener('mousedown', () => { if (gameRunning && !isAnimating) playerRotate(1); });
}

bindMobileControls();
update();