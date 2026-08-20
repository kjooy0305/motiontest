/* ═══════════════════════════════════════════════════════════════
   world.js — 땅, 먹이, 재해
   지형은 한쪽에서 일방적으로 때린다. 늪은 발을 붙잡고, 열지대는
   태우고, 서리밭은 기운을 앗아간다. 개체들은 그걸 겪고서야 배운다.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const TER = { PLAIN: 0, FOREST: 1, WATER: 2, ROCK: 3, MARSH: 4, SCALD: 5, COLD: 6, BLOOM: 7 };

/* 지형별 성질
   pass  : 지나갈 수 있는가
   slow  : 이동 속도 배율
   dmg   : 매 초 깎이는 체력
   drain : 매 초 깎이는 기운
   grow  : 먹이가 자라는 속도
   cap   : 먹이가 쌓일 수 있는 최대치
   cover : 몸을 숨길 수 있는 정도(함정이 잘 숨는다)                */
const TERINFO = [
  { id: 0, key: 'plain',  name: '초원',   pass: 1, slow: 1.00, dmg: 0,    drain: 0,    grow: .020, cap: .55, cover: .10, c: [58, 74, 52] },
  { id: 1, key: 'forest', name: '숲',     pass: 1, slow: 0.78, dmg: 0,    drain: 0,    grow: .034, cap: 1.00, cover: .70, c: [32, 62, 44] },
  { id: 2, key: 'water',  name: '물',     pass: 0, slow: 0.30, dmg: 0,    drain: 0,    grow: 0,    cap: 0,    cover: 0,   c: [28, 52, 84] },
  { id: 3, key: 'rock',   name: '바위',   pass: 0, slow: 0.40, dmg: 0,    drain: 0,    grow: 0,    cap: 0,    cover: .20, c: [70, 70, 76] },
  { id: 4, key: 'marsh',  name: '늪',     pass: 1, slow: 0.42, dmg: 1.6,  drain: .55,  grow: .014, cap: .40, cover: .55, c: [56, 62, 44] },
  { id: 5, key: 'scald',  name: '열지대', pass: 1, slow: 0.90, dmg: 5.2,  drain: 1.10, grow: .002, cap: .10, cover: .05, c: [104, 50, 38] },
  { id: 6, key: 'cold',   name: '서리밭', pass: 1, slow: 0.72, dmg: 0.7,  drain: 2.10, grow: .006, cap: .22, cover: .15, c: [96, 110, 126] },
  { id: 7, key: 'bloom',  name: '비옥지', pass: 1, slow: 1.02, dmg: 0,    drain: 0,    grow: .070, cap: 1.40, cover: .30, c: [76, 106, 50] },
];

/* ── 난수 · 잡음 ──────────────────────────────────────────── */
function rng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeNoise(seed) {
  const N = 256, tbl = new Float32Array(N * N), r = rng(seed);
  for (let i = 0; i < tbl.length; i++) tbl[i] = r();
  const sm = t => t * t * (3 - 2 * t);
  return function (x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = sm(x - xi), yf = sm(y - yi);
    const i = xi & 255, j = yi & 255, i2 = (i + 1) & 255, j2 = (j + 1) & 255;
    const a = tbl[j * N + i], b = tbl[j * N + i2];
    const c = tbl[j2 * N + i], d = tbl[j2 * N + i2];
    return (a + (b - a) * xf) + ((c + (d - c) * xf) - (a + (b - a) * xf)) * yf;
  };
}
function fbm(nz, x, y, oct = 4, lac = 2, gain = .5) {
  let s = 0, amp = 1, f = 1, norm = 0;
  for (let i = 0; i < oct; i++) { s += nz(x * f, y * f) * amp; norm += amp; amp *= gain; f *= lac; }
  return s / norm;
}

/* ═══════════════════════════════════════════════════════════════
   세계
   ═══════════════════════════════════════════════════════════════ */
