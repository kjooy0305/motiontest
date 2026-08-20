/* ══════════════════════════════════════════════════════════
   놀람 고양이 — 랜덤 트롤 탐험
   죽음 없음. 대신 놀란다. 맵·함정 배치·함정 종류가 매번 무작위.
   ══════════════════════════════════════════════════════════ */

/* ─────────── 1. 시드 난수 ─────────── */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function seedFromString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function randomSeedText() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

/* ─────────── 2. 소리 (파일 없이 합성) ─────────── */
const Snd = {
  ctx: null, on: true,
  init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  tone(f1, f2, dur, type, vol, delay) {
    if (!this.on || !this.ctx) return;
    const t = this.now() + (delay || 0);
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f1, t);
    if (f2 && f2 !== f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol == null ? 0.18 : vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol, delay, lp) {
    if (!this.on || !this.ctx) return;
    const t = this.now() + (delay || 0);
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol == null ? 0.2 : vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = src;
    if (lp) { const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; src.connect(f); node = f; }
    node.connect(g); g.connect(this.ctx.destination);
    src.start(t); src.stop(t + dur + 0.02);
  },
  meow() { this.tone(700, 420, 0.28, 'sawtooth', 0.16); this.tone(1050, 640, 0.26, 'sine', 0.08, 0.02); },
  jump() { this.tone(420, 780, 0.11, 'square', 0.09); },
  land() { this.noise(0.06, 0.09, 0, 900); },
  fish() { this.tone(880, 1320, 0.09, 'triangle', 0.14); this.tone(1320, 1760, 0.09, 'triangle', 0.1, 0.07); },
  boom() { this.noise(0.5, 0.4, 0, 500); this.tone(140, 40, 0.45, 'sawtooth', 0.3); },
  pop() { this.tone(260, 900, 0.08, 'square', 0.16); },
  spring() { this.tone(300, 1500, 0.22, 'square', 0.14); },
  whoosh() { this.noise(0.3, 0.13, 0, 2200); },
  glitch() { for (let i = 0; i < 5; i++) this.tone(200 + Math.random() * 1400, 120, 0.05, 'square', 0.09, i * 0.045); },
  door() { this.tone(520, 780, 0.14, 'triangle', 0.15); this.tone(780, 1170, 0.2, 'triangle', 0.13, 0.12); },
  win() {[0, .12, .24, .42].forEach((d, i) => this.tone([523, 659, 784, 1046][i], null, 0.3, 'triangle', 0.16, d)); }
};

/* ─────────── 3. 상수 ─────────── */
const TILE = 28;
const MW = 200, MH = 44;            // 맵 크기(타일)
// 점프 최고 높이 = JUMP²/(2*GRAV) ≈ 101px ≈ 3.6칸.
// 지형의 오르막 단차는 2칸으로 제한하므로 넉넉히 넘는다.
const GRAV = 0.62, JUMP = -11.2, WALK = 3.1, RUN = 4.6;
const FISH_NEED = 8;

// 타일
const E = 0, GRND = 1, DIRT = 2, STONE = 3, BRICK = 4, PLAT = 5, QBLK = 6,
  FAKE = 7, INVIS = 8, DOOR = 9, BED = 10;
const SOLID = { 1: 1, 2: 1, 3: 1, 4: 1, 6: 1, 7: 1, 8: 1, 10: 1 };

/* ─────────── 4. 함정 종류 ───────────
   screen:true = 화면을 조작하는 계열 (순한 맛에서 제외)
   trigger: land(밟음) / touch(닿음) / near(접근) / head(머리 박음) */
const TRAPS = [
  { id: 'vanish', n: '유령 발판', tr: 'land', w: 10 },
  { id: 'spring', n: '초강력 스프링', tr: 'land', w: 8 },
  { id: 'collapse', n: '바닥 붕괴', tr: 'land', w: 7 },
  { id: 'bump', n: '투명 벽', tr: 'touch', w: 8 },
  { id: 'drop', n: '낙하 블록', tr: 'near', w: 8 },
  { id: 'popup', n: '숨어있던 고양이', tr: 'near', w: 10 },
  { id: 'bomb', n: '폭탄 상자', tr: 'touch', w: 8 },
  { id: 'runaway', n: '도망치는 생선', tr: 'near', w: 7 },
  { id: 'clones', n: '분신 고양이떼', tr: 'near', w: 6 },
  { id: 'taunt', n: '도발', tr: 'near', w: 6, harmless: true },
  { id: 'fakeout', n: '헛방', tr: 'near', w: 7, harmless: true },
  { id: 'gift', n: '진짜 선물', tr: 'touch', w: 6, harmless: true },
  { id: 'flipv', n: '상하 반전', tr: 'touch', w: 6, screen: true },
  { id: 'fliph', n: '조작 반전', tr: 'touch', w: 6, screen: true },
  { id: 'zoom', n: '급확대', tr: 'touch', w: 5, screen: true },
  { id: 'dark', n: '암전', tr: 'touch', w: 5, screen: true },
  { id: 'face', n: '대왕 고양이 얼굴', tr: 'touch', w: 6, screen: true },
  { id: 'gravity', n: '중력 반전', tr: 'touch', w: 5, screen: true },
  { id: 'speed', n: '폭주', tr: 'touch', w: 5, screen: true },
  { id: 'boom', n: '굉음', tr: 'touch', w: 5, screen: true }
];

const FACES = ['😼', '🙀', '😹', '😻', '😾', '🐱', '😽'];
const TAUNTS = ['그쪽 아닌데ㅋ', '어? 방금 뭐 지나갔는데', '거기 조심…', '아무것도 없어요~', '뒤에!', '다시 한번 볼까?', '설마 진짜 밟게?', '히히'];

/* ─────────── 5. 상태 ─────────── */
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
let VW = 0, VH = 0, DPR = 1;

const OPT = { sound: true, shake: true, lessFlash: false, mild: false };
let G = null;   // 게임 상태

const $ = id => document.getElementById(id);

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  VW = cv.clientWidth; VH = cv.clientHeight;
  cv.width = Math.floor(VW * DPR); cv.height = Math.floor(VH * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);

