/* ═══════════════════════════════════════════════════════════════
   그늘 산책 — 마우스 포인터로 어두운 공간들을 지나가는 산책
   · 조작: 마우스(또는 터치) 포인터 쪽으로 계속 걸어감. 상하좌우 자유.
   · 대사·자막·글자 없음. 픽토그램만.
   · 체력·사망·게임오버·되감기 없음. 무엇에 닿아도 죽지 않는다.
     닿으면 화면이 흔들리고 흐려질 뿐, 잠시 뒤 원래대로 돌아온다.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* ── 기본 상수 ─────────────────────────────────────────────── */
const T        = 46;    // 타일 한 변(px)
const GW       = 62;    // 맵 가로 타일 수
const GH       = 32;    // 맵 세로 타일 수
const PR       = 9;     // 플레이어 반지름
const RAYS     = 132;   // 시야 폴리곤 광선 수

const FLOOR = 0, WALL = 1, PROP = 2;

/* ── 유틸 ─────────────────────────────────────────────────── */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp  = (a, b, t) => a + (b - a) * t;
const TAU   = Math.PI * 2;

function rng(seed) {                       // mulberry32
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(x, y) {                     // 타일마다 고정된 잡음값
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/* ═══════════════════════════════════════════════════════════════
   공간 정의 — 7곳. 팔레트·소품·안개·조명·등장하는 것·소리가 다르다.
   ═══════════════════════════════════════════════════════════════ */
const SCENES = [
  { /* 1 ─ 병동 복도 */
    id: 'ward', seed: 10427,
    floor: ['#151b19', '#111614'], grout: '#0a0e0d',
    wall: '#1c2421', wallIn: '#0e1312', edge: '#2b3733',
    dark: .962, lightR: 210, cone: 430, spread: .56,
    fog:  { n: 60, c: '160,190,178', a: .030, size: [40, 130], spd: .10 },
    lamps:{ every: 6, c: '198,226,212', r: 132, flicker: .42 },
    props: [
      { t: 'door',   on: 'wallside', p: .16, solid: 0 },
      { t: 'gurney', on: 'wallside', p: .05, solid: 1 },
      { t: 'chair',  on: 'wallside', p: .05, solid: 0 },
      { t: 'puddle', on: 'floor',    p: .035, solid: 0 },
      { t: 'crack',  on: 'floor',    p: .05, solid: 0 },
    ],
    ents: [['watcher', 2], ['crawler', 1], ['face', 1]],
    snd: { drone: 44, dq: 6, noise: 360, ng: .020, drip: 7, creak: 11 },
  },
  { /* 2 ─ 지하 주차장 */
    id: 'garage', seed: 33871,
    floor: ['#16181b', '#121417'], grout: '#0b0c0e',
    wall: '#1e2126', wallIn: '#101215', edge: '#2c3138',
    dark: .972, lightR: 190, cone: 470, spread: .48,
    fog:  { n: 46, c: '150,158,175', a: .026, size: [70, 180], spd: .07 },
    lamps:{ every: 9, c: '186,198,224', r: 118, flicker: .62 },
    props: [
      { t: 'pillar', on: 'room',     p: .12, solid: 1 },
      { t: 'car',    on: 'room',     p: .10, solid: 1 },
      { t: 'cone',   on: 'floor',    p: .03, solid: 0 },
      { t: 'crack',  on: 'floor',    p: .06, solid: 0 },
      { t: 'puddle', on: 'floor',    p: .03, solid: 0 },
    ],
    ents: [['follower', 1], ['watcher', 2], ['eyes', 2]],
    snd: { drone: 38, dq: 8, noise: 240, ng: .026, drip: 5, creak: 14 },
  },
  { /* 3 ─ 세면장 */
    id: 'lavatory', seed: 51203,
    floor: ['#1b1e1e', '#171a1a'], grout: '#0d1010',
    wall: '#232726', wallIn: '#131615', edge: '#343b39',
    dark: .955, lightR: 175, cone: 360, spread: .62,
    fog:  { n: 74, c: '190,205,205', a: .040, size: [30, 90], spd: .16 },
    lamps:{ every: 5, c: '206,222,226', r: 104, flicker: .30 },
    props: [
      { t: 'stall',  on: 'wallside', p: .16, solid: 1 },
      { t: 'sink',   on: 'wallside', p: .12, solid: 1 },
      { t: 'mirror', on: 'wallside', p: .13, solid: 0 },
      { t: 'puddle', on: 'floor',    p: .10, solid: 0 },
    ],
    ents: [['watcher', 3], ['eyes', 3], ['face', 2]],
    snd: { drone: 52, dq: 5, noise: 520, ng: .022, drip: 3, creak: 16 },
  },
  { /* 4 ─ 밤의 숲 */
    id: 'forest', seed: 77419,
    floor: ['#12160f', '#0e120c'], grout: '#080a07',
    wall: '#141810', wallIn: '#0a0d08', edge: '#1e2617',
    dark: .980, lightR: 165, cone: 400, spread: .42,
    fog:  { n: 80, c: '150,175,150', a: .036, size: [80, 230], spd: .05 },
    lamps:null,
    props: [
      { t: 'tree',   on: 'any',   p: .17, solid: 1 },
      { t: 'bush',   on: 'floor', p: .09, solid: 0 },
      { t: 'stone',  on: 'floor', p: .05, solid: 1 },
      { t: 'branch', on: 'floor', p: .07, solid: 0 },
    ],
    ents: [['eyes', 6], ['follower', 2], ['shadow', 1]],
    snd: { drone: 34, dq: 4, noise: 700, ng: .034, drip: 12, creak: 6 },
  },
  { /* 5 ─ 교실 복도 */
    id: 'school', seed: 90233,
    floor: ['#1a1713', '#161310'], grout: '#0e0b09',
    wall: '#221e19', wallIn: '#12100d', edge: '#332d25',
    dark: .966, lightR: 200, cone: 420, spread: .54,
    fog:  { n: 54, c: '190,175,150', a: .028, size: [50, 140], spd: .09 },
    lamps:{ every: 7, c: '224,206,170', r: 124, flicker: .38 },
    props: [
      { t: 'locker', on: 'wallside', p: .17, solid: 1 },
      { t: 'desk',   on: 'room',     p: .18, solid: 1 },
      { t: 'board',  on: 'wallside', p: .07, solid: 0 },
      { t: 'crack',  on: 'floor',    p: .05, solid: 0 },
    ],
    ents: [['watcher', 3], ['crawler', 1], ['face', 2]],
    snd: { drone: 47, dq: 7, noise: 300, ng: .020, drip: 14, creak: 8 },
  },
  { /* 6 ─ 하수 터널 */
    id: 'sewer', seed: 12876,
    floor: ['#121517', '#0e1113'], grout: '#080a0b',
    wall: '#191d20', wallIn: '#0c0f11', edge: '#252c30',
    dark: .976, lightR: 180, cone: 450, spread: .40,
    fog:  { n: 70, c: '150,175,185', a: .042, size: [60, 190], spd: .13 },
    lamps:{ every: 11, c: '170,196,206', r: 96, flicker: .70 },
    props: [
      { t: 'pipe',   on: 'wallside', p: .20, solid: 0 },
      { t: 'water',  on: 'floor',    p: .16, solid: 0 },
      { t: 'barrel', on: 'wallside', p: .06, solid: 1 },
      { t: 'grate',  on: 'floor',    p: .04, solid: 0 },
    ],
    ents: [['crawler', 2], ['follower', 1], ['eyes', 3]],
    snd: { drone: 31, dq: 9, noise: 190, ng: .038, drip: 2, creak: 13 },
  },
  { /* 7 ─ 방 — 숨 돌리는 곳. 여기를 지나면 처음으로 되돌아간다. */
    id: 'room', seed: 60518,
    floor: ['#1d1a17', '#191614'], grout: '#100e0c',
    wall: '#252017', wallIn: '#14110c', edge: '#3a3325',
    dark: .930, lightR: 260, cone: 380, spread: .70,
    fog:  { n: 40, c: '220,200,170', a: .026, size: [40, 120], spd: .07 },
    lamps:{ every: 8, c: '246,222,178', r: 150, flicker: .12 },
    props: [
      { t: 'bed',    on: 'room',     p: .07, solid: 1 },
      { t: 'window', on: 'wallside', p: .13, solid: 0 },
      { t: 'lampf',  on: 'wallside', p: .06, solid: 1 },
      { t: 'rug',    on: 'floor',    p: .05, solid: 0 },
    ],
    ents: [['watcher', 1], ['eyes', 1]],
    snd: { drone: 58, dq: 3, noise: 420, ng: .014, drip: 16, creak: 18 },
  },
];

/* ═══════════════════════════════════════════════════════════════
   맵 생성 — 왼쪽에서 오른쪽으로 이어지는 통로 + 곁방
   생성 방식상 출구까지 길이 반드시 이어진다.
   ═══════════════════════════════════════════════════════════════ */
function buildMap(scene, seed) {
  const R = rng(seed);
  const g = [];
  for (let y = 0; y < GH; y++) g.push(new Uint8Array(GW).fill(WALL));

  const key = (x, y) => y * GW + x;
  const spine = new Set();
  const roomMask = new Set();
  const rooms = [];

  function carve(x0, y0, w, h, mark) {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        if (x < 1 || y < 1 || x >= GW - 1 || y >= GH - 1) continue;
        g[y][x] = FLOOR;
        if (mark) mark.add(key(x, y));
      }
    }
  }

  /* 주 통로 */
  let cx = 3, cy = (GH >> 1) + ((R() * 6 | 0) - 3);
  const start = { x: cx, y: cy };
  carve(cx - 1, cy - 1, 3, 3, spine);

  const legs = [];
  while (cx < GW - 9) {
    const w   = R() < .35 ? 3 : 2;                 // 통로 폭
    const run = 5 + (R() * 7 | 0);
    const nx  = Math.min(cx + run, GW - 7);
    carve(cx, cy - (w >> 1), nx - cx + w, w, spine);
    legs.push({ x: cx, y: cy, x2: nx });
    cx = nx;

    if (cx >= GW - 9) break;
    const dir = R() < .5 ? -1 : 1;
    const ny  = clamp(cy + dir * (3 + (R() * 7 | 0)), 3, GH - 5);
    const y0  = Math.min(cy, ny), y1 = Math.max(cy, ny);
    carve(cx - (w >> 1), y0, w, y1 - y0 + w, spine);
    cy = ny;
  }
  const exit = { x: Math.min(cx + 3, GW - 3), y: cy };
  carve(exit.x - 2, exit.y - 2, 5, 5, spine);

  /* 큰 홀 — 통로 중간중간을 넓게 열어 '공간'이 되게 한다 */
  const hallN = 3 + (R() * 3 | 0);
  for (let i = 0; i < hallN; i++) {
    const leg = legs[1 + ((R() * Math.max(1, legs.length - 1)) | 0)] || legs[0];
    const hw = 8 + (R() * 6 | 0), hh = 6 + (R() * 4 | 0);
    const hx = clamp(leg.x + (R() * Math.max(1, leg.x2 - leg.x) | 0) - (hw >> 1), 2, GW - hw - 2);
    const hy = clamp(leg.y - (hh >> 1), 2, GH - hh - 2);
    carve(hx, hy, hw, hh, null);
    rooms.push({ x: hx, y: hy, w: hw, h: hh, hall: 1 });
    /* 홀 안쪽은 소품이 놓이는 영역, 가운데 통과 차선만 비워 둔다 */
    for (let y = hy; y < hy + hh; y++)
      for (let x = hx; x < hx + hw; x++) roomMask.add(key(x, y));
    for (let x = hx; x < hx + hw; x++) {
      spine.add(key(x, leg.y)); spine.add(key(x, leg.y + 1));
    }
  }

  /* 곁방 */
  const roomN = 7 + (R() * 6 | 0);
  for (let i = 0; i < roomN; i++) {
    const leg = legs[(R() * legs.length) | 0];
    const rw  = 4 + (R() * 5 | 0), rh = 3 + (R() * 4 | 0);
    const side = R() < .5 ? -1 : 1;
    const rx = clamp(leg.x + (R() * (leg.x2 - leg.x) | 0) - (rw >> 1), 2, GW - rw - 2);
    const ry = clamp(leg.y + side * (3 + (R() * 3 | 0)), 2, GH - rh - 2);
    carve(rx, ry, rw, rh, roomMask);
    rooms.push({ x: rx, y: ry, w: rw, h: rh });
    /* 통로와 연결 — 방 중앙에서 통로 y까지 세로로 뚫는다 */
    const mx = rx + (rw >> 1);
    const a = Math.min(ry, leg.y), b = Math.max(ry + rh - 1, leg.y);
    carve(mx, a, 2, b - a + 1, null);
  }

  /* 소품 배치 */
  const props = [];
  const lamps = [];
  const noProp = new Set();
  for (let y = start.y - 2; y <= start.y + 2; y++)
    for (let x = start.x - 2; x <= start.x + 2; x++) noProp.add(key(x, y));
  for (let y = exit.y - 2; y <= exit.y + 2; y++)
    for (let x = exit.x - 2; x <= exit.x + 2; x++) noProp.add(key(x, y));

  for (let y = 1; y < GH - 1; y++) {
    for (let x = 1; x < GW - 1; x++) {
      if (g[y][x] !== FLOOR) continue;
      const k = key(x, y);
      if (noProp.has(k)) continue;
      const onSpine = spine.has(k);
      const inRoom  = roomMask.has(k);
      const nearWall = g[y - 1][x] === WALL || g[y + 1][x] === WALL ||
                       g[y][x - 1] === WALL || g[y][x + 1] === WALL;

      for (const rule of scene.props) {
        if (rule.on === 'wallside' && !nearWall) continue;
        if (rule.on === 'room' && !inRoom) continue;
        if (rule.solid && onSpine) continue;
        if (R() >= rule.p) continue;
        /* 고체 소품이 통로를 완전히 막지 않게 — 사방이 트인 칸엔 두지 않음 */
        if (rule.solid) {
          const open = (g[y - 1][x] === FLOOR) + (g[y + 1][x] === FLOOR) +
                       (g[y][x - 1] === FLOOR) + (g[y][x + 1] === FLOOR);
          if (open >= 4 && !inRoom) continue;
          g[y][x] = PROP;
        }
        props.push({
          t: rule.t, gx: x, gy: y,
          x: x * T + T / 2 + (R() - .5) * 8,
          y: y * T + T / 2 + (R() - .5) * 8,
          r: R(), rot: R() * TAU,
          /* 벽이 어느 쪽에 붙어 있는지 — 벽걸이 소품 방향 */
          face: g[y - 1][x] === WALL ? 0 : g[y][x + 1] === WALL ? 1 :
                g[y + 1][x] === WALL ? 2 : 3,
        });
        break;
      }
    }
  }

  /* 천장 조명 — 통로 위에 일정 간격으로 */
  if (scene.lamps) {
    const sp = [...spine];
    for (let i = 0; i < sp.length; i += scene.lamps.every * 3) {
      const k = sp[i];
      const x = k % GW, y = (k / GW) | 0;
      if (g[y][x] !== FLOOR) continue;
      lamps.push({
        x: x * T + T / 2, y: y * T + T / 2,
        ph: R() * TAU, on: 1, dead: R() < .18,
      });
    }
  }

  /* ── 도달 가능성 보장 ──────────────────────────────────
     시작점에서 물이 흐르듯 퍼뜨려 본다. 출구가 잠겼으면
     경계에 붙은 소품을 하나씩 치워 길을 다시 연다.
     (막다른 곳에 갇히는 일이 없게 하는 안전장치)              */
  let reach;
  for (let attempt = 0; attempt < 40; attempt++) {
    reach = new Set();
    const q = [key(start.x, start.y)];
    reach.add(q[0]);
    const border = [];
    while (q.length) {
      const k = q.pop();
      const x = k % GW, y = (k / GW) | 0;
      for (let i = 0; i < 4; i++) {
        const nx = x + (i === 0 ? 1 : i === 1 ? -1 : 0);
        const ny = y + (i === 2 ? 1 : i === 3 ? -1 : 0);
        if (nx < 1 || ny < 1 || nx >= GW - 1 || ny >= GH - 1) continue;
        const nk = key(nx, ny);
        if (reach.has(nk)) continue;
        if (g[ny][nx] === FLOOR) { reach.add(nk); q.push(nk); }
        else if (g[ny][nx] === PROP) border.push(nk);
      }
    }
    if (reach.has(key(exit.x, exit.y))) break;
    if (!border.length) break;
    /* 경계의 소품을 절반쯤 치운다 */
    for (let i = 0; i < border.length; i += 2) {
      const bx = border[i] % GW, by = (border[i] / GW) | 0;
      g[by][bx] = FLOOR;
      for (let j = props.length - 1; j >= 0; j--)
        if (props[j].gx === bx && props[j].gy === by) props.splice(j, 1);
    }
  }

  /* 등장물이 놓일 칸 — 실제로 걸어서 갈 수 있는 곳만 */
  const open = [];
  for (const k of reach) {
    const x = k % GW, y = (k / GW) | 0;
    open.push({ x: x * T + T / 2, y: y * T + T / 2 });
  }

  return {
    g, props, lamps, rooms, open,
    spawn: { x: start.x * T + T / 2, y: start.y * T + T / 2 },
    exit:  { x: exit.x  * T + T / 2, y: exit.y  * T + T / 2 },
  };
}

