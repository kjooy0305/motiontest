'use strict';

const $ = id => document.getElementById(id);
const HAS_KATEX = typeof katex !== 'undefined';
if (!HAS_KATEX) $('katexWarn').style.display = 'inline-block';

/* ═══════════ 렌더 도우미 ═══════════ */
function renderTo(el, tex, display) {
  el.classList.remove('err');
  if (!tex || !tex.trim()) { el.innerHTML = '<span style="color:#999;font-size:13px">여기에 결과가 나옵니다</span>'; return true; }
  if (!HAS_KATEX) { el.textContent = tex; return true; }
  try {
    katex.render(tex, el, {displayMode: !!display, throwOnError: true});
    return true;
  } catch (e) {
    el.classList.add('err');
    el.textContent = '⚠ ' + friendlyError(e.message);
    return false;
  }
}

function friendlyError(msg) {
  const m = String(msg).replace(/^KaTeX parse error:\s*/, '');
  if (/Undefined control sequence/.test(m)) {
    const name = (m.match(/\\[a-zA-Z]+/) || [''])[0];
    return `모르는 명령어입니다: ${name}\n→ 철자를 확인하거나 [기호 사전]에서 찾아보세요.`;
  }
  if (/Expected 'EOF', got '\}'/.test(m)) return '중괄호 } 가 하나 더 많습니다.';
  if (/Unexpected end of input in a macro argument/.test(m) || /Expected '\}'/.test(m)) {
    return '중괄호 } 가 모자랍니다. 여는 { 마다 닫는 } 가 하나씩 있어야 합니다.';
  }
  if (/Expected group after/.test(m)) {
    const sym = (m.match(/after '(.+?)'/) || ['', '^'])[1];
    return `${sym} 뒤에 올 내용이 비어 있습니다. x^{2} 처럼 뒤에 값을 적어주세요.`;
  }
  if (/Expected '\\right'/.test(m)) {
    return '\\left 를 썼는데 \\right 로 닫지 않았습니다. 짝을 맞춰주세요.';
  }
  if (/got '\\right'/.test(m)) {
    return '\\right 앞에 짝이 되는 \\left 가 없습니다.';
  }
  if (/Extra \\left|Extra \\right/.test(m)) {
    return '\\left 와 \\right 의 짝이 맞지 않습니다.';
  }
  if (/No such environment/.test(m)) {
    const name = (m.match(/environment: ([a-zA-Z*]+)/) || ['', ''])[1];
    return `모르는 환경입니다: ${name}\n→ pmatrix · bmatrix · vmatrix · cases · aligned 중에서 골라보세요.`;
  }
  if (/Missing \\begin\{[a-z]*\}|\\end\{/.test(m) && /environment/.test(m)) {
    return '\\begin 과 \\end 의 이름이 서로 다릅니다.';
  }
  if (/Double superscript/.test(m))  return '^ 를 두 번 겹쳐 썼습니다. x^{a^{b}} 처럼 묶어주세요.';
  if (/Double subscript/.test(m))    return '_ 를 두 번 겹쳐 썼습니다. 중괄호로 묶어주세요.';
  if (/Can't use function '\$'/.test(m)) return '$ 기호는 넣지 마세요. 수식 내용만 적으면 됩니다.';
  return m;
}

/* 미리보기 없이 검사만 */
function texValid(tex) {
  if (!HAS_KATEX) return true;
  try { katex.renderToString(tex, {throwOnError: true}); return true; }
  catch (e) { return false; }
}

/* ═══════════ 탭 ═══════════ */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
    document.querySelectorAll('.sec').forEach(s => s.classList.remove('on'));
    tab.classList.add('on');
    const s = $('sec-' + tab.dataset.tab);
    if (s) s.classList.add('on');
    window.scrollTo(0, 0);
  });
});
function goTab(name) {
  const t = document.querySelector(`.tab[data-tab="${name}"]`);
  if (t) t.click();
}

/* ═══════════ 토스트 ═══════════ */
let toastTimer = 0;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1700);
}

function copyText(text) {
  if (!text) { toast('복사할 내용이 없습니다'); return; }
  const done = () => toast('복사했습니다');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, () => fallback());
  } else fallback();

  function fallback() {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('복사에 실패했습니다'); }
    ta.remove();
  }
}