/* ─────────── 6. 맵 생성 ─────────── */
function genLevel(seedText) {
  const rng = mulberry32(seedFromString(seedText));
  const t = new Uint8Array(MW * MH);
  // ★ 좌우 끝은 벽(BED)이지만 위아래는 뚫려 있어야 한다.
  //   아래를 BED 로 두면 구멍 바닥이 막혀 1칸 굴에 갇힌다.
  const at = (x, y) => {
    if (x < 0 || x >= MW) return BED;     // 좌우 = 보이지 않는 벽
    if (y < 0 || y >= MH) return E;       // 위 = 하늘, 아래 = 낭떠러지
    return t[y * MW + x];
  };
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MW && y < MH) t[y * MW + x] = v; };

  /* ① 지표면 높이 — 랜덤 워크. 구멍은 같은 높이 사이에만, 최대 3칸 */
  const gh = new Int16Array(MW).fill(-1);
  let h = 26, x = 0;
  for (; x < 10; x++) gh[x] = h;                 // 시작 안전지대
  let gapCd = 0;                                 // ★ 구멍이 붙어서 생기면 못 건넌다
  while (x < MW - 12) {
    if (gapCd > 0) gapCd--;
    // 구멍은 최대 3칸, 그리고 다음 구멍까지 최소 5칸의 땅을 보장한다
    if (gapCd === 0 && rng() < 0.16 && x > 14 && x < MW - 18) {
      const gap = 1 + Math.floor(rng() * 3);
      for (let i = 0; i < gap; i++, x++) gh[x] = -1;
      // 구멍 건너편은 반드시 같은 높이의 땅으로 시작 (착지 보장)
      const land = 3 + Math.floor(rng() * 3);
      for (let i = 0; i < land && x < MW - 12; i++, x++) gh[x] = h;
      gapCd = 5;
      continue;
    }
    if (rng() < 0.38) {
      // ★ 오르막(h 감소)은 최대 2칸까지만. 3칸이면 점프 여유가 없어 못 올라간다.
      //   내리막(h 증가)은 떨어지기만 하면 되므로 4칸까지 허용한다.
      h += Math.floor(rng() * 7) - 2;            // -2(위) ~ +4(아래)
      h = Math.max(15, Math.min(33, h));
    }
    const run = 2 + Math.floor(rng() * 6);
    for (let i = 0; i < run && x < MW - 12; i++, x++) gh[x] = h;
  }
  for (; x < MW; x++) gh[x] = h;                 // 끝 안전지대

  /* ② 지형 채우기 */
  for (let cx = 0; cx < MW; cx++) {
    if (gh[cx] < 0) continue;
    set(cx, gh[cx], GRND);
    for (let cy = gh[cx] + 1; cy < MH - 1; cy++) set(cx, cy, cy > gh[cx] + 5 ? STONE : DIRT);
  }
  // ★ 구멍(gh<0) 아래에는 암반을 깔지 않는다.
  //   깔면 1칸 폭 수직굴 바닥에 착지해 영영 못 빠져나온다.
  //   바닥이 없어야 아래로 떨어져 "튕겨 나오는 놀람"으로 복귀한다.
  for (let cx = 0; cx < MW; cx++) if (gh[cx] >= 0) set(cx, MH - 1, BED);

  /* ③ 지하 동굴 (탐험 요소)
     ★ 동굴끼리 겹치면 서로의 사다리를 지워 갇히는 문제가 생긴다.
       그래서 ① 최소 간격을 두고 자리를 고르고 ② 굴을 전부 판 뒤
       ③ 마지막에 사다리를 놓는 3단계로 처리한다. */
  const caves = [];
  const caveN = 6 + Math.floor(rng() * 4);
  for (let i = 0; i < caveN * 4 && caves.length < caveN; i++) {
    const cx = 20 + Math.floor(rng() * (MW - 45));
    if (gh[cx] < 0) continue;
    if (caves.some(c => Math.abs(c.x - cx) < 14)) continue;   // 최소 간격
    caves.push({
      x: cx, y: gh[cx] + 5 + Math.floor(rng() * 5),
      rw: 3 + Math.floor(rng() * 4), rh: 2 + Math.floor(rng() * 3),
      top: gh[cx]
    });
  }
  // ② 굴 파기 (블롭 + 2칸 폭 수직 통로)
  caves.forEach(c => {
    for (let a = -c.rw; a <= c.rw; a++) for (let b = -c.rh; b <= c.rh; b++) {
      if (a * a / (c.rw * c.rw) + b * b / (c.rh * c.rh) <= 1) set(c.x + a, c.y + b, E);
    }
    for (let cy2 = c.top; cy2 <= c.y; cy2++) { set(c.x, cy2, E); set(c.x + 1, cy2, E); }
  });
  // ③ 사다리 + 입구 뚜껑 — 굴을 다 판 뒤에 해야 지워지지 않는다
  caves.forEach(c => {
    // 지그재그 발판: 올라올 때는 점프, 내려갈 때는 빈 칸으로 지나간다
    for (let cy2 = c.top + 2; cy2 < c.y; cy2 += 2) {
      set(c.x + ((cy2 >> 1) & 1), cy2, PLAT);
    }
    // ★ 입구를 한 방향 발판으로 덮는다.
    //   덮지 않으면 지상을 달리다 매번 굴에 빠져 길이 끊긴다.
    //   들어가려면 ↓(아래 키)로 내려가면 된다.
    set(c.x, c.top, PLAT); set(c.x + 1, c.top, PLAT);
  });

  /* ④ 공중 발판 */
  const plats = [];
  const platN = 26 + Math.floor(rng() * 14);
  for (let i = 0; i < platN; i++) {
    const px = 12 + Math.floor(rng() * (MW - 26));
    const base = gh[px] > 0 ? gh[px] : 26;
    const py = Math.max(7, base - 4 - Math.floor(rng() * 9));
    const pw = 3 + Math.floor(rng() * 5);
    let ok = true;
    for (let a = 0; a < pw; a++) if (at(px + a, py) !== E) ok = false;
    if (!ok) continue;
    const kind = rng() < 0.62 ? PLAT : BRICK;
    for (let a = 0; a < pw; a++) set(px + a, py, kind);
    plats.push({ x: px, y: py, w: pw });
  }

  /* ⑤ ? 블록 — 겉모습은 같지만 속은 매번 다르다 */
  const qs = [];
  const qN = 10 + Math.floor(rng() * 8);
  for (let i = 0; i < qN; i++) {
    const px = 14 + Math.floor(rng() * (MW - 28));
    const base = gh[px] > 0 ? gh[px] : 26;
    const py = base - 4 - Math.floor(rng() * 3);
    if (at(px, py) !== E) continue;
    set(px, py, QBLK);
    qs.push({ x: px, y: py, good: rng() < 0.45 });   // 이번 판에서만 유효한 정체
  }

  /* ⑥ 생선 배치 — 지상/발판/동굴에 흩뿌린다 */
  const fish = [];
  const putFish = (fx, fy) => { if (at(fx, fy) === E) fish.push({ x: fx * TILE + TILE / 2, y: fy * TILE + TILE / 2, got: false, vx: 0, vy: 0, flee: 0 }); };
  plats.forEach(p => { if (rng() < 0.55) putFish(p.x + Math.floor(p.w / 2), p.y - 1); });
  caves.forEach(c => { putFish(c.x, c.y); if (rng() < 0.4) putFish(c.x + 1, c.y); });
  for (let i = 0; i < 8; i++) {
    const fx = 15 + Math.floor(rng() * (MW - 30));
    if (gh[fx] > 0) putFish(fx, gh[fx] - 1);
  }

  /* ⑦ 함정 배치 — 종류를 무작위로 뽑아 위치에 심는다 */
  const pool = TRAPS.filter(tr => !(OPT.mild && tr.screen));
  const bag = [];
  pool.forEach(tr => { for (let i = 0; i < tr.w; i++) bag.push(tr); });
  const pick = () => bag[Math.floor(rng() * bag.length)];

  const traps = [];
  const trapN = (OPT.mild ? 20 : 34) + Math.floor(rng() * 10);
  for (let i = 0; i < trapN; i++) {
    const k = pick();
    let px = 16 + Math.floor(rng() * (MW - 32));
    let py;
    if (k.tr === 'land' || k.tr === 'collapse') {
      if (gh[px] < 0) continue;
      py = gh[px];
      if (k.id === 'vanish') {                   // 가짜 발판은 공중에 놓아야 속는다
        py = Math.max(8, gh[px] - 3 - Math.floor(rng() * 4));
        if (at(px, py) !== E) continue;
        for (let a = 0; a < 3; a++) set(px + a, py, FAKE);
      }
    } else if (k.tr === 'head') {
      py = (gh[px] > 0 ? gh[px] : 26) - 4;
    } else {
      const base = gh[px] > 0 ? gh[px] : 26;
      py = base - 1 - Math.floor(rng() * 3);
      if (at(px, py) !== E) continue;
    }
    traps.push({
      kind: k, x: px * TILE, y: py * TILE, tx: px, ty: py,
      w: TILE, h: TILE, done: false, armed: true,
      // 일부 함정은 "두 번째로 지나갈 때" 터진다 — 예측을 더 어렵게
      delay: rng() < 0.22 ? 1 : 0, seen: 0,
      st: 0, data: {}
    });
  }

  /* ⑧ 투명 벽 (지형에 직접 심는다) */
  const invN = 5 + Math.floor(rng() * 6);
  for (let i = 0; i < invN; i++) {
    const px = 18 + Math.floor(rng() * (MW - 34));
    const base = gh[px] > 0 ? gh[px] : 26;
    const py = base - 3 - Math.floor(rng() * 2);
    if (at(px, py) === E) set(px, py, INVIS);
  }

  /* ⑨ 골 — 마지막 안전지대 */
  const gx = MW - 7, gy = gh[gx];
  for (let a = -2; a <= 3; a++) for (let b = 1; b <= 3; b++) set(gx + a, gy + b, STONE);
  set(gx, gy, E); set(gx, gy - 1, E);

  return {
    t, gh, fish, traps, qs, plats, caves,
    goal: { x: gx * TILE, y: (gy - 1) * TILE, tx: gx, ty: gy, run: 0, moved: 0 },
    spawn: { x: 5 * TILE, y: (gh[5] - 2) * TILE },
    at, set, rng
  };
}