/* ═══════════════════════════════════════════════════════════════
   소리 — 외부 파일 없이 WebAudio로 전부 합성
   ═══════════════════════════════════════════════════════════════ */
const Snd = {
  ready: false, muted: false, ctx: null,
  init() {
    if (this.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = .9;
    this.master.connect(c.destination);

    /* 저역 드론 */
    this.dGain = c.createGain(); this.dGain.gain.value = 0;
    this.dFilt = c.createBiquadFilter();
    this.dFilt.type = 'lowpass'; this.dFilt.frequency.value = 200; this.dFilt.Q.value = 4;
    this.dGain.connect(this.dFilt); this.dFilt.connect(this.master);
    this.osc = [];
    for (let i = 0; i < 3; i++) {
      const o = c.createOscillator();
      o.type = i === 2 ? 'triangle' : 'sine';
      const g = c.createGain(); g.gain.value = i === 2 ? .22 : .5;
      o.connect(g); g.connect(this.dGain); o.start();
      this.osc.push({ o, g });
    }
    /* 드론 흔들림 */
    const lfo = c.createOscillator(); lfo.frequency.value = .07;
    const lg = c.createGain(); lg.gain.value = 60;
    lfo.connect(lg); lg.connect(this.dFilt.frequency); lfo.start();

    /* 잡음 바닥(바람·공기) */
    const len = c.sampleRate * 3;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    this.nFilt = c.createBiquadFilter();
    this.nFilt.type = 'bandpass'; this.nFilt.frequency.value = 400; this.nFilt.Q.value = .8;
    this.nGain = c.createGain(); this.nGain.gain.value = 0;
    src.connect(this.nFilt); this.nFilt.connect(this.nGain); this.nGain.connect(this.master);
    src.start();
    const nlfo = c.createOscillator(); nlfo.frequency.value = .11;
    const nlg = c.createGain(); nlg.gain.value = 140;
    nlfo.connect(nlg); nlg.connect(this.nFilt.frequency); nlfo.start();

    this.ready = true;
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  setScene(s, intensity) {
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const base = s.snd.drone * (1 - (intensity - 1) * .06);
    this.osc[0].o.frequency.setTargetAtTime(base, t, 1.4);
    this.osc[1].o.frequency.setTargetAtTime(base * 1.0075, t, 1.4);
    this.osc[2].o.frequency.setTargetAtTime(base * .5, t, 1.4);
    this.dFilt.Q.setTargetAtTime(s.snd.dq, t, 1.2);
    this.dGain.gain.setTargetAtTime(.085 + (intensity - 1) * .015, t, 2.0);
    this.nFilt.frequency.setTargetAtTime(s.snd.noise, t, 1.6);
    this.nGain.gain.setTargetAtTime(s.snd.ng, t, 2.0);
  },
  noise(dur, freq, q, gain, type) {
    if (!this.ready || this.muted) return;
    const c = this.ctx, t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    s.playbackRate.value = .7 + Math.random() * .7;
    const f = c.createBiquadFilter();
    f.type = type || 'lowpass'; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + .008);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t); s.stop(t + dur + .05);
  },
  tone(freq, dur, gain, type, glide) {
    if (!this.ready || this.muted) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, glide), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + .05);
  },
  step(soft)  { this.noise(soft ? .10 : .16, 620 + Math.random() * 300, 1.1, soft ? .022 : .038); },
  drip()      { this.tone(1300 + Math.random() * 700, .22, .045, 'sine', 380); },
  creak()     { this.noise(1.1 + Math.random(), 220 + Math.random() * 200, 9, .030, 'bandpass'); },
  gust()      { this.noise(2.2, 300 + Math.random() * 200, .6, .035, 'bandpass'); },
  whisper()   { this.noise(1.5, 1400 + Math.random() * 900, 5, .022, 'bandpass'); },
  stinger()   {
    if (!this.ready || this.muted) return;
    this.noise(.7, 2600, .7, .055, 'highpass');
    const f = 320 + Math.random() * 140;
    this.tone(f, .8, .05, 'sawtooth', f * .55);
    this.tone(f * 1.06, .8, .035, 'sawtooth', f * .58);
    this.tone(f * .5, 1.1, .045, 'sine', f * .3);
  },
  thump()     { this.tone(58, .34, .09, 'sine', 34); },
  door()      { this.noise(.9, 160, 6, .045, 'bandpass'); this.tone(90, .5, .04, 'sine', 48); },
};

