/* ═══════════════════════════════════════════════════════════════
   app.js — 보여 주기, 손대기, 흘려보내기
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);

let VW = 0, VH = 0, DPR = 1;

/* ── 세상 손잡이 ──────────────────────────────────────────── */
const cfg = {
  speed: 1,
  birth: 1, aggression: 1, trapRate: 1, plenty: 1,
  ageRate: 1, mutation: .06, disaster: .6,
  maxPop: 320, revive: true,
};
const DIALS = [
  { k: 'birth',      label: '출생',  min: 0,  max: 2,   step: .05 },
  { k: 'aggression', label: '사나움', min: 0,  max: 2,   step: .05 },
  { k: 'trapRate',   label: '함정',  min: 0,  max: 2,   step: .05 },
  { k: 'plenty',     label: '먹이',  min: .2, max: 2.2, step: .05 },
  { k: 'ageRate',    label: '세월',  min: .2, max: 3,   step: .05 },
  { k: 'mutation',   label: '변이',  min: 0,  max: .5,  step: .01 },
  { k: 'disaster',   label: '재해',  min: 0,  max: 3,   step: .05 },
  { k: 'maxPop',     label: '상한',  min: 40, max: 600, step: 10 },
];

const eyes = { zone: true, bond: false, trap: true, dread: false, name: false, food: true };

/* ── 시점 ─────────────────────────────────────────────────── */
const cam = {
  x: World.WW / 2, y: World.WH / 2,
  tx: World.WW / 2, ty: World.WH / 2,
  zoom: 1, tzoom: 1,
  follow: null, auto: true, idleFor: 0, nextPick: 6,
};
let fit = 1;
function scale() { return fit * cam.zoom; }

/* ── 상태 ─────────────────────────────────────────────────── */
let tool = 'look';
let terKind = TER.FOREST;
let selected = null;
let paused = false;
let frame = 0;
let dragging = false, panning = false, lastPX = 0, lastPY = 0;

/* ═══════════════════════════════════════════════════════════════
   화면 크기 · 밑그림
   ═══════════════════════════════════════════════════════════════ */
const terCan = document.createElement('canvas');
const terCtx = terCan.getContext('2d');
const foodCan = document.createElement('canvas');
const foodCtx = foodCan.getContext('2d');

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  VW = window.innerWidth; VH = window.innerHeight;
  cv.width = Math.floor(VW * DPR); cv.height = Math.floor(VH * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  fit = Math.max(VW / World.WW, VH / World.WH);
}
window.addEventListener('resize', resize);

/* 지형은 바뀔 때만 다시 그린다 */
function drawTerrain() {
  const { gw, gh, CS, ter } = World;
  terCan.width = World.WW; terCan.height = World.WH;
  const img = terCtx.createImageData(gw, gh);
  const d = img.data;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x;
      const c = TERINFO[ter[i]].c;
      /* 칸마다 조금씩 다른 결 */
      const n = ((Math.imul(x * 374761393 + y * 668265263, 1274126177) >>> 20) & 255) / 255;
      const k = .86 + n * .28;
      const o = i * 4;
      d[o] = Math.min(255, c[0] * k);
      d[o + 1] = Math.min(255, c[1] * k);
      d[o + 2] = Math.min(255, c[2] * k);
      d[o + 3] = 255;
    }
  }
  /* 작은 이미지를 늘려 그려서 부드러운 덩어리로 */
  const tmp = document.createElement('canvas');
  tmp.width = gw; tmp.height = gh;
  tmp.getContext('2d').putImageData(img, 0, 0);
  terCtx.imageSmoothingEnabled = true;
  terCtx.clearRect(0, 0, World.WW, World.WH);
  terCtx.drawImage(tmp, 0, 0, World.WW, World.WH);

  /* 물가와 바위 언저리에 옅은 테두리 */
  terCtx.globalAlpha = .30;
  terCtx.strokeStyle = 'rgba(0,0,0,.55)';
  terCtx.lineWidth = 1.5;
  terCtx.beginPath();
  for (let y = 1; y < gh; y++) {
    for (let x = 1; x < gw; x++) {
      const a = ter[y * gw + x], b = ter[y * gw + x - 1], c = ter[(y - 1) * gw + x];
      const solid = k => k === TER.WATER || k === TER.ROCK;
      if (solid(a) !== solid(b)) { terCtx.moveTo(x * CS, y * CS); terCtx.lineTo(x * CS, (y + 1) * CS); }
      if (solid(a) !== solid(c)) { terCtx.moveTo(x * CS, y * CS); terCtx.lineTo((x + 1) * CS, y * CS); }
    }
  }
  terCtx.stroke();
  terCtx.globalAlpha = 1;
  World.dirty = false;
}

