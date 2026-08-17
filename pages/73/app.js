/* ══════════════════════════════════════════════════════════════
   MythicCraft 통합 위키 — 뷰어
   데이터: git.mythiccraft.io 공식 위키 (11개 저장소) 자동 추출
   ══════════════════════════════════════════════════════════════ */
(function () {
'use strict';

var META = window.MC_META, KO = window.MC_KO || {};
var IDX = META.idx, CATS = META.cats, CORDER = META.catOrder, PLUGS = META.plugins;

var PMAP = {};                    // 플러그인 키 -> 정의
PLUGS.forEach(function (p) { PMAP[p.k] = p; });

var BYID = {}, PATH = {}, BASE = {};
IDX.forEach(function (e) {
  BYID[e.i] = e;
  PATH[e.p + '|' + e.k] = e.i;
  var b = e.k.split('/').pop();
  if (!BASE[e.p + '|' + b]) BASE[e.p + '|' + b] = e.i;
  if (!BASE['*|' + b]) BASE['*|' + b] = e.i;
  var kf = e.f.toLowerCase();
  e.ko = KO[e.p + '|' + e.c + '|' + kf] || KO[e.p + '|' + kf] ||
           KO['*|' + e.c + '|' + kf] || KO['*|' + kf] || '';
  e._s = (e.n + ' ' + e.f + ' ' + (e.a || []).join(' ') + ' ' + e.ko + ' ' + e.d).toLowerCase();
});

var CCNT = {};                    // 플러그인별 카테고리 개수
IDX.forEach(function (e) {
  (CCNT[e.p] = CCNT[e.p] || {})[e.c] = (CCNT[e.p][e.c] || 0) + 1;
});

var $ = function (s) { return document.querySelector(s); };
var tabsEl = $('#tabs'), catsEl = $('#cats'), listEl = $('#list'), docEl = $('#docInner');
var searchEl = $('#search'), cntEl = $('#cnt'), sideEl = $('#side'), ovlEl = $('#ovl');

var state = { plug: 'home', cat: null, id: null, q: '', orig: false };
try { state.orig = localStorage.getItem('mcwiki_orig') === '1'; } catch (err) {}

function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

/* ─────────────────────────── 탭 ─────────────────────────── */
function renderTabs() {
  var h = '<button class="tab' + (state.plug === 'home' ? ' on' : '') + '" data-p="home">🏠 홈</button>';
  PLUGS.forEach(function (p) {
    h += '<button class="tab' + (state.plug === p.k ? ' on' : '') + '" data-p="' + p.k + '">' +
      '<span class="dot" style="background:' + p.c + '"></span>' + esc(p.n) +
      '<span class="n">' + (CCNT[p.k] ? Object.keys(CCNT[p.k]).reduce(function (a, c) { return a + CCNT[p.k][c]; }, 0) : 0) + '</span></button>';
  });
  tabsEl.innerHTML = h;
  [].forEach.call(tabsEl.children, function (b) {
    b.onclick = function () { go(b.dataset.p, null, null); };
  });
  var on = tabsEl.querySelector('.tab.on');
  if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
}

/* ─────────────────── 카테고리 · 목록 ─────────────────── */
function renderCats() {
  if (state.plug === 'home' || state.q) { catsEl.style.display = 'none'; return; }
  catsEl.style.display = 'flex';
  var cc = CCNT[state.plug] || {}, h = '';
  var tot = Object.keys(cc).reduce(function (a, c) { return a + cc[c]; }, 0);
  h += '<button class="cat' + (state.cat ? '' : ' on') + '" data-c="">전체<b>' + tot + '</b></button>';
  CORDER.forEach(function (c) {
    if (!cc[c]) return;
    h += '<button class="cat' + (state.cat === c ? ' on' : '') + '" data-c="' + c + '">' +
      esc(CATS[c]) + '<b>' + cc[c] + '</b></button>';
  });
  catsEl.innerHTML = h;
  [].forEach.call(catsEl.children, function (b) {
    b.onclick = function () { go(state.plug, b.dataset.c || null, null); };
  });
}

function matches(e, q) {
  if (!q) return true;
  var w = q.split(/\s+/).filter(Boolean);
  for (var i = 0; i < w.length; i++) if (e._s.indexOf(w[i]) < 0) return false;
  return true;
}

function score(e, q) {
  var n = e.f.toLowerCase(), s = 0;
  if (n === q) s += 100;
  else if (n.indexOf(q) === 0) s += 60;
  else if (n.indexOf(q) >= 0) s += 30;
  if ((e.a || []).some(function (a) { return a.toLowerCase() === q; })) s += 80;
  if (e.ko && e.ko.indexOf(q) >= 0) s += 20;
  if (e.c === 'mech' || e.c === 'cond' || e.c === 'targ' || e.c === 'trig') s += 6;
  return s;
}

function currentList() {
  var q = state.q.trim().toLowerCase();
  if (q) {
    var r = IDX.filter(function (e) { return matches(e, q); });
    r.sort(function (a, b) { return score(b, q) - score(a, q); });
    return r.slice(0, 400);
  }
  return IDX.filter(function (e) {
    return e.p === state.plug && (!state.cat || e.c === state.cat);
  });
}

function hl(t, q) {
  if (!q) return esc(t);
  var out = esc(t), ws = q.split(/\s+/).filter(Boolean);
  ws.forEach(function (w) {
    var re = new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    out = out.replace(re, '<span class="hl">$1</span>');
  });
  return out;
}

function renderList() {
  var arr = currentList(), q = state.q.trim().toLowerCase(), h = '', lastc = null, lastp = null;
  cntEl.textContent = q ? arr.length + '건' : IDX.length + '개 문서';
  if (!arr.length) {
    listEl.innerHTML = '<div class="lempty">검색 결과가 없습니다.<br><br>영문 키워드로도 검색해 보세요.<br>(예: <code>projectile</code>, <code>aura</code>)</div>';
    return;
  }
  arr.forEach(function (e) {
    if (q) {
      if (e.p !== lastp) { h += '<div class="lhdr">' + esc(PMAP[e.p].n) + '</div>'; lastp = e.p; }
    } else if (e.c !== lastc) {
      h += '<div class="lhdr">' + esc(CATS[e.c] || e.c) + '</div>'; lastc = e.c;
    }
    var sub = e.ko || e.d;
    h += '<div class="itm' + (state.id === e.i ? ' on' : '') + '" data-i="' + esc(e.i) + '">' +
      '<div class="t">' + hl(e.n, q) + '</div>' +
      (sub ? '<div class="s">' + hl(sub, q) + '</div>' : '') +
      (q ? '<div class="pg">' + esc(CATS[e.c] || e.c) + '</div>' : '') +
      '</div>';
  });
  listEl.innerHTML = h;
  [].forEach.call(listEl.querySelectorAll('.itm'), function (d) {
    d.onclick = function () {
      var e = BYID[d.dataset.i];
      go(e.p, null, e.i);
      if (window.innerWidth <= 860) closeSide();
    };
  });
}

/* ─────────────────────── 문서 렌더 ─────────────────────── */
function openDoc(id) {
  var e = BYID[id];
  if (!e) { return; }
  docEl.innerHTML = '<div class="lempty">불러오는 중…</div>';
  var jobs = [MC.load(e.g)];
  if (state.orig) jobs.push(MC.loadO(e.g));
  Promise.all(jobs).then(function () {
    var d = MC.DOC[id];
    var body = (state.orig && MC.DOCO[id]) ? MC.DOCO[id].h : (d ? d.h : null);
    var p = PMAP[e.p];
    var h = '<div class="dhead">' +
      '<div class="crumb"><b>' + esc(p.n) + '</b> &nbsp;›&nbsp; ' + esc(CATS[e.c] || e.c) + '</div>' +
      '<h1>' + esc(e.n) + '</h1>' +
      (e.ko ? '<div class="ko">' + esc(e.ko) + '</div>' : '') +
      '<div class="meta">';
    (e.a || []).forEach(function (a) { h += '<span class="chip al">별칭 ' + esc(a) + '</span>'; });
    (e.t || []).forEach(function (t) { h += '<span class="chip tg">#' + esc(t) + '</span>'; });
    h += '<span class="chip ext" id="docLang">' + (state.orig ? '🇬🇧 원문(EN) — 번역으로' : '🇰🇷 한국어 번역 — 원문으로') + '</span>';
    if (d && d.u) h += '<a class="chip ext" href="' + esc(d.u) + '" target="_blank" rel="noopener">공식 위키 ↗</a>';
    h += '</div></div><div id="body">' + (body || '<p>문서를 불러오지 못했습니다.</p>') + '</div>';
    docEl.innerHTML = h;
    var lang = document.getElementById('docLang');
    if (lang) lang.onclick = toggleOrig;
    decorate(docEl);
    $('#doc').scrollTop = 0;
  });
}

/* 한국어 번역 ↔ 위키 원문 전환 */
function toggleOrig() {
  state.orig = !state.orig;
  try { localStorage.setItem('mcwiki_orig', state.orig ? '1' : '0'); } catch (err) {}
  syncOrigBtn();
  if (state.id) openDoc(state.id);
}

function syncOrigBtn() {
  var b = document.getElementById('origBtn');
  if (!b) return;
  b.textContent = state.orig ? '번역 KO' : '원문 EN';
  b.classList.toggle('on', state.orig);
}

function decorate(root) {
  /* 코드 블록: 하이라이트 + 복사 버튼 */
  [].forEach.call(root.querySelectorAll('pre.cb'), function (pre) {
    var code = pre.querySelector('code'), raw = code.textContent;
    if (pre.dataset.lang === 'yaml' || !pre.dataset.lang) code.innerHTML = yamlHL(raw);
    var w = document.createElement('div');
    w.className = 'cbw';
    pre.parentNode.insertBefore(w, pre);
    w.appendChild(pre);
    var b = document.createElement('button');
    b.className = 'cpy'; b.textContent = '복사';
    b.onclick = function () {
      navigator.clipboard.writeText(raw).then(function () {
        b.textContent = '복사됨 ✓'; b.classList.add('done');
        setTimeout(function () { b.textContent = '복사'; b.classList.remove('done'); }, 1400);
      });
    };
    w.appendChild(b);
  });
  /* 위키 내부 링크 */
  [].forEach.call(root.querySelectorAll('a.wl'), function (a) {
    var pth = (a.dataset.p || '').toLowerCase(), cur = state.id ? BYID[state.id].p : state.plug;
    var tgt = PATH[cur + '|' + pth] || BASE[cur + '|' + pth.split('/').pop()] ||
      PATH['mm|' + pth] || BASE['*|' + pth.split('/').pop()];
    if (tgt) {
      a.onclick = function (ev) { ev.preventDefault(); go(BYID[tgt].p, null, tgt); };
    } else if (a.dataset.x) {
      a.href = a.dataset.x; a.target = '_blank'; a.rel = 'noopener';
      a.classList.add('dead'); a.title = '이 페이지에 없는 문서 — 공식 위키에서 열림';
    }
  });
  /* 홈 카드 */
  [].forEach.call(root.querySelectorAll('[data-goto]'), function (d) {
    d.onclick = function () { go(d.dataset.goto, d.dataset.cat || null, d.dataset.id || null); };
  });
}

/* YAML / Mythic 문법 하이라이트 */
var YRE = /(#[^\n]*)|(^\s*[A-Za-z_][\w .'-]*:)|(~on[A-Za-z]+(?::[\w.<>%-]+)?)|(@[A-Za-z][\w]*)|(\?[!~]?[A-Za-z][\w]*)|(<[a-zA-Z][^<>\n]{0,80}>)|("(?:[^"\\\n]|\\.)*")|(^\s*-\s+[a-zA-Z][\w:]*)|(\b\d+(?:\.\d+)?\b)/gm;
function yamlHL(t) {
  var out = '', last = 0, m;
  YRE.lastIndex = 0;
  while ((m = YRE.exec(t))) {
    out += escC(t.slice(last, m.index));
    var cls = m[1] ? 'y-c' : m[2] ? 'y-k' : m[3] ? 'y-t' : m[4] ? 'y-g' : m[5] ? 'y-p' :
      m[6] ? 'y-a' : m[7] ? 'y-s' : m[8] ? 'y-m' : 'y-n';
    out += '<span class="' + cls + '">' + escC(m[0]) + '</span>';
    last = m.index + m[0].length;
  }
  out += escC(t.slice(last));
  return out;
}
function escC(s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }

/* ─────────────────────────── 홈 ─────────────────────────── */
function renderHome() {
  var total = IDX.length;
  var mech = IDX.filter(function (e) { return e.c === 'mech'; }).length;
  var cond = IDX.filter(function (e) { return e.c === 'cond'; }).length;
  var targ = IDX.filter(function (e) { return e.c === 'targ'; }).length;

  var cards = PLUGS.map(function (p) {
    var n = Object.keys(CCNT[p.k] || {}).reduce(function (a, c) { return a + CCNT[p.k][c]; }, 0);
    return '<div class="pcard" style="border-left-color:' + p.c + '" data-goto="' + p.k + '">' +
      '<h3 style="color:' + p.c + '">' + esc(p.n) + '</h3>' +
      '<div class="ko">' + esc(p.ko) + '</div>' +
      '<p>' + esc(p.d) + '</p>' +
      '<div class="n">문서 ' + n + '개</div></div>';
  }).join('');

  docEl.innerHTML =
'<div class="hero">' +
  '<h1>MythicCraft 공식 플러그인<br>통합 위키</h1>' +
  '<p>MythicMobs · ModelEngine 4 · Crucible · Dungeons · RPG · Enchants · HUD · Cosmetics · Armors · Achievements<br>' +
  '공식 위키의 모든 기능을 한 곳에서 검색하고 예시 구문까지 확인하세요.</p>' +
  '<div class="stats">' +
    '<div><b>' + total + '</b><span>전체 문서</span></div>' +
    '<div><b>' + mech + '</b><span>메카닉</span></div>' +
    '<div><b>' + cond + '</b><span>조건</span></div>' +
    '<div><b>' + targ + '</b><span>타게터</span></div>' +
    '<div><b>10</b><span>플러그인</span></div>' +
  '</div>' +
'</div>' +

'<div class="sect"><h2>플러그인 둘러보기</h2>' +
'<div class="sub">카드를 누르면 해당 플러그인의 문서 목록으로 이동합니다.</div>' +
'<div class="pgrid">' + cards + '</div></div>' +

'<div class="sect"><h2>스킬 한 줄 해부</h2>' +
'<div class="sub">미틱몹스의 모든 스킬은 아래 5개 부품의 조합입니다. 이것만 이해하면 나머지는 전부 목록 찾기입니다.</div>' +
'<div class="anat">' +
  '<div class="ln">' +
    '<span class="y-m">- damage</span>' +
    '<span class="y-a">{amount=10;ignoreArmor=true}</span> ' +
    '<span class="y-g">@PlayersInRadius{r=5}</span> ' +
    '<span class="y-t">~onTimer:40</span> ' +
    '<span class="y-p">?health{a=&lt;50%}</span> ' +
    '<span class="y-n">0.5</span>' +
  '</div>' +
  '<table>' +
  '<tr><td class="y-m">damage</td><td><b>메카닉</b> — 무엇을 할 것인가. 피해·소환·파티클·순간이동 등 ' + mech + '종.</td></tr>' +
  '<tr><td class="y-a">{...}</td><td><b>속성</b> — 메카닉의 세부 설정. <code>;</code> 로 구분하고 별칭(<code>a=10</code>)도 가능합니다.</td></tr>' +
  '<tr><td class="y-g">@Targeter</td><td><b>타게터</b> — 누구에게/어디에 적용할 것인가. ' + targ + '종. 생략하면 <code>@Self</code>.</td></tr>' +
  '<tr><td class="y-t">~onTrigger</td><td><b>트리거</b> — 언제 발동할 것인가. 몹의 <code>Skills:</code> 블록에서만 사용합니다.</td></tr>' +
  '<tr><td class="y-p">?condition</td><td><b>인라인 조건</b> — 어떤 상황에서만 실행할 것인가. ' + cond + '종. <code>?!</code> 는 부정.</td></tr>' +
  '<tr><td class="y-n">0.5</td><td><b>확률</b> — 맨 끝의 숫자는 실행 확률(0~1)입니다.</td></tr>' +
  '</table>' +
'</div></div>' +

'<div class="sect"><h2>5분 만에 첫 커스텀 몹</h2>' +
'<div class="sub">plugins/MythicMobs/Mobs/ 폴더에 <code>.yml</code> 파일을 만들고 아래를 붙여넣은 뒤 <code>/mm reload</code> → <code>/mm mobs spawn 화염기사</code></div>' +
'<pre class="cb" data-lang="yaml"><code>화염기사:\n' +
'  Type: WITHER_SKELETON          # 베이스가 될 바닐라 몹\n' +
'  Display: \'&c화염 기사\'\n' +
'  Health: 200\n' +
'  Damage: 8\n' +
'  Options:\n' +
'    MovementSpeed: 0.3\n' +
'    PreventOtherDrops: true\n' +
'    AlwaysShowName: true\n' +
'  Equipment:\n' +
'    - NETHERITE_SWORD HAND\n' +
'    - NETHERITE_HELMET HEAD\n' +
'  Skills:\n' +
'  # 5초마다 주변 8칸 플레이어에게 화염 폭발\n' +
'  - skill{s=화염폭발} @self ~onTimer:100\n' +
'  # 체력 50% 미만이 되면 단 한 번 광폭화\n' +
'  - skill{s=광폭화} @self ~onDamaged ?health{a=&lt;50%} ?!stance{s=rage}\n' +
'  - message{m="&lt;mob.name&gt;&amp;7 이(가) 쓰러졌다."} @PIR{r=30} ~onDeath\n' +
'  Drops:\n' +
'    - GOLD_INGOT 3-7 1\n' +
'    - DIAMOND 1 0.15\n' +
'</code></pre>' +
'<pre class="cb" data-lang="yaml"><code># plugins/MythicMobs/Skills/ 폴더에 저장\n' +
'화염폭발:\n' +
'  Skills:\n' +
'  - sound{s=entity.blaze.shoot;v=1;p=0.8} @self\n' +
'  - effect:particles{p=flame;amount=60;hS=1.5;vS=1;speed=0.1} @self\n' +
'  - delay 20\n' +
'  - damage{amount=12;element=FIRE} @PlayersInRadius{r=8}\n' +
'  - ignite{ticks=60} @PlayersInRadius{r=8}\n' +
'  - effect:particles{p=explosion_huge;amount=3} @self\n' +
'\n' +
'광폭화:\n' +
'  Skills:\n' +
'  - setstance{stance=rage} @self\n' +
'  - sendtitle{title="&amp;c&amp;l광폭화!";d=40} @PIR{r=30}\n' +
'  - aura{auraName=rage;duration=999999;interval=20} @self\n' +
'    - potion{type=INCREASE_DAMAGE;duration=40;level=1} @self\n' +
'    - potion{type=SPEED;duration=40;level=1} @self\n' +
'    - effect:particles{p=angry_villager;amount=3;y=2.2} @self\n' +
'</code></pre>' +
'<div class="note g"><b>핵심 3가지</b> — ① 몹은 <code>Mobs/</code>, 스킬은 <code>Skills/</code>, 아이템은 <code>Items/</code> 폴더. ' +
'② 들여쓰기는 반드시 <b>스페이스</b>(탭 금지). ③ 저장 후 <code>/mm reload</code>.</div>' +
'</div>' +

'<div class="sect"><h2>자주 쓰는 패턴 치트시트</h2>' +
'<div class="sub">복사해서 바로 쓸 수 있는 구문 모음입니다. 각 항목의 이름을 검색창에 넣으면 전체 옵션표를 볼 수 있습니다.</div>' +
'<div class="gcards">' +
  gcard('반복 실행', '일정 주기로 스킬을 돌린다.', '- skill{s=폭풍} @self ~onTimer:60') +
  gcard('확률 발동', '맨 끝 숫자가 실행 확률(0~1).', '- lightning @target ~onAttack 0.25') +
  gcard('체력 조건', '인라인 조건은 <code>?</code>, 부정은 <code>?!</code>.', '- skill{s=필살기} @self ~onDamaged ?health{a=&lt;30%}') +
  gcard('페이즈 전환', 'stance 로 상태를 나누는 것이 정석.', '- setstance{s=phase2} @self ~onDamaged ?health{a=&lt;50%}') +
  gcard('지속 버프(오라)', '하위 스킬이 interval 마다 실행된다.', '- aura{auraName=보호;duration=200;interval=10}') +
  gcard('유도 발사체', '대상을 추적하며 날아간다.', '- missile{onTick=궤적;onHit=명중;v=6;hR=1;i=1} @target') +
  gcard('직진 발사체', '가장 옵션이 많은 메카닉.', '- projectile{onTick=궤적;onHit=명중;v=8;mr=30} @target') +
  gcard('범위 대상', 'PlayersInRadius = @PIR (별칭).', '- damage{a=20} @PIR{r=6}') +
  gcard('소환', '자식 몹으로 소환하면 부모 추적 가능.', '- summon{type=좀비호위;amount=4;radius=3} @self') +
  gcard('변수 저장', 'caster / target / skill / global 스코프.', '- setvariable{var=caster.분노;value=0;type=INTEGER}') +
  gcard('변수 증가', '수식과 플레이스홀더도 사용 가능.', '- variableadd{var=caster.분노;amount=1}') +
  gcard('메시지 · 타이틀', '색 코드는 &amp; 또는 MiniMessage.', '- sendtitle{title="&amp;c경고";subtitle="피하세요";d=40} @PIR{r=20}') +
  gcard('파티클', 'effect: 접두사는 생략 가능.', '- effect:particles{p=flame;amount=40;hS=1;vS=1}') +
  gcard('소리', '바닐라 사운드 키를 그대로 사용.', '- sound{s=entity.ender_dragon.growl;v=2;p=0.6} @PIR{r=40}') +
  gcard('순간이동', '대상 위치로 즉시 이동.', '- teleport @target') +
  gcard('당기기 / 밀기', '보스 진입기의 기본.', '- forcepull{spread=1;velocity=1.5} @PIR{r=12}') +
  gcard('드롭 테이블', '아이템 개수범위 + 확률.', 'Drops:\n- DIAMOND 1-3 0.2\n- MythicItem 1 0.05') +
  gcard('레벨 스케일링', '레벨에 따라 능력치 증가.', 'LevelModifiers:\n  Health: 20\n  Damage: 2') +
'</div></div>' +

'<div class="sect"><h2>플러그인별 역할 한눈에</h2>' +
'<div class="sub">미틱 생태계는 MythicMobs를 중심으로 애드온이 붙는 구조입니다.</div>' +
'<div class="anat"><table>' +
'<tr><td style="color:#e0453e">MythicMobs</td><td><b>기반</b> — 몹·스킬·아이템·드롭·스포너. 나머지 대부분이 이 플러그인을 필요로 합니다.</td></tr>' +
'<tr><td style="color:#4f9dff">ModelEngine 4</td><td><b>외형</b> — 블록벤치로 만든 3D 모델과 애니메이션을 몹에 입힙니다. 히트박스·본 단위 제어 지원.</td></tr>' +
'<tr><td style="color:#f0a020">MythicCrucible</td><td><b>아이템</b> — 아이템 자체에 스킬·쿨다운·탄약을 부여. 가구(Furniture)와 제작법도 담당.</td></tr>' +
'<tr><td style="color:#9b5de5">MythicDungeons</td><td><b>인스턴스</b> — 파티별 독립 던전 월드 생성, 체크포인트, 절차적 생성.</td></tr>' +
'<tr><td style="color:#2ec4b6">MythicRPG</td><td><b>클래스</b> — 아키타입(직업), 주문 시전, 스킬 트리, 재화, 웨이스톤.</td></tr>' +
'<tr><td style="color:#c77dff">MythicEnchantments</td><td><b>인챈트</b> — 데이터 기반 커스텀 인챈트와 등급, 인챈트 테이블 통합.</td></tr>' +
'<tr><td style="color:#ff9f1c">MythicHUD</td><td><b>UI</b> — 리소스팩 폰트로 만드는 커스텀 HUD·체력바·팝업.</td></tr>' +
'<tr><td style="color:#ff6fb5">MythicCosmetics</td><td><b>치장</b> — 모자·펫·탈것·이모트·스프레이 등 꾸미기 요소.</td></tr>' +
'<tr><td style="color:#8ecae6">MythicArmors</td><td><b>방어구</b> — 커스텀 방어구 세트와 리소스팩 자동 생성.</td></tr>' +
'<tr><td style="color:#ffd166">MythicAchievements</td><td><b>업적</b> — 조건 기반 커스텀 업적과 보상.</td></tr>' +
'</table></div></div>' +

'<div class="sect"><h2>이 페이지 사용법</h2>' +
'<div class="gcards">' +
  gcard('검색', '이름 · 별칭 · 한글 설명 전체에서 찾습니다.', 'damage / @PIR / onTimer / 발사체') +
  gcard('단축키', '<code>/</code> 검색 포커스, <code>Esc</code> 검색 해제', '') +
  gcard('카테고리', '탭 선택 후 왼쪽 칩으로 메카닉·조건·타게터 등을 좁힙니다.', '') +
  gcard('원문 대조', '우측 상단 <b>원문 EN</b> 버튼으로 영문 원문과 즉시 전환됩니다. 설정은 저장됩니다.', '') +
'</div></div>' +

'<div class="ftr">' +
'출처: <a href="https://git.mythiccraft.io/mythiccraft" target="_blank" rel="noopener">git.mythiccraft.io</a> 공식 위키 11개 저장소 · 본문 전체를 한국어로 옮겼습니다.<br>' +
'코드 블록과 속성명·메카닉명·열거값(<code>amount</code>, <code>@PIR</code>, <code>~onTimer</code>, <code>true</code> 등)은 실제로 입력하는 값이므로 원문 그대로 두었습니다.<br>' +
'번역이 애매하면 우측 상단 <b>원문 EN</b> 버튼으로 영문 원문과 바로 대조할 수 있습니다. ' +
'플러그인 업데이트로 원문이 달라질 수 있으니, 중요한 설정은 각 문서의 “공식 위키” 링크로 최신본을 확인하세요.' +
'</div>';

  decorate(docEl);
  $('#doc').scrollTop = 0;
}

function gcard(t, d, code) {
  return '<div class="gcard"><h4>' + t + '</h4><p>' + d + '</p>' +
    (code ? '<pre class="cb" data-lang="yaml"><code>' + code + '</code></pre>' : '') + '</div>';
}

/* ─────────────────────── 라우팅 ─────────────────────── */
function go(plug, cat, id) {
  state.plug = plug; state.cat = cat; state.id = id;
  if (id) state.plug = BYID[id].p;
  renderTabs(); renderCats(); renderList();
  if (id) openDoc(id);
  else if (state.plug === 'home') renderHome();
  else renderIntro();
  var hash = id ? id : (state.plug + (cat ? '/' + cat : ''));
  if (location.hash.slice(1) !== hash) {
    history.replaceState(null, '', '#' + hash);
  }
}

function renderIntro() {
  var p = PMAP[state.plug];
  var cc = CCNT[p.k] || {};
  var rows = CORDER.filter(function (c) { return cc[c]; }).map(function (c) {
    return '<tr><td style="color:' + p.c + '">' + esc(CATS[c]) + '</td>' +
      '<td>' + cc[c] + '개 문서 &nbsp;<span style="color:var(--txt3);cursor:pointer;text-decoration:underline" data-goto="' + p.k + '" data-cat="' + c + '">목록 보기</span></td></tr>';
  }).join('');
  var homeId = PATH[p.k + '|home'] || PATH[p.k + '|Home'.toLowerCase()] ||
    (IDX.filter(function (e) { return e.p === p.k && e.c === 'start'; })[0] || {}).i;
  docEl.innerHTML =
    '<div class="dhead"><div class="crumb">플러그인</div>' +
    '<h1 style="color:' + p.c + '">' + esc(p.n) + '</h1>' +
    '<div class="ko">' + esc(p.ko) + ' — ' + esc(p.d) + '</div>' +
    '<div class="meta"><a class="chip ext" href="https://git.mythiccraft.io/mythiccraft/' + esc(p.repo) + '/-/wikis/home" target="_blank" rel="noopener">공식 위키 ↗</a></div></div>' +
    '<div id="body">' +
    (homeId ? '<p><span class="wl" style="cursor:pointer;color:var(--acc2);border-bottom:1px dotted" data-goto="' + p.k + '" data-id="' + esc(homeId) + '">📖 시작 문서 열기</span></p>' : '') +
    '<h2>문서 분류</h2><div class="tw"><table><thead><tr><th>분류</th><th>내용</th></tr></thead><tbody>' +
    rows + '</tbody></table></div>' +
    '<div class="note">왼쪽 목록에서 항목을 고르거나, 위쪽 검색창에 기능 이름을 입력하세요.</div>' +
    '</div>';
  decorate(docEl);
  $('#doc').scrollTop = 0;
}

/* ─────────────────────── 검색 ─────────────────────── */
var stimer;
searchEl.addEventListener('input', function () {
  clearTimeout(stimer);
  stimer = setTimeout(function () {
    state.q = searchEl.value;
    renderCats(); renderList();
    if (window.innerWidth <= 860 && state.q) openSide();
  }, 110);
});
document.addEventListener('keydown', function (e) {
  if (e.key === '/' && document.activeElement !== searchEl) { e.preventDefault(); searchEl.focus(); searchEl.select(); }
  if (e.key === 'Escape') {
    if (document.activeElement === searchEl && searchEl.value) { searchEl.value = ''; state.q = ''; renderCats(); renderList(); }
    else searchEl.blur();
  }
});

/* ─────────────────────── 모바일 ─────────────────────── */
function openSide() { sideEl.classList.add('open'); ovlEl.classList.add('on'); }
function closeSide() { sideEl.classList.remove('open'); ovlEl.classList.remove('on'); }
$('#menuBtn').onclick = function () { sideEl.classList.contains('open') ? closeSide() : openSide(); };
$('#origBtn').onclick = toggleOrig;
syncOrigBtn();
ovlEl.onclick = closeSide;

/* ─────────────────────── 시작 ─────────────────────── */
function boot() {
  var h = decodeURIComponent(location.hash.slice(1));
  if (h && BYID[h]) { go(BYID[h].p, null, h); return; }
  if (h) {
    var parts = h.split('/');
    if (PMAP[parts[0]]) { go(parts[0], parts[1] || null, null); return; }
  }
  go('home', null, null);
}
window.addEventListener('hashchange', function () {
  var h = decodeURIComponent(location.hash.slice(1));
  if (h && BYID[h] && h !== state.id) go(BYID[h].p, null, h);
});
boot();

})();