/* ═══════════════════════════════════════════════════════════════
   게임 상태
   ═══════════════════════════════════════════════════════════════ */
const world = document.getElementById('world');
const fxc   = document.getElementById('fx');
const wctx  = world.getContext('2d');
const fctx  = fxc.getContext('2d');
const dcan  = document.createElement('canvas');       // 어둠 레이어
const dctx  = dcan.getContext('2d');
const stage = document.getElementById('stage');
const gate  = document.getElementById('gate');
const hud   = document.getElementById('hud');
const muteB = document.getElementById('mute');

let W = 0, H = 0, DPR = 1;
const G = {
  running: false,
  sceneIdx: 0, loop: 1,
  scene: null, map: null,
  p: { x: 0, y: 0, vx: 0, vy: 0, ang: 0, walk: 0, stepAcc: 0, slow: 0 },
  cam: { x: 0, y: 0 },
  ptr: { x: 0, y: 0, has: false },      // 화면 좌표
  ents: [], fog: [], vis: [],
  face: null, faceT: 4,
  t: 0, shake: 0, distort: 0, flash: 0,
  blink: 0, phase: 'play',              // play | out | in
  beat: 0, glitch: 0,
  nextDrip: 3, nextCreak: 6, nextWhisper: 12,
};

/* ── 화면 크기 ─────────────────────────────────────────────── */
function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = Math.floor(window.innerWidth);
  H = Math.floor(window.innerHeight);
  for (const c of [world, fxc, dcan]) {
    c.width = Math.floor(W * DPR);
    c.height = Math.floor(H * DPR);
  }
  wctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  dctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  buildGrain();
}
window.addEventListener('resize', resize);

/* ── 필름 그레인 타일 ──────────────────────────────────────── */
let grain = [];
function buildGrain() {
  grain = [];
  for (let k = 0; k < 4; k++) {
    const c = document.createElement('canvas');
    c.width = c.height = 160;
    const g = c.getContext('2d');
    const im = g.createImageData(160, 160);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = 120 + Math.random() * 135;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
      im.data[i + 3] = 26 + Math.random() * 40;
    }
    g.putImageData(im, 0, 0);
    grain.push(c);
  }
}

/* ═══════════════════════════════════════════════════════════════
   등장물
   ═══════════════════════════════════════════════════════════════ */
function farCell(minD) {
  const o = G.map.open;
  let best = o[0], bestD = -1;
  for (let i = 0; i < 40; i++) {
    const c = o[(Math.random() * o.length) | 0];
    const d = Math.hypot(c.x - G.p.x, c.y - G.p.y);
    if (d > minD) return c;
    if (d > bestD) { bestD = d; best = c; }
  }
  return best;
}

function makeEnt(kind) {
  const c = farCell(620);
  const e = {
    k: kind, x: c.x, y: c.y, a: 0, alpha: 0, seen: false,
    ph: Math.random() * TAU, cd: 0, state: 0, sx: 0, sy: 0, life: 0,
  };
  if (kind === 'crawler') e.cd = 3 + Math.random() * 6;
  if (kind === 'shadow')  e.cd = 6 + Math.random() * 8;
  return e;
}