const World = {
  WW: 1800, WH: 1150,     // 세계 크기(논리 px)
  CS: 10,                 // 지형 한 칸
  gw: 0, gh: 0,
  ter: null,              // Uint8Array — 지형
  food: null,             // Float32Array — 먹이량
  dread: null,            // Float32Array — 무서운 곳의 기억(죽음이 일어난 자리)
  seed: 1,
  rand: null,
  dirty: true,            // 지형이 바뀌면 다시 그려야 한다
  hazards: [],            // 진행 중인 재해

  init(seed) {
    this.seed = seed >>> 0 || 1;
    this.rand = rng(this.seed);
    this.gw = Math.ceil(this.WW / this.CS);
    this.gh = Math.ceil(this.WH / this.CS);
    const n = this.gw * this.gh;
    this.ter = new Uint8Array(n);
    this.food = new Float32Array(n);
    this.dread = new Float32Array(n);
    this.hazards = [];
    this.generate();
    this.dirty = true;
  },

  idx(gx, gy) { return gy * this.gw + gx; },
  inBounds(gx, gy) { return gx >= 0 && gy >= 0 && gx < this.gw && gy < this.gh; },
  gxOf(x) { return Math.floor(x / this.CS); },
  terAt(x, y) {
    const gx = this.gxOf(x), gy = this.gxOf(y);
    if (!this.inBounds(gx, gy)) return TER.ROCK;
    return this.ter[gy * this.gw + gx];
  },
  infoAt(x, y) { return TERINFO[this.terAt(x, y)]; },
  passableAt(x, y) {
    if (x < 4 || y < 4 || x > this.WW - 4 || y > this.WH - 4) return false;
    return TERINFO[this.terAt(x, y)].pass === 1;
  },

  generate() {
    const nz1 = makeNoise(this.seed);
    const nz2 = makeNoise(this.seed ^ 0x9e37);
    const nz3 = makeNoise(this.seed ^ 0x51ed);
    const { gw, gh, ter, food } = this;

    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const u = x / gw, v = y / gh;
        const h = fbm(nz1, u * 5.5, v * 3.6, 5);          // 높낮이
        const w = fbm(nz2, u * 4.2 + 11, v * 2.8 + 7, 4); // 물기
        const t = fbm(nz3, u * 3.1 + 31, v * 2.2 + 3, 3); // 더위

        /* 가장자리는 조금 낮춰 세계가 섬처럼 닫히게 */
        const edge = Math.min(u, v, 1 - u, 1 - v);
        const hh = h - Math.max(0, .16 - edge) * 1.4;

        let k;
        if (hh < .30) k = TER.WATER;
        else if (hh > .745) k = TER.ROCK;
        else if (w > .66 && hh < .40) k = TER.MARSH;
        else if (t > .70 && w < .40) k = TER.SCALD;
        else if (t < .285 && hh > .52) k = TER.COLD;
        else if (w > .60) k = TER.FOREST;
        else if (w > .50 && h > .45) k = TER.BLOOM;
        else k = TER.PLAIN;

        const i = y * gw + x;
        ter[i] = k;
        food[i] = TERINFO[k].cap * (.35 + this.rand() * .5);
      }
    }
    this.smooth();
  },

  /* 홀로 떨어진 칸을 주변에 맞춰 다듬는다 — 지형이 얼룩덜룩하지 않게 */
  smooth() {
    const { gw, gh, ter } = this;
    const out = ter.slice();
    for (let y = 1; y < gh - 1; y++) {
      for (let x = 1; x < gw - 1; x++) {
        const cnt = {};
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const k = ter[(y + dy) * gw + (x + dx)];
            cnt[k] = (cnt[k] || 0) + 1;
          }
        let best = -1, bn = 0;
        for (const k in cnt) if (cnt[k] > bn) { bn = cnt[k]; best = +k; }
        if (bn >= 6) out[y * gw + x] = best;
      }
    }
    this.ter.set(out);
  },

  /* 지형 칠하기(개입) */
  paint(x, y, kind, radius) {
    const gx = this.gxOf(x), gy = this.gxOf(y);
    const r = Math.max(1, Math.round(radius / this.CS));
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const nx = gx + dx, ny = gy + dy;
        if (!this.inBounds(nx, ny)) continue;
        const i = ny * this.gw + nx;
        this.ter[i] = kind;
        this.food[i] = Math.min(this.food[i], TERINFO[kind].cap);
      }
    }
    this.dirty = true;
  },

  /* 먹이 뿌리기(개입) */
  scatter(x, y, radius, amount) {
    const gx = this.gxOf(x), gy = this.gxOf(y);
    const r = Math.max(1, Math.round(radius / this.CS));
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const d2 = dx * dx + dy * dy;
        if (d2 > r * r) continue;
        const nx = gx + dx, ny = gy + dy;
        if (!this.inBounds(nx, ny)) continue;
        const i = ny * this.gw + nx;
        if (!TERINFO[this.ter[i]].pass) continue;
        this.food[i] = Math.min(2.2, this.food[i] + amount * (1 - Math.sqrt(d2) / (r + .5)));
      }
    }
  },

  /* 먹이 찾기 — 반경 안에서 가장 먹을 게 많은 칸 */
  bestFood(x, y, radius, avoidDread) {
    const gx = this.gxOf(x), gy = this.gxOf(y);
    const r = Math.max(1, Math.round(radius / this.CS));
    let bi = -1, bs = .06, bx = 0, by = 0;
    for (let dy = -r; dy <= r; dy += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        const nx = gx + dx, ny = gy + dy;
        if (!this.inBounds(nx, ny)) continue;
        const i = ny * this.gw + nx;
        if (!TERINFO[this.ter[i]].pass) continue;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        let s = this.food[i] / (1 + dist * .10);
        if (avoidDread) s -= this.dread[i] * .55;
        if (s > bs) { bs = s; bi = i; bx = nx; by = ny; }
      }
    }
    if (bi < 0) return null;
    return { i: bi, x: (bx + .5) * this.CS, y: (by + .5) * this.CS, amount: this.food[bi] };
  },

  eat(i, amount) {
    const got = Math.min(this.food[i], amount);
    this.food[i] -= got;
    return got;
  },

  markDread(x, y, amount) {
    const gx = this.gxOf(x), gy = this.gxOf(y);
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        if (!this.inBounds(gx + dx, gy + dy)) continue;
        const f = 1 - (Math.abs(dx) + Math.abs(dy)) / 5;
        this.dread[(gy + dy) * this.gw + gx + dx] += amount * f;
      }
  },
  dreadAt(x, y) {
    const gx = this.gxOf(x), gy = this.gxOf(y);
    if (!this.inBounds(gx, gy)) return 0;
    return this.dread[gy * this.gw + gx];
  },

  /* ── 매 틱 ──────────────────────────────────────────────── */
  step(dt, cfg) {
    const { gw, gh, ter, food, dread } = this;
    const n = gw * gh;

    /* 먹이가 자라고, 무서움은 옅어진다 — 한 번에 조금씩 나눠 훑는다 */
    const chunk = Math.ceil(n / 12);
    const s = (this._cur = ((this._cur || 0) + chunk) % n);
    for (let c = 0; c < chunk; c++) {
      const i = (s + c) % n;
      const inf = TERINFO[ter[i]];
      if (inf.grow > 0) {
        const cap = inf.cap * cfg.plenty;
        if (food[i] < cap) food[i] = Math.min(cap, food[i] + inf.grow * dt * 12 * cfg.plenty);
      }
      if (dread[i] > 0) dread[i] = Math.max(0, dread[i] - dt * .06);
    }

    /* 재해 — 땅이 먼저 때린다 */
    for (let k = this.hazards.length - 1; k >= 0; k--) {
      const h = this.hazards[k];
      h.t += dt;
      h.r = h.r0 * Math.min(1, h.t / h.grow);
      if (h.t > h.life) {
        if (h.onEnd) h.onEnd();
        this.hazards.splice(k, 1);
      }
    }
    if (cfg.disaster > 0 && Math.random() < cfg.disaster * dt * .05) this.randomHazard();
  },

  randomHazard() {
    const kinds = ['fire', 'flood', 'quake'];
    const kind = kinds[(Math.random() * kinds.length) | 0];
    let x = 0, y = 0, tries = 0;
    do {
      x = Math.random() * this.WW; y = Math.random() * this.WH; tries++;
    } while (tries < 30 && !this.passableAt(x, y));
    this.addHazard(kind, x, y);
    return { kind, x, y };
  },

  addHazard(kind, x, y, scale = 1) {
    const spec = {
      fire:  { r0: 130 * scale, grow: 3.5, life: 13, dmg: 26, name: '들불' },
      flood: { r0: 175 * scale, grow: 2.2, life: 10, dmg: 15, name: '범람' },
      quake: { r0: 220 * scale, grow: 0.8, life: 4.5, dmg: 20, name: '땅울림' },
      meteor:{ r0: 150 * scale, grow: 0.4, life: 3.5, dmg: 60, name: '떨어진 것' },
    }[kind] || { r0: 120, grow: 2, life: 8, dmg: 20, name: '재해' };
    const h = { kind, x, y, t: 0, r: 0, ...spec };
    this.hazards.push(h);

    /* 들불은 지나간 자리를 태워 놓는다 */
    if (kind === 'fire') h.onEnd = () => this.paint(x, y, TER.SCALD, h.r0 * .45);
    return h;
  },

  hazardDamageAt(x, y) {
    let d = 0;
    for (const h of this.hazards) {
      const dx = x - h.x, dy = y - h.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < h.r) d += h.dmg * (1 - dist / (h.r + 1));
    }
    return d;
  },

  /* 지나갈 수 있는 아무 자리 */
  randomOpen(rand) {
    const R = rand || Math.random;
    for (let i = 0; i < 400; i++) {
      const x = R() * this.WW, y = R() * this.WH;
      if (this.passableAt(x, y)) {
        const inf = this.infoAt(x, y);
        if (inf.dmg < 1) return { x, y };
      }
    }
    return { x: this.WW / 2, y: this.WH / 2 };
  },
};