/* 먹이는 가끔 다시 그린다 */
function drawFood() {
  const { gw, gh, CS, food, ter } = World;
  foodCan.width = World.WW; foodCan.height = World.WH;
  foodCtx.clearRect(0, 0, World.WW, World.WH);
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x;
      const f = food[i];
      if (f < .16 || !TERINFO[ter[i]].pass) continue;
      const a = Math.min(.5, f * .34);
      foodCtx.fillStyle = `rgba(150,220,120,${a.toFixed(3)})`;
      const r = 1.1 + Math.min(2.2, f * 1.9);
      foodCtx.beginPath();
      foodCtx.arc(x * CS + CS / 2, y * CS + CS / 2, r, 0, 6.2832);
      foodCtx.fill();
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   구역 그림 — 성긴 격자에 세력을 뿌려 가장 센 쪽이 갖는다
   ═══════════════════════════════════════════════════════════════ */
const TG = { cs: 26, w: 0, h: 0, owner: null, acc: null, max: 12, list: [] };
function initTG() {
  TG.w = Math.ceil(World.WW / TG.cs);
  TG.h = Math.ceil(World.WH / TG.cs);
  TG.owner = new Int16Array(TG.w * TG.h);
  TG.acc = new Float32Array(TG.w * TG.h * TG.max);
}
function calcTerritory() {
  const n = TG.w * TG.h;
  TG.owner.fill(-1);
  TG.acc.fill(0);
  TG.list = Life.clans.slice().sort((a, b) => b.size - a.size).slice(0, TG.max);
  const R = 4;
  TG.list.forEach((c, ci) => {
    for (const m of c.members) {
      const gx = (m.x / TG.cs) | 0, gy = (m.y / TG.cs) | 0;
      for (let dy = -R; dy <= R; dy++) {
        const ny = gy + dy;
        if (ny < 0 || ny >= TG.h) continue;
        for (let dx = -R; dx <= R; dx++) {
          const nx = gx + dx;
          if (nx < 0 || nx >= TG.w) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 > R * R) continue;
          TG.acc[(ny * TG.w + nx) * TG.max + ci] += 1 - Math.sqrt(d2) / (R + .6);
        }
      }
    }
  });
  for (let i = 0; i < n; i++) {
    let best = -1, bv = .55;
    const o = i * TG.max;
    for (let c = 0; c < TG.list.length; c++) {
      const v = TG.acc[o + c];
      if (v > bv) { bv = v; best = c; }
    }
    TG.owner[i] = best;
  }
}
function drawTerritory() {
  const cs = TG.cs;
  for (let y = 0; y < TG.h; y++) {
    for (let x = 0; x < TG.w; x++) {
      const c = TG.owner[y * TG.w + x];
      if (c < 0) continue;
      const clan = TG.list[c];
      const war = clan.wars.size > 0;
      ctx.fillStyle = `hsla(${clan.hue.toFixed(0)},${war ? 78 : 55}%,${war ? 58 : 62}%,${war ? .17 : .12})`;
      ctx.fillRect(x * cs, y * cs, cs + .6, cs + .6);
    }
  }
  /* 경계선 */
  ctx.lineWidth = 1.6 / scale();
  for (let y = 0; y < TG.h; y++) {
    for (let x = 0; x < TG.w; x++) {
      const i = y * TG.w + x;
      const c = TG.owner[i];
      if (c < 0) continue;
      const clan = TG.list[c];
      const war = clan.wars.size > 0;
      ctx.strokeStyle = `hsla(${clan.hue.toFixed(0)},${war ? 85 : 60}%,${war ? 62 : 68}%,${war ? .62 : .38})`;
      const r = x + 1 < TG.w ? TG.owner[i + 1] : -1;
      const b = y + 1 < TG.h ? TG.owner[i + TG.w] : -1;
      if (r !== c) { ctx.beginPath(); ctx.moveTo((x + 1) * cs, y * cs); ctx.lineTo((x + 1) * cs, (y + 1) * cs); ctx.stroke(); }
      if (b !== c) { ctx.beginPath(); ctx.moveTo(x * cs, (y + 1) * cs); ctx.lineTo((x + 1) * cs, (y + 1) * cs); ctx.stroke(); }
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   그리기
   ═══════════════════════════════════════════════════════════════ */
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#07090c';
  ctx.fillRect(0, 0, VW, VH);

  const s = scale();
  ctx.save();
  ctx.translate(VW / 2, VH / 2);
  ctx.scale(s, s);
  ctx.translate(-cam.x, -cam.y);

  if (World.dirty) drawTerrain();
  ctx.drawImage(terCan, 0, 0);
  if (eyes.food) ctx.drawImage(foodCan, 0, 0);

  if (eyes.dread) drawDread();
  if (eyes.zone) drawTerritory();

  drawHazards();
  if (eyes.trap) drawTraps();
  if (eyes.bond) drawBonds();
  drawAgents(s);
  if (selected && selected.alive) drawSelection(s);

  ctx.restore();
  drawEdgeVignette();
}

function drawDread() {
  const { gw, gh, CS, dread } = World;
  for (let y = 0; y < gh; y += 2) {
    for (let x = 0; x < gw; x += 2) {
      const d = dread[y * gw + x];
      if (d < .06) continue;
      ctx.fillStyle = `rgba(230,70,60,${Math.min(.34, d * .3).toFixed(3)})`;
      ctx.fillRect(x * CS, y * CS, CS * 2, CS * 2);
    }
  }
}

function drawHazards() {
  for (const h of World.hazards) {
    const fade = Math.min(1, (h.life - h.t) / 2);
    const col = { fire: '255,120,40', flood: '90,150,240', quake: '190,160,110', meteor: '255,190,90' }[h.kind] || '255,120,60';
    const g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, Math.max(1, h.r));
    g.addColorStop(0, `rgba(${col},${(.42 * fade).toFixed(3)})`);
    g.addColorStop(.65, `rgba(${col},${(.20 * fade).toFixed(3)})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(h.x, h.y, Math.max(1, h.r), 0, 6.2832); ctx.fill();
    ctx.strokeStyle = `rgba(${col},${(.55 * fade).toFixed(3)})`;
    ctx.lineWidth = 2 / scale();
    ctx.beginPath(); ctx.arc(h.x, h.y, Math.max(1, h.r), 0, 6.2832); ctx.stroke();
  }
}

function drawTraps() {
  const s = scale();
  ctx.lineWidth = 1.4 / s;
  for (const t of Life.traps) {
    if (!t.armed) continue;
    const a = .22 + (1 - t.hide) * .5;
    ctx.strokeStyle = `rgba(255,120,110,${a.toFixed(2)})`;
    const r = 4;
    ctx.beginPath();
    ctx.moveTo(t.x - r, t.y - r); ctx.lineTo(t.x + r, t.y + r);
    ctx.moveTo(t.x + r, t.y - r); ctx.lineTo(t.x - r, t.y + r);
    ctx.stroke();
  }
}

function drawBonds() {
  const s = scale();
  ctx.lineWidth = 1 / s;
  let drawn = 0;
  for (const a of Life.agents) {
    if (!a.alive || drawn > 900) continue;
    for (const [id, v] of a.rel) {
      if (Math.abs(v) < .55) continue;
      const b = Life.byId.get(id);
      if (!b || !b.alive || b.id < a.id) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 130) continue;
      ctx.strokeStyle = v > 0
        ? `rgba(110,230,170,${(v * .3).toFixed(2)})`
        : `rgba(255,110,100,${(-v * .3).toFixed(2)})`;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      drawn++;
    }
  }
}

function agentColor(a) {
  const sat = 30 + a.mood * 45 + (a.variant ? 20 : 0);
  const lig = 38 + (a.energy / 100) * 26 - (a.age > a.maxAge * .74 ? 12 : 0);
  return `hsl(${a.g.hue.toFixed(0)},${sat.toFixed(0)}%,${lig.toFixed(0)}%)`;
}

function drawAgents(s) {
  const showName = eyes.name && s > .85;
  for (const a of Life.agents) {
    if (!a.alive) continue;
    const child = a.age < CHILD_END;
    const old = a.age > a.maxAge * .74;
    const r = child ? 2.6 + a.age / CHILD_END * 1.3 : old ? 3.6 : 4.3;

    /* 다친 순간의 번쩍임 */
    if (a.flash > 0) {
      ctx.fillStyle = a.flashC || '#fff';
      ctx.globalAlpha = a.flash * .3;
      ctx.beginPath(); ctx.arc(a.x, a.y, r + 7 * a.flash, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* 몸 */
    ctx.fillStyle = agentColor(a);
    if (a.variant) {
      ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(Math.PI / 4);
      ctx.fillRect(-r * .85, -r * .85, r * 1.7, r * 1.7);
      ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, 6.2832); ctx.fill();
    }

    /* 구역 테 */
    if (a.clan > 0) {
      const c = Life.clans.find(k => k.id === a.clan);
      if (c) {
        ctx.strokeStyle = `hsla(${c.hue.toFixed(0)},70%,66%,${c.wars.size ? .95 : .62})`;
        ctx.lineWidth = (c.wars.size ? 1.7 : 1.2) / s;
        ctx.beginPath(); ctx.arc(a.x, a.y, r + 1.9, 0, 6.2832); ctx.stroke();
      }
    } else if (a.age >= CHILD_END) {
      /* 외톨이 — 끊어진 테 */
      ctx.strokeStyle = 'rgba(180,190,205,.35)';
      ctx.lineWidth = 1 / s;
      ctx.setLineDash([2 / s, 3 / s]);
      ctx.beginPath(); ctx.arc(a.x, a.y, r + 2.2, 0, 6.2832); ctx.stroke();
      ctx.setLineDash([]);
    }

    /* 하는 일 표시 */
    if (s > 1.1) {
      const mark = { fight: '#ff6b5e', build: '#ffb562', disarm: '#7ec8ff', mate: '#ff9ad4', play: '#9de88f', teach: '#c9a6ff', talk: '#8fd0e8' }[a.act];
      if (mark) {
        ctx.fillStyle = mark;
        ctx.beginPath(); ctx.arc(a.x + r + 2, a.y - r - 1, 1.5, 0, 6.2832); ctx.fill();
      }
    }
    /* 기운 없는 것 */
    if (a.energy < 22) {
      ctx.strokeStyle = 'rgba(255,200,90,.5)';
      ctx.lineWidth = 1 / s;
      ctx.beginPath(); ctx.arc(a.x, a.y, r + 3.6, -1.2, 1.2); ctx.stroke();
    }

    if (showName) {
      ctx.fillStyle = 'rgba(225,235,245,.55)';
      ctx.font = `${(8 / s).toFixed(1)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(a.name, a.x, a.y - r - 4);
    }
  }
  ctx.textAlign = 'left';
}

function drawSelection(s) {
  const a = selected;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6 / s;
  ctx.beginPath(); ctx.arc(a.x, a.y, 11 + Math.sin(frame * .09) * 1.6, 0, 6.2832); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.25)';
  ctx.beginPath(); ctx.arc(a.x, a.y, a.g.sense, 0, 6.2832); ctx.stroke();

  /* 마음 줄 */
  const rels = [...a.rel.entries()].sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 10);
  ctx.lineWidth = 1.4 / s;
  for (const [id, v] of rels) {
    const b = Life.byId.get(id);
    if (!b || !b.alive) continue;
    ctx.strokeStyle = v > 0 ? `rgba(110,235,170,${(.25 + v * .5).toFixed(2)})`
                            : `rgba(255,110,100,${(.25 - v * .5).toFixed(2)})`;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  if (a.target && (a.act === 'eat' || a.act === 'wander')) {
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.setLineDash([3 / s, 4 / s]);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(a.target.x, a.target.y); ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawEdgeVignette() {
  const g = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * .42,
                                     VW / 2, VH / 2, Math.hypot(VW, VH) * .62);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VW, VH);
}

/* ═══════════════════════════════════════════════════════════════
   시점 옮기기
   ═══════════════════════════════════════════════════════════════ */
const INTEREST = { war: 5, split: 4.5, variant: 4, outcast: 3, found: 3, peace: 3.5, death: 1.4, birth: 1.2, bond: 1.6 };
let poi = [];
function noteInterest(e) {
  const w = INTEREST[e.kind];
  if (!w || e.x == null) return;
  poi.push({ x: e.x, y: e.y, w, t: Life.time });
  if (poi.length > 40) poi.shift();
}
function autoCamera(dt) {
  if (!cam.auto || cam.follow) return;
  cam.nextPick -= dt;
  if (cam.nextPick > 0) return;
  cam.nextPick = 11 + Math.random() * 9;

  /* 최근에 뭔가 벌어진 곳을 고른다 */
  poi = poi.filter(p => Life.time - p.t < 30);
  let best = null, bs = 0;
  for (const p of poi) {
    const age = Life.time - p.t;
    const s = p.w * (1 - age / 30) * (.6 + Math.random() * .8);
    if (s > bs) { bs = s; best = p; }
  }
  if (!best) {
    const c = Life.clans.slice().sort((a, b) => b.size - a.size)[0];
    if (c) best = { x: c.cx, y: c.cy };
    else if (Life.agents.length) { const a = Life.agents[(Math.random() * Life.agents.length) | 0]; best = { x: a.x, y: a.y }; }
  }
  if (best) {
    cam.tx = best.x; cam.ty = best.y;
    cam.tzoom = 1.25 + Math.random() * .9;
  }
}
function stepCamera(dt) {
  if (cam.follow) {
    if (cam.follow.alive) { cam.tx = cam.follow.x; cam.ty = cam.follow.y; }
    else cam.follow = null;
  }
  const k = Math.min(1, dt * 1.5);
  cam.x = lerp(cam.x, cam.tx, k);
  cam.y = lerp(cam.y, cam.ty, k);
  cam.zoom = lerp(cam.zoom, cam.tzoom, Math.min(1, dt * 1.8));
  /* 화면 밖으로 너무 나가지 않게 */
  const s = scale();
  const halfW = VW / 2 / s, halfH = VH / 2 / s;
  cam.x = clamp(cam.x, halfW, World.WW - halfW);
  cam.y = clamp(cam.y, halfH, World.WH - halfH);
  cam.tx = clamp(cam.tx, halfW, World.WW - halfW);
  cam.ty = clamp(cam.ty, halfH, World.WH - halfH);

  if (cam.idleFor > 0) { cam.idleFor -= dt; if (cam.idleFor <= 0 && $('autoCam').dataset.want !== '0') cam.auto = true; }
}
function toWorld(px, py) {
  const s = scale();
  return { x: (px - VW / 2) / s + cam.x, y: (py - VH / 2) / s + cam.y };
}
function touched() { cam.auto = false; cam.idleFor = 50; }

/* ═══════════════════════════════════════════════════════════════
   손대기
   ═══════════════════════════════════════════════════════════════ */
function agentAt(wx, wy, r) {
  let best = null, bd = r * r;
  for (const a of Life.agents) {
    if (!a.alive) continue;
    const d = (a.x - wx) ** 2 + (a.y - wy) ** 2;
    if (d < bd) { bd = d; best = a; }
  }
  return best;
}

function applyTool(wx, wy, isDrag) {
  switch (tool) {
    case 'look': {
      if (isDrag) return;
      const a = agentAt(wx, wy, 22 / scale() * 1.2 + 12);
      selected = a;
      if (a) { cam.tx = a.x; cam.ty = a.y; }
      updateInspector();
      break;
    }
    case 'spawn': case 'variant': {
      if (!World.passableAt(wx, wy)) return;
      const g = makeGenes();
      if (tool === 'variant') {
        const keys = ['spd', 'sense', 'aggr', 'soc', 'cur', 'int', 'craft', 'vig', 'meta', 'lon', 'fert'];
        for (let i = 0; i < 2; i++) {
          const k = pick(keys);
          g[k] = k === 'sense' ? clamp(g[k] * rand(.4, 2.2), 30, 260) : clamp(g[k] * rand(.3, 2.6), 0, k === 'meta' || k === 'lon' || k === 'spd' ? 2 : 1);
        }
      }
      const a = makeAgent(wx, wy, g, 1, null);
      a.age = rand(CHILD_END + 1, 26);
      a.variant = tool === 'variant';
      a.flash = 1; a.flashC = tool === 'variant' ? '#c88bff' : '#a8ffcf';
      Life.add(a);
      Life.log(tool === 'variant' ? 'variant' : 'arrive',
        tool === 'variant' ? `${a.name}이(가) 어딘가 다른 모습으로 나타났다` : `${a.name}이(가) 나타났다`, a);
      break;
    }
    case 'erase': {
      for (const a of Life.near(wx, wy, 34)) Life.remove(a, true);
      break;
    }
    case 'food': World.scatter(wx, wy, 62, .55); break;
    case 'trap': {
      Life.traps.push({
        id: Life.nextTrapId++, x: wx, y: wy, owner: 0, clan: -99,
        power: 46, hide: .72, armed: true, age: 0, seen: 0,
      });
      break;
    }
    case 'terrain': World.paint(wx, wy, terKind, 46); break;
    case 'disaster': {
      if (isDrag) return;
      const kind = pick(['fire', 'flood', 'quake', 'meteor']);
      const h = World.addHazard(kind, wx, wy, 1);
      Life.log('world', `${h.name}이(가) 들이닥쳤다`, { x: wx, y: wy });
      break;
    }
    case 'peace': {
      const near = new Set();
      for (const a of Life.near(wx, wy, 220)) if (a.clan > 0) near.add(a.clan);
      const ids = [...near];
      for (let i = 0; i < ids.length; i++)
        for (let j = i + 1; j < ids.length; j++) {
          const ca = Life.clans.find(c => c.id === ids[i]), cb = Life.clans.find(c => c.id === ids[j]);
          if (ca && cb) Life.addClanRel(ca, cb, 1.2);
        }
      for (const a of Life.near(wx, wy, 220)) {
        for (const [id, v] of a.rel) if (v < 0) a.rel.set(id, v * .2 + .1);
        a.mood = Math.min(1, a.mood + .4);
        a.flash = .8; a.flashC = '#7ee0a8';
      }
      if (ids.length) Life.log('peace', '누군가의 손길에 앙금이 풀렸다', { x: wx, y: wy });
      break;
    }
    case 'war': {
      const near = new Set();
      for (const a of Life.near(wx, wy, 220)) if (a.clan > 0) near.add(a.clan);
      const ids = [...near];
      for (let i = 0; i < ids.length; i++)
        for (let j = i + 1; j < ids.length; j++) {
          const ca = Life.clans.find(c => c.id === ids[i]), cb = Life.clans.find(c => c.id === ids[j]);
          if (ca && cb) Life.addClanRel(ca, cb, -1.4);
        }
      for (const a of Life.near(wx, wy, 220)) {
        for (const b of Life.near(a.x, a.y, 120)) {
          if (b !== a && b.clan !== a.clan) Life.addRel(a, b, -.6);
        }
        a.flash = .8; a.flashC = '#ff8a72';
      }
      if (ids.length > 1) Life.log('war', '누군가가 불씨를 던졌다', { x: wx, y: wy });
      break;
    }
    case 'mutate': {
      for (const a of Life.near(wx, wy, 70)) {
        const keys = ['spd', 'sense', 'aggr', 'soc', 'cur', 'int', 'craft', 'vig', 'meta', 'lon', 'fert'];
        const k = pick(keys);
        a.g[k] = k === 'sense' ? clamp(a.g[k] * rand(.4, 2.2), 30, 260)
                               : clamp(a.g[k] * rand(.3, 2.6), 0, k === 'meta' || k === 'lon' || k === 'spd' ? 2 : 1);
        a.g.hue = (a.g.hue + rand(40, 300)) % 360;
        a.variant = true;
        a.flash = 1; a.flashC = '#c88bff';
      }
      break;
    }
  }
}

/* ── 입력 ─────────────────────────────────────────────────── */
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId);
  touched();
  if (e.button === 2 || e.button === 1) { panning = true; lastPX = e.clientX; lastPY = e.clientY; return; }
  dragging = true;
  const w = toWorld(e.clientX, e.clientY);
  applyTool(w.x, w.y, false);
});
cv.addEventListener('pointermove', e => {
  if (panning) {
    const s = scale();
    cam.tx -= (e.clientX - lastPX) / s; cam.ty -= (e.clientY - lastPY) / s;
    cam.x = cam.tx; cam.y = cam.ty;
    lastPX = e.clientX; lastPY = e.clientY;
    return;
  }
  if (!dragging) return;
  if (tool === 'look' || tool === 'disaster') return;
  const w = toWorld(e.clientX, e.clientY);
  applyTool(w.x, w.y, true);
});
window.addEventListener('pointerup', () => { dragging = false; panning = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => {
  e.preventDefault();
  touched();
  const before = toWorld(e.clientX, e.clientY);
  cam.tzoom = clamp(cam.tzoom * (e.deltaY < 0 ? 1.18 : 1 / 1.18), .6, 6);
  cam.zoom = cam.tzoom;
  const after = toWorld(e.clientX, e.clientY);
  cam.tx += before.x - after.x; cam.ty += before.y - after.y;
  cam.x = cam.tx; cam.y = cam.ty;
}, { passive: false });

/* ═══════════════════════════════════════════════════════════════
   화면 붙이기
   ═══════════════════════════════════════════════════════════════ */
function buildUI() {
  /* 도구 */
  document.querySelectorAll('.tool').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.tool').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      tool = b.dataset.tool;
      $('terrainRow').classList.toggle('on', tool === 'terrain');
      hint(b.title);
      if (tool !== 'look') { selected = null; updateInspector(); }
    });
  });

  /* 땅 종류 */
  const row = $('terrainRow');
  for (const t of TERINFO) {
    const b = document.createElement('button');
    b.className = 'tbit' + (t.id === terKind ? ' on' : '');
    b.textContent = t.name;
    b.style.borderColor = `rgb(${t.c.map(v => Math.min(255, v * 1.5)).join(',')})`;
    b.addEventListener('click', () => {
      terKind = t.id;
      row.querySelectorAll('.tbit').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
    });
    row.appendChild(b);
  }

  /* 손잡이 */
  const dr = $('dialRows');
  for (const d of DIALS) {
    const r = document.createElement('div');
    r.className = 'row';
    r.innerHTML = `<label>${d.label}</label>
      <input type="range" min="${d.min}" max="${d.max}" step="${d.step}" value="${cfg[d.k]}">
      <span class="v"></span>`;
    const inp = r.querySelector('input'), v = r.querySelector('.v');
    const show = () => v.textContent = d.k === 'maxPop' ? cfg[d.k] : (+cfg[d.k]).toFixed(2).replace(/0$/, '');
    inp.addEventListener('input', () => { cfg[d.k] = +inp.value; show(); });
    show();
    dr.appendChild(r);
  }

  /* 속도 */
  $('spd').querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      $('spd').querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      cfg.speed = +b.dataset.s;
      paused = cfg.speed === 0;
    });
  });

  /* 보기 */
  $('eyes').querySelectorAll('.eye').forEach(b => {
    const k = b.dataset.eye;
    b.classList.toggle('on', !!eyes[k]);
    b.addEventListener('click', () => {
      eyes[k] = !eyes[k];
      b.classList.toggle('on', eyes[k]);
    });
  });

  $('dialsHd').addEventListener('click', () => $('dials').classList.toggle('min'));
  $('reseed').addEventListener('click', () => newWorld());
  $('zen').addEventListener('click', () => document.body.classList.toggle('zen'));
  $('autoCam').addEventListener('click', () => {
    const want = $('autoCam').classList.toggle('on');
    $('autoCam').dataset.want = want ? '1' : '0';
    cam.auto = want; cam.idleFor = 0;
    if (want) cam.follow = null;
  });

  /* 글쇠 */
  const keyTool = { '1': 'look', '2': 'spawn', '3': 'variant', '4': 'erase', '5': 'food',
                    '6': 'trap', '7': 'terrain', '8': 'disaster', '9': 'peace', '0': 'war', '-': 'mutate' };
  window.addEventListener('keydown', e => {
    if (e.key === ' ') {
      e.preventDefault();
      const cur = cfg.speed === 0 ? 1 : 0;
      $('spd').querySelector(`[data-s="${cur}"]`).click();
      return;
    }
    if (e.key === 'h' || e.key === 'H') document.body.classList.toggle('zen');
    if (e.key === 'f' || e.key === 'F') { if (selected) { cam.follow = cam.follow ? null : selected; touched(); } }
    const t = keyTool[e.key];
    if (t) document.querySelector(`[data-tool="${t}"]`).click();
  });
}