function updateEnts(dt) {
  const p = G.p;
  const fx = Math.cos(p.ang), fy = Math.sin(p.ang);

  for (const e of G.ents) {
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const towards = (-dx / d) * fx + (-dy / d) * fy;   // 플레이어가 e를 향해 보는 정도

    switch (e.k) {

      case 'watcher': {
        /* 어딘가에 서서 바라본다. 다가가면 스러진다. */
        e.a = Math.atan2(dy, dx);
        const lit = d < G.scene.cone * .95 && towards > .35;
        e.alpha = lerp(e.alpha, lit ? 1 : .25, dt * 2.2);
        if (lit && !e.seen) { e.seen = true; if (Math.random() < .55) Snd.whisper(); }
        if (d < 175) {
          e.state += dt;
          e.alpha = lerp(e.alpha, 0, dt * 4.5);
          if (e.state > .55) {
            const c = farCell(700);
            e.x = c.x; e.y = c.y; e.state = 0; e.seen = false; e.alpha = 0;
          }
        } else e.state = 0;
        e.y += Math.sin(G.t * 1.1 + e.ph) * .06;   // 아주 미세한 흔들림
        break;
      }

      case 'follower': {
        /* 등을 보이면 다가오고, 마주 보면 멈춘다. 닿아도 죽지 않는다. */
        const watched = towards > .45 && d < 520;
        e.alpha = lerp(e.alpha, watched ? .5 : .78, dt * 2);
        if (!watched) {
          const sp = (44 + (G.loop - 1) * 8) * dt;
          const nx = e.x + (dx / d) * sp, ny = e.y + (dy / d) * sp;
          if (!solidAt(nx, ny)) { e.x = nx; e.y = ny; }
          else { e.x += (Math.random() - .5) * 12; e.y += (Math.random() - .5) * 12; }
        }
        e.a = Math.atan2(dy, dx);
        if (d < 46) { brush(); const c = farCell(760); e.x = c.x; e.y = c.y; }
        break;
      }

      case 'crawler': {
        /* 시야를 가로질러 한 번 지나간다. */
        if (e.state === 0) {
          e.cd -= dt;
          if (e.cd <= 0 && d < 460) {
            const side = Math.random() < .5 ? 1 : -1;
            const px = -fy * side, py = fx * side;
            e.x = p.x + fx * (200 + Math.random() * 160) - px * 300;
            e.y = p.y + fy * (200 + Math.random() * 160) - py * 300;
            e.sx = px; e.sy = py;
            e.state = 1; e.life = 0; e.alpha = 0;
            if (Math.random() < .5) Snd.noise(.5, 900, 2, .03);
          }
        } else {
          e.life += dt;
          const sp = (620 + (G.loop - 1) * 90) * dt;
          e.x += e.sx * sp; e.y += e.sy * sp;
          e.a = Math.atan2(e.sy, e.sx);
          e.alpha = Math.sin(clamp(e.life / .95, 0, 1) * Math.PI);
          if (e.life > .95) { e.state = 0; e.cd = 5 + Math.random() * 9; e.alpha = 0; }
        }
        break;
      }

      case 'eyes': {
        /* 어둠 속에서 깜빡인다. 가까이 가면 사라진다. */
        e.a = Math.atan2(dy, dx);
        const blinkPh = Math.sin(G.t * .9 + e.ph);
        const open = blinkPh > -.72 ? 1 : 0;
        const near = d < 150;
        e.alpha = lerp(e.alpha, near ? 0 : (d < 900 ? open : 0), dt * (near ? 5 : 8));
        if (near) {
          e.state += dt;
          if (e.state > .5) { const c = farCell(720); e.x = c.x; e.y = c.y; e.state = 0; }
        } else e.state = 0;
        break;
      }

      case 'shadow': {
        /* 화면을 스쳐 지나가는 그림자. 위치는 화면 기준. */
        e.cd -= dt;
        if (e.state === 0 && e.cd <= 0) {
          e.state = 1; e.life = 0;
          e.sx = Math.random() < .5 ? -1 : 1;
          e.sy = .1 + Math.random() * .5;
          if (Math.random() < .4) Snd.gust();
        } else if (e.state === 1) {
          e.life += dt;
          if (e.life > 2.1) { e.state = 0; e.cd = 9 + Math.random() * 12; }
        }
        break;
      }
    }
  }

  /* 벽에 스치는 얼굴 — 잠깐 떠올랐다 사라진다 */
  G.faceT -= dt;
  if (G.faceT <= 0 && G.scene.ents.some(e => e[0] === 'face')) {
    G.faceT = 7 + Math.random() * 13;
    const a = p.ang + (Math.random() - .5) * 1.5;
    for (let r = 120; r < 340; r += 22) {
      const wx = p.x + Math.cos(a) * r, wy = p.y + Math.sin(a) * r;
      if (solidAt(wx, wy)) {
        G.face = { x: wx, y: wy, t: 0, dur: 1.5 + Math.random() };
        if (Math.random() < .4) Snd.whisper();
        break;
      }
    }
  }
  if (G.face) { G.face.t += dt; if (G.face.t > G.face.dur) G.face = null; }
}

/* 무언가에 닿았을 때 — 죽지 않는다. 화면만 일그러진다. */
function brush() {
  G.distort = Math.min(1.6, G.distort + 1.1);
  G.shake = Math.max(G.shake, 16);
  G.glitch = 1;
  G.p.slow = 1.6;
  Snd.stinger();
}

/* ═══════════════════════════════════════════════════════════════
   충돌 · 시야
   ═══════════════════════════════════════════════════════════════ */
function tileAt(x, y) {
  const gx = (x / T) | 0, gy = (y / T) | 0;
  if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) return WALL;
  return G.map.g[gy][gx];
}
const solidAt = (x, y) => tileAt(x, y) !== FLOOR;

function moveP(dt) {
  const p = G.p;
  /* 포인터 방향으로 걷는다 */
  let ax = 0, ay = 0;
  if (G.ptr.has) {
    const tx = G.ptr.x + G.cam.x, ty = G.ptr.y + G.cam.y;
    const dx = tx - p.x, dy = ty - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 14) { ax = dx / d; ay = dy / d; }
    if (d > 3) p.ang = lerp2ang(p.ang, Math.atan2(dy, dx), dt * 9);
  }
  const slowF = p.slow > 0 ? .45 : 1;
  const maxV = 152 * slowF * (1 + (G.loop - 1) * .04);
  const acc  = 900 * slowF;
  p.vx = lerp(p.vx, ax * maxV, clamp(dt * acc / maxV, 0, 1));
  p.vy = lerp(p.vy, ay * maxV, clamp(dt * acc / maxV, 0, 1));
  if (p.slow > 0) p.slow -= dt;

  /* 축별로 밀어내며 이동 */
  const nx = p.x + p.vx * dt;
  if (!hitBox(nx, p.y)) p.x = nx; else p.vx = 0;
  const ny = p.y + p.vy * dt;
  if (!hitBox(p.x, ny)) p.y = ny; else p.vy = 0;

  /* 발소리 */
  const sp = Math.hypot(p.vx, p.vy);
  p.walk += sp * dt;
  p.stepAcc += sp * dt;
  if (p.stepAcc > 46) { p.stepAcc = 0; Snd.step(sp < maxV * .6); }
}
function hitBox(x, y) {
  return solidAt(x - PR, y - PR) || solidAt(x + PR, y - PR) ||
         solidAt(x - PR, y + PR) || solidAt(x + PR, y + PR) ||
         solidAt(x, y - PR) || solidAt(x, y + PR) ||
         solidAt(x - PR, y) || solidAt(x + PR, y);
}
function lerp2ang(a, b, t) {
  let d = ((b - a + Math.PI * 3) % TAU) - Math.PI;
  return a + d * clamp(t, 0, 1);
}

/* DDA 광선 — 가장 가까운 막힌 칸까지 거리 */
function castRay(ox, oy, ang, maxD) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  let gx = (ox / T) | 0, gy = (oy / T) | 0;
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
  const idx = dx === 0 ? 1e9 : Math.abs(T / dx);
  const idy = dy === 0 ? 1e9 : Math.abs(T / dy);
  let tx = dx === 0 ? 1e9 : Math.abs(((dx > 0 ? (gx + 1) * T : gx * T) - ox) / dx);
  let ty = dy === 0 ? 1e9 : Math.abs(((dy > 0 ? (gy + 1) * T : gy * T) - oy) / dy);
  let d = 0;
  for (let i = 0; i < 90; i++) {
    if (tx < ty) { d = tx; tx += idx; gx += sx; }
    else         { d = ty; ty += idy; gy += sy; }
    if (d > maxD) return maxD;
    if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) return d;
    if (G.map.g[gy][gx] !== FLOOR) return d;
  }
  return maxD;
}
function buildVis() {
  const maxD = Math.max(G.scene.cone, G.scene.lightR) + 120;
  const p = G.p;
  G.vis.length = 0;
  for (let i = 0; i < RAYS; i++) {
    const a = (i / RAYS) * TAU;
    const d = castRay(p.x, p.y, a, maxD);
    G.vis.push(p.x + Math.cos(a) * (d + 2), p.y + Math.sin(a) * (d + 2));
  }
}

/* ═══════════════════════════════════════════════════════════════
   그리기
   ═══════════════════════════════════════════════════════════════ */
function toS(x, y) { return [x - G.cam.x, y - G.cam.y]; }