/* ═══════════ 만들기 화면 ═══════════ */
const ML_BASE = 'https://cdn.jsdelivr.net/npm/mathlive@0.110.0';
const inputEl = $('input');
const outEl = $('output');
const prevEl = $('preview');

let mode = 'draw';        // 'draw'(수식 편집기) | 'easy'(빠른 입력) | 'tex'(코드)
let mf = null;            // MathLive 편집기
let mlReady = false;
let displayMode = true;
let showCode = false;     // 평소엔 코드를 감춰둔다
let currentTex = '';

/* ── MathLive 초기화 ────────────────────── */
function initMathfield() {
  if (typeof MathfieldElement === 'undefined') return false;
  try {
    MathfieldElement.fontsDirectory = ML_BASE + '/fonts';
    MathfieldElement.soundsDirectory = null;      // 효과음은 받지 않는다

    const el = new MathfieldElement();
    el.smartMode = true;      // 글자를 이어 치면 알아서 텍스트로 전환 (한글·영어)
    el.smartFence = true;     // 괄호 자동 짝맞춤
    el.mathVirtualKeyboardPolicy = 'manual';
    el.setAttribute('aria-label', '수식 입력란');
    el.addEventListener('input', update);

    const host = $('mfHost');
    host.innerHTML = '';
    host.appendChild(el);
    mf = el;
    mlReady = true;
    return true;
  } catch (e) {
    console.warn('수식 편집기를 시작하지 못했습니다:', e);
    return false;
  }
}