let hintT = 0;
function hint(text) {
  const h = $('hint');
  h.textContent = text;
  h.classList.add('on');
  clearTimeout(hintT);
  hintT = setTimeout(() => h.classList.remove('on'), 1900);
}

/* ── 일어난 일 ────────────────────────────────────────────── */
const logBody = $('logBody');
function pushLog(e) {
  noteInterest(e);
  const d = document.createElement('div');
  d.className = 'ev ' + e.kind;
  const yr = Math.floor(e.t / YEAR);
  d.innerHTML = `<span class="tm">${yr}년</span>${escapeHtml(e.text)}`;
  if (e.x != null) d.addEventListener('click', () => {
    touched();
    cam.tx = e.x; cam.ty = e.y; cam.tzoom = Math.max(cam.tzoom, 1.7);
    if (e.id) { const a = Life.byId.get(e.id); if (a && a.alive) { selected = a; updateInspector(); } }
  });
  logBody.insertBefore(d, logBody.firstChild);
  while (logBody.childNodes.length > 70) logBody.removeChild(logBody.lastChild);
}
const escapeHtml = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/* ── 요약 ─────────────────────────────────────────────────── */
function updateStats() {
  const s = Life.stats();
  const yr = Math.floor(Life.time / YEAR);
  $('stats').innerHTML =
    `<span>${yr}년</span>` +
    `<span>인구 <b>${s.pop}</b></span>` +
    `<span>아이 <b>${s.child}</b> · 늙은이 <b>${s.old}</b></span>` +
    `<span>구역 <b>${s.clans}</b></span>` +
    (s.wars > 0 ? `<span class="w">전쟁 <b>${s.wars}</b></span>` : `<span class="p">평온</span>`) +
    `<span>외톨이 <b>${s.lone}</b></span>` +
    `<span>함정 <b>${s.traps}</b></span>` +
    `<span>변종 <b>${s.variant}</b></span>` +
    `<span>대 <b>${s.gen}</b></span>` +
    `<span>태어남 <b>${s.born}</b> · 죽음 <b>${s.died}</b></span>`;
}