function drawFloor() {
  const s = G.scene;
  const x0 = Math.max(0, (G.cam.x / T | 0) - 1), y0 = Math.max(0, (G.cam.y / T | 0) - 1);
  const x1 = Math.min(GW - 1, ((G.cam.x + W) / T | 0) + 1);
  const y1 = Math.min(GH - 1, ((G.cam.y + H) / T | 0) + 1);
  /* 1) 바닥 — 같은 색끼리 몰아서 채운다 */
  for (let pass = 0; pass < 2; pass++) {
    wctx.fillStyle = s.floor[pass];
    wctx.beginPath();
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (G.map.g[y][x] !== FLOOR) continue;
        if ((hash2(x, y) < .5 ? 0 : 1) !== pass) continue;
        wctx.rect(x * T - G.cam.x, y * T - G.cam.y, T, T);
      }
    }
    wctx.fill();
  }

  /* 2) 타일 줄눈 — 화면 전체를 한 번의 path로 */
  wctx.strokeStyle = s.grout; wctx.lineWidth = 1;
  wctx.beginPath();
  for (let x = x0; x <= x1 + 1; x++) {
    const sx = Math.floor(x * T - G.cam.x) + .5;
    wctx.moveTo(sx, y0 * T - G.cam.y); wctx.lineTo(sx, (y1 + 1) * T - G.cam.y);
  }
  for (let y = y0; y <= y1 + 1; y++) {
    const sy = Math.floor(y * T - G.cam.y) + .5;
    wctx.moveTo(x0 * T - G.cam.x, sy); wctx.lineTo((x1 + 1) * T - G.cam.x, sy);
  }
  wctx.stroke();

  /* 3) 벽 — 줄눈 위에 덮어 그린다 */
  wctx.fillStyle = s.wall;
  wctx.beginPath();
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (G.map.g[y][x] !== FLOOR) wctx.rect(x * T - G.cam.x, y * T - G.cam.y, T, T);
  wctx.fill();

  /* 벽면의 얼룩 — 어두운 쪽/밝은 쪽 두 단계로만 */
  for (let lv = 0; lv < 2; lv++) {
    wctx.fillStyle = 'rgba(0,0,0,' + (lv ? .22 : .10) + ')';
    wctx.beginPath();
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        if (G.map.g[y][x] === FLOOR) continue;
        if ((hash2(x, y) < .5 ? 0 : 1) !== lv) continue;
        wctx.rect(x * T - G.cam.x, y * T - G.cam.y, T, T);
      }
    wctx.fill();
  }

  /* 4) 벽의 위·아래 모서리 — 두께감 */
  wctx.fillStyle = s.edge;
  wctx.beginPath();
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (G.map.g[y][x] !== FLOOR && y + 1 < GH && G.map.g[y + 1][x] === FLOOR)
        wctx.rect(x * T - G.cam.x, y * T - G.cam.y + T - 3, T, 3);
  wctx.fill();
  wctx.fillStyle = s.wallIn;
  wctx.beginPath();
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (G.map.g[y][x] !== FLOOR && y - 1 >= 0 && G.map.g[y - 1][x] === FLOOR)
        wctx.rect(x * T - G.cam.x, y * T - G.cam.y, T, 3);
  wctx.fill();
}

/* 소품 ─────────────────────────────────────────────────────── */
const PROPS = {
  door(c, p, s) {
    const w = 30, h = 7;
    c.fillStyle = '#0b0d0c'; c.strokeStyle = s.edge; c.lineWidth = 1.5;
    if (p.face === 0 || p.face === 2) { c.fillRect(-w / 2, -h / 2, w, h); c.strokeRect(-w / 2, -h / 2, w, h); }
    else { c.fillRect(-h / 2, -w / 2, h, w); c.strokeRect(-h / 2, -w / 2, h, w); }
    c.fillStyle = 'rgba(220,230,225,.20)';
    c.beginPath(); c.arc(p.r < .5 ? -8 : 8, 0, 1.7, 0, TAU); c.fill();
  },
  gurney(c) {
    c.fillStyle = '#191f1d'; c.strokeStyle = '#2e3a36'; c.lineWidth = 1.2;
    c.fillRect(-9, -18, 18, 36); c.strokeRect(-9, -18, 18, 36);
    c.fillStyle = 'rgba(210,220,215,.10)'; c.fillRect(-7, -16, 14, 13);
  },
  chair(c) {
    c.fillStyle = '#1a201e'; c.strokeStyle = '#2b3532'; c.lineWidth = 1.2;
    c.fillRect(-7, -7, 14, 14); c.strokeRect(-7, -7, 14, 14);
  },
  puddle(c, p) {
    const r = 9 + p.r * 12;
    const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, 'rgba(150,180,190,.16)');
    g.addColorStop(1, 'rgba(120,150,160,0)');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(0, 0, r, r * .66, p.rot, 0, TAU); c.fill();
  },
  crack(c, p) {
    c.strokeStyle = 'rgba(0,0,0,.42)'; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(-14, -3);
    c.lineTo(-4, 2 + p.r * 4); c.lineTo(5, -4 + p.r * 3); c.lineTo(15, 3);
    c.stroke();
  },
  pillar(c, p, s) {
    c.fillStyle = '#20242a'; c.fillRect(-19, -19, 38, 38);
    c.fillStyle = 'rgba(0,0,0,.42)'; c.fillRect(-13, -13, 26, 26);
    c.strokeStyle = s.edge; c.lineWidth = 1.4; c.strokeRect(-19, -19, 38, 38);
    c.fillStyle = 'rgba(230,200,90,.16)'; c.fillRect(-19, 15, 38, 4);
  },
  car(c, p) {
    c.rotate(p.r < .5 ? 0 : Math.PI / 2);
    c.fillStyle = '#191c20'; c.strokeStyle = '#2c3138'; c.lineWidth = 1.3;
    rr(c, -14, -22, 28, 44, 7); c.fill(); c.stroke();
    c.fillStyle = 'rgba(140,170,190,.10)'; rr(c, -10, -12, 20, 15, 3); c.fill();
    c.fillStyle = 'rgba(255,240,200,' + (p.r < .18 ? .30 : .05) + ')';
    c.beginPath(); c.arc(-8, -21, 2.4, 0, TAU); c.arc(8, -21, 2.4, 0, TAU); c.fill();
  },
  cone(c) {
    c.fillStyle = 'rgba(210,110,50,.5)';
    c.beginPath(); c.moveTo(0, -9); c.lineTo(7, 8); c.lineTo(-7, 8); c.closePath(); c.fill();
  },
  stall(c, p, s) {
    c.fillStyle = '#1e2221'; c.strokeStyle = s.edge; c.lineWidth = 1.3;
    const vert = p.face === 1 || p.face === 3;
    if (vert) { c.fillRect(-8, -20, 16, 40); c.strokeRect(-8, -20, 16, 40); }
    else { c.fillRect(-20, -8, 40, 16); c.strokeRect(-20, -8, 40, 16); }
    c.fillStyle = 'rgba(0,0,0,.5)';
    if (vert) c.fillRect(-8, -4, 16, 8); else c.fillRect(-4, -8, 8, 16);
  },
  sink(c, p, s) {
    c.fillStyle = '#222625'; c.strokeStyle = s.edge; c.lineWidth = 1.2;
    rr(c, -11, -8, 22, 16, 4); c.fill(); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(0, 0, 7, 5, 0, 0, TAU); c.fill();
  },
  mirror(c, p) {
    const g = c.createLinearGradient(-16, -6, 16, 6);
    g.addColorStop(0, 'rgba(180,205,205,.10)');
    g.addColorStop(.5, 'rgba(210,230,230,.22)');
    g.addColorStop(1, 'rgba(150,180,180,.08)');
    c.fillStyle = g; c.strokeStyle = 'rgba(200,220,220,.20)'; c.lineWidth = 1.2;
    const vert = p.face === 1 || p.face === 3;
    if (vert) { c.fillRect(-5, -16, 10, 32); c.strokeRect(-5, -16, 10, 32); }
    else { c.fillRect(-16, -5, 32, 10); c.strokeRect(-16, -5, 32, 10); }
  },
  tree(c, p) {
    c.fillStyle = '#0b0f09';
    c.beginPath(); c.arc(0, 0, 16 + p.r * 5, 0, TAU); c.fill();
    c.fillStyle = '#161c11';
    c.beginPath(); c.arc(-3, -3, 10 + p.r * 4, 0, TAU); c.fill();
    c.fillStyle = 'rgba(0,0,0,.55)';
    c.beginPath(); c.arc(0, 0, 5, 0, TAU); c.fill();
  },
  bush(c, p) {
    c.fillStyle = 'rgba(20,30,18,.85)';
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.arc((i - 1) * 7, (p.r - .5) * 8, 6 + p.r * 3, 0, TAU); c.fill();
    }
  },
  stone(c, p) {
    c.fillStyle = '#1a1d18'; c.strokeStyle = '#262b21'; c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-11, 4); c.lineTo(-6, -9); c.lineTo(7, -7); c.lineTo(11, 5); c.closePath();
    c.fill(); c.stroke();
  },
  branch(c, p) {
    c.strokeStyle = 'rgba(60,55,40,.5)'; c.lineWidth = 2;
    c.rotate(p.rot);
    c.beginPath(); c.moveTo(-14, 0); c.lineTo(4, -3); c.lineTo(14, 2); c.stroke();
  },
  locker(c, p, s) {
    c.fillStyle = '#23201a'; c.strokeStyle = s.edge; c.lineWidth = 1.2;
    const vert = p.face === 1 || p.face === 3;
    if (vert) {
      c.fillRect(-9, -22, 18, 44); c.strokeRect(-9, -22, 18, 44);
      c.strokeStyle = 'rgba(0,0,0,.5)';
      for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(-9, -22 + i * 14.6); c.lineTo(9, -22 + i * 14.6); c.stroke(); }
    } else {
      c.fillRect(-22, -9, 44, 18); c.strokeRect(-22, -9, 44, 18);
      c.strokeStyle = 'rgba(0,0,0,.5)';
      for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(-22 + i * 14.6, -9); c.lineTo(-22 + i * 14.6, 9); c.stroke(); }
    }
  },
  desk(c, p, s) {
    c.rotate(p.r < .5 ? 0 : Math.PI / 2);
    c.fillStyle = '#241f18'; c.strokeStyle = s.edge; c.lineWidth = 1.1;
    rr(c, -15, -10, 30, 20, 2); c.fill(); c.stroke();
    c.fillStyle = '#1a1610';
    c.beginPath(); c.arc(0, 17, 7, 0, TAU); c.fill();
  },
  board(c, p) {
    c.fillStyle = 'rgba(30,44,36,.85)'; c.strokeStyle = 'rgba(120,110,80,.35)'; c.lineWidth = 1.4;
    const vert = p.face === 1 || p.face === 3;
    if (vert) { c.fillRect(-5, -20, 10, 40); c.strokeRect(-5, -20, 10, 40); }
    else { c.fillRect(-20, -5, 40, 10); c.strokeRect(-20, -5, 40, 10); }
  },
  pipe(c, p) {
    c.strokeStyle = '#20262a'; c.lineWidth = 7;
    const vert = p.face === 1 || p.face === 3;
    c.beginPath();
    if (vert) { c.moveTo(0, -T / 2); c.lineTo(0, T / 2); } else { c.moveTo(-T / 2, 0); c.lineTo(T / 2, 0); }
    c.stroke();
    c.strokeStyle = 'rgba(150,180,190,.10)'; c.lineWidth = 2;
    c.stroke();
  },
  water(c, p) {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 22);
    g.addColorStop(0, 'rgba(120,165,180,.16)');
    g.addColorStop(1, 'rgba(90,130,145,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(180,215,225,.10)'; c.lineWidth = 1;
    const rr2 = 6 + ((G.t * 14 + p.r * 40) % 16);
    c.beginPath(); c.arc(0, 0, rr2, 0, TAU); c.stroke();
  },
  barrel(c, p, s) {
    c.fillStyle = '#1d2124'; c.strokeStyle = s.edge; c.lineWidth = 1.2;
    c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.45)';
    c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.stroke();
  },
  grate(c) {
    c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      c.beginPath(); c.moveTo(i * 6, -14); c.lineTo(i * 6, 14); c.stroke();
    }
  },
  bed(c, p, s) {
    c.rotate(p.r < .5 ? 0 : Math.PI / 2);
    c.fillStyle = '#26211a'; c.strokeStyle = s.edge; c.lineWidth = 1.3;
    rr(c, -16, -26, 32, 52, 3); c.fill(); c.stroke();
    c.fillStyle = 'rgba(235,220,190,.10)'; rr(c, -13, -23, 26, 16, 3); c.fill();
  },
  window(c, p) {
    const g = c.createLinearGradient(-18, 0, 18, 0);
    g.addColorStop(0, 'rgba(120,150,200,.05)');
    g.addColorStop(.5, 'rgba(180,205,240,.16)');
    g.addColorStop(1, 'rgba(120,150,200,.05)');
    c.fillStyle = g;
    const vert = p.face === 1 || p.face === 3;
    if (vert) c.fillRect(-6, -18, 12, 36); else c.fillRect(-18, -6, 36, 12);
    c.strokeStyle = 'rgba(200,215,240,.16)'; c.lineWidth = 1.2;
    if (vert) c.strokeRect(-6, -18, 12, 36); else c.strokeRect(-18, -6, 36, 12);
  },
  lampf(c) {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 34);
    g.addColorStop(0, 'rgba(250,225,170,.30)');
    g.addColorStop(1, 'rgba(250,225,170,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 34, 0, TAU); c.fill();
    c.fillStyle = 'rgba(250,232,190,.55)';
    c.beginPath(); c.arc(0, 0, 5, 0, TAU); c.fill();
  },
  rug(c, p) {
    c.fillStyle = 'rgba(80,60,45,.28)';
    c.rotate(p.rot * .2);
    rr(c, -20, -14, 40, 28, 3); c.fill();
  },
};
function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawProps() {
  const s = G.scene;
  const pad = 60;
  for (const p of G.map.props) {
    const sx = p.x - G.cam.x, sy = p.y - G.cam.y;
    if (sx < -pad || sy < -pad || sx > W + pad || sy > H + pad) continue;
    const fn = PROPS[p.t]; if (!fn) continue;
    wctx.save(); wctx.translate(sx, sy); fn(wctx, p, s); wctx.restore();
  }
}

