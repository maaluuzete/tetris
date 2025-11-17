const COLS = 10;
const ROWS = 20;
const BLOCK = 24;

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
canvas.width = COLS * BLOCK;
canvas.height = ROWS * BLOCK;

const nextCanvas = document.getElementById('next');
const nctx = nextCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const startBtn = document.getElementById('startBtn');

let board, current, nextPiece, dropInterval, lastTime, gameOver, paused;
let score = 0, level = 1, lines = 0;

const COLORS = {
  I: '#b02828ff',
  J: '#ff8000ff',
  L: '#ffe57bff',
  O: '#76e6ffff',
  S: '#67ff9cff',
  T: '#a000ff',
  Z: '#fd6effff'
};

const SHAPES = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]]
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]]
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]]
  ],
  O: [
    [[1,1],[1,1]]
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]]
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]]
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]]
  ]
};

function createBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randPiece() {
  const types = Object.keys(SHAPES);
  const t = types[Math.floor(Math.random() * types.length)];
  return {
    type: t,
    shapeIndex: 0,
    shape: SHAPES[t][0],
    x: Math.floor((COLS - SHAPES[t][0][0].length) / 2),
    y: -1
  };
}

function rotate(piece) {
  const shapes = SHAPES[piece.type];
  piece.shapeIndex = (piece.shapeIndex + 1) % shapes.length;
  piece.shape = shapes[piece.shapeIndex];
}

function rotateBack(piece) {
  const shapes = SHAPES[piece.type];
  piece.shapeIndex = (piece.shapeIndex - 1 + shapes.length) % shapes.length;
  piece.shape = shapes[piece.shapeIndex];
}

function collide(piece, offsetX = 0, offsetY = 0) {
  const s = piece.shape;
  for (let r = 0; r < s.length; r++) {
    for (let c = 0; c < s[r].length; c++) {
      if (s[r][c]) {
        const x = piece.x + c + offsetX;
        const y = piece.y + r + offsetY;

        if (x < 0 || x >= COLS || y >= ROWS) return true;
        if (y >= 0 && board[y][x]) return true;
      }
    }
  }
  return false;
}

function placePiece() {
  const s = current.shape;
  for (let r = 0; r < s.length; r++) {
    for (let c = 0; c < s[r].length; c++) {
      if (s[r][c]) {
        const x = current.x + c;
        const y = current.y + r;
        if (y >= 0) board[y][x] = current.type;
      }
    }
  }

  clearLines();

  // Só cria nova peça se não estiver em game over
  if (!gameOver) spawn();
}

function clearLines() {
  let removed = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== 0)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(0));
      removed++;
      r++;
    }
  }

  if (removed > 0) {
    const points = [0, 40, 100, 300, 1200];
    score += points[removed] * level;
    lines += removed;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    updateInfo();
  }
}

function spawn() {
  current = nextPiece || randPiece();
  nextPiece = randPiece();

  if (collide(current, 0, 0)) {
    gameOver = true;
  }
}

function updateInfo() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  linesEl.textContent = lines;
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
  ctx.strokeStyle = '#00000080';
  ctx.strokeRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (cell) drawCell(c, r, COLORS[cell] || '#999');
    }
  }

  if (current) {
    const s = current.shape;
    for (let r = 0; r < s.length; r++) {
      for (let c = 0; c < s[r].length; c++) {
        if (s[r][c]) {
          const x = current.x + c;
          const y = current.y + r;
          if (y >= 0) drawCell(x, y, COLORS[current.type]);
        }
      }
    }
  }
}

function drawNext() {
  nctx.fillStyle = '#000';
  nctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  if (!nextPiece) return;

  const s = nextPiece.shape;
  const size = s.length;
  const offset = Math.floor((nextCanvas.width / BLOCK - size) / 2);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (s[r][c]) {
        nctx.fillStyle = COLORS[nextPiece.type];
        nctx.fillRect((c + offset) * BLOCK / 2, (r + offset) * BLOCK / 2, BLOCK / 2, BLOCK / 2);
        nctx.strokeStyle = '#00000080';
        nctx.strokeRect((c + offset) * BLOCK / 2 + 0.5, (r + offset) * BLOCK / 2 + 0.5, BLOCK / 2 - 1, BLOCK / 2 - 1);
      }
    }
  }
}

function drop() {
  if (!current) return;

  current.y++;

  if (collide(current, 0, 0)) {
    current.y--;
    placePiece();
  }
}


function move(dir) {
  current.x += dir;
  if (collide(current, 0, 0)) current.x -= dir;
}

function rotateCurrent() {
  rotate(current);
  if (collide(current, 0, 0)) {
    if (!collide(current, -1, 0)) current.x -= 1;
    else if (!collide(current, 1, 0)) current.x += 1;
    else if (!collide(current, 0, -1)) current.y -= 1;
    else rotateBack(current);
  }
}

function gameLoop(time = 0) {
  if (gameOver) {
    draw();

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '16px sans-serif';
    ctx.fillText('Clique em Iniciar para jogar de novo', canvas.width / 2, canvas.height / 2 + 20);

    return requestAnimationFrame(gameLoop);
  }

  if (paused) {
    draw();

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSADO', canvas.width / 2, canvas.height / 2);

    lastTime = time;

    return requestAnimationFrame(gameLoop);
  }

  const delta = time - lastTime;
  if (delta > dropInterval) {
    drop();
    lastTime = time;
  }

  draw();
  drawNext();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  createBoard();
  score = 0;
  lines = 0;
  level = 1;

  dropInterval = 1000;
  lastTime = 0;
  gameOver = false;
  paused = false;

  nextPiece = randPiece();
  current = null;

  spawn();
  updateInfo();

  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
  if (gameOver) return;

  if (e.key === 'ArrowLeft') { move(-1); draw(); }
  else if (e.key === 'ArrowRight') { move(1); draw(); }
  else if (e.key === 'ArrowUp') { rotateCurrent(); draw(); }
  else if (e.key === 'ArrowDown') { drop(); draw(); }
  else if (e.key.toLowerCase() === 'p') { paused = !paused; draw(); }
});

startBtn.addEventListener('click', startGame);

createBoard();
draw();
drawNext();