/* ── 개체 살펴보기 ────────────────────────────────────────── */
const GENE_LABEL = { spd: '빠르기', sense: '눈', aggr: '사나움', soc: '붙임성', cur: '호기심',
  int: '머리', craft: '손재주', vig: '경계심', meta: '먹성', lon: '타고난 명', fert: '자손' };

function updateInspector() {
  const p = $('insp');
  if (!selected || !selected.alive) { p.classList.remove('on'); return; }
  const a = selected;
  p.classList.add('on');
  const clan = a.clan > 0 ? Life.clans.find(c => c.id === a.clan) : null;
  const child = a.age < CHILD_END, old = a.age > a.maxAge * .74;
  const stage = child ? '아이' : old ? '늙은이' : '어른';

  const tags = [];
  if (a.variant) tags.push(['변종', 'p']);
  if (a.g.int > .74) tags.push(['똑똑함', 'g']);
  if (a.g.int < .26) tags.push(['무능함', 'b']);
  if (a.scars < .1 && a.age < 32) tags.push(['순수함', 'g']);
  if (a.scars > .6) tags.push(['상처투성이', 'b']);
  if (a.g.aggr > .74) tags.push(['사나움', 'b']);
  if (a.g.soc > .74) tags.push(['다정함', 'g']);
  if (a.g.craft > .68) tags.push(['손재주', 'y']);
  if (a.clan < 0 && !child) tags.push(['외톨이', 'y']);
  if (a.outcast > 0) tags.push([`배척 ${a.outcast}번`, 'b']);
  if (a.kills > 0) tags.push([`죽인 것 ${a.kills}`, 'b']);
  if (a.births > 0) tags.push([`자식 ${a.births}`, 'g']);
  if (a.saved > 0) tags.push([`함정 해체 ${a.saved}`, 'g']);

  const genes = ['int', 'aggr', 'soc', 'craft', 'vig', 'cur', 'spd', 'fert']
    .map(k => {
      const v = clamp(k === 'spd' ? a.g[k] / 1.6 : a.g[k], 0, 1);
      const hue = 120 * v;
      return `<div class="gbar"><span>${GENE_LABEL[k]}</span><div class="b">
        <i style="width:${(v * 100).toFixed(0)}%;background:hsl(${hue.toFixed(0)},62%,55%)"></i></div></div>`;
    }).join('');

  const rels = [...a.rel.entries()]
    .map(([id, v]) => [Life.byId.get(id), v])
    .filter(([b]) => b && b.alive)
    .sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 5)
    .map(([b, v]) => `<div class="rel" data-id="${b.id}">
        <span>${escapeHtml(b.name)}</span>
        <span style="color:${v > 0 ? '#5fd8a0' : '#ff7a72'}">${v > 0 ? '+' : ''}${v.toFixed(2)}</span></div>`).join('')
    || '<div style="color:#5b6d85;font-size:11px">아는 이가 없다</div>';

  p.innerHTML =
    `<div class="nm"><span class="dot" style="background:${agentColor(a)}"></span>${escapeHtml(a.name)}</div>` +
    `<div class="sub">${Math.floor(a.age)}살 · ${stage} · ${a.gen}대` +
      (clan ? ` · <span style="color:hsl(${clan.hue.toFixed(0)},65%,68%)">${escapeHtml(clan.name)}</span>` : ' · 무리 없음') + `</div>` +
    `<div class="tagz">${tags.map(([t, c]) => `<span class="tag ${c}">${t}</span>`).join('')}</div>` +
    `<div class="gbar"><span>기운</span><div class="b"><i style="width:${a.energy.toFixed(0)}%;background:#e0b13c"></i></div></div>` +
    `<div class="gbar"><span>몸</span><div class="b"><i style="width:${Math.max(0, a.hp).toFixed(0)}%;background:#ff7a72"></i></div></div>` +
    `<div class="gbar"><span>기분</span><div class="b"><i style="width:${(a.mood * 100).toFixed(0)}%;background:#6ba7ff"></i></div></div>` +
    `<div class="gbar"><span>아는 것</span><div class="b"><i style="width:${(a.lore * 100).toFixed(0)}%;background:#5fd8a0"></i></div></div>` +
    `<div class="sec">타고난 것</div>${genes}` +
    `<div class="sec">마음에 둔 이</div>${rels}` +
    `<div class="sec">지금</div><div style="font-size:11px;color:#8fa2ba">${actName(a)} · 아는 함정 ${a.know.size}곳</div>` +
    `<div class="btns">
       <button id="ifollow">${cam.follow === a ? '따라가는 중' : '따라가기'}</button>
       <button id="iclose">닫기</button></div>`;

  p.querySelectorAll('.rel').forEach(r => r.addEventListener('click', () => {
    const b = Life.byId.get(+r.dataset.id);
    if (b && b.alive) { selected = b; touched(); cam.tx = b.x; cam.ty = b.y; updateInspector(); }
  }));
  $('ifollow').addEventListener('click', () => { cam.follow = cam.follow === a ? null : a; touched(); updateInspector(); });
  $('iclose').addEventListener('click', () => { selected = null; cam.follow = null; updateInspector(); });
}
const ACT_KO = { wander: '거닌다', eat: '먹는다', rest: '쉰다', flee: '달아난다', fight: '싸운다',
  talk: '이야기한다', play: '논다', learn: '배운다', teach: '가르친다', mate: '짝을 찾는다',
  build: '함정을 놓는다', disarm: '함정을 푼다' };