/* 출구 ─────────────────────────────────────────────────────── */
function drawExit() {
  const [sx, sy] = toS(G.map.exit.x, G.map.exit.y);
  if (sx < -120 || sy < -120 || sx > W + 120 || sy > H + 120) return;
  const pu = .55 + Math.sin(G.t * 1.5) * .22;
  const g = wctx.createRadialGradient(sx, sy, 0, sx, sy, 78);
  g.addColorStop(0, 'rgba(226,236,255,' + (.22 * pu).toFixed(3) + ')');
  g.addColorStop(1, 'rgba(226,236,255,0)');
  wctx.fillStyle = g;
  wctx.beginPath(); wctx.arc(sx, sy, 78, 0, TAU); wctx.fill();
  wctx.strokeStyle = 'rgba(232,240,255,' + (.30 + pu * .30).toFixed(3) + ')';
  wctx.lineWidth = 2;
  wctx.strokeRect(sx - 17, sy - 26, 34, 52);
  wctx.fillStyle = 'rgba(0,0,0,.55)';
  wctx.fillRect(sx - 15, sy - 24, 30, 48);
}

/* 등장물 그리기 ───────────────────────────────────────────── */
function figure(c, h, w, alpha, col) {
  c.globalAlpha = alpha;
  c.fillStyle = col;
  c.beginPath(); c.ellipse(0, 0, w, h, 0, 0, TAU); c.fill();      // 몸
  c.beginPath(); c.arc(0, -h * .52, w * .58, 0, TAU); c.fill();   // 머리
  c.globalAlpha = 1;
}
function drawEntsBefore() {
  for (const e of G.ents) {
    if (e.alpha < .02) continue;
    const [sx, sy] = toS(e.x, e.y);
    if (sx < -90 || sy < -90 || sx > W + 90 || sy > H + 90) continue;

    if (e.k === 'watcher') {
      wctx.save(); wctx.translate(sx, sy);
      figure(wctx, 20, 8.5, e.alpha * .95, '#05070a');
      /* 아주 희미한 윤곽 */
      wctx.globalAlpha = e.alpha * .30;
      wctx.strokeStyle = 'rgba(190,205,220,.55)'; wctx.lineWidth = 1;
      wctx.beginPath(); wctx.ellipse(0, 0, 8.5, 20, 0, 0, TAU); wctx.stroke();
      wctx.globalAlpha = 1;
      wctx.restore();
    }
    if (e.k === 'crawler') {
      wctx.save(); wctx.translate(sx, sy); wctx.rotate(e.a);
      wctx.globalAlpha = e.alpha * .9;
      wctx.fillStyle = '#04060a';
      wctx.beginPath(); wctx.ellipse(0, 0, 24, 8, 0, 0, TAU); wctx.fill();
      wctx.beginPath(); wctx.arc(20, 0, 6, 0, TAU); wctx.fill();
      wctx.globalAlpha = 1;
      wctx.restore();
    }
  }
  /* 벽의 얼굴 */
  if (G.face) {
    const f = G.face;
    const a = Math.sin((f.t / f.dur) * Math.PI) * .5;
    const [sx, sy] = toS(f.x, f.y);
    wctx.save(); wctx.translate(sx, sy); wctx.globalAlpha = a;
    wctx.fillStyle = 'rgba(215,220,225,.20)';
    wctx.beginPath(); wctx.ellipse(0, 0, 12, 16, 0, 0, TAU); wctx.fill();
    wctx.fillStyle = 'rgba(0,0,0,.75)';
    wctx.beginPath(); wctx.ellipse(-4.5, -3, 2.4, 3.4, 0, 0, TAU); wctx.fill();
    wctx.beginPath(); wctx.ellipse(4.5, -3, 2.4, 3.4, 0, 0, TAU); wctx.fill();
    wctx.beginPath(); wctx.ellipse(0, 7, 3.4, 2.0, 0, 0, TAU); wctx.fill();
    wctx.globalAlpha = 1; wctx.restore();
  }
}
/* 어둠 위에 그리는 것들 — 어둠 속에서도 보인다 */
function drawEntsAfter() {
  for (const e of G.ents) {
    const [sx, sy] = toS(e.x, e.y);

    if (e.k === 'follower' && e.alpha > .02) {
      if (sx < -90 || sy < -90 || sx > W + 90 || sy > H + 90) continue;
      wctx.save(); wctx.translate(sx, sy);
      wctx.globalAlpha = e.alpha * .55;
      const g = wctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      g.addColorStop(0, 'rgba(6,8,12,.95)');
      g.addColorStop(1, 'rgba(6,8,12,0)');
      wctx.fillStyle = g;
      wctx.beginPath(); wctx.arc(0, 0, 30, 0, TAU); wctx.fill();
      figure(wctx, 21, 9, e.alpha * .5, '#02040a');
      wctx.globalAlpha = e.alpha * .55;
      wctx.fillStyle = 'rgba(226,236,255,.75)';
      wctx.beginPath(); wctx.arc(-3, -11, 1.5, 0, TAU); wctx.arc(3, -11, 1.5, 0, TAU); wctx.fill();
      wctx.globalAlpha = 1; wctx.restore();
    }

    if (e.k === 'eyes' && e.alpha > .02) {
      if (sx < -60 || sy < -60 || sx > W + 60 || sy > H + 60) continue;
      wctx.save(); wctx.translate(sx, sy); wctx.rotate(e.a);
      wctx.globalAlpha = e.alpha;
      const g = wctx.createRadialGradient(0, 0, 0, 0, 0, 16);
      g.addColorStop(0, 'rgba(255,230,180,.30)');
      g.addColorStop(1, 'rgba(255,230,180,0)');
      wctx.fillStyle = g; wctx.beginPath(); wctx.arc(0, 0, 16, 0, TAU); wctx.fill();
      wctx.fillStyle = 'rgba(255,242,214,.92)';
      wctx.beginPath(); wctx.ellipse(0, -4, 1.7, 1.2, 0, 0, TAU); wctx.fill();
      wctx.beginPath(); wctx.ellipse(0, 4, 1.7, 1.2, 0, 0, TAU); wctx.fill();
      wctx.globalAlpha = 1; wctx.restore();
    }

    if (e.k === 'shadow' && e.state === 1) {
      const t = e.life / 2.1;
      const x = e.sx > 0 ? -260 + t * (W + 520) : W + 260 - t * (W + 520);
      const y = H * e.sy + Math.sin(t * 6) * 24;
      wctx.save();
      wctx.globalAlpha = Math.sin(t * Math.PI) * .55;
      const g = wctx.createRadialGradient(x, y, 0, x, y, 220);
      g.addColorStop(0, 'rgba(0,0,0,.95)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      wctx.fillStyle = g;
      wctx.beginPath(); wctx.ellipse(x, y, 220, 150, 0, 0, TAU); wctx.fill();
      wctx.globalAlpha = 1; wctx.restore();
    }
  }
}

/* 플레이어 ─────────────────────────────────────────────────── */
function drawPlayer() {
  const [sx, sy] = toS(G.p.x, G.p.y);
  const bob = Math.sin(G.p.walk * .22) * 1.4;
  wctx.save(); wctx.translate(sx, sy + bob);
  /* 손에 든 빛 */
  const g = wctx.createRadialGradient(0, 0, 0, 0, 0, 34);
  g.addColorStop(0, 'rgba(255,236,200,.16)');
  g.addColorStop(1, 'rgba(255,236,200,0)');
  wctx.fillStyle = g; wctx.beginPath(); wctx.arc(0, 0, 34, 0, TAU); wctx.fill();
  /* 그림자 · 몸 */
  wctx.fillStyle = 'rgba(0,0,0,.5)';
  wctx.beginPath(); wctx.ellipse(0, 4, 11, 7, 0, 0, TAU); wctx.fill();
  wctx.rotate(G.p.ang);
  wctx.fillStyle = '#14171c';
  wctx.beginPath(); wctx.ellipse(0, 0, 9.5, 7.5, 0, 0, TAU); wctx.fill();
  wctx.fillStyle = '#1d2228';
  wctx.beginPath(); wctx.arc(1.5, 0, 5.4, 0, TAU); wctx.fill();
  wctx.fillStyle = 'rgba(255,240,210,.5)';
  wctx.beginPath(); wctx.arc(7, 0, 1.8, 0, TAU); wctx.fill();
  wctx.restore();
}

/* 안개 ─────────────────────────────────────────────────────── */
function initFog() {
  const f = G.scene.fog;
  G.fog = [];
  for (let i = 0; i < f.n; i++) {
    G.fog.push({
      x: Math.random() * GW * T, y: Math.random() * GH * T,
      r: f.size[0] + Math.random() * (f.size[1] - f.size[0]),
      a: .4 + Math.random() * .6,
      vx: (Math.random() - .5) * f.spd * 60,
      vy: (Math.random() - .5) * f.spd * 60,
    });
  }
}
function drawFog(dt) {
  const f = G.scene.fog;
  for (const p of G.fog) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < -200) p.x = GW * T + 200; if (p.x > GW * T + 200) p.x = -200;
    if (p.y < -200) p.y = GH * T + 200; if (p.y > GH * T + 200) p.y = -200;
    const sx = p.x - G.cam.x, sy = p.y - G.cam.y;
    if (sx < -p.r || sy < -p.r || sx > W + p.r || sy > H + p.r) continue;
    const g = wctx.createRadialGradient(sx, sy, 0, sx, sy, p.r);
    g.addColorStop(0, 'rgba(' + f.c + ',' + (f.a * p.a).toFixed(4) + ')');
    g.addColorStop(1, 'rgba(' + f.c + ',0)');
    wctx.fillStyle = g;
    wctx.beginPath(); wctx.arc(sx, sy, p.r, 0, TAU); wctx.fill();
  }
}

