/* ═══════════════════════════════════════════════════════════════
   life.js — 개체, 관계, 함정, 구역
   누구는 똑똑하고 누구는 무능하다. 누구는 배척당하고 누구는 사랑받는다.
   모이면 구역이 되고, 구역은 갈라지고, 갈라진 것들은 싸우다 지쳐 화해한다.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* ── 이름 짓기 ────────────────────────────────────────────── */
const SYL1 = ['아', '루', '미', '나', '도', '카', '세', '리', '온', '하', '유', '무', '다', '페', '조',
  '비', '소', '이', '라', '노', '테', '쿠', '마', '시', '헤', '오', '가', '네', '피', '토'];
const SYL2 = ['린', '사', '무', '엘', '카', '나', '로', '단', '시', '베', '타', '리', '온', '메', '푸',
  '델', '란', '고', '수', '체', '미', '가', '녹', '휘', '람', '설', '별', '솔', '담', '결'];
const CLANWORD = ['바람', '재', '돌', '잔물결', '가시', '이끼', '노을', '서리', '불씨', '뿌리',
  '메아리', '그늘', '모래', '깃털', '무리', '이슬', '잿빛', '푸른', '먼', '오랜',
  '조약돌', '가지', '들판', '고요', '거센', '작은', '흰', '검은', '붉은', '늦은'];
const CLANTAIL = ['골', '무리', '터', '족', '자리', '언덕', '숲', '기슭', '들', '자락'];