const actName = a => ACT_KO[a.act] || a.act;

/* ═══════════════════════════════════════════════════════════════
   시작 · 루프
   ═══════════════════════════════════════════════════════════════ */
function newWorld() {
  World.init((Math.random() * 1e9) | 0);
  initTG();
  Life.onEvent = pushLog;
  Life.init(cfg, 64);
  logBody.innerHTML = '';
  selected = null; cam.follow = null;
  updateInspector();
  cam.tx = cam.x = World.WW / 2; cam.ty = cam.y = World.WH / 2;
  cam.tzoom = cam.zoom = 1;
  poi = [];
  drawTerrain();
  drawFood();
  calcTerritory();
}

let last = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  const dtReal = Math.min(.05, (ts - last) / 1000 || .016);
  last = ts;
  frame++;

  if (!paused) {
    /* 빠르게 돌리다 인구가 불어나면 한 판에 다 못 돌 수 있다.
       화면이 끊기느니 세상이 조금 천천히 흐르는 편이 낫다. */
    const steps = Math.min(8, cfg.speed);
    const t0 = performance.now();
    for (let i = 0; i < steps; i++) {
      World.step(1 / 60, cfg);
      Life.step(1 / 60);
      if (i > 0 && performance.now() - t0 > 11) break;
    }
  }
  stepCamera(dtReal);
  autoCamera(dtReal);

  if (frame % 30 === 0 && !paused) drawFood();
  if (frame % 20 === 0) calcTerritory();
  if (frame % 15 === 0) updateStats();
  if (frame % 12 === 0 && selected) {
    if (!selected.alive) { selected = null; updateInspector(); }
    else updateInspector();
  }

  render();
}

resize();
buildUI();
newWorld();
hint('마우스 휠로 확대 · 오른쪽 드래그로 이동 · H로 화면 가리기');
requestAnimationFrame(loop);