/* 어둠 + 빛 ───────────────────────────────────────────────── */
function drawDark() {
  const s = G.scene;
  const dk = clamp(s.dark + (G.loop - 1) * .006, 0, .995);
  dctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  dctx.clearRect(0, 0, W, H);
  dctx.fillStyle = 'rgba(0,0,0,' + dk + ')';
  dctx.fillRect(0, 0, W, H);

  /* 시야 폴리곤으로 잘라낸 안에서만 빛이 통한다 */
  dctx.save();
  dctx.beginPath();
  dctx.moveTo(G.vis[0] - G.cam.x, G.vis[1] - G.cam.y);
  for (let i = 2; i < G.vis.length; i += 2)
    dctx.lineTo(G.vis[i] - G.cam.x, G.vis[i + 1] - G.cam.y);
  dctx.closePath();
  dctx.clip();

  dctx.globalCompositeOperation = 'destination-out';
  const [px, py] = toS(G.p.x, G.p.y);

  /* 주변 빛 */
  const flick = 1 - Math.abs(Math.sin(G.t * 3.1)) * .04;
  const ar = s.lightR * flick * (1 - G.distort * .22);
  let g = dctx.createRadialGradient(px, py, 0, px, py, ar);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(.45, 'rgba(0,0,0,.62)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  dctx.fillStyle = g;
  dctx.beginPath(); dctx.arc(px, py, ar, 0, TAU); dctx.fill();

  /* 포인터 쪽으로 뻗는 빛 */
  const len = s.cone * (1 - G.distort * .3);
  const sp = s.spread;
  g = dctx.createRadialGradient(px, py, 0, px, py, len);
  g.addColorStop(0, 'rgba(0,0,0,.95)');
  g.addColorStop(.5, 'rgba(0,0,0,.72)');
  g.addColorStop(.82, 'rgba(0,0,0,.28)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  dctx.fillStyle = g;
  dctx.beginPath(); dctx.moveTo(px, py);
  dctx.arc(px, py, len, G.p.ang - sp, G.p.ang + sp);
  dctx.closePath(); dctx.fill();

  /* 천장 조명 */
  for (const L of G.map.lamps) {
    const sx = L.x - G.cam.x, sy = L.y - G.cam.y;
    if (sx < -220 || sy < -220 || sx > W + 220 || sy > H + 220) continue;
    let a = L.dead ? 0 : 1;
    if (!L.dead && s.lamps.flicker > 0) {
      const n = Math.sin(G.t * 7.3 + L.ph) * Math.sin(G.t * 2.1 + L.ph * 2.3);
      a = n > -s.lamps.flicker ? 1 : (Math.random() < .5 ? .12 : .6);
    }
    if (a <= 0) continue;
    const r = s.lamps.r;
    const lg = dctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    lg.addColorStop(0, 'rgba(0,0,0,' + (.88 * a) + ')');
    lg.addColorStop(.55, 'rgba(0,0,0,' + (.42 * a) + ')');
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    dctx.fillStyle = lg;
    dctx.beginPath(); dctx.arc(sx, sy, r, 0, TAU); dctx.fill();
  }
  dctx.globalCompositeOperation = 'source-over';
  dctx.restore();

  wctx.save(); wctx.setTransform(1, 0, 0, 1, 0, 0);
  wctx.drawImage(dcan, 0, 0);
  wctx.restore();

  /* 조명 자체의 빛무리 — 어둠 위에 살짝 얹는다 */
  if (G.scene.lamps) {
    for (const L of G.map.lamps) {
      if (L.dead) continue;
      const sx = L.x - G.cam.x, sy = L.y - G.cam.y;
      if (sx < -80 || sy < -80 || sx > W + 80 || sy > H + 80) continue;
      const n = Math.sin(G.t * 7.3 + L.ph) * Math.sin(G.t * 2.1 + L.ph * 2.3);
      const a = n > -G.scene.lamps.flicker ? .16 : .03;
      const lg = wctx.createRadialGradient(sx, sy, 0, sx, sy, 44);
      lg.addColorStop(0, 'rgba(' + G.scene.lamps.c + ',' + a + ')');
      lg.addColorStop(1, 'rgba(' + G.scene.lamps.c + ',0)');
      wctx.fillStyle = lg;
      wctx.beginPath(); wctx.arc(sx, sy, 44, 0, TAU); wctx.fill();
    }
  }
}

/* 화면 효과 ───────────────────────────────────────────────── */
let grainI = 0;
function drawFX(dt) {
  fctx.clearRect(0, 0, W, H);

  /* 글리치 — 세계 화면의 가로 띠를 어긋나게 겹친다 */
  if (G.glitch > .02) {
    const n = 3 + (G.glitch * 6 | 0);
    fctx.globalAlpha = .55 * G.glitch;
    for (let i = 0; i < n; i++) {
      const y = Math.random() * H;
      const h = 6 + Math.random() * 26;
      const dx = (Math.random() - .5) * 40 * G.glitch;
      fctx.drawImage(world,
        0, y * DPR, world.width, h * DPR,
        dx, y, W, h);
    }
    fctx.globalAlpha = 1;
    G.glitch = Math.max(0, G.glitch - dt * 1.5);
  }

  /* 비네트 */
  const vg = .55 + G.distort * .34 + Math.sin(G.t * .8) * .02;
  const r0 = Math.min(W, H) * (.28 - G.distort * .10);
  const r1 = Math.hypot(W, H) * .62;
  const g = fctx.createRadialGradient(W / 2, H / 2, r0, W / 2, H / 2, r1);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,' + clamp(vg, 0, .96) + ')');
  fctx.fillStyle = g; fctx.fillRect(0, 0, W, H);

  /* 그레인 */
  grainI = (grainI + 1) % grain.length;
  const gt = grain[grainI];
  fctx.globalAlpha = .055 + G.distort * .07;
  const ox = -Math.random() * 160, oy = -Math.random() * 160;
  for (let y = oy; y < H; y += 160)
    for (let x = ox; x < W; x += 160) fctx.drawImage(gt, x, y);
  fctx.globalAlpha = 1;

  /* 포인터 표시 — 작은 고리 */
  if (G.ptr.has) {
    fctx.strokeStyle = 'rgba(240,240,235,.30)';
    fctx.lineWidth = 1;
    fctx.beginPath(); fctx.arc(G.ptr.x, G.ptr.y, 7 + Math.sin(G.t * 3) * 1.2, 0, TAU); fctx.stroke();
    fctx.fillStyle = 'rgba(240,240,235,.5)';
    fctx.beginPath(); fctx.arc(G.ptr.x, G.ptr.y, 1.3, 0, TAU); fctx.fill();
  }

  /* 눈 감기듯 닫히는 전환 */
  if (G.blink > 0) {
    const h = H * .52 * G.blink;
    fctx.fillStyle = '#000';
    fctx.fillRect(0, 0, W, h);
    fctx.fillRect(0, H - h, W, h);
  }
  /* 섬광 */
  if (G.flash > .01) {
    fctx.fillStyle = 'rgba(255,255,255,' + (G.flash * .16).toFixed(3) + ')';
    fctx.fillRect(0, 0, W, H);
    G.flash -= dt * 2.2;
  }
}

/* ═══════════════════════════════════════════════════════════════
   장면 전환
   ═══════════════════════════════════════════════════════════════ */
function loadScene(i) {
  G.sceneIdx = i;
  G.scene = SCENES[i];
  G.map = buildMap(G.scene, G.scene.seed + G.loop * 7919);
  G.p.x = G.map.spawn.x; G.p.y = G.map.spawn.y;
  G.p.vx = G.p.vy = 0; G.p.slow = 0;
  G.cam.x = G.p.x - W / 2; G.cam.y = G.p.y - H / 2;
  G.ents = [];
  for (const [k, n] of G.scene.ents) {
    if (k === 'face') continue;
    const cnt = n + (G.loop - 1);
    for (let j = 0; j < cnt; j++) G.ents.push(makeEnt(k));
  }
  G.face = null; G.faceT = 6 + Math.random() * 8;
  initFog();
  Snd.setScene(G.scene, G.loop);
  updateHud();
}
function updateHud() {
  hud.innerHTML = '';
  for (let i = 0; i < SCENES.length; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i === G.sceneIdx ? ' on' : i < G.sceneIdx ? ' past' : '');
    hud.appendChild(d);
  }
}
function nextScene() {
  G.phase = 'out';
  G.blink = 0;
  Snd.door();
}

