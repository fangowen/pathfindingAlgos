const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const rows = 30;
const cols = 30;
const cellSize = canvas.width / cols;

let grid = [];
let start = { r: 2, c: 2 };
let goal = { r: rows - 3, c: cols - 3 };
let mode = 'walls'; // 'start' | 'goal' | 'walls'
let algorithm = 'astar';
let running = false;

function makeGrid() {
  grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({ r, c, wall: false }))
  );
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize;
      const y = r * cellSize;
      ctx.fillStyle = grid[r][c].wall ? '#222' : '#fff';
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeStyle = '#eee';
      ctx.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
    }
  }
  // draw start/goal
  drawCell(start.r, start.c, '#0b6cff');
  drawCell(goal.r, goal.c, '#ff6b6b');
}

function drawCell(r, c, color) {
  ctx.fillStyle = color;
  ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
}

canvas.addEventListener('click', (e) => {
  if (running) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const c = Math.floor(x / cellSize);
  const r = Math.floor(y / cellSize);
  if (mode === 'start') { start = { r, c }; }
  else if (mode === 'goal') { goal = { r, c }; }
  else { grid[r][c].wall = !grid[r][c].wall; }
  drawGrid();
});

// Controls
document.getElementById('set-start').addEventListener('click', () => { mode = 'start'; });
document.getElementById('set-goal').addEventListener('click', () => { mode = 'goal'; });
document.getElementById('toggle-walls').addEventListener('click', () => { mode = 'walls'; });
document.getElementById('algorithm').addEventListener('change', (e) => { algorithm = e.target.value; });

function neighbors(node) {
  const dirs = [ [1,0], [-1,0], [0,1], [0,-1] ];
  const res = [];
  for (const [dr, dc] of dirs) {
    const nr = node.r + dr, nc = node.c + dc;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc].wall) res.push({ r: nr, c: nc });
  }
  return res;
}

function heuristic(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
}

async function runAStar() {
  const open = new Map();
  const startKey = `${start.r},${start.c}`;
  open.set(startKey, { ...start, g: 0, f: heuristic(start, goal), prev: null });
  const closed = new Set();

  while (open.size) {
    // pick lowest f
    let currentKey, current;
    for (const [k, v] of open) {
      if (!current || v.f < current.f) { current = v; currentKey = k; }
    }
    if (!current) break;
    if (current.r === goal.r && current.c === goal.c) return reconstruct(current);

    open.delete(currentKey);
    closed.add(currentKey);
    drawCell(current.r, current.c, '#ffd966');
    await sleep(30);

    for (const nb of neighbors(current)) {
      const key = `${nb.r},${nb.c}`;
      if (closed.has(key)) continue;
      const tentativeG = current.g + 1;
      const existing = open.get(key);
      if (!existing || tentativeG < existing.g) {
        open.set(key, { ...nb, g: tentativeG, f: tentativeG + heuristic(nb, goal), prev: current });
      }
    }
  }
  return null;
}

async function runBFS() {
  const q = [{ ...start, prev: null }];
  const visited = new Set([`${start.r},${start.c}`]);
  while (q.length) {
    const cur = q.shift();
    drawCell(cur.r, cur.c, '#ffd966');
    await sleep(10);
    if (cur.r === goal.r && cur.c === goal.c) return reconstruct(cur);
    for (const nb of neighbors(cur)) {
      const key = `${nb.r},${nb.c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      q.push({ ...nb, prev: cur });
    }
  }
  return null;
}

async function runDijkstra() {
  // Dijkstra is A* without heuristic (or heuristic = 0)
  // We'll use a simple priority selection by smallest distance (g)
  const dist = new Map();
  const prev = new Map();
  const startKey = `${start.r},${start.c}`;
  const goalKey = `${goal.r},${goal.c}`;
  // initialize distances
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const k = `${r},${c}`;
    dist.set(k, Infinity);
  }
  dist.set(startKey, 0);

  const visited = new Set();

  while (true) {
    // pick unvisited node with smallest dist
    let currentKey = null;
    let currentDist = Infinity;
    for (const [k, d] of dist) {
      if (visited.has(k)) continue;
      if (d < currentDist) { currentDist = d; currentKey = k; }
    }
    if (currentKey === null || currentDist === Infinity) break;
    const [cr, cc] = currentKey.split(',').map(Number);
    const cur = { r: cr, c: cc };
    if (currentKey === goalKey) {
      // reconstruct using prev map
      const path = [];
      let k = currentKey;
      while (k) {
        const [pr, pc] = k.split(',').map(Number);
        path.push({ r: pr, c: pc });
        k = prev.get(k);
      }
      return path.reverse();
    }

    visited.add(currentKey);
    drawCell(cur.r, cur.c, '#ffd966');
    await sleep(20);

    for (const nb of neighbors(cur)) {
      const key = `${nb.r},${nb.c}`;
      if (visited.has(key)) continue;
      const alt = currentDist + 1; // uniform edge weight
      if (alt < dist.get(key)) {
        dist.set(key, alt);
        prev.set(key, currentKey);
      }
    }
  }
  return null;
}

function reconstruct(node) {
  const path = [];
  let cur = node;
  while (cur) {
    path.push({ r: cur.r, c: cur.c });
    cur = cur.prev;
  }
  return path.reverse();
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

async function run() {
  running = true;
  const speed = parseInt(document.getElementById('speed').value, 10);
  const originalSleep = sleep;
  // override sleep based on speed
  window.sleep = (ms) => originalSleep(Math.max(5, ms - speed));
  let path = null;
  if (algorithm === 'astar') path = await runAStar();
  else if (algorithm === 'dijkstra') path = await runDijkstra();
  else path = await runBFS();
  if (path) {
    for (const p of path) {
      drawCell(p.r, p.c, '#2ecc71');
      await sleep(20);
    }
  }
  running = false;
  window.sleep = originalSleep;
}

document.getElementById('run').addEventListener('click', run);
document.getElementById('clear').addEventListener('click', () => { makeGrid(); drawGrid(); });

makeGrid(); drawGrid();