/* MathLive 가 내놓는 표기 중 KaTeX 가 모르는 것을 바꿔준다 */
function toKatex(latex) {
  if (!latex) return '';
  return latex
    .replace(/\\placeholder\{([^{}]*)\}/g, '$1')   // 빈 칸은 지운다
    .replace(/\\placeholder(?![a-zA-Z])/g, '')
    .replace(/\\mleft(?![a-zA-Z])/g, '\\left')
    .replace(/\\mright(?![a-zA-Z])/g, '\\right')
    .replace(/\\differentialD(?![a-zA-Z])/g, 'd')
    .replace(/\\exponentialE(?![a-zA-Z])/g, 'e')
    .replace(/\\imaginaryI(?![a-zA-Z])/g, 'i')
    .replace(/\\left\.\s*\\right\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ── 현재 수식 가져오기 / 넣기 ──────────── */
function getLatex() {
  if (mode === 'draw') return mlReady ? toKatex(mf.value) : '';
  if (mode === 'easy') {
    try { return Convert.easyToTex(inputEl.value); } catch (e) { return ''; }
  }
  return inputEl.value;
}
function setLatex(tex) {
  if (mode === 'draw' && mlReady) { mf.value = tex; }
  else if (mode === 'tex') { inputEl.value = tex; }
  else { inputEl.value = tex; }   // 빠른 입력 모드에도 코드를 그대로 넣으면 통과된다
  update();
}

/* ── 모드 전환 ─────────────────────────── */
const MODE_BTN = {draw: 'mDraw', easy: 'mEasy', tex: 'mTex'};

function setMode(m, keep) {
  const carried = keep === false ? '' : getLatex();
  mode = m;

  Object.entries(MODE_BTN).forEach(([k, id]) => {
    const b = $(id);
    if (b) b.classList.toggle('on', k === m);
  });

  const drawing = (m === 'draw');
  $('mfHost').style.display = drawing ? 'flex' : 'none';
  inputEl.style.display = drawing ? 'none' : 'block';
  $('drawHint').style.display = drawing ? 'block' : 'none';
  $('easyHint').style.display = (m === 'easy') ? 'block' : 'none';
  $('btnKbd').style.display = drawing ? '' : 'none';

  $('inLabel').textContent =
    drawing ? '✍️ 여기에 수식을 쓰세요' :
    m === 'easy' ? '⌨️ 키보드로 빠르게 (a+b)/2' : '</> KaTeX 코드를 직접';

  inputEl.placeholder = m === 'easy'
    ? '예)  (x^2 + 1)/(x - 1) = sqrt(2)/2'
    : '예)  \\frac{x^{2}+1}{x-1}';

  if (carried) {
    if (drawing && mlReady) mf.value = carried;
    else inputEl.value = carried;
  }
  update();
}

/* ── 갱신 ──────────────────────────────── */
function update() {
  currentTex = getLatex();

  const ok = renderTo(prevEl, currentTex, displayMode);

  outEl.textContent = currentTex || '(비어 있음)';
  outEl.classList.toggle('err', !ok);
  outEl.style.display = showCode ? 'block' : 'none';

  buildExplain(currentTex);
}

inputEl.addEventListener('input', update);

$('mDraw').addEventListener('click', () => {
  if (!mlReady) { toast('수식 편집기를 불러오지 못했습니다'); return; }
  setMode('draw');
});
$('mEasy').addEventListener('click', () => setMode('easy'));
$('mTex').addEventListener('click', () => setMode('tex'));

/* ── 버튼들 ────────────────────────────── */
const SAMPLES = {
  draw: [
    'x = \\frac{-b \\pm \\sqrt{b^{2}-4ac}}{2a}',
    '\\sum_{k=1}^{n} k^{2} = \\frac{n(n+1)(2n+1)}{6}',
    '\\int_{0}^{1} x^{2}\\,dx = \\frac{1}{3}',
    '\\text{넓이} = \\pi r^{2}',
    '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
  ],
  easy: [
    '(-b +- sqrt(b^2 - 4ac))/(2a)',
    'sum_(k=1)^n k^2 = (n(n+1)(2n+1))/6',
    'int_0^1 x^2 dx = 1/3',
    'lim(x->0) sin(x)/x = 1',
    '"넓이" = pi r^2',
  ],
};
let sampleIdx = 0;

$('btnClear').addEventListener('click', () => {
  if (mode === 'draw' && mlReady) { mf.value = ''; mf.focus(); }
  else { inputEl.value = ''; inputEl.focus(); }
  update();
});
$('btnSample').addEventListener('click', () => {
  const list = mode === 'easy' ? SAMPLES.easy : SAMPLES.draw;
  const v = list[sampleIdx % list.length];
  sampleIdx++;
  if (mode === 'draw' && mlReady) mf.value = v;
  else inputEl.value = v;
  update();
});
$('btnDisp').addEventListener('click', () => {
  displayMode = !displayMode;
  $('btnDisp').textContent = '디스플레이 모드: ' + (displayMode ? '켬' : '끔');
  update();
});
$('btnKbd').addEventListener('click', () => {
  const vk = window.mathVirtualKeyboard;
  if (!vk) { toast('화면 키보드를 쓸 수 없습니다'); return; }
  if (mf) mf.focus();
  if (vk.visible) vk.hide(); else vk.show();
});
$('goGuide').addEventListener('click', () => goTab('guide'));

$('btnShowCode').addEventListener('click', () => {
  showCode = !showCode;
  $('btnShowCode').textContent = showCode ? '코드 숨기기' : '코드 보기';
  update();
});

function copyAndReveal(text, label) {
  if (!currentTex) { toast('먼저 수식을 입력하세요'); return; }
  copyText(text);
  outEl.textContent = text;
  outEl.style.display = 'block';
  outEl.classList.remove('err');
  $('btnShowCode').textContent = '코드 숨기기';
  showCode = true;
  if (label) toast(label + ' 복사했습니다');
}
$('btnCopy').addEventListener('click', () => copyAndReveal(currentTex, 'KaTeX 코드를'));
$('btnCopyInline').addEventListener('click', () => copyAndReveal('$' + currentTex + '$', '$…$ 형태로'));
$('btnCopyBlock').addEventListener('click', () => copyAndReveal('$$\n' + currentTex + '\n$$', '$$…$$ 형태로'));
$('btnToTex').addEventListener('click', () => {
  if (!currentTex) { toast('먼저 수식을 입력하세요'); return; }
  const t = currentTex;
  setMode('tex', false);
  inputEl.value = t;
  update();
  inputEl.focus();
  toast('이제 코드를 직접 고칠 수 있습니다');
});

/* ── 한글·영어 넣기 ────────────────────── */
const textBox = $('textBox');
const textInput = $('textInput');

$('btnText').addEventListener('click', () => {
  const open = textBox.style.display !== 'none';
  textBox.style.display = open ? 'none' : 'block';
  if (!open) { textInput.value = ''; textInput.focus(); }
});
$('textCancel').addEventListener('click', () => { textBox.style.display = 'none'; });
$('textOk').addEventListener('click', insertText);
textInput.addEventListener('keydown', ev => {
  if (ev.key === 'Enter') { ev.preventDefault(); insertText(); }
  if (ev.key === 'Escape') { textBox.style.display = 'none'; }
});

function insertText() {
  const raw = textInput.value.trim();
  if (!raw) { toast('넣을 글자를 적어주세요'); return; }
  // \text{} 안에서 문제가 되는 글자를 정리
  const safe = raw.replace(/[\\{}$&#^_~%]/g, m => ({'\\': '', '{': '(', '}': ')'}[m] || ''));
  insertSymbol('\\text{' + safe + '}');
  textInput.value = '';
  textInput.focus();
}

/* ── 팔레트·사전에서 넣기 ──────────────── */
function insertSymbol(code, easyForm) {
  if (mode === 'draw' && mlReady) {
    const tex = code.replace(/▢/g, '#?');
    try {
      if (typeof mf.insert === 'function') mf.insert(tex, {focus: true});
      else mf.executeCommand(['insert', tex]);
    } catch (e) {
      mf.value = mf.value + tex.replace(/#\?/g, '');
    }
    mf.focus();
    update();
    return;
  }

  const text = (mode === 'easy' && easyForm) ? easyForm : code;
  const el = inputEl;
  const s = el.selectionStart, e = el.selectionEnd;
  el.value = el.value.slice(0, s) + text + el.value.slice(e);

  const holder = el.value.indexOf('▢', s);
  if (holder !== -1 && holder < s + text.length) el.setSelectionRange(holder, holder + 1);
  else { const pos = s + text.length; el.setSelectionRange(pos, pos); }
  el.focus();
  update();
}

// 코드 모드에서 Tab 으로 다음 ▢ 자리로 이동
inputEl.addEventListener('keydown', ev => {
  if (ev.key !== 'Tab') return;
  const el = inputEl;
  let idx = el.value.indexOf('▢', el.selectionEnd);
  if (idx === -1) idx = el.value.indexOf('▢');
  if (idx === -1) return;
  ev.preventDefault();
  el.setSelectionRange(idx, idx + 1);
});

/* ── 팔레트 ── */
const CATS = [];
REF.forEach(r => { if (!CATS.includes(r.cat)) CATS.push(r.cat); });
let curCat = CATS[0];

function buildPalette() {
  const cats = $('palCats');
  cats.innerHTML = '';
  CATS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'pal-cat' + (c === curCat ? ' on' : '');
    b.textContent = c;
    b.onclick = () => { curCat = c; buildPalette(); };
    cats.appendChild(b);
  });

  const grid = $('palGrid');
  grid.innerHTML = '';
  REF.filter(r => r.cat === curCat).forEach(r => {
    const b = document.createElement('button');
    b.className = 'pal-btn';
    b.title = r.desc + '\n' + r.code + (r.easy ? '\n빠른 입력: ' + r.easy : '');

    const sym = document.createElement('span');
    sym.className = 'sym';
    renderTo(sym, r.tex, false);
    b.appendChild(sym);

    const nm = document.createElement('span');
    nm.className = 'nm';
    nm.textContent = r.desc.replace(/\s*\(.*\)$/, '');
    b.appendChild(nm);

    b.onclick = () => insertSymbol(r.code, r.easy);
    grid.appendChild(b);
  });
}

/* ── 설명 패널 ── */
const CMD_DESC = {};
REF.forEach(r => {
  const m = r.code.match(/^\\[a-zA-Z]+/);
  if (m && !CMD_DESC[m[0]]) CMD_DESC[m[0]] = r.desc;
});
Object.assign(CMD_DESC, {
  '\\left': '뒤따르는 괄호를 내용 높이에 맞춰 크게',
  '\\right': '\\left 와 짝이 되는 닫는 괄호',
  '\\begin': '환경 시작 (행렬·경우 나누기·정렬)',
  '\\end': '환경 끝',
  '\\operatorname': '직접 만든 함수 이름을 똑바로 세움',
  '\\lfloor': '버림 기호 ⌊', '\\rfloor': '버림 기호 ⌋',
  '\\lceil': '올림 기호 ⌈', '\\rceil': '올림 기호 ⌉',
  '\\bmod': '나머지 연산 mod',
  '\\colon': '콜론 :',
  '\\aligned': '여러 줄 정렬',
});

function buildExplain(tex) {
  const box = $('explain');
  box.innerHTML = '';
  if (!tex || !tex.trim()) {
    box.innerHTML = '<div class="expl-empty">수식을 입력하면 사용된 명령어의 뜻을 하나씩 풀어드립니다.</div>';
    return;
  }

  const items = [];
  const seen = new Set();
  const add = (code, txt) => { if (!seen.has(code)) { seen.add(code); items.push([code, txt]); } };

  if (/\^\{/.test(tex) || /\^[^{]/.test(tex)) add('^{ }', '<b>위 첨자</b> — 중괄호 안의 내용이 위로 올라갑니다');
  if (/_\{/.test(tex) || /_[^{]/.test(tex))  add('_{ }', '<b>아래 첨자</b> — 중괄호 안의 내용이 아래로 내려갑니다');

  (tex.match(/\\[a-zA-Z]+/g) || []).forEach(cmd => {
    const d = CMD_DESC[cmd];
    if (d) add(cmd, d);
  });

  const envs = tex.match(/\\begin\{([a-zA-Z*]+)\}/g) || [];
  envs.forEach(e => {
    const name = e.match(/\{([a-zA-Z*]+)\}/)[1];
    const map = {
      pmatrix: '소괄호 ( ) 행렬', bmatrix: '대괄호 [ ] 행렬', vmatrix: '행렬식 | |',
      Bmatrix: '중괄호 행렬', matrix: '괄호 없는 행렬',
      cases: '조건에 따라 나누어 정의', aligned: '= 기호를 맞춰 여러 줄 정렬',
    };
    if (map[name]) add('\\begin{' + name + '}', map[name] + ' — 칸은 <b>&</b>, 줄은 <b>\\\\</b> 로 나눕니다');
  });

  if (/&/.test(tex)) add('&', '칸을 나누는 구분자');
  if (/\\\\/.test(tex)) add('\\\\', '줄을 바꾸는 구분자');

  if (!items.length) {
    box.innerHTML = '<div class="expl-empty">특별한 명령어 없이 글자와 숫자만 쓰인 수식입니다. 이대로 붙여넣어도 됩니다.</div>';
    return;
  }

  items.forEach(([code, txt]) => {
    const d = document.createElement('div');
    d.className = 'expl-i';
    const c = document.createElement('span');
    c.className = 'expl-code';
    c.textContent = code;
    const t = document.createElement('span');
    t.className = 'expl-txt';
    t.innerHTML = txt;
    d.appendChild(c); d.appendChild(t);
    box.appendChild(d);
  });
}

/* ═══════════ 기호 사전 ═══════════ */
function buildDict() {
  const body = $('dictBody');
  body.innerHTML = '';
  CATS.forEach(cat => {
    const h = document.createElement('h3');
    h.className = 'blk';
    h.textContent = cat;
    h.dataset.cat = cat;
    body.appendChild(h);

    const grid = document.createElement('div');
    grid.className = 'dict-grid';
    grid.dataset.cat = cat;

    REF.filter(r => r.cat === cat).forEach(r => {
      const d = document.createElement('div');
      d.className = 'dict-i';
      d.title = '클릭하면 코드가 복사됩니다';

      const sym = document.createElement('div');
      sym.className = 'dict-sym';
      renderTo(sym, r.tex, false);

      const info = document.createElement('div');
      info.className = 'dict-info';
      const code = document.createElement('div');
      code.className = 'dict-code';
      code.textContent = r.code;
      const desc = document.createElement('div');
      desc.className = 'dict-desc';
      desc.textContent = r.desc;
      info.appendChild(code); info.appendChild(desc);
      if (r.easy) {
        const e = document.createElement('div');
        e.className = 'dict-easy';
        e.textContent = '빠른 입력: ' + r.easy;
        info.appendChild(e);
      }

      d.appendChild(sym); d.appendChild(info);
      d.onclick = () => copyText(r.code.replace(/▢/g, ''));
      grid.appendChild(d);
    });
    body.appendChild(grid);
  });
}

$('dictSearch').addEventListener('input', function () {
  const q = this.value.trim().toLowerCase();
  const all = [...document.querySelectorAll('.dict-i')];
  let hits = 0;

  all.forEach(el => {
    const match = !q || el.textContent.toLowerCase().includes(q);
    el.classList.toggle('hidden', !match);
    if (match) hits++;
  });

  // 항목이 하나도 없는 분류는 제목까지 숨긴다
  document.querySelectorAll('.dict-grid').forEach(g => {
    const any = [...g.querySelectorAll('.dict-i')].some(x => !x.classList.contains('hidden'));
    g.style.display = any ? '' : 'none';
    const h = document.querySelector(`h3.blk[data-cat="${g.dataset.cat}"]`);
    if (h) h.style.display = any ? '' : 'none';
  });

  $('dictCnt').textContent = q ? (hits ? hits + '개' : '결과 없음') : '';
});

/* ═══════════ 예제 모음 ═══════════ */
function buildExamples() {
  const body = $('exBody');
  body.innerHTML = '';
  const groups = [];
  EXAMPLES.forEach(e => { if (!groups.includes(e.g)) groups.push(e.g); });

  groups.forEach(g => {
    const h = document.createElement('h3');
    h.className = 'blk';
    h.textContent = g;
    body.appendChild(h);

    const grid = document.createElement('div');
    grid.className = 'ex-grid';

    EXAMPLES.filter(e => e.g === g).forEach(e => {
      const box = document.createElement('div');
      box.className = 'ex-i';

      const hd = document.createElement('div');
      hd.className = 'ex-hd';
      hd.innerHTML = '<span>' + e.t + '</span>';

      const useBtn = document.createElement('button');
      useBtn.className = 'btn sm pri';
      useBtn.textContent = '가져오기';
      useBtn.onclick = () => {
        setMode(mlReady ? 'draw' : 'tex', false);
        setLatex(e.tex);
        goTab('make');
        toast('편집기로 가져왔습니다');
      };
      const cpBtn = document.createElement('button');
      cpBtn.className = 'btn sm';
      cpBtn.textContent = '복사';
      cpBtn.style.marginLeft = '4px';
      cpBtn.onclick = () => copyText(e.tex);
      hd.appendChild(useBtn);
      hd.appendChild(cpBtn);

      const prev = document.createElement('div');
      prev.className = 'ex-prev';
      renderTo(prev, e.tex, true);

      const code = document.createElement('div');
      code.className = 'ex-code';
      code.textContent = e.tex;

      box.appendChild(hd); box.appendChild(prev); box.appendChild(code);
      grid.appendChild(box);
    });
    body.appendChild(grid);
  });
}

/* ═══════════ 연습 문제 ═══════════ */
let qOrder = [];
let qIdx = 0;
let qSolved = 0;
let qTried = new Set();

/* 같은 뜻인 다른 이름들 — 채점할 때 같은 것으로 본다 */
const ALIAS = {
  '\\leq': '\\le', '\\geq': '\\ge', '\\neq': '\\ne',
  '\\rightarrow': '\\to', '\\leftarrow': '\\gets',
  '\\wedge': '\\land', '\\vee': '\\lor',
  '\\lt': '<', '\\gt': '>', '\\dots': '\\ldots',
  '\\intercal': '\\top',
};

/* 파스 트리를 정규화한다 — { } 로 한 번 더 묶었는지 같은 차이는 무시된다 */
function normTree(node) {
  if (Array.isArray(node)) {
    const a = node.map(normTree).filter(x => x !== null);
    return a.length === 1 ? a[0] : a;
  }
  if (!node || typeof node !== 'object') return node === undefined ? null : node;
  if (node.type === 'ordgroup') return normTree(node.body);

  const out = {t: node.type};
  ['mode', 'text', 'name', 'family', 'label', 'delim', 'size'].forEach(k => {
    if (node[k] !== undefined) {
      let v = node[k];
      if (typeof v === 'string' && ALIAS[v]) v = ALIAS[v];
      out[k] = v;
    }
  });
  ['body', 'base', 'sub', 'sup', 'numer', 'denom', 'index', 'expression', 'value'].forEach(k => {
    if (node[k] !== undefined && typeof node[k] === 'object') out[k] = normTree(node[k]);
  });
  return out;
}

function sameMath(a, b) {
  if (!a || !b) return false;
  if (HAS_KATEX && typeof katex.__parse === 'function') {
    try {
      return JSON.stringify(normTree(katex.__parse(a))) ===
             JSON.stringify(normTree(katex.__parse(b)));
    } catch (e) { /* 아래 문자열 비교로 넘어간다 */ }
  }
  const norm = s => s.replace(/\s+/g, '').replace(/\{([^{}])\}/g, '$1');
  return norm(a) === norm(b);
}

function loadQuestion() {
  const q = QUIZ[qOrder[qIdx]];
  $('qNum').textContent = `문제 ${qIdx + 1} / ${qOrder.length}`;
  renderTo($('qTarget'), q.tex, true);
  $('qInput').value = '';
  $('qRes').textContent = '';
  $('qRes').className = 'quiz-res';
  $('qHint').textContent = q.hint;
  $('qHint').classList.remove('show');
  renderTo($('qPreview'), '', false);
  updateScore();
}
function updateScore() {
  $('qScore').textContent = `맞힌 문제 ${qSolved} / 전체 ${QUIZ.length}`;
}

$('qInput').addEventListener('input', function () {
  renderTo($('qPreview'), this.value, true);
});
$('qCheck').addEventListener('click', () => {
  const q = QUIZ[qOrder[qIdx]];
  const mine = $('qInput').value.trim();
  const res = $('qRes');

  if (!mine) { res.textContent = '먼저 코드를 입력해 보세요.'; res.className = 'quiz-res no'; return; }
  if (HAS_KATEX && !texValid(mine)) {
    res.textContent = '✗ 코드에 문법 오류가 있습니다. 위 미리보기의 오류 내용을 확인하세요.';
    res.className = 'quiz-res no';
    return;
  }
  if (sameMath(mine, q.tex)) {
    res.textContent = '✓ 정답입니다!';
    res.className = 'quiz-res ok';
    if (!qTried.has(qOrder[qIdx])) { qSolved++; qTried.add(qOrder[qIdx]); }
    updateScore();
  } else {
    res.textContent = '✗ 모양이 다릅니다. 미리보기와 문제를 비교해 보세요.';
    res.className = 'quiz-res no';
  }
});
$('qHintBtn').addEventListener('click', () => $('qHint').classList.toggle('show'));
$('qAnswer').addEventListener('click', () => {
  const q = QUIZ[qOrder[qIdx]];
  $('qInput').value = q.tex;
  renderTo($('qPreview'), q.tex, true);
  $('qRes').textContent = '정답 코드를 넣었습니다. 어떻게 생겼는지 보고 다음 문제로 넘어가세요.';
  $('qRes').className = 'quiz-res';
});
$('qNext').addEventListener('click', () => {
  qIdx = (qIdx + 1) % qOrder.length;
  loadQuestion();
});

/* ═══════════ 문법 가이드 ═══════════ */
function buildGuide() {
  document.querySelectorAll('.kx').forEach(el => {
    renderTo(el, el.dataset.tex, false);
  });

  const rows = REF.filter(r => r.easy);
  const wrap = document.createElement('div');
  wrap.className = 'tbl-wrap';
  let html = '<div class="tbl-cap">빠른 입력 → KaTeX 대응표 (' + rows.length + '개)</div>' +
    '<table><tr><th>이렇게 적으면</th><th>이 코드가 됩니다</th><th>결과</th><th>뜻</th></tr>';
  rows.forEach(r => {
    html += '<tr><td><code>' + escapeHtml(r.easy) + '</code></td>' +
      '<td><code>' + escapeHtml(r.code.replace(/▢/g, '□')) + '</code></td>' +
      '<td class="kx2" data-tex="' + escapeHtml(r.tex) + '"></td>' +
      '<td>' + escapeHtml(r.desc) + '</td></tr>';
  });
  html += '</table>';
  wrap.innerHTML = html;
  $('easyTable').appendChild(wrap);
  wrap.querySelectorAll('.kx2').forEach(el => renderTo(el, el.dataset.tex, false));
}
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ═══════════ 시작 ═══════════ */
buildPalette();
buildDict();
buildExamples();
buildGuide();

qOrder = QUIZ.map((_, i) => i);
loadQuestion();

// 수식 편집기를 먼저 띄우고, 못 쓰면 코드 모드로 물러난다
if (initMathfield()) {
  setMode('draw', false);
  mf.value = SAMPLES.draw[0];
  sampleIdx = 1;
  update();
} else {
  $('mDraw').style.opacity = '.45';
  $('mDraw').title = '수식 편집기를 불러오지 못했습니다 (인터넷 연결 확인)';
  $('mfHost').innerHTML =
    '<div id="mfLoading">수식 편집기를 불러오지 못했습니다. ' +
    '아래 <b>빠른 입력</b>이나 <b>코드</b> 모드를 쓰세요.</div>';
  setMode('easy', false);
  inputEl.value = SAMPLES.easy[0];
  sampleIdx = 1;
  update();
}