/* ═══════════════════════════════════════════════════════════════
   루프
   ═══════════════════════════════════════════════════════════════ */
let last = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  if (!G.running) return;
  const dt = Math.min(.05, (ts - last) / 1000 || .016);
  last = ts;
  G.t += dt;

  /* 전환 처리 */
  if (G.phase === 'out') {
    G.blink = Math.min(1, G.blink + dt * 1.15);
    if (G.blink >= 1) {
      let n = G.sceneIdx + 1;
      if (n >= SCENES.length) { n = 0; G.loop++; }
      loadScene(n);
      G.phase = 'in';
      G.flash = .5;
    }
  } else if (G.phase === 'in') {
    G.blink = Math.max(0, G.blink - dt * .8);
    if (G.blink <= 0) G.phase = 'play';
  }

  if (G.phase !== 'out') moveP(dt);
  updateEnts(dt);

  /* 출구 도달 */
  if (G.phase === 'play') {
    const d = Math.hypot(G.p.x - G.map.exit.x, G.p.y - G.map.exit.y);
    if (d < 34) nextScene();
  }

  /* 심장 소리 — 흐트러졌을 때만 */
  if (G.distort > .25) {
    G.beat -= dt;
    if (G.beat <= 0) { Snd.thump(); setTimeout(() => Snd.thump(), 210); G.beat = .95; }
  }
  G.distort = Math.max(0, G.distort - dt * .38);
  G.shake = Math.max(0, G.shake - dt * 26);

  /* 주변 소리 */
  const s = G.scene.snd;
  G.nextDrip -= dt;   if (G.nextDrip   <= 0) { Snd.drip();    G.nextDrip   = s.drip   * (.5 + Math.random()); }
  G.nextCreak -= dt;  if (G.nextCreak  <= 0) { Snd.creak();   G.nextCreak  = s.creak  * (.5 + Math.random()); }
  G.nextWhisper -= dt;if (G.nextWhisper<= 0) { if (Math.random() < .5) Snd.whisper(); G.nextWhisper = 14 * (.5 + Math.random()); }

  /* 카메라 */
  const lead = 46;
  const tx = G.p.x + Math.cos(G.p.ang) * lead - W / 2;
  const ty = G.p.y + Math.sin(G.p.ang) * lead - H / 2;
  G.cam.x = lerp(G.cam.x, tx, clamp(dt * 3.4, 0, 1));
  G.cam.y = lerp(G.cam.y, ty, clamp(dt * 3.4, 0, 1));
  G.cam.x = clamp(G.cam.x, 0, Math.max(0, GW * T - W));
  G.cam.y = clamp(G.cam.y, 0, Math.max(0, GH * T - H));

  buildVis();

  /* 렌더 */
  const shk = G.shake;
  wctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  wctx.fillStyle = '#000'; wctx.fillRect(0, 0, W, H);
  if (shk > .1) {
    wctx.translate((Math.random() - .5) * shk, (Math.random() - .5) * shk);
  }
  drawFloor();
  drawProps();
  drawExit();
  drawEntsBefore();
  drawFog(dt);
  drawPlayer();
  drawDark();
  drawEntsAfter();
  wctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  drawFX(dt);
}

/* ═══════════════════════════════════════════════════════════════
   입력
   ═══════════════════════════════════════════════════════════════ */
function setPtr(x, y) { G.ptr.x = x; G.ptr.y = y; G.ptr.has = true; }
window.addEventListener('mousemove', e => setPtr(e.clientX, e.clientY));
window.addEventListener('touchstart', e => {
  if (e.touches[0]) setPtr(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });
window.addEventListener('touchmove', e => {
  if (e.touches[0]) setPtr(e.touches[0].clientX, e.touches[0].clientY);
  e.preventDefault();
}, { passive: false });
window.addEventListener('touchend', () => { G.ptr.has = false; });
window.addEventListener('mouseleave', () => { G.ptr.has = false; });
window.addEventListener('blur', () => { G.ptr.has = false; });

muteB.addEventListener('click', e => {
  e.stopPropagation();
  Snd.muted = !Snd.muted;
  if (Snd.ready) Snd.master.gain.value = Snd.muted ? 0 : .9;
  document.getElementById('wave1').style.display = Snd.muted ? 'none' : '';
  document.getElementById('wave2').style.display = Snd.muted ? 'none' : '';
  document.getElementById('slash').style.display = Snd.muted ? '' : 'none';
});

function start() {
  if (G.running) return;
  Snd.init(); Snd.resume();
  resize();
  loadScene(0);
  G.running = true;
  G.phase = 'in'; G.blink = 1;
  gate.classList.add('off');
  hud.classList.add('on');
  muteB.classList.add('on');
  stage.classList.add('playing');
  last = performance.now();
}
gate.addEventListener('click', start);
gate.addEventListener('touchstart', e => { e.preventDefault(); start(); }, { passive: false });

resize();
requestAnimationFrame(frame);