/* ─────────── 7. 게임 시작 ─────────── */
function startGame(seedText) {
  const L = genLevel(seedText);
  G = {
    seed: seedText, L,
    p: {
      x: L.spawn.x, y: L.spawn.y, vx: 0, vy: 0, w: 18, h: 22,
      onGround: false, face: 1, coyote: 0, buffer: 0, anim: 0, expr: 0, exprT: 0, dropT: 0
    },
    cam: { x: 0, y: 0 },
    fx: { shake: 0, flash: 0, flashC: '#fff', zoom: 1, zoomT: 0, flipV: 0, flipH: 0, dark: 0, face: 0, faceE: '😼', grav: 0, speed: 0, invert: 0 },
    ghosts: [], parts: [], falling: [],
    fish: 0, startle: 0, log: [], t0: performance.now(), time: 0,
    lastSafe: { x: L.spawn.x, y: L.spawn.y },
    over: false, win: false, msgT: 0
  };
  $('v-fishmax').textContent = FISH_NEED;
  $('v-seed').textContent = seedText;
  updateHud();
}

/* ─────────── 8. 놀람 ─────────── */
function startle(name, opts) {
  const g = G; if (!g || g.over) return;
  opts = opts || {};
  g.startle++;
  const last = g.log[g.log.length - 1];
  if (last && last.name === name && g.time - last.time < 3) last.count++;
  else g.log.push({ name, time: g.time, count: 1 });
  g.p.expr = 2; g.p.exprT = 40;
  if (OPT.shake) g.fx.shake = Math.max(g.fx.shake, opts.shake == null ? 10 : opts.shake);
  if (!OPT.lessFlash && opts.flash !== false) { g.fx.flash = 0.55; g.fx.flashC = opts.flashC || '#fff'; }
  updateHud();
}

function say(text, ms) {
  const el = $('say');
  el.textContent = text;
  el.classList.add('on');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('on'), ms || 1400);
}

function updateHud() {
  const g = G; if (!g) return;
  $('v-startle').textContent = g.startle;
  $('v-fish').textContent = g.fish;
  $('h-startle').firstChild.nodeValue = (g.startle === 0 ? '😺 ' : g.startle < 6 ? '😼 ' : g.startle < 14 ? '😾 ' : '🙀 ');
  $('bar-in').style.width = Math.min(100, (g.p.x / (MW * TILE)) * 100) + '%';
}