/* ── 작은 도구 ────────────────────────────────────────────── */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[(Math.random() * arr.length) | 0];
function gauss(m, s) {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* 머리가 닿을 수 있는 데까지 — 무능한 것은 끝내 무능하다 */
const loreCap = a => .26 + a.g.int * .74;

/* 나이 단위: 1살 = 3.2초(기본 속도 기준) */
const YEAR = 3.2;
const CHILD_END = 13;      // 여기까지는 아이 — 놀고 배우고, 미워할 줄 모른다

/* ═══════════════════════════════════════════════════════════════
   개체
   ═══════════════════════════════════════════════════════════════ */
let _id = 1;

function makeGenes(base) {
  const g = base ? { ...base } : {
    spd:   rand(.62, 1.35),
    sense: rand(52, 165),
    aggr:  Math.random() ** 1.5,
    soc:   Math.random() ** .8,
    cur:   Math.random(),
    int:   Math.random(),
    craft: Math.random() ** 1.4,
    vig:   Math.random(),
    meta:  rand(.75, 1.30),
    lon:   rand(.72, 1.32),
    fert:  rand(.25, 1.0),
    hue:   Math.random() * 360,
  };
  return g;
}

function mixGenes(a, b, mutation) {
  const g = {};
  for (const k in a) {
    if (k === 'hue') {
      /* 색은 원 위에서 섞는다 */
      const d = ((b.hue - a.hue + 540) % 360) - 180;
      g.hue = (a.hue + d * (.3 + Math.random() * .4) + 360) % 360;
    } else {
      g[k] = lerp(a[k], b[k], .35 + Math.random() * .3) + gauss(0, .055) * (k === 'sense' ? 40 : 1);
    }
  }
  /* 격세유전 — 어느 한 가지가 조상 아무개의 것으로 되돌아간다.
     이것이 없으면 몇 대 만에 온 세상이 비슷해져서,
     똑똑한 것도 무능한 것도 더는 태어나지 않는다. */
  if (Math.random() < .10) {
    const k = pick(['aggr', 'soc', 'cur', 'int', 'craft', 'vig', 'fert']);
    g[k] = Math.random();
  }

  let variant = false;
  if (Math.random() < mutation) {
    variant = true;
    /* 변종 — 한두 가지가 확 튄다 */
    const keys = ['spd', 'sense', 'aggr', 'soc', 'cur', 'int', 'craft', 'vig', 'meta', 'lon', 'fert'];
    const n = 1 + (Math.random() < .35 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const k = pick(keys);
      g[k] = k === 'sense' ? clamp(g[k] * rand(.5, 2.1), 30, 260)
                           : clamp(g[k] * rand(.35, 2.4), 0, k === 'meta' || k === 'lon' || k === 'spd' ? 2.2 : 1);
    }
    g.hue = (g.hue + rand(70, 290)) % 360;
  }
  /* 범위 정리 */
  g.spd = clamp(g.spd, .35, 2.0);
  g.sense = clamp(g.sense, 30, 260);
  for (const k of ['aggr', 'soc', 'cur', 'int', 'craft', 'vig', 'fert']) g[k] = clamp(g[k], 0, 1);
  g.meta = clamp(g.meta, .55, 2.1);
  g.lon = clamp(g.lon, .5, 2.0);
  return { g, variant };
}

function makeName() { return pick(SYL1) + pick(SYL2); }

function makeAgent(x, y, genes, gen, parents) {
  const g = genes || makeGenes();
  return {
    id: _id++,
    name: makeName(),
    x, y, vx: 0, vy: 0, dir: Math.random() * Math.PI * 2,
    g,
    hp: 100, energy: rand(55, 90),
    age: 0, maxAge: (52 + Math.random() * 46) * g.lon,
    lore: 0,                       // 세상에 대해 아는 정도 — 배워서 는다
    sk: { forage: 0, fight: 0, craft: 0, social: 0 },
    know: new Set(),               // 알고 있는 함정
    rel: new Map(),                // 다른 개체에 대한 마음 (-1..1)
    clan: -1, clanTime: 0,
    gen: gen || 1,
    parents: parents || null,
    variant: false,
    act: 'wander', target: null, targetId: 0,
    cool: { mate: rand(0, 20), trap: rand(0, 30), talk: 0, play: 0, teach: 0, fight: 0 },
    think: (Math.random() * 10) | 0,
    mood: .5,
    scars: 0,                      // 겪은 험한 일 — 많을수록 순수함을 잃는다
    kills: 0, births: 0, saved: 0,
    outcast: 0,                    // 배척당한 횟수
    alive: true,
    born: 0,
    flash: 0, flashC: null,
  };
}

/* ═══════════════════════════════════════════════════════════════
   세상 살림
   ═══════════════════════════════════════════════════════════════ */
const Life = {
  agents: [], traps: [], clans: [],
  byId: new Map(),
  events: [],
  time: 0, tick: 0,
  nextClanId: 1, nextTrapId: 1,
  hash: new Map(), HS: 70,
  cfg: null,
  born: 0, died: 0, peak: 0,
  lastClanCalc: 0,
  onEvent: null,

  init(cfg, count) {
    this.cfg = cfg;
    this.agents = []; this.traps = []; this.clans = [];
    this.byId.clear(); this.events = [];
    this.time = 0; this.tick = 0; this.born = 0; this.died = 0; this.peak = 0;
    _id = 1; this.nextClanId = 1; this.nextTrapId = 1;

    /* 처음엔 몇 무리로 나눠 뿌린다 — 곧 저희끼리 뭉친다 */
    const seeds = 3 + (Math.random() * 3 | 0);
    const spots = [];
    for (let i = 0; i < seeds; i++) spots.push(World.randomOpen());
    for (let i = 0; i < count; i++) {
      const s = spots[i % seeds];
      let x, y, t = 0;
      do {
        x = s.x + gauss(0, 95); y = s.y + gauss(0, 95); t++;
      } while (t < 40 && !World.passableAt(x, y));
      if (!World.passableAt(x, y)) { const o = World.randomOpen(); x = o.x; y = o.y; }
      const a = makeAgent(x, y);
      a.age = rand(CHILD_END, 40);
      this.add(a);
    }
    this.log('world', '세상이 열렸다', null);
  },

  add(a) { this.agents.push(a); this.byId.set(a.id, a); if (this.agents.length > this.peak) this.peak = this.agents.length; return a; },

  log(kind, text, a) {
    const e = {
      kind, text, t: this.time,
      x: a ? a.x : null, y: a ? a.y : null,
      id: (a && a.id) || 0,
    };
    this.events.push(e);
    if (this.events.length > 400) this.events.splice(0, 120);
    if (this.onEvent) this.onEvent(e);
  },

  /* ── 공간 해시 ────────────────────────────────────────── */
  rehash() {
    this.hash.clear();
    const HS = this.HS;
    for (const a of this.agents) {
      const k = (((a.y / HS) | 0) + 64) * 512 + (((a.x / HS) | 0) + 64);
      let l = this.hash.get(k);
      if (!l) this.hash.set(k, l = []);
      l.push(a);
    }
  },
  near(x, y, r) {
    const HS = this.HS, out = [];
    const c = Math.ceil(r / HS);
    const gx = (x / HS) | 0, gy = (y / HS) | 0;
    const r2 = r * r;
    for (let dy = -c; dy <= c; dy++)
      for (let dx = -c; dx <= c; dx++) {
        const l = this.hash.get((gy + dy + 64) * 512 + (gx + dx + 64));
        if (!l) continue;
        for (const a of l) {
          const ddx = a.x - x, ddy = a.y - y;
          if (ddx * ddx + ddy * ddy <= r2) out.push(a);
        }
      }
    return out;
  },

  /* 같은 배열을 돌려 쓰는 판 — 뜨거운 자리에서만 쓴다.
     안에서 또 near를 부르면 안 된다(같은 통을 덮어쓴다). */
  _nb: [],
  nearBuf(x, y, r, skip) {
    const HS = this.HS, buf = this._nb;
    const c = Math.ceil(r / HS);
    const gx = (x / HS) | 0, gy = (y / HS) | 0;
    const r2 = r * r;
    let n = 0;
    for (let dy = -c; dy <= c; dy++)
      for (let dx = -c; dx <= c; dx++) {
        const l = this.hash.get((gy + dy + 64) * 512 + (gx + dx + 64));
        if (!l) continue;
        for (let i = 0; i < l.length; i++) {
          const a = l[i];
          if (a === skip || !a.alive) continue;
          const ddx = a.x - x, ddy = a.y - y;
          if (ddx * ddx + ddy * ddy <= r2) buf[n++] = a;
        }
      }
    return n;
  },

  /* 함정도 자리별로 묶어 둔다 — 개체마다 온 함정을 훑지 않게 */
  TS: 96,
  trapHash: new Map(),
  rehashTraps() {
    this.trapHash.clear();
    for (const t of this.traps) {
      if (!t.armed) continue;
      const k = (((t.y / this.TS) | 0) + 64) * 512 + (((t.x / this.TS) | 0) + 64);
      let l = this.trapHash.get(k);
      if (!l) this.trapHash.set(k, l = []);
      l.push(t);
    }
  },

  /* ── 관계 ──────────────────────────────────────────────── */
  rel(a, b) { return a.rel.get(b.id) || 0; },
  addRel(a, b, d) {
    const v = clamp((a.rel.get(b.id) || 0) + d, -1, 1);
    a.rel.set(b.id, v);
    if (a.rel.size > 60) {           // 오래된 기억은 흐려진다
      const it = a.rel.keys();
      for (let i = 0; i < 12; i++) {
        const k = it.next().value;
        if (Math.abs(a.rel.get(k)) < .12) a.rel.delete(k);
      }
    }
    return v;
  },

  clanOf(a) { return a.clan > 0 ? this.clans.find(c => c.id === a.clan) : null; },
  clanRel(ca, cb) {
    if (!ca || !cb || ca === cb) return 1;
    return ca.rel.get(cb.id) || 0;
  },
  addClanRel(ca, cb, d) {
    if (!ca || !cb || ca === cb) return;
    const v = clamp((ca.rel.get(cb.id) || 0) + d, -1, 1);
    ca.rel.set(cb.id, v);
    cb.rel.set(ca.id, v);
    /* 전쟁과 평화의 문턱 */
    const wasWar = ca.wars.has(cb.id);
    if (!wasWar && v < -.40) {
      ca.wars.add(cb.id); cb.wars.add(ca.id);
      ca.warSince = cb.warSince = this.time;
      this.log('war', `${ca.name}과 ${cb.name}이 서로에게 등을 돌렸다`, null);
    } else if (wasWar && v > -.12) {
      ca.wars.delete(cb.id); cb.wars.delete(ca.id);
      this.log('peace', `${ca.name}과 ${cb.name}이 싸움을 멈췄다`, null);
    }
  },
  atWar(a, b) {
    if (a.clan < 0 || b.clan < 0 || a.clan === b.clan) return false;
    const ca = this.clanOf(a);
    return !!(ca && ca.wars.has(b.clan));
  },

  /* ═════════════════════════════════════════════════════════
     한 틱
     ═════════════════════════════════════════════════════════ */
  step(dt) {
    const cfg = this.cfg;
    this.time += dt;
    this.tick++;
    this.rehash();
    this.rehashTraps();

    for (const a of this.agents) if (a.alive) this.stepAgent(a, dt, cfg);

    /* 죽은 것들 치우기 */
    if (this.tick % 8 === 0) {
      for (let i = this.agents.length - 1; i >= 0; i--) {
        const a = this.agents[i];
        if (!a.alive) { this.agents.splice(i, 1); this.byId.delete(a.id); }
      }
    }

    this.stepTraps(dt);
    if (this.tick % 90 === 0) this.recalcClans();
    if (this.tick % 45 === 0) this.stepClanMood(dt * 45);
    if (this.tick % 120 === 0) this.checkOutcasts();

    /* 아무도 없으면 떠돌이가 흘러든다 — 멍하니 보는 세계가 멈추지 않게 */
    if (cfg.revive && this.agents.length < 8 && Math.random() < .02) {
      const o = World.randomOpen();
      const a = makeAgent(o.x, o.y);
      a.age = rand(CHILD_END + 2, 30);
      this.add(a);
      this.log('arrive', `${a.name}이(가) 어디선가 흘러들었다`, a);
    }
  },

  /* ── 개체 하나 ────────────────────────────────────────── */
  stepAgent(a, dt, cfg) {
    /* 나이와 배고픔 */
    a.age += dt / YEAR * cfg.ageRate;
    const child = a.age < CHILD_END;
    const old = a.age > a.maxAge * .74;

    const move = Math.hypot(a.vx, a.vy) / 40;
    a.energy -= dt * (1.05 + move * .9) * a.g.meta * (child ? .72 : old ? .92 : 1);
    a.mood = clamp(a.mood + (a.energy > 55 ? .04 : -.05) * dt, 0, 1);
    /* for-in은 뜨거운 자리에서 비싸다 — 하나씩 깎는다 */
    const c = a.cool;
    if (c.mate > 0) c.mate -= dt;
    if (c.trap > 0) c.trap -= dt;
    if (c.talk > 0) c.talk -= dt;
    if (c.play > 0) c.play -= dt;
    if (c.teach > 0) c.teach -= dt;
    if (c.fight > 0) c.fight -= dt;
    if (a.flash > 0) a.flash -= dt * 2.6;

    /* 땅이 때린다 */
    const inf = World.infoAt(a.x, a.y);
    if (inf.dmg) {
      /* 아는 게 많을수록 덜 다친다 — 어디를 밟으면 안 되는지 안다 */
      a.hp -= inf.dmg * dt * (1 - a.lore * .35);
      if (Math.random() < dt * .25) { a.scars += .015; World.markDread(a.x, a.y, .05); }
    }
    if (inf.drain) a.energy -= inf.drain * dt * (1 - a.lore * .25);

    const hz = World.hazards.length ? World.hazardDamageAt(a.x, a.y) : 0;
    if (hz > 0) {
      a.hp -= hz * dt;
      a.mood = clamp(a.mood - dt, 0, 1);
      a.scars += dt * .05;
    }

    /* 회복 */
    if (a.energy > 62 && a.hp < 100) a.hp = Math.min(100, a.hp + dt * 2.4);
    if (a.energy <= 0) { a.hp -= dt * 7; a.energy = 0; }

    /* 죽음 */
    if (a.hp <= 0) return this.kill(a, hz > 0 ? '재해' : inf.dmg ? inf.name : a.energy <= 0 ? '굶주림' : '다친 상처');
    if (a.age > a.maxAge) return this.kill(a, '늙음');

    /* 배우기 — 살아 있는 것만으로도 조금씩 는다. 똑똑할수록 빨리, 그리고 더 멀리.
       머리가 나쁘면 아무리 오래 살아도 닿지 못하는 데가 있다. */
    a.lore = clamp(a.lore + dt * .0022 * (.3 + a.g.int), 0, loreCap(a));

    /* 마음은 가만두면 옅어진다.
       자주 마주쳐 되새기는 사이만 남는다 — 그래서 무리는 무한히 커지지 못한다. */
    if ((this.tick + a.think) % 30 === 0 && a.rel.size) {
      for (const [id, v] of a.rel) {
        /* 정은 식고 앙금은 남는다 */
        const nv = v > 0 ? v * .986 : v * .9975;
        if (nv > -.045 && nv < .045) a.rel.delete(id);
        else a.rel.set(id, nv);
      }
    }

    /* 생각은 몇 틱에 한 번 — 초당 여섯 번쯤이면 넉넉하다 */
    if ((this.tick + a.think) % 10 === 0) this.decide(a, dt * 10, cfg, child, old);

    /* 움직임 */
    this.applyMove(a, dt, child, old);

    /* 함정 밟기 — 한 틱에 움직이는 거리가 함정 반경보다 훨씬 작아 몇 틱에 한 번이면 된다 */
    if ((this.tick + a.think) % 3 === 0) this.checkTraps(a);
  },

  /* ── 무엇을 할지 정한다 ───────────────────────────────── */
  decide(a, dt, cfg, child, old) {
    const sense = a.g.sense * (child ? .8 : old ? .85 : 1) * (1 + a.lore * .25);
    const nn = this.nearBuf(a.x, a.y, sense, a);
    const neigh = this._nb;   // 이 함수 안에서는 near를 다시 부르지 않는다

    /* 재해가 보이면 무조건 도망 — 무능해도 뜨거운 건 안다 */
    for (const h of World.hazards) {
      const d = Math.hypot(a.x - h.x, a.y - h.y);
      if (d < h.r + 70) {
        a.act = 'flee';
        a.target = { x: a.x + (a.x - h.x) / (d + 1) * 220, y: a.y + (a.y - h.y) / (d + 1) * 220 };
        return;
      }
    }

    const hungry = a.energy < 52;
    const starving = a.energy < 24;

    /* 무서운 적 */
    let threat = null, threatD = 1e9;
    for (let ni = 0; ni < nn; ni++) {
      const o = neigh[ni];
      if (o.age < CHILD_END) continue;
      const hostile = this.atWar(a, o) || this.rel(a, o) < -.4;
      if (!hostile) continue;
      const power = this.power(o), mine = this.power(a);
      const d = Math.hypot(a.x - o.x, a.y - o.y);
      /* 똑똑하면 이길 수 있는지 가늠한다. 무능하면 그냥 덤빈다. */
      const judge = lerp(.45, 1, a.g.int);
      if (power * judge > mine || a.hp < 34 || child) {
        if (d < threatD) { threat = o; threatD = d; }
      }
    }
    if (threat && (threatD < sense * .62 || a.hp < 40)) {
      a.act = 'flee'; a.targetId = threat.id;
      a.target = { x: a.x + (a.x - threat.x), y: a.y + (a.y - threat.y) };
      a.mood = clamp(a.mood - .1, 0, 1);
      return;
    }

    /* 굶으면 먹는 게 먼저 */
    if (starving) { if (this.seekFood(a, sense * 1.5)) return; }

    /* 싸움 — 전쟁 중이거나 몹시 미울 때 */
    if (!child && a.cool.fight <= 0 && a.hp > 45) {
      let foe = null, best = 0;
      for (let ni = 0; ni < nn; ni++) {
        const o = neigh[ni];
        if (o.age < CHILD_END && a.g.aggr < .85) continue;   // 아이를 때리는 건 아주 사나운 것들뿐
        const war = this.atWar(a, o);
        const hate = -this.rel(a, o);
        if (!war && hate < .45) continue;
        const mine = this.power(a), theirs = this.power(o);
        const win = mine / (mine + theirs);
        const want = (war ? .55 : 0) + hate * .5 + a.g.aggr * cfg.aggression * .6
                   + (hungry ? .15 : 0) - (1 - win) * lerp(.2, 1.5, a.g.int);
        if (want > best) { best = want; foe = o; }
      }
      if (foe && best > .5) {
        a.act = 'fight'; a.targetId = foe.id; a.target = null;
        return;
      }
    }

    /* 함정 다루기 — 손재주와 눈썰미 */
    const trap = this.senseTrap(a, sense * .5);
    if (trap) {
      if (a.know.has(trap.id)) {
        if (a.g.craft > .5 && trap.clan !== a.clan && a.cool.trap <= 0) {
          a.act = 'disarm'; a.target = { x: trap.x, y: trap.y }; a.targetId = 0; a._trap = trap;
          return;
        }
      }
    }

    /* 함정 놓기 — 다툼이 있는 쪽 경계에 */
    if (!child && a.g.craft > .42 && a.cool.trap <= 0 && cfg.trapRate > 0 &&
        this.traps.length < 60 * cfg.trapRate && Math.random() < .30 * cfg.trapRate) {
      const ca = this.clanOf(a);
      if (ca && ca.wars.size > 0 || a.g.aggr > .6) {
        a.act = 'build'; a.target = { x: a.x + gauss(0, 70), y: a.y + gauss(0, 70) };
        return;
      }
    }

    /* 배가 고프면 */
    if (hungry && this.seekFood(a, sense * 1.2)) return;

    /* 아이는 논다 — 놀면서 친해지고 배운다 */
    if (child && a.cool.play <= 0) {
      let mate = null, teacher = null;
      for (let ni = 0; ni < nn; ni++) {
        const o = neigh[ni];
        if (!mate && o.age < CHILD_END + 6) mate = o;
        if (!teacher && o.age > a.maxAge * .6 && o.lore > .3) teacher = o;
      }
      if (mate) { a.act = 'play'; a.targetId = mate.id; a.target = null; return; }
      if (teacher && Math.random() < .5) { a.act = 'learn'; a.targetId = teacher.id; a.target = null; return; }
    }

    /* 늙은이는 가르친다 */
    if (old && a.lore > .25 && a.cool.teach <= 0) {
      for (let ni = 0; ni < nn; ni++) {
        const o = neigh[ni];
        if (o.age < CHILD_END + 4) { a.act = 'teach'; a.targetId = o.id; a.target = null; return; }
      }
    }

    /* 새끼 낳기 */
    if (!child && !old && a.energy > 62 && a.cool.mate <= 0 && cfg.birth > 0 &&
        this.agents.length < cfg.maxPop) {
      let best = null, bs = .38;
      for (let ni = 0; ni < nn; ni++) {
        const o = neigh[ni];
        if (o.age < CHILD_END || o.age > o.maxAge * .74) continue;
        if (o.energy < 55 || o.cool.mate > 0) continue;
        const r = Math.min(this.rel(a, o), this.rel(o, a));
        if (r > bs) { bs = r; best = o; }
      }
      if (best && Math.random() < .5 * a.g.fert * cfg.birth) {
        a.act = 'mate'; a.targetId = best.id; a.target = null; return;
      }
    }

    /* 어울리기 */
    if (a.cool.talk <= 0 && nn > 0 && Math.random() < .25 + a.g.soc * .5) {
      let best = null, bs = -2;
      for (let ni = 0; ni < nn; ni++) {
        const o = neigh[ni];
        if (this.atWar(a, o)) continue;
        const r = this.rel(a, o);
        const same = o.clan === a.clan && a.clan > 0;
        /* 순수한 아이는 편을 가리지 않는다 — 그래서 가끔 전쟁을 끝낸다 */
        const bias = child ? .35 : same ? .3 : -.15;
        const s = r + bias + a.g.soc * .25 + (Math.random() - .5) * .2;
        if (s > bs) { bs = s; best = o; }
      }
      if (best && bs > -.05) { a.act = 'talk'; a.targetId = best.id; a.target = null; return; }
    }

    /* 먹이 챙기기 */
    if (a.energy < 78 && this.seekFood(a, sense)) return;

    /* 쉬거나 돌아다니기 */
    if (a.energy < 40 || (old && Math.random() < .3)) { a.act = 'rest'; a.target = null; return; }
    a.act = 'wander';
    if (!a.target || Math.random() < .25) {
      const ca = this.clanOf(a);
      const roam = 120 + a.g.cur * 320;
      let bx, by;
      if (ca && Math.random() > a.g.cur * .8) { bx = ca.cx; by = ca.cy; }
      else { bx = a.x; by = a.y; }
      a.target = { x: clamp(bx + gauss(0, roam), 20, World.WW - 20),
                   y: clamp(by + gauss(0, roam), 20, World.WH - 20) };
    }
  },

  seekFood(a, r) {
    const spot = World.bestFood(a.x, a.y, r, a.g.int > .32 || a.lore > .35);
    if (!spot) return false;
    a.act = 'eat'; a.target = spot; a.targetId = 0;
    return true;
  },

  power(a) {
    const age = a.age < CHILD_END ? .35 : a.age > a.maxAge * .74 ? .62 : 1;
    return (12 + a.g.aggr * 26 + a.sk.fight * 22) * age * (a.hp / 100) * (.6 + a.g.spd * .4);
  },

  /* ── 행동 실행 ───────────────────────────────────────── */
  applyMove(a, dt, child, old) {
    const cfg = this.cfg;
    let tx = null, ty = null, urgency = 1;

    const t = a.targetId ? this.byId.get(a.targetId) : null;
    if (a.targetId && (!t || !t.alive)) { a.targetId = 0; a.act = 'wander'; a.target = null; }

    switch (a.act) {
      case 'eat': {
        if (!a.target) break;
        tx = a.target.x; ty = a.target.y;
        if (Math.hypot(a.x - tx, a.y - ty) < 11) {
          const got = World.eat(a.target.i, dt * 34 * (.6 + a.sk.forage * .8));
          a.energy = Math.min(100, a.energy + got * 26);
          a.sk.forage = clamp(a.sk.forage + dt * .02 * (.4 + a.g.int), 0, 1);
          if (got < .003) { a.target = null; a.act = 'wander'; }
        }
        break;
      }
      case 'flee': urgency = 1.5; if (a.target) { tx = a.target.x; ty = a.target.y; } break;
      case 'rest': a.energy = Math.min(100, a.energy + dt * .5); a.vx *= .82; a.vy *= .82; break;

      case 'fight': {
        if (!t) break;
        tx = t.x; ty = t.y; urgency = 1.25;
        if (Math.hypot(a.x - tx, a.y - ty) < 15) this.doFight(a, t, dt);
        break;
      }
      case 'talk': {
        if (!t) break;
        tx = t.x; ty = t.y;
        if (Math.hypot(a.x - tx, a.y - ty) < 20) this.doTalk(a, t, dt);
        break;
      }
      case 'play': {
        if (!t) break;
        tx = t.x + Math.cos(this.time * 3 + a.id) * 26;
        ty = t.y + Math.sin(this.time * 3 + a.id) * 26;
        if (Math.hypot(a.x - t.x, a.y - t.y) < 34) this.doPlay(a, t, dt);
        break;
      }
      case 'learn': case 'teach': {
        if (!t) break;
        tx = t.x; ty = t.y;
        if (Math.hypot(a.x - tx, a.y - ty) < 22) {
          const from = a.act === 'teach' ? a : t, to = a.act === 'teach' ? t : a;
          this.doTeach(from, to, dt);
        }
        break;
      }
      case 'mate': {
        if (!t) break;
        tx = t.x; ty = t.y;
        if (Math.hypot(a.x - tx, a.y - ty) < 17) this.doMate(a, t);
        break;
      }
      case 'build': {
        if (!a.target) break;
        tx = a.target.x; ty = a.target.y;
        if (Math.hypot(a.x - tx, a.y - ty) < 14) { this.buildTrap(a); a.act = 'wander'; a.target = null; }
        break;
      }
      case 'disarm': {
        if (!a._trap || !a._trap.armed) { a.act = 'wander'; a._trap = null; break; }
        tx = a._trap.x; ty = a._trap.y;
        if (Math.hypot(a.x - tx, a.y - ty) < 14) { this.disarmTrap(a, a._trap); a.act = 'wander'; a._trap = null; }
        break;
      }
      default:
        if (a.target) { tx = a.target.x; ty = a.target.y; }
    }

    if (tx == null) {
      if (a.act !== 'rest') { a.vx *= .9; a.vy *= .9; }
    } else {
      this.steer(a, tx, ty, dt, urgency, child, old);
    }

    /* 함정을 아는 개체는 그 자리를 피해 간다 */
    if (a.know.size && this.trapHash.size && (this.tick + a.think) % 3 === 1) {
      this.eachTrapNear(a.x, a.y, tr => {
        if (!tr.armed || !a.know.has(tr.id)) return;
        const dx = a.x - tr.x, dy = a.y - tr.y, d = Math.hypot(dx, dy);
        if (d < 34) { a.vx += dx / (d + .1) * 46 * dt * 8; a.vy += dy / (d + .1) * 46 * dt * 8; }
      });
    }

    /* 실제 이동 */
    const inf = World.infoAt(a.x, a.y);
    const sp = Math.hypot(a.vx, a.vy);
    const maxSp = 42 * a.g.spd * inf.slow * (child ? .82 : old ? .68 : 1) * (a.energy < 18 ? .6 : 1);
    if (sp > maxSp) { a.vx = a.vx / sp * maxSp; a.vy = a.vy / sp * maxSp; }

    let nx = a.x + a.vx * dt, ny = a.y + a.vy * dt;
    if (!World.passableAt(nx, ny)) {
      /* 막히면 옆으로 돌아간다 */
      let ok = false;
      for (const ang of [.6, -.6, 1.3, -1.3, 2.2, -2.2, 3.0]) {
        const c = Math.cos(ang), s = Math.sin(ang);
        const rx = a.vx * c - a.vy * s, ry = a.vx * s + a.vy * c;
        const px = a.x + rx * dt, py = a.y + ry * dt;
        if (World.passableAt(px, py)) { a.vx = rx; a.vy = ry; nx = px; ny = py; ok = true; break; }
      }
      if (!ok) { a.vx = -a.vx * .4; a.vy = -a.vy * .4; nx = a.x; ny = a.y; }
    }
    a.x = clamp(nx, 6, World.WW - 6);
    a.y = clamp(ny, 6, World.WH - 6);
    if (Math.hypot(a.vx, a.vy) > 3) a.dir = Math.atan2(a.vy, a.vx);
  },

  steer(a, tx, ty, dt, urgency, child, old) {
    let dx = tx - a.x, dy = ty - a.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;

    /* 앞이 막혔으면 비껴 본다 */
    const probe = 22;
    if (!World.passableAt(a.x + dx * probe, a.y + dy * probe)) {
      for (const ang of [.5, -.5, 1.0, -1.0, 1.7, -1.7]) {
        const c = Math.cos(ang), s = Math.sin(ang);
        const rx = dx * c - dy * s, ry = dx * s + dy * c;
        if (World.passableAt(a.x + rx * probe, a.y + ry * probe)) { dx = rx; dy = ry; break; }
      }
    }
    /* 무서운 자리는 피한다 — 아는 만큼 */
    if (a.g.int > .3 || a.lore > .3) {
      const dr = World.dreadAt(a.x + dx * 30, a.y + dy * 30);
      if (dr > .25) { const c = Math.cos(1.1), s = Math.sin(1.1); const rx = dx * c - dy * s, ry = dx * s + dy * c; dx = rx; dy = ry; }
    }
    const acc = 150 * urgency * (child ? 1.1 : old ? .8 : 1);
    a.vx += dx * acc * dt;
    a.vy += dy * acc * dt;
  },

  /* ── 사귀기 ───────────────────────────────────────────── */
  doTalk(a, b, dt) {
    a.cool.talk = rand(2.5, 6); b.cool.talk = Math.max(b.cool.talk, rand(1.5, 4));
    const warm = (a.g.soc + b.g.soc) * .5;
    let d = .06 + warm * .13;

    /* 낯섦 — 생김새가 다르고 변종이면 밀어내는 마음이 생긴다.
       붙임성과 호기심이 그 마음을 눌러 준다.
       아이는 이 셈을 하지 않는다. 아이에게는 다름이 그저 다름이다. */
    if (a.age >= CHILD_END) {
      const dh = Math.abs(((b.g.hue - a.g.hue + 540) % 360) - 180) / 180;
      const strange = (a.variant !== b.variant ? .55 : 0) + dh * .6;
      const tol = a.g.soc * .55 + a.g.cur * .45;
      d -= strange * (1 - tol) * .24;
      /* 남의 무리 사람과는 좀처럼 깊어지지 않는다 */
      if (a.clan > 0 && b.clan > 0 && a.clan !== b.clan) d *= .45;
    }
    this.addRel(a, b, d);
    this.addRel(b, a, d * (.6 + b.g.soc * .6));
    a.sk.social = clamp(a.sk.social + .01, 0, 1);
    a.mood = clamp(a.mood + .06, 0, 1); b.mood = clamp(b.mood + .06, 0, 1);

    /* 아는 것을 나눈다 — 함정 자리, 세상 물정 */
    for (const id of a.know) if (!b.know.has(id) && Math.random() < .55) {
      b.know.add(id);
      if (Math.random() < .04) this.log('learn', `${a.name}이(가) ${b.name}에게 함정 자리를 일러 주었다`, b);
    }
    for (const id of b.know) if (!a.know.has(id) && Math.random() < .55) a.know.add(id);
    const hi = Math.max(a.lore, b.lore);
    a.lore = Math.min(loreCap(a), lerp(a.lore, hi, .12 * (.4 + a.g.int)));
    b.lore = Math.min(loreCap(b), lerp(b.lore, hi, .12 * (.4 + b.g.int)));

    /* 뒷말 — 내가 미워하는 것을 너도 조금 미워하게 된다 */
    if (Math.random() < .4 * a.g.soc) {
      let worst = null, wv = -.35;
      for (const [id, v] of a.rel) if (v < wv) { wv = v; worst = id; }
      if (worst && worst !== b.id) {
        const cur = b.rel.get(worst) || 0;
        b.rel.set(worst, clamp(cur + wv * .28 * (1 - b.g.int * .4), -1, 1));
      }
    }

    /* 구역끼리도 조금 누그러진다 */
    if (a.clan !== b.clan) this.addClanRel(this.clanOf(a), this.clanOf(b), .035 + warm * .03);

    /* 사이가 아주 좋아지면 */
    if (this.rel(a, b) > .78 && Math.random() < .02) {
      this.log('bond', `${a.name}과 ${b.name}이 둘도 없는 사이가 되었다`, a);
      a.flash = 1; a.flashC = '#7ee0a8'; b.flash = 1; b.flashC = '#7ee0a8';
    }
  },

  doPlay(a, b, dt) {
    a.cool.play = rand(3, 7);
    a.energy -= dt * 3; b.energy -= dt * 2;
    this.addRel(a, b, .14); this.addRel(b, a, .12);
    a.mood = clamp(a.mood + .16, 0, 1); b.mood = clamp(b.mood + .16, 0, 1);
    a.sk.social = clamp(a.sk.social + .02, 0, 1);
    a.sk.fight = clamp(a.sk.fight + .004, 0, 1);   // 뒹굴며 배우는 것도 있다
    /* 다른 구역 아이끼리 놀면 어른들 사이도 풀린다 */
    if (a.clan !== b.clan) {
      this.addClanRel(this.clanOf(a), this.clanOf(b), .09);
      if (Math.random() < .012) this.log('play', `${a.name}과 ${b.name}이 편을 잊고 어울려 놀았다`, a);
    }
  },

  doTeach(from, to, dt) {
    from.cool.teach = rand(6, 12);
    const gain = (from.lore - to.lore) * .3 * (.35 + to.g.int);
    if (gain > 0) to.lore = clamp(to.lore + gain, 0, loreCap(to));
    for (const id of from.know) if (!to.know.has(id) && Math.random() < .8) to.know.add(id);
    to.sk.forage = clamp(to.sk.forage + from.sk.forage * .12, 0, 1);
    this.addRel(to, from, .10); this.addRel(from, to, .08);
    if (Math.random() < .015) this.log('teach', `${from.name}이(가) ${to.name}에게 아는 것을 물려주었다`, to);
  },

  doMate(a, b) {
    if (this.agents.length >= this.cfg.maxPop) return;
    a.cool.mate = rand(28, 55) / this.cfg.birth;
    b.cool.mate = rand(28, 55) / this.cfg.birth;
    a.energy -= 22; b.energy -= 18;
    a.births++; b.births++;

    const { g, variant } = mixGenes(a.g, b.g, this.cfg.mutation);
    const c = makeAgent(a.x + gauss(0, 12), a.y + gauss(0, 12), g,
                        Math.max(a.gen, b.gen) + 1, [a.id, b.id]);
    if (!World.passableAt(c.x, c.y)) { c.x = a.x; c.y = a.y; }
    c.variant = variant;
    c.born = this.time;
    /* 부모에게서 물려받는 것 — 아는 자리와 마음 */
    c.lore = Math.min(loreCap(c), Math.max(a.lore, b.lore) * .30);
    for (const id of a.know) if (Math.random() < .5) c.know.add(id);
    for (const id of b.know) if (Math.random() < .5) c.know.add(id);
    this.addRel(c, a, .55); this.addRel(a, c, .65);
    this.addRel(c, b, .55); this.addRel(b, c, .65);
    c.clan = a.clan;
    this.add(c);
    this.born++;
    c.flash = 1; c.flashC = '#ffe9a8';
    this.log(variant ? 'variant' : 'birth',
      variant ? `${c.name}이(가) 태어났다 — 어딘가 다르다`
              : `${a.name}과 ${b.name} 사이에서 ${c.name}이(가) 태어났다`, c);
  },

  doFight(a, b, dt) {
    a.cool.fight = rand(1.2, 3);
    const pa = this.power(a), pb = this.power(b);
    const dmg = dt * 26 * (pa / (pa + pb) + .25);
    b.hp -= dmg;
    a.hp -= dt * 26 * (pb / (pa + pb) + .12) * .5;
    a.sk.fight = clamp(a.sk.fight + dt * .05, 0, 1);
    b.sk.fight = clamp(b.sk.fight + dt * .03, 0, 1);
    a.energy -= dt * 4;
    this.addRel(b, a, -.32 * dt * 6);
    this.addRel(a, b, -.12 * dt * 6);
    b.mood = clamp(b.mood - dt, 0, 1);
    b.scars += dt * .1;
    a.flash = .6; a.flashC = '#ff8a72';

    /* 보는 눈이 있다 — 편을 든다 */
    if (Math.random() < dt * 3) {
      for (const w of this.near(a.x, a.y, 90)) {
        if (w === a || w === b || !w.alive) continue;
        if (this.rel(w, b) > .3) this.addRel(w, a, -.09);
        if (this.rel(w, a) > .3) this.addRel(w, b, -.05);
      }
    }
    this.addClanRel(this.clanOf(a), this.clanOf(b), -.055 * dt * 6 * this.cfg.aggression);

    if (b.hp <= 0) {
      a.kills++;
      this.kill(b, `${a.name}의 손`);
      /* 죽음은 오래 남는다 */
      for (const w of this.near(b.x, b.y, 150)) {
        if (w === a || !w.alive) continue;
        if (this.rel(w, b) > .2) this.addRel(w, a, -.5);
        w.scars += .05;
      }
      this.addClanRel(this.clanOf(a), this.clanOf(b), -.30 * this.cfg.aggression);
      World.markDread(b.x, b.y, .5);
    }
  },

  /* ── 함정 ─────────────────────────────────────────────── */
  buildTrap(a) {
    a.cool.trap = rand(25, 60) / Math.max(.2, this.cfg.trapRate);
    a.energy -= 9;
    a.sk.craft = clamp(a.sk.craft + .05, 0, 1);
    const cover = World.infoAt(a.x, a.y).cover;
    const t = {
      id: this.nextTrapId++, x: a.x, y: a.y,
      owner: a.id, clan: a.clan,
      power: 26 + a.g.craft * 52 + a.sk.craft * 26,
      hide: clamp(.25 + a.g.craft * .5 + cover * .4, 0, .96),
      armed: true, age: 0, seen: 0,
    };
    this.traps.push(t);
    a.know.add(t.id);
    /* 같은 편에게는 알려 준다 */
    for (const o of this.near(a.x, a.y, 190)) {
      if (o.clan === a.clan && a.clan > 0 && Math.random() < .7) o.know.add(t.id);
    }
    if (Math.random() < .18) this.log('trap', `${a.name}이(가) 무언가를 묻어 두었다`, a);
  },

  /* 자리 둘레의 함정만 훑는다 */
  eachTrapNear(x, y, fn) {
    if (!this.trapHash.size) return;
    const gx = (x / this.TS) | 0, gy = (y / this.TS) | 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const l = this.trapHash.get((gy + dy + 64) * 512 + (gx + dx + 64));
        if (!l) continue;
        for (let i = 0; i < l.length; i++) if (fn(l[i]) === true) return;
      }
  },

  senseTrap(a, r) {
    if (!this.trapHash.size) return null;
    const found = [];
    this.eachTrapNear(a.x, a.y, t => { if (t.armed) found.push(t); });
    for (const t of found) {
      const d = Math.hypot(a.x - t.x, a.y - t.y);
      if (d > r) continue;
      if (a.know.has(t.id)) return t;
      /* 눈썰미 — 경계심과 지능과 배운 것 */
      const see = a.g.vig * .55 + a.g.int * .3 + a.lore * .35 - t.hide;
      if (see > .12 && Math.random() < .3) {
        a.know.add(t.id);
        t.seen++;
        if (Math.random() < .10) this.log('spot', `${a.name}이(가) 함정을 알아챘다`, a);
        return t;
      }
    }
    return null;
  },

  disarmTrap(a, t) {
    a.cool.trap = rand(8, 18);
    const ok = Math.random() < clamp(.25 + a.g.craft * .55 + a.sk.craft * .3 + a.g.int * .2, 0, .95);
    if (ok) {
      t.armed = false;
      a.sk.craft = clamp(a.sk.craft + .07, 0, 1);
      a.saved++;
      a.flash = .8; a.flashC = '#8fd6ff';
      if (Math.random() < .35) this.log('disarm', `${a.name}이(가) 함정을 못 쓰게 만들었다`, a);
      const idx = this.traps.indexOf(t);
      if (idx >= 0) this.traps.splice(idx, 1);
    } else {
      this.trigger(a, t);
    }
  },

  checkTraps(a) {
    if (!this.trapHash.size) return;
    let hit = null;
    this.eachTrapNear(a.x, a.y, t => {
      if (!t.armed) return;
      if (t.clan === a.clan && a.clan > 0) return;        // 제 편 것은 밟지 않는다
      if (a.know.has(t.id)) return;
      const dx = a.x - t.x, dy = a.y - t.y;
      if (dx * dx + dy * dy > 81) return;
      hit = t;
      return true;
    });
    if (!hit) return;
    /* 마지막 순간의 눈썰미 */
    const dodge = a.g.vig * .4 + a.g.int * .25 + a.lore * .3;
    if (Math.random() < dodge * .5) { a.know.add(hit.id); return; }
    this.trigger(a, hit);
  },

  trigger(a, t) {
    t.armed = false;
    const idx = this.traps.indexOf(t);
    if (idx >= 0) this.traps.splice(idx, 1);
    a.hp -= t.power;
    a.scars += .2;
    a.mood = clamp(a.mood - .5, 0, 1);
    a.flash = 1; a.flashC = '#ff6b6b';
    World.markDread(t.x, t.y, .6);

    /* 본 것들은 배운다 — 남의 불행이 곧 지식이다 */
    for (const o of this.near(t.x, t.y, 170)) {
      if (o === a || !o.alive) continue;
      o.lore = clamp(o.lore + .02, 0, loreCap(o));
      const owner = this.byId.get(t.owner);
      if (owner && this.rel(o, a) > .25) this.addRel(o, owner, -.28);
    }
    const owner = this.byId.get(t.owner);
    if (owner) {
      this.addRel(a, owner, -.55);
      this.addClanRel(this.clanOf(a), this.clanOf(owner), -.16 * this.cfg.aggression);
    }
    if (a.hp <= 0) {
      this.kill(a, '함정');
      if (owner) owner.kills++;
    } else if (Math.random() < .5) {
      this.log('trapped', `${a.name}이(가) 함정에 걸렸다`, a);
    }
  },

  stepTraps(dt) {
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const t = this.traps[i];
      t.age += dt;
      if (t.age > 260) this.traps.splice(i, 1);         // 오래되면 삭아 없어진다
    }
  },

  /* ── 죽음 ─────────────────────────────────────────────── */
  kill(a, cause) {
    if (!a.alive) return;
    a.alive = false;
    a.deadAt = this.time;
    a.cause = cause;
    this.died++;
    World.markDread(a.x, a.y, .25);
    /* 남은 이들의 마음 */
    for (const o of this.near(a.x, a.y, 200)) {
      if (o === a || !o.alive) continue;
      const r = this.rel(o, a);
      if (r > .3) { o.mood = clamp(o.mood - r * .5, 0, 1); o.scars += r * .08; }
    }
    const rare = ['늙음', '함정'].includes(cause) || Math.random() < .3;
    if (rare) {
      const age = Math.round(a.age);
      this.log('death', `${a.name}이(가) ${cause}(으)로 죽었다 (${age}살)`, a);
    }
  },

  remove(a, quiet) {
    if (!a.alive) return;
    a.alive = false;
    this.died++;
    if (!quiet) this.log('erase', `${a.name}이(가) 사라졌다`, a);
  },

  /* ═════════════════════════════════════════════════════════
     구역 — 가까이 있고 서로 좋아하는 것들이 저절로 무리가 된다
     ═════════════════════════════════════════════════════════ */
  recalcClans() {
    const A = this.agents.filter(a => a.alive && a.age >= CHILD_END * .5);
    const n = A.length;
    if (!n) { this.clans = []; return; }

    /* 유니온 파인드 */
    const parent = new Int32Array(n);
    for (let i = 0; i < n; i++) parent[i] = i;
    const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
    const union = (i, j) => { const a = find(i), b = find(j); if (a !== b) parent[b] = a; };

    const idxOf = new Map();
    A.forEach((a, i) => idxOf.set(a.id, i));

    for (let i = 0; i < n; i++) {
      const a = A[i];
      const cnt = this.nearBuf(a.x, a.y, 112, a);
      for (let bi = 0; bi < cnt; bi++) {
        const b = this._nb[bi];
        const j = idxOf.get(b.id);
        if (j === undefined || j <= i) continue;
        const d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        const mutual = Math.min(this.rel(a, b), this.rel(b, a));
        const kin = (a.parents && a.parents.includes(b.id)) ||
                    (b.parents && b.parents.includes(a.id));
        /* 가까이서 서로 좋아하면 한 무리 */
        if (d2 < 96 * 96 && (mutual > .14 || (kin && mutual > -.1))) { union(i, j); continue; }
        /* 이미 한 무리였다면 조금 멀어지고 데면데면해도 쉽게 흩어지지 않는다 —
           무리는 관성이 있어야 서로 오래 미워하고 오래 화해할 수 있다 */
        if (a.clan > 0 && a.clan === b.clan && mutual > -.08) union(i, j);
      }
    }

    /* 덩어리 모으기 */
    const groups = new Map();
    for (let i = 0; i < n; i++) {
      const r = find(i);
      let g = groups.get(r);
      if (!g) groups.set(r, g = []);
      g.push(A[i]);
    }

    const fresh = [];
    for (const [, members] of groups) {
      if (members.length < 4) { for (const m of members) m._newClan = -1; continue; }
      fresh.push(members);
    }

    /* 이전 구역과 이어 붙이기 — 이름과 색을 잇는다 */
    const oldClans = this.clans;
    const usedOld = new Set();
    const next = [];
    const originCount = new Map();     // 옛 구역이 몇 조각으로 갈라졌는지

    /* 각 덩어리가 어느 옛 구역에서 왔는지 */
    const claims = fresh.map(members => {
      const tally = new Map();
      for (const m of members) if (m.clan > 0) tally.set(m.clan, (tally.get(m.clan) || 0) + 1);
      let best = 0, bn = 0;
      for (const [cid, c] of tally) if (c > bn) { bn = c; best = cid; }
      if (best) originCount.set(best, (originCount.get(best) || 0) + 1);
      return { members, origin: best, share: bn };
    });

    /* 큰 조각이 옛 이름을 물려받는다 */
    claims.sort((a, b) => b.share - a.share);
    for (const cl of claims) {
      let clan = null;
      if (cl.origin && !usedOld.has(cl.origin)) {
        clan = oldClans.find(c => c.id === cl.origin);
        if (clan) usedOld.add(cl.origin);
      }
      if (!clan) {
        clan = this.newClan();
        if (cl.origin && originCount.get(cl.origin) > 1) {
          const from = oldClans.find(c => c.id === cl.origin);
          clan.hue = from ? (from.hue + rand(28, 70)) % 360 : clan.hue;
          /* 조각이 제법 커야 '분열'이라 부를 만하다 */
          if (cl.members.length >= 5)
            this.log('split', `${from ? from.name : '어떤 무리'}에서 ${clan.name}이(가) 갈라져 나왔다`, cl.members[0]);
          /* 갈라선 사이는 서먹하다 */
          if (from) this.addClanRel(clan, from, -.34);
        } else if (cl.members.length >= 5) {
          this.log('found', `${clan.name}이(가) 자리를 잡았다`, cl.members[0]);
        }
      }
      clan.members = cl.members;
      next.push(clan);
      for (const m of cl.members) m._newClan = clan.id;
    }

    /* 사라진 구역 */
    for (const c of oldClans) {
      if (next.includes(c)) continue;
      this.log('gone', `${c.name}이(가) 흩어졌다`, null);
      for (const c2 of next) { c2.rel.delete(c.id); c2.wars.delete(c.id); }
    }

    /* 반영 */
    for (const a of this.agents) {
      const nc = a._newClan === undefined ? (a.age < CHILD_END * .5 ? a.clan : -1) : a._newClan;
      if (a.alive) {
        if (a.clan > 0 && nc === -1) a.clanTime = 0;
        a.clan = nc;
      }
      delete a._newClan;
    }
    /* 아이는 부모 곁 구역에 붙는다 */
    for (const a of this.agents) {
      if (!a.alive || a.clan > 0 || a.age >= CHILD_END * .5) continue;
      const near = this.near(a.x, a.y, 80).find(o => o.clan > 0);
      if (near) a.clan = near.clan;
    }

    this.clans = next;
    for (const c of this.clans) {
      let sx = 0, sy = 0, ag = 0, op = 0, pw = 0;
      for (const m of c.members) { sx += m.x; sy += m.y; ag += m.g.aggr; op += m.g.soc; pw += this.power(m); }
      const k = c.members.length;
      c.cx = sx / k; c.cy = sy / k;
      c.culture = { aggr: ag / k, open: op / k };
      c.power = pw;
      c.size = k;
      c.age = (c.age || 0) + 1;
    }
  },

  newClan() {
    const c = {
      id: this.nextClanId++,
      name: pick(CLANWORD) + pick(CLANTAIL),
      hue: Math.random() * 360,
      members: [], rel: new Map(), wars: new Set(),
      cx: 0, cy: 0, power: 0, size: 0, age: 0,
      culture: { aggr: .5, open: .5 },
      born: this.time,
    };
    return c;
  },

  /* 구역 사이의 기운 — 가까이 붙어 있으면 긴장이, 멀면 무관심이 */
  stepClanMood(dt) {
    const cs = this.clans;
    for (let i = 0; i < cs.length; i++) {
      for (let j = i + 1; j < cs.length; j++) {
        const a = cs[i], b = cs[j];
        const d = Math.hypot(a.cx - b.cx, a.cy - b.cy);
        const reach = 150 + Math.sqrt(a.size + b.size) * 26;
        const war = a.wars.has(b.id);
        let drift = 0;
        if (d < reach) {
          /* 맞닿으면 자원 다툼 — 사나운 무리일수록 빨리 틀어진다.
             이미 싸우는 사이라면 더 나빠질 것도 없다(피가 마르길 기다린다) */
          const press = (1 - d / reach) * (war ? .25 : 1);
          drift -= press * .05 * dt * (a.culture.aggr + b.culture.aggr) * this.cfg.aggression;
          drift += press * .018 * dt * (a.culture.open + b.culture.open) * .5;
        } else {
          drift += .012 * dt;      // 멀어지면 앙금이 옅어진다
        }
        /* 오래 싸우면 지친다 — 지치면 화해가 온다 */
        if (war) {
          const dur = this.time - (a.warSince || this.time);
          drift += Math.min(.16, .02 + Math.max(0, dur - 30) * .003) * dt;
          if (a.size < 7 || b.size < 7) drift += .07 * dt;      // 한쪽이 꺾이면 끝이 온다
        }
        if (drift) this.addClanRel(a, b, drift);
      }
    }
  },

  /* 배척 — 무리가 누군가를 밀어낸다 */
  checkOutcasts() {
    for (const c of this.clans) {
      if (c.members.length < 5) continue;
      for (const m of c.members) {
        if (m.age < CHILD_END) continue;
        /* 아무 감정도 없는 이는 셈에서 뺀다 — 미워하거나 아끼는 이들만 판을 놓는다 */
        let sum = 0, cnt = 0, looked = 0;
        for (const o of c.members) {
          if (looked++ > 26) break;
          if (o === m) continue;
          const v = o.rel.get(m.id);
          if (v === undefined) continue;
          sum += v; cnt++;
        }
        if (cnt < 4) continue;
        const avg = sum / cnt;
        if (avg < -.18) {
          m.clan = -1; m.outcast++; m.clanTime = 0;
          m.mood = clamp(m.mood - .3, 0, 1);
          m.scars += .1;
          if (Math.random() < .55) this.log('outcast', `${c.name}이(가) ${m.name}을(를) 밀어냈다`, m);
        }
      }
    }
  },

  /* ── 통계 ─────────────────────────────────────────────── */
  stats() {
    let child = 0, adult = 0, old = 0, lone = 0, smart = 0, dull = 0, pure = 0, variant = 0;
    let ageSum = 0, loreSum = 0;
    for (const a of this.agents) {
      if (!a.alive) continue;
      if (a.age < CHILD_END) child++;
      else if (a.age > a.maxAge * .74) old++;
      else adult++;
      if (a.clan < 0) lone++;
      if (a.g.int > .72) smart++;
      if (a.g.int < .28) dull++;
      if (a.scars < .1 && a.age < 30) pure++;
      if (a.variant) variant++;
      ageSum += a.age; loreSum += a.lore;
    }
    const n = this.agents.length || 1;
    let wars = 0;
    for (const c of this.clans) wars += c.wars.size;
    return {
      pop: this.agents.length, child, adult, old, lone, smart, dull, pure, variant,
      clans: this.clans.length, wars: wars / 2,
      traps: this.traps.length,
      avgAge: ageSum / n, avgLore: loreSum / n,
      born: this.born, died: this.died, peak: this.peak,
      gen: this.agents.reduce((m, a) => Math.max(m, a.gen), 1),
    };
  },
};