/* ─────────── 9. 함정 발동 ─────────── */
function fireTrap(tr) {
  const g = G, p = g.p, F = g.fx, L = g.L;
  const k = tr.kind;
  tr.done = true;

  switch (k.id) {
    case 'vanish': {
      for (let a = -1; a <= 3; a++) if (L.at(tr.tx + a, tr.ty) === FAKE) {
        L.set(tr.tx + a, tr.ty, E);
        burst(tr.x + a * TILE, tr.y, '#c9b98a', 8);
      }
      Snd.whoosh(); startle(k.n, { shake: 8 });
      break;
    }
    case 'spring': {
      p.vy = -20; p.onGround = false;
      Snd.spring(); startle(k.n, { shake: 12, flash: false });
      break;
    }
    case 'collapse': {
      // ★ 3칸까지만 무너뜨린다. 5칸이면 점프로 못 건너는 구멍이 생겨 길이 막힌다.
      for (let a = -1; a <= 1; a++) {
        const cx = tr.tx + a;
        if (L.gh[cx] < 0) continue;
        const cy = L.gh[cx];
        L.set(cx, cy, E); L.set(cx, cy + 1, E);
        g.falling.push({ x: cx * TILE, y: cy * TILE, vy: 1, c: '#7b8f4e' });
        L.gh[cx] = -1;
      }
      Snd.boom(); startle(k.n, { shake: 16 });
      break;
    }
    case 'bump': {
      p.vx = -p.face * 5; p.vy = -3;
      Snd.land(); Snd.tone(180, 90, .2, 'square', .2);
      startle(k.n, { shake: 12 });
      break;
    }
    case 'drop': {
      g.falling.push({ x: tr.x, y: tr.y - TILE * 7, vy: 0, c: '#8d6a4a', hit: true });
      Snd.whoosh(); tr.st = 1;
      break;
    }
    case 'popup': {
      g.ghosts.push({ x: tr.x, y: tr.y, vy: -7, vx: (Math.random() - .5) * 3, life: 70, e: FACES[Math.floor(Math.random() * FACES.length)] });
      Snd.meow(); startle(k.n, { shake: 11 });
      break;
    }
    case 'bomb': {
      p.vy = -9; p.vx = -p.face * 7;
      for (let i = 0; i < 22; i++) burst(tr.x, tr.y, i % 2 ? '#ffb340' : '#ff5f6f', 1);
      Snd.boom(); startle(k.n, { shake: 20, flashC: '#ffb340' });
      break;
    }
    case 'runaway': {
      let nearest = null, nd = 1e9;
      g.L.fish.forEach(f => { if (f.got) return; const d = Math.hypot(f.x - tr.x, f.y - tr.y); if (d < nd) { nd = d; nearest = f; } });
      if (nearest) { nearest.flee = 120; nearest.vx = (nearest.x < p.x ? -1 : 1) * 4.5; nearest.vy = -5; }
      Snd.pop(); say('생선이 도망갔다!', 1100);
      startle(k.n, { shake: 6, flash: false });
      break;
    }
    case 'clones': {
      for (let i = 0; i < 7; i++) g.ghosts.push({
        x: p.x + (Math.random() - .5) * 160, y: p.y - Math.random() * 60,
        vx: (Math.random() - .5) * 7, vy: -4 - Math.random() * 4, life: 60, e: '🐱'
      });
      Snd.meow(); startle(k.n, { shake: 9 });
      break;
    }
    case 'taunt': {
      say(TAUNTS[Math.floor(Math.random() * TAUNTS.length)], 1500);
      Snd.pop();
      break;
    }
    case 'fakeout': {
      Snd.whoosh();
      if (OPT.shake) F.shake = 5;
      tr.st = 1;   // 아무 일도 안 일어난다. 그게 함정
      break;
    }
    case 'gift': {
      g.fish++; Snd.fish(); say('진짜 선물이었다 🐟', 1200); updateHud();
      for (let i = 0; i < 14; i++) burst(tr.x, tr.y, '#ffd280', 1);
      break;
    }
    case 'flipv': F.flipV = 220; Snd.glitch(); startle(k.n, { shake: 8 }); break;
    case 'fliph': F.flipH = 240; F.invert = 240; Snd.glitch(); startle(k.n, { shake: 8 }); say('조작이…?', 1200); break;
    case 'zoom': F.zoomT = 150; Snd.whoosh(); startle(k.n, { shake: 10 }); break;
    case 'dark': F.dark = 120; Snd.tone(120, 60, .5, 'sine', .2); startle(k.n, { shake: 6, flash: false }); break;
    case 'face': F.face = 46; F.faceE = FACES[Math.floor(Math.random() * FACES.length)]; Snd.meow(); Snd.boom(); startle(k.n, { shake: 22 }); break;
    case 'gravity': F.grav = 190; Snd.glitch(); p.vy = -3; startle(k.n, { shake: 12 }); break;
    case 'speed': F.speed = 260; Snd.tone(300, 900, .3, 'sawtooth', .12); startle(k.n, { shake: 8, flash: false }); say('폭주!', 1000); break;
    case 'boom': Snd.boom(); startle(k.n, { shake: 24, flashC: '#ff5f6f' }); break;
  }
}

function burst(x, y, c, n) {
  for (let i = 0; i < n; i++) G.parts.push({
    x, y, vx: (Math.random() - .5) * 6, vy: -Math.random() * 5 - 1,
    life: 22 + Math.random() * 18, c
  });
}

/* ─────────── 10. 입력 ─────────── */
const keys = {};
window.addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'r' && G && !G.over) { Snd.init(); startGame(randomSeedText()); }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

const touch = { l: false, r: false, j: false, d: false };
function bindTouch(id, k) {
  const el = $(id);
  const on = e => { e.preventDefault(); touch[k] = true; Snd.init(); };
  const off = e => { e.preventDefault(); touch[k] = false; };
  el.addEventListener('touchstart', on, { passive: false });
  el.addEventListener('touchend', off, { passive: false });
  el.addEventListener('touchcancel', off, { passive: false });
  el.addEventListener('mousedown', on); el.addEventListener('mouseup', off);
  el.addEventListener('mouseleave', off);
}
bindTouch('t-left', 'l'); bindTouch('t-right', 'r'); bindTouch('t-jump', 'j'); bindTouch('t-down', 'd');
if ('ontouchstart' in window) $('touch').classList.add('on');

/* ─────────── 11. 물리 ─────────── */
function solidAt(tx, ty) {
  const v = G.L.at(tx, ty);
  return !!SOLID[v];
}

function moveX(p, dx) {
  p.x += dx;
  const x0 = Math.floor((p.x - p.w / 2) / TILE), x1 = Math.floor((p.x + p.w / 2) / TILE);
  const y0 = Math.floor((p.y - p.h) / TILE), y1 = Math.floor((p.y - 1) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (!solidAt(tx, ty)) continue;
    if (G.L.at(tx, ty) === INVIS) revealInvis(tx, ty);
    if (dx > 0) p.x = tx * TILE - p.w / 2 - 0.01;
    else p.x = (tx + 1) * TILE + p.w / 2 + 0.01;
    p.vx = 0;
    return true;
  }
  return false;
}

function moveY(p, dy) {
  p.y += dy;
  const x0 = Math.floor((p.x - p.w / 2) / TILE), x1 = Math.floor((p.x + p.w / 2) / TILE);
  if (dy > 0) {           // 낙하 — 발
    const ty = Math.floor((p.y - 1) / TILE);
    for (let tx = x0; tx <= x1; tx++) {
      const v = G.L.at(tx, ty);
      const isPlat = v === PLAT;
      if (!SOLID[v] && !isPlat) continue;
      if (isPlat && (p.y - dy - 1) > ty * TILE) continue;   // 아래에서 올라오는 중이면 통과
      if (isPlat && p.dropT > 0) continue;                  // ↓키로 통과하는 중
      if (v === INVIS) revealInvis(tx, ty);
      p.y = ty * TILE - 0.01; p.vy = 0;
      if (!p.onGround) { p.onGround = true; onLand(tx, ty, v); }
      return;
    }
    p.onGround = false;
  } else {                // 상승 — 머리
    const ty = Math.floor((p.y - p.h) / TILE);
    for (let tx = x0; tx <= x1; tx++) {
      const v = G.L.at(tx, ty);
      if (!SOLID[v]) continue;
      if (v === INVIS) revealInvis(tx, ty);
      if (v === QBLK) hitQ(tx, ty);
      p.y = (ty + 1) * TILE + p.h + 0.01; p.vy = 1;
      return;
    }
  }
}

function revealInvis(tx, ty) {
  G.L.set(tx, ty, BRICK);
  burst(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#d8cfa8', 10);
  Snd.tone(200, 100, .18, 'square', .2);
  startle('투명 벽', { shake: 12 });
}

function hitQ(tx, ty) {
  const q = G.L.qs.find(o => o.x === tx && o.y === ty);
  G.L.set(tx, ty, BRICK);
  if (q && q.good) {
    G.fish++; Snd.fish(); updateHud();
    for (let i = 0; i < 12; i++) burst(tx * TILE + TILE / 2, ty * TILE, '#ffd280', 1);
    say('🐟 +1', 900);
  } else {
    // 겉모습은 같은데 속은 다르다 — 매 판 랜덤
    const roll = Math.random();
    if (roll < .34) {
      G.ghosts.push({ x: tx * TILE, y: ty * TILE, vy: -6, vx: 0, life: 60, e: FACES[Math.floor(Math.random() * FACES.length)] });
      Snd.meow(); startle('상자 속 고양이', { shake: 12 });
    } else if (roll < .67) {
      G.p.vy = -16; Snd.spring(); startle('상자 스프링', { shake: 10, flash: false });
    } else {
      Snd.boom(); startle('상자 폭발', { shake: 18, flashC: '#ffb340' });
      for (let i = 0; i < 18; i++) burst(tx * TILE + TILE / 2, ty * TILE, '#ff5f6f', 1);
    }
  }
}

function onLand(tx, ty, v) {
  Snd.land();
  G.p.expr = 0;
  if (v === FAKE) {
    const tr = G.L.traps.find(o => o.kind.id === 'vanish' && !o.done && Math.abs(o.tx - tx) <= 3 && o.ty === ty);
    if (tr) fireTrap(tr);
    else { G.L.set(tx, ty, E); Snd.whoosh(); startle('유령 발판', { shake: 8 }); }
    return;
  }
  // 밟는 함정
  for (const tr of G.L.traps) {
    if (tr.done || (tr.kind.tr !== 'land')) continue;
    if (tr.tx === tx && Math.abs(tr.ty - ty) <= 1) {
      if (tr.delay > tr.seen) { tr.seen++; continue; }
      fireTrap(tr); break;
    }
  }
  // 안전 지점 기록 (구멍에 빠졌을 때 돌아올 곳)
  if (v === GRND || v === STONE || v === DIRT || v === BRICK) {
    G.lastSafe.x = G.p.x; G.lastSafe.y = G.p.y - 4;
  }
}

/* ─────────── 12. 업데이트 ─────────── */
function update() {
  const g = G; if (!g || g.over) return;
  const p = g.p, F = g.fx, L = g.L;
  g.time = (performance.now() - g.t0) / 1000;

  // 효과 타이머
  ['shake', 'flash'].forEach(k => { if (F[k] > 0) F[k] *= 0.88; if (F[k] < 0.05) F[k] = 0; });
  ['flipV', 'flipH', 'dark', 'face', 'grav', 'speed', 'invert', 'zoomT'].forEach(k => { if (F[k] > 0) F[k]--; });
  F.zoom += ((F.zoomT > 0 ? 1.9 : 1) - F.zoom) * 0.12;

  // 입력
  let ax = 0;
  const L_ = keys['arrowleft'] || keys['a'] || touch.l;
  const R_ = keys['arrowright'] || keys['d'] || touch.r;
  const J_ = keys['arrowup'] || keys['w'] || keys[' '] || touch.j;
  const D_ = keys['arrowdown'] || keys['s'] || touch.d;
  if (L_) ax -= 1; if (R_) ax += 1;
  if (F.invert > 0) ax = -ax;

  // ↓ 로 한 방향 발판 통과 (동굴 입구로 내려가기)
  if (p.dropT > 0) p.dropT--;
  if (D_ && p.onGround && p.dropT === 0) {
    const ty = Math.floor((p.y + 1) / TILE), tx = Math.floor(p.x / TILE);
    if (L.at(tx, ty) === PLAT) { p.dropT = 12; p.y += 3; p.onGround = false; }
  }

  const sp = (keys['shift'] ? RUN : WALK) * (F.speed > 0 ? 1.9 : 1);
  if (ax !== 0) { p.vx += ax * 0.7; p.face = ax > 0 ? 1 : -1; }
  p.vx *= p.onGround ? 0.78 : 0.9;
  p.vx = Math.max(-sp, Math.min(sp, p.vx));

  // 점프 (코요테 타임 + 입력 버퍼)
  if (p.onGround) p.coyote = 7; else if (p.coyote > 0) p.coyote--;
  if (J_) p.buffer = 7; else if (p.buffer > 0) p.buffer--;
  const gdir = F.grav > 0 ? -1 : 1;
  if (p.buffer > 0 && p.coyote > 0) {
    p.vy = JUMP * gdir; p.onGround = false; p.coyote = 0; p.buffer = 0;
    Snd.jump(); p.expr = 1; p.exprT = 14;
  }
  if (!J_ && p.vy * gdir < -4) p.vy = -4 * gdir;   // 짧게 누르면 낮게

  p.vy += GRAV * gdir;
  p.vy = Math.max(-24, Math.min(24, p.vy));

  moveX(p, p.vx);
  if (gdir < 0) {          // 중력 반전 중엔 천장을 바닥처럼
    p.y += p.vy;
    const ty = Math.floor((p.y - p.h) / TILE);
    const x0 = Math.floor((p.x - p.w / 2) / TILE), x1 = Math.floor((p.x + p.w / 2) / TILE);
    let hitc = false;
    for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) { p.y = (ty + 1) * TILE + p.h; p.vy = 0; hitc = true; }
    p.onGround = hitc;
  } else {
    moveY(p, p.vy);
  }

  if (p.exprT > 0) { p.exprT--; if (p.exprT === 0) p.expr = 0; }
  p.anim += Math.abs(p.vx) * 0.12;

  // 세계 밖으로 떨어짐 → 죽지 않고 "튕겨 나오며" 복귀
  if (p.y > (MH - 1) * TILE + 60) {
    // ★ 기억해 둔 위치가 이미 무너진 곳일 수 있다(바닥 붕괴 함정).
    //   그래서 왼쪽으로 스캔해 실제로 땅이 남아 있는 칸을 찾아 세운다.
    let sx = Math.floor(g.lastSafe.x / TILE);
    sx = Math.max(2, Math.min(MW - 3, sx));
    // ★ 오른쪽으로 최소 3칸 연속된 땅이 있는 자리를 찾는다.
    //   구멍 바로 앞에 세우면 다시 빠져 무한 루프가 된다.
    let guard = 0;
    while (sx > 3 && guard++ < MW) {
      let ok = L.gh[sx] >= 0;
      for (let k = 1; k <= 3 && ok; k++) if (L.gh[sx + k] < 0) ok = false;
      if (ok) break;
      sx--;
    }
    if (L.gh[sx] < 0) sx = 5;               // 최후의 보루: 시작 지점
    p.x = sx * TILE + TILE / 2;
    p.y = L.gh[sx] * TILE - 2;
    // ★ 위로 튕겨 올리면 공중에 뜬 채로 다시 구멍 쪽으로 날아간다.
    //   착지한 상태로 되돌려야 바로 다음 점프를 준비할 수 있다.
    p.vx = 0; p.vy = 0; p.onGround = true; p.coyote = 7; p.dropT = 0;
    g.lastSafe.x = p.x; g.lastSafe.y = p.y;
    Snd.spring(); say('아래에서 뭔가 튕겨냈다!', 1300);
    startle('구멍 아래의 무언가', { shake: 14 });
  }
  if (p.x < 6) { p.x = 6; p.vx = 0; }

  // 함정 감지
  for (const tr of L.traps) {
    if (tr.done) continue;
    const dx = Math.abs(p.x - (tr.x + TILE / 2)), dy = Math.abs(p.y - TILE / 2 - (tr.y + TILE / 2));
    if (tr.kind.tr === 'near') {
      if (dx < TILE * 2.4 && dy < TILE * 2.4) {
        if (tr.delay > tr.seen) { tr.seen++; tr.done = false; tr.delay = 0; continue; }
        fireTrap(tr);
      }
    } else if (tr.kind.tr === 'touch') {
      if (dx < TILE * 0.85 && dy < TILE * 0.95) {
        if (tr.delay > tr.seen) { tr.seen++; tr.delay = 0; continue; }
        fireTrap(tr);
      }
    }
  }

  // 낙하 블록
  g.falling.forEach(f => {
    f.vy += 0.75; f.y += f.vy;
    if (f.hit && Math.abs(f.x + TILE / 2 - p.x) < TILE * .8 && Math.abs(f.y + TILE / 2 - (p.y - TILE / 2)) < TILE * .9) {
      f.hit = false; p.vy = 4; p.vx = -p.face * 4;
      Snd.boom(); startle('낙하 블록', { shake: 16 });
    }
    if (f.y > (MH - 1) * TILE) f.dead = true;
    const ty = Math.floor((f.y + TILE) / TILE), tx = Math.floor((f.x + TILE / 2) / TILE);
    if (solidAt(tx, ty)) { f.dead = true; burst(f.x + TILE / 2, f.y + TILE, f.c, 8); if (OPT.shake) g.fx.shake = Math.max(g.fx.shake, 5); }
  });
  g.falling = g.falling.filter(f => !f.dead);

  // 생선
  L.fish.forEach(f => {
    if (f.got) return;
    if (f.flee > 0) {
      f.flee--; f.vy += 0.5; f.x += f.vx; f.y += f.vy;
      const ty = Math.floor((f.y + 8) / TILE), tx = Math.floor(f.x / TILE);
      if (solidAt(tx, ty)) { f.y = ty * TILE - 8; f.vy = 0; f.vx *= 0.85; }
      if (f.flee === 0) f.vx = 0;
    }
    if (Math.abs(f.x - p.x) < 20 && Math.abs(f.y - (p.y - 11)) < 22) {
      f.got = true; g.fish++; Snd.fish(); updateHud();
      for (let i = 0; i < 10; i++) burst(f.x, f.y, '#ffd280', 1);
    }
  });

  // 유령/분신
  g.ghosts.forEach(o => { o.vy += 0.42; o.x += o.vx; o.y += o.vy; o.life--; });
  g.ghosts = g.ghosts.filter(o => o.life > 0);

  // 파티클
  g.parts.forEach(o => { o.vy += 0.35; o.x += o.vx; o.y += o.vy; o.life--; });
  g.parts = g.parts.filter(o => o.life > 0);

  // 골
  const gl = L.goal;
  const gdx = Math.abs(p.x - (gl.x + TILE / 2)), gdy = Math.abs(p.y - TILE - gl.y);
  if (gdx < TILE * 0.9 && gdy < TILE * 1.4) {
    if (g.fish >= FISH_NEED) finish(true);
    else if (gl.run <= 0 && gl.moved < 2) {
      // 생선이 모자라면 문이 도망간다 (한두 번만)
      gl.run = 60; gl.moved++;
      gl.x -= TILE * (4 + Math.floor(Math.random() * 3));
      Snd.whoosh(); say(`🐟 ${FISH_NEED - g.fish}마리 더!`, 1600);
      startle('도망가는 문', { shake: 10 });
    } else if (gl.run <= 0) {
      say(`🐟 ${FISH_NEED - g.fish}마리 더 모아야 열려요`, 1500);
      gl.run = 40;
    }
  }
  if (gl.run > 0) gl.run--;

  // 카메라
  const tzx = p.x - VW / (2 * F.zoom), tzy = p.y - VH / (2 * F.zoom) - 20;
  g.cam.x += (tzx - g.cam.x) * 0.12;
  g.cam.y += (tzy - g.cam.y) * 0.1;
  g.cam.x = Math.max(0, Math.min(MW * TILE - VW / F.zoom, g.cam.x));
  g.cam.y = Math.max(0, Math.min(MH * TILE - VH / F.zoom, g.cam.y));

  $('v-time').textContent = g.time.toFixed(1);
}

/* ─────────── 13. 그리기 ─────────── */
function draw() {
  const g = G;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (!g) { ctx.fillStyle = '#0b0a12'; ctx.fillRect(0, 0, VW, VH); return; }
  const F = g.fx, L = g.L, p = g.p;

  // 하늘
  const sky = ctx.createLinearGradient(0, 0, 0, VH);
  sky.addColorStop(0, F.dark > 0 ? '#05040a' : '#1b1533');
  sky.addColorStop(0.6, F.dark > 0 ? '#08060f' : '#33224d');
  sky.addColorStop(1, F.dark > 0 ? '#0b0a12' : '#4a2f52');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, VW, VH);

  ctx.save();

  // 화면 조작 효과
  ctx.translate(VW / 2, VH / 2);
  if (F.flipV > 0) ctx.scale(1, -1);
  if (F.flipH > 0) ctx.scale(-1, 1);
  ctx.scale(F.zoom, F.zoom);
  ctx.translate(-VW / 2, -VH / 2);

  const sh = F.shake;
  const ox = -g.cam.x + (sh ? (Math.random() - .5) * sh : 0);
  const oy = -g.cam.y + (sh ? (Math.random() - .5) * sh : 0);
  ctx.translate(ox, oy);

  // 원경 (시차)
  drawHills(g.cam.x);

  // 타일
  const vw = VW / F.zoom, vh = VH / F.zoom;
  const x0 = Math.max(0, Math.floor(g.cam.x / TILE) - 1), x1 = Math.min(MW - 1, Math.ceil((g.cam.x + vw) / TILE) + 1);
  const y0 = Math.max(0, Math.floor(g.cam.y / TILE) - 1), y1 = Math.min(MH - 1, Math.ceil((g.cam.y + vh) / TILE) + 1);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const v = L.at(tx, ty); if (v === E || v === INVIS) continue;
    drawTile(v, tx * TILE, ty * TILE, tx, ty);
  }

  // 낙하 블록
  g.falling.forEach(f => {
    ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, TILE, TILE);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(f.x, f.y + TILE - 5, TILE, 5);
  });

  // 골
  const gl = L.goal;
  ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = g.fish >= FISH_NEED ? '#ffd280' : '#6a5f8a';
  ctx.fillText(g.fish >= FISH_NEED ? '🚪' : '🔒', gl.x + TILE / 2, gl.y + TILE + 4);
  if (g.fish < FISH_NEED) {
    ctx.font = 'bold 11px sans-serif'; ctx.fillStyle = '#ffb340';
    ctx.fillText(`🐟 ${g.fish}/${FISH_NEED}`, gl.x + TILE / 2, gl.y - 8);
  }

  // 생선
  ctx.font = '18px serif';
  L.fish.forEach(f => {
    if (f.got) return;
    const bob = Math.sin(g.time * 3 + f.x * 0.05) * 3;
    ctx.fillText('🐟', f.x, f.y + bob + 6);
  });

  // 파티클
  g.parts.forEach(o => {
    ctx.globalAlpha = Math.min(1, o.life / 20);
    ctx.fillStyle = o.c; ctx.fillRect(o.x - 2, o.y - 2, 4, 4);
  });
  ctx.globalAlpha = 1;

  // 유령/분신
  ctx.font = '26px serif';
  g.ghosts.forEach(o => {
    ctx.globalAlpha = Math.min(1, o.life / 25);
    ctx.fillText(o.e, o.x + TILE / 2, o.y + 20);
  });
  ctx.globalAlpha = 1;

  drawCat(p);
  ctx.restore();

  // 암전 (플레이어 주변만 보이게)
  if (F.dark > 0) {
    const px = (p.x - g.cam.x) * F.zoom, py = (p.y - 12 - g.cam.y) * F.zoom;
    const rg = ctx.createRadialGradient(px, py, 10, px, py, 120);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.93)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, VW, VH);
  }

  // 대왕 얼굴
  if (F.face > 0) {
    const k = F.face / 46;
    ctx.globalAlpha = Math.min(1, k * 1.6);
    ctx.font = `${Math.min(VW, VH) * (1.15 - k * 0.25)}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(F.faceE, VW / 2, VH / 2);
    ctx.globalAlpha = 1;
  }

  // 섬광
  if (F.flash > 0.02 && !OPT.lessFlash) {
    ctx.globalAlpha = Math.min(0.7, F.flash);
    ctx.fillStyle = F.flashC; ctx.fillRect(0, 0, VW, VH);
    ctx.globalAlpha = 1;
  }

  // 상태 배지
  const badges = [];
  if (F.flipV > 0) badges.push('🙃 상하반전');
  if (F.invert > 0) badges.push('↔ 조작반전');
  if (F.grav > 0) badges.push('🔃 중력반전');
  if (F.speed > 0) badges.push('💨 폭주');
  if (badges.length) {
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    badges.forEach((b, i) => {
      const y = VH - 26 - i * 22;
      const w = ctx.measureText(b).width + 18;
      ctx.fillStyle = 'rgba(255,111,165,.9)';
      ctx.beginPath(); ctx.roundRect(VW / 2 - w / 2, y - 10, w, 20, 10); ctx.fill();
      ctx.fillStyle = '#1a1626'; ctx.fillText(b, VW / 2, y);
    });
  }
}

function drawHills(camx) {
  for (let layer = 0; layer < 2; layer++) {
    const par = 0.25 + layer * 0.2;
    const off = camx * (1 - par);
    ctx.fillStyle = layer === 0 ? 'rgba(60,40,80,.55)' : 'rgba(45,30,62,.75)';
    ctx.beginPath();
    const baseY = (MH - 12 - layer * 3) * TILE;
    ctx.moveTo(camx - 100, baseY + 400);
    for (let i = -1; i < 26; i++) {
      const hx = camx - off * 0 + i * 220 - ((camx * par) % 220) + off * 0;
      const px = camx + i * 220 - ((camx * par) % 220) - 120;
      ctx.lineTo(px, baseY - 60 - Math.abs(Math.sin(i * 1.7 + layer)) * 120);
      ctx.lineTo(px + 110, baseY + 400);
    }
    ctx.closePath(); ctx.fill();
  }
}

function drawTile(v, x, y, tx, ty) {
  switch (v) {
    case GRND:
      ctx.fillStyle = '#6b8a3e'; ctx.fillRect(x, y, TILE, 7);
      ctx.fillStyle = '#8ab04f'; ctx.fillRect(x, y, TILE, 3);
      ctx.fillStyle = '#4e3b2a'; ctx.fillRect(x, y + 7, TILE, TILE - 7);
      break;
    case DIRT:
      ctx.fillStyle = '#4e3b2a'; ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = 'rgba(0,0,0,.13)'; ctx.fillRect(x + 5, y + 6, 5, 5); ctx.fillRect(x + 17, y + 15, 6, 5);
      break;
    case STONE:
      ctx.fillStyle = '#3a3646'; ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x, y, TILE, 2);
      break;
    case BRICK:
    case FAKE:
      ctx.fillStyle = '#9a6a44'; ctx.fillRect(x, y, TILE, TILE);
      ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(x + 1, y + 1, TILE - 2, 2);
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.lineTo(x + TILE, y + 14);
      ctx.moveTo(x + 14, y); ctx.lineTo(x + 14, y + 14);
      ctx.moveTo(x + 7, y + 14); ctx.lineTo(x + 7, y + TILE); ctx.stroke();
      break;
    case PLAT:
      ctx.fillStyle = '#7a5c8e'; ctx.fillRect(x, y, TILE, 8);
      ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(x, y, TILE, 2);
      break;
    case QBLK: {
      const bob = Math.sin(G.time * 4 + tx) * 1.2;
      ctx.fillStyle = '#d8a53a'; ctx.fillRect(x, y + bob, TILE, TILE);
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x + 1, y + 1 + bob, TILE - 2, 3);
      ctx.fillStyle = '#4a3510'; ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('?', x + TILE / 2, y + TILE / 2 + bob);
      break;
    }
    case BED:
      ctx.fillStyle = '#211d2e'; ctx.fillRect(x, y, TILE, TILE);
      break;
  }
}

function drawCat(p) {
  const x = p.x, y = p.y, f = p.face;
  const bounce = p.onGround ? Math.abs(Math.sin(p.anim)) * 2 : 0;
  const by = y - bounce;
  ctx.save();
  ctx.translate(x, by);
  ctx.scale(f, 1);

  // 꼬리
  ctx.strokeStyle = '#e8a04c'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-7, -8);
  const tw = Math.sin(G.time * 8) * 5;
  ctx.quadraticCurveTo(-16, -14 + tw, -13, -22 + tw);
  ctx.stroke();

  // 몸
  ctx.fillStyle = '#f0ad55';
  ctx.beginPath(); ctx.ellipse(0, -8, 9, 8, 0, 0, 7); ctx.fill();
  // 머리
  ctx.beginPath(); ctx.arc(2, -20, 8.5, 0, 7); ctx.fill();
  // 귀
  ctx.beginPath();
  ctx.moveTo(-4, -26); ctx.lineTo(-2, -33); ctx.lineTo(3, -27); ctx.closePath(); ctx.fill();
  ctx.moveTo(6, -27); ctx.beginPath();
  ctx.moveTo(6, -27); ctx.lineTo(9, -33); ctx.lineTo(11, -25); ctx.closePath(); ctx.fill();
  // 배
  ctx.fillStyle = '#ffd9a8';
  ctx.beginPath(); ctx.ellipse(1, -6, 5, 5, 0, 0, 7); ctx.fill();

  // 표정
  ctx.fillStyle = '#2b1d10';
  if (p.expr === 2) {                 // 놀람
    ctx.beginPath(); ctx.arc(0, -21, 3.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(7, -21, 3.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0.8, -22, 1.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(7.8, -22, 1.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#2b1d10';
    ctx.beginPath(); ctx.ellipse(4, -15, 2.4, 3, 0, 0, 7); ctx.fill();
  } else if (p.expr === 1) {           // 점프
    ctx.fillRect(-1, -23, 2, 2); ctx.fillRect(6, -23, 2, 2);
    ctx.beginPath(); ctx.arc(4, -16, 2, 0, 3.14); ctx.fill();
  } else {                             // 평소
    ctx.fillRect(-1, -22, 2, 3); ctx.fillRect(6, -22, 2, 3);
    ctx.beginPath(); ctx.moveTo(2, -16); ctx.lineTo(5, -16); ctx.lineTo(3.5, -14); ctx.closePath(); ctx.fill();
  }
  // 수염
  ctx.strokeStyle = 'rgba(60,40,20,.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(9, -18); ctx.lineTo(14, -19); ctx.moveTo(9, -16); ctx.lineTo(14, -16); ctx.stroke();

  // 다리
  ctx.fillStyle = '#e09a42';
  const lw = p.onGround ? Math.sin(p.anim) * 3 : 2;
  ctx.fillRect(-5 + lw, -3, 4, 4);
  ctx.fillRect(3 - lw, -3, 4, 4);
  ctx.restore();

  // 놀람 표시
  if (p.expr === 2) {
    ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ff6fa5';
    ctx.fillText('!', x + f * 12, by - 34);
  }
}

/* ─────────── 14. 종료 ─────────── */
function finish(win) {
  const g = G; if (g.over) return;
  g.over = true; g.win = win;
  Snd.win();
  const s = g.startle;
  const rank = s === 0 ? ['🗿 강철 심장', '한 번도 안 놀랐습니다. 진짜로요?']
    : s <= 3 ? ['😼 침착한 고양이', '거의 안 놀랐네요. 함정을 잘 피했습니다.']
      : s <= 8 ? ['😺 평범한 모험가', '적당히 놀라며 잘 헤쳐나갔습니다.']
        : s <= 15 ? ['😾 잘 놀라는 편', '여기저기서 꽤 당했네요.']
          : ['🙀 놀람 장인', '이 정도면 함정 수집가입니다.'];
  $('rank').innerHTML = `${rank[0]}<small>${rank[1]}</small>`;
  $('res-stats').innerHTML = `
    <div class="stat"><b>${g.startle}</b><i>놀란 횟수</i></div>
    <div class="stat"><b>${g.fish}</b><i>모은 생선</i></div>
    <div class="stat"><b>${g.time.toFixed(1)}</b><i>초</i></div>
    <div class="stat"><b>${g.log.length}</b><i>함정 종류</i></div>`;
  const total = {};
  g.log.forEach(l => { total[l.name] = (total[l.name] || 0) + l.count; });
  const rows = Object.entries(total).sort((a, b) => b[1] - a[1]);
  $('res-log').innerHTML = rows.length
    ? rows.map(([n, c]) => `<div class="lg"><span class="n">${n}</span><span class="c">${c}회</span></div>`).join('')
    : '<div class="lg"><span style="color:var(--txt3)">한 번도 안 놀랐습니다 😐</span></div>';
  $('end-title').textContent = win ? '🎉 탈출 성공!' : '끝';
  $('ov-end').classList.remove('hide');
}

/* ─────────── 15. 루프 ─────────── */
function loop() { update(); draw(); requestAnimationFrame(loop); }

/* ─────────── 16. UI ─────────── */
function readOpts() {
  OPT.sound = $('o-sound').checked;
  OPT.shake = $('o-shake').checked;
  OPT.lessFlash = $('o-flash').checked;
  OPT.mild = $('o-hint').checked;
  Snd.on = OPT.sound;
  $('mute').textContent = OPT.sound ? '🔊' : '🔇';
}

function begin(seed) {
  readOpts();
  Snd.init();
  if (Snd.ctx && Snd.ctx.state === 'suspended') Snd.ctx.resume();
  $('ov-start').classList.add('hide');
  $('ov-end').classList.add('hide');
  startGame(seed);
}

$('b-start').addEventListener('click', () => {
  const s = $('i-seed').value.trim().toUpperCase() || randomSeedText();
  $('i-seed').value = s;
  begin(s);
});
$('b-rand').addEventListener('click', () => { $('i-seed').value = randomSeedText(); });
$('b-again').addEventListener('click', () => begin(randomSeedText()));
$('b-retry').addEventListener('click', () => begin(G ? G.seed : randomSeedText()));
$('b-menu').addEventListener('click', () => {
  $('ov-end').classList.add('hide');
  $('ov-start').classList.remove('hide');
  G = null;
});
$('mute').addEventListener('click', () => {
  Snd.on = !Snd.on; OPT.sound = Snd.on;
  $('o-sound').checked = Snd.on;
  $('mute').textContent = Snd.on ? '🔊' : '🔇';
  Snd.init(); if (Snd.ctx && Snd.ctx.state === 'suspended') Snd.ctx.resume();
});

resize();
loop();
