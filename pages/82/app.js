/* ═══════════════════════════════════════════════════════════════
   말한 대로 받아쓰기
   · 브라우저의 Web Speech API로 말을 받아쓰고
   · 멈추면 그 내용을 이 페이지 안에서 계산해 정리한다
   · 서버로 보내는 것도, 저장하는 것도 없다
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* ── DOM ──────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const recBtn = $('recBtn'), micIcon = $('micIcon'), level = $('level');
const timerEl = $('timer'), stateTxt = $('stateTxt'), miniStat = $('miniStat');
const script = $('script'), interim = $('interim'), scriptCnt = $('scriptCnt');
const sumEmpty = $('sumEmpty'), sumBody = $('sumBody');
const langSel = $('lang'), warn = $('warn'), toast = $('toast');
const deFiller = $('deFiller');

/* ── 상태 ─────────────────────────────────────────────────── */
const S = {
  rec: null,            // SpeechRecognition 인스턴스
  want: false,          // 사용자가 녹음을 원하는 상태인가
  starting: false,
  elapsed: 0,           // 누적 녹음 시간(ms)
  startedAt: 0,
  lastFinal: 0,         // 마지막으로 확정 문장이 들어온 시각
  tick: null,
  audio: null,          // { ctx, stream, analyser, data, raf }
  summary: null,        // 마지막으로 만든 정리 결과
};

/* ── 지원 여부 확인 ────────────────────────────────────────── */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const secure = window.isSecureContext ||
               location.protocol === 'https:' ||
               ['localhost', '127.0.0.1'].includes(location.hostname);

function checkSupport() {
  const msgs = [];
  if (!SR) {
    msgs.push('이 브라우저는 <b>음성 인식을 지원하지 않습니다</b>. ' +
              'Chrome · Edge · 삼성 인터넷에서 열면 녹음 기능을 쓸 수 있습니다. ' +
              '지금도 아래 칸에 글을 붙여넣으면 정리 기능은 그대로 동작합니다.');
    recBtn.disabled = true;
    setState('음성 인식을 지원하지 않는 브라우저입니다');
  }
  if (!secure) {
    msgs.push('주소가 <code>https</code>가 아니면 브라우저가 마이크를 막습니다. ' +
              'https 주소로 열어 주세요.');
    recBtn.disabled = true;
  }
  if (msgs.length) { warn.innerHTML = msgs.join('<br><br>'); warn.classList.add('on'); }
}
checkSupport();

/* ── 작은 도구들 ──────────────────────────────────────────── */
function setState(t) { stateTxt.textContent = t; }
function say(msg, isErr) {
  toast.textContent = msg;
  toast.classList.toggle('err', !!isErr);
  toast.classList.add('on');
  clearTimeout(say._t);
  say._t = setTimeout(() => toast.classList.remove('on'), 2200);
}
function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60;
  const p = n => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(ss)}` : `${p(m)}:${p(ss)}`;
}
function countWords(t) {
  const m = t.trim().match(/[가-힣]+|[a-zA-Z']+|[0-9]+(?:[.,][0-9]+)*/g);
  return m ? m.length : 0;
}
function updateCounts() {
  const t = script.value;
  const chars = t.length, words = countWords(t);
  scriptCnt.textContent = chars.toLocaleString() + '자';
  miniStat.textContent = `${chars.toLocaleString()}자 · ${words.toLocaleString()}단어`;
}

/* ═══════════════════════════════════════════════════════════════
   음성 인식
   ═══════════════════════════════════════════════════════════════ */
function makeRec() {
  const r = new SR();
  r.lang = langSel.value;
  r.continuous = true;
  r.interimResults = true;
  r.maxAlternatives = 1;

  r.onstart = () => {
    S.starting = false;
    setState('듣고 있습니다 — 편하게 말씀하세요');
  };

  r.onresult = e => {
    let live = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      const txt = res[0].transcript;
      if (res.isFinal) appendFinal(txt);
      else live += txt;
    }
    interim.textContent = live;
  };

  r.onerror = e => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;   // 흔한 일 — 자동 재시작에 맡긴다
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      stopRec();
      setState('마이크 권한이 거부되었습니다');
      say('마이크 사용을 허용해 주세요', true);
      warn.innerHTML = '마이크 권한이 <b>거부</b>되어 있습니다. 주소창 왼쪽의 자물쇠(또는 ⓘ) → ' +
                       '사이트 설정에서 마이크를 <b>허용</b>으로 바꾼 뒤 다시 시도해 주세요.';
      warn.classList.add('on');
      return;
    }
    if (e.error === 'audio-capture') {
      stopRec();
      setState('마이크를 찾지 못했습니다');
      say('연결된 마이크가 없습니다', true);
      return;
    }
    if (e.error === 'network') say('인식 서버와 연결이 잠시 끊겼습니다', true);
  };

  /* 크롬은 조용하면 스스로 끊는다. 사용자가 멈춘 게 아니면 다시 잇는다. */
  r.onend = () => {
    if (!S.want) { setState('멈췄습니다'); return; }
    setState('잇는 중…');
    setTimeout(() => {
      if (!S.want) return;
      try { r.start(); } catch (_) { /* 이미 돌고 있으면 무시 */ }
    }, 260);
  };

  return r;
}

/* 확정된 말을 본문에 붙인다 */
function appendFinal(txt) {
  const t = txt.trim();
  if (!t) return;
  const now = Date.now();
  const gap = S.lastFinal ? now - S.lastFinal : 0;
  S.lastFinal = now;

  const cur = script.value;
  let join = '';
  if (cur) join = (gap > 1800) ? '\n' : (/[\s\n]$/.test(cur) ? '' : ' ');
  script.value = cur + join + t;
  script.scrollTop = script.scrollHeight;
  interim.textContent = '';
  updateCounts();
}

/* ── 시작 / 정지 ──────────────────────────────────────────── */
function startRec() {
  if (!SR || S.want) return;
  S.want = true;
  S.starting = true;
  S.startedAt = Date.now();
  S.lastFinal = 0;
  document.body.classList.add('rec');
  script.readOnly = true;
  micIcon.innerHTML = '<rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" stroke="none"/>';
  recBtn.title = '녹음 정지';
  setState('마이크를 여는 중…');

  S.rec = makeRec();
  try { S.rec.start(); }
  catch (err) { S.want = false; document.body.classList.remove('rec'); say('시작하지 못했습니다', true); return; }

  S.tick = setInterval(() => {
    timerEl.textContent = fmtTime(S.elapsed + (Date.now() - S.startedAt));
  }, 250);
  startMeter();
}

function stopRec() {
  if (!S.want) return;
  S.want = false;
  S.elapsed += Date.now() - S.startedAt;
  clearInterval(S.tick);
  timerEl.textContent = fmtTime(S.elapsed);
  document.body.classList.remove('rec');
  script.readOnly = false;
  micIcon.innerHTML =
    '<rect x="9" y="2.5" width="6" height="11.5" rx="3"/>' +
    '<path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"/>' +
    '<line x1="12" y1="18" x2="12" y2="21.5"/>';
  recBtn.title = '녹음 시작';
  interim.textContent = '';
  try { S.rec && S.rec.stop(); } catch (_) {}
  stopMeter();
  setState(script.value.trim() ? '정리했습니다 — 아래에서 확인하세요' : '들린 말이 없습니다');
  summarize();          // 멈추면 곧바로 정리
}

recBtn.addEventListener('click', () => S.want ? stopRec() : startRec());

langSel.addEventListener('change', () => {
  if (S.want) { stopRec(); say('언어를 바꿨습니다. 다시 녹음해 주세요'); }
});

/* ── 마이크 음량 표시 ─────────────────────────────────────── */
async function startMeter() {
  if (S.audio) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const src = ctx.createMediaStreamSource(stream);
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    src.connect(an);
    const data = new Uint8Array(an.frequencyBinCount);
    S.audio = { ctx, stream, an, data, raf: 0 };

    (function loop() {
      if (!S.audio) return;
      S.audio.raf = requestAnimationFrame(loop);
      an.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
      const rms = Math.sqrt(sum / data.length);
      const k = 1 + Math.min(.38, rms * 3.4);
      level.style.transform = `scale(${k.toFixed(3)})`;
      level.style.opacity = (.28 + Math.min(.6, rms * 4)).toFixed(2);
    })();
  } catch (_) {
    /* 음량 표시는 있으면 좋은 것일 뿐 — 실패해도 인식은 계속한다 */
  }
}
function stopMeter() {
  if (!S.audio) return;
  cancelAnimationFrame(S.audio.raf);
  S.audio.stream.getTracks().forEach(t => t.stop());
  S.audio.ctx.close().catch(() => {});
  S.audio = null;
  level.style.transform = 'scale(1)';
  level.style.opacity = '';
}

/* ═══════════════════════════════════════════════════════════════
   정리(요약) — 이 페이지 안에서 계산하는 추출식 요약
   중요한 낱말이 많이 모인 문장을 원래 순서대로 골라 낸다.
   ═══════════════════════════════════════════════════════════════ */

/* 낱말 뒤에 붙는 조사 — 긴 것부터 떼어 낸다 */
const JOSA = ['으로서', '으로써', '에서는', '에게서', '이라고', '이라는', '에게는',
  '으로', '에서', '에게', '한테', '까지', '부터', '보다', '처럼', '이나', '라고',
  '에는', '에도', '만큼', '이랑', '와는', '과는', '라는', '이란', '에요',
  '은', '는', '이', '가', '을', '를', '에', '의', '도', '만', '로', '나', '랑', '와', '과', '야', '께']
  .sort((a, b) => b.length - a.length);

const STOP = new Set(`
그 저 이 것 거 게 수 등 및 좀 막 뭐 음 어 아 응 예 자 저기 이제 인제 진짜 정말 되게
약간 조금 그냥 아주 매우 너무 다시 계속 항상 지금 여기 거기 우리 저희 제가 내가 너가
그리고 그래서 그런데 하지만 그러나 또한 그러면 그럼 만약 만일 때문 경우 정도 부분 관련
사람 생각 이런 저런 그런 이렇게 저렇게 그렇게 무슨 어떤 어떻게 그니까 그러니까 근데
먼저 마지막 대부분 현재 이번 지난 다음 각각 서로 모두 전부 아마 혹시 물론 사실 일단
있다 없다 하다 되다 이다 같다 보다 위해 통해 대해 관해 따라 대한 관한 위한 통한 해서
the and or but for with that this these those from into your their there here what when
where which while would could should have has had was were are being been you they she
`.trim().split(/\s+/));

/* 활용된 서술어 — 문장마다 나와서 무엇이 중요한지 가린다. 낱말 점수에서 뺀다. */
const VERB_TAIL = /(습니다|습니까|합니다|입니다|였습니다|했습니다|하겠습니다|겠습니다|됩니다|십시오|하세요|주세요|이에요|예요|거예요|해요|어요|아요|네요|군요|거든요|더라고요|같아요|는데요|았어요|었어요|십니다|드립니다)$/;

/* 말할 때 섞이는 군더더기 — 정리할 때만 지운다 */
const FILLER = ['음', '음음', '어', '어어', '엄', '아', '오', '에', '에에',
  '저기', '뭐', '이제', '인제', '막', '뭐죠', '뭐라고', '그니까'];

function stem(w) {
  if (!/^[가-힣]+$/.test(w)) return w.toLowerCase();
  for (const j of JOSA) {
    if (w.length - j.length >= 2 && w.endsWith(j)) return w.slice(0, -j.length);
  }
  return w;
}

/* 구분자 뒤에서 자르기 — 뒤돌아보기(lookbehind) 없이 */
function splitAfter(text, marks) {
  const re = new RegExp('(' + marks.join('|') + ')(\\s+|$)', 'g');
  const out = [];
  let start = 0, m;
  while ((m = re.exec(text))) {
    out.push(text.slice(start, m.index + m[1].length));
    start = m.index + m[0].length;
    re.lastIndex = start;
  }
  if (start < text.length) out.push(text.slice(start));
  return out.map(s => s.trim()).filter(Boolean);
}

const PUNCT = ['\\.', '!', '\\?', '…', '。', '！', '？'];
/* 한국어에서 문장이 끝났다고 볼 수 있는 어미 — 애매한 것은 넣지 않았다 */
const ENDER = ['습니다', '합니다', '입니다', '했습니다', '됩니다', '있습니다', '없습니다',
  '하세요', '주세요', '이에요', '예요', '거예요', '해요', '어요', '아요', '네요', '군요',
  '거든요', '더라고요', '드라고요', '같아요', '같습니다', '겠죠', '는데요', '았어요', '었어요',
  '입니까', '습니까', '나요', '까요', '죠'];

function toSentences(text) {
  const out = [];
  for (const block of text.split(/\n+/)) {
    const b = block.trim();
    if (!b) continue;
    for (const byPunct of splitAfter(b, PUNCT)) {
      /* 말할 때는 문장부호를 찍지 않으니 종결어미로 한 번 더 나눈다.
         어미로도 안 갈리면 그대로 둔다. */
      const sub = splitAfter(byPunct, ENDER);
      out.push(...(sub.length > 1 ? sub : [byPunct]));
    }
  }
  return out;
}

function tokens(s) {
  const m = s.match(/[가-힣]+|[a-zA-Z']{2,}|[0-9]+(?:[.,][0-9]+)*/g);
  return m ? m : [];
}

function cleanup(s, removeFiller) {
  let t = s.replace(/\s+/g, ' ').trim();
  if (removeFiller) {
    for (let i = 0; i < 2; i++) {
      t = t.replace(new RegExp('(^|\\s)(' + FILLER.join('|') + ')(?=\\s|$)', 'g'), '$1')
           .replace(/\s+/g, ' ').trim();
    }
    /* 같은 낱말을 잇달아 되풀이한 것 정리: "그 그 그" → "그"
       (한글에는 \b가 먹히지 않아 공백을 직접 다룬다) */
    t = t.replace(/(^|\s)(\S+)(?:\s+\2)+(?=\s|$)/g, '$1$2');
  }
  return t.trim();
}

function summarizeText(raw, removeFiller) {
  const text = raw.replace(/\r/g, '').trim();
  if (!text) return null;

  const sents = toSentences(text)
    .map(s => cleanup(s, removeFiller))
    .filter(s => s.length >= 2);
  if (!sents.length) return null;

  /* 낱말 점수 — 자주 나오고 길수록 무겁게 */
  const freq = new Map();
  const inSents = new Map();          // 낱말이 몇 문장에 나오는가
  const stems = sents.map(s => {
    const set = new Set();
    const list = [];
    for (const w of tokens(s)) {
      const k = stem(w);
      if (k.length < 2 || STOP.has(k) || /^[0-9]+$/.test(k)) continue;
      if (VERB_TAIL.test(k)) continue;
      list.push(k);
      freq.set(k, (freq.get(k) || 0) + 1);
      set.add(k);
    }
    for (const k of set) inSents.set(k, (inSents.get(k) || 0) + 1);
    return list;
  });

  const wScore = new Map();
  for (const [k, f] of freq) {
    const lenBonus = 1 + Math.min(3, k.length - 1) * .12;
    const spread = 1 + Math.log(1 + (inSents.get(k) || 1)) * .35;
    wScore.set(k, f * lenBonus * spread);
  }

  /* 문장 점수 */
  const scored = sents.map((s, i) => {
    const uniq = new Set(stems[i]);
    let sum = 0;
    for (const k of uniq) sum += wScore.get(k) || 0;
    let sc = sum / (0.6 + Math.sqrt(stems[i].length || 1));
    if (i === 0) sc *= 1.18;                       // 첫머리는 주제를 담기 쉽다
    if (i === sents.length - 1 && sents.length > 3) sc *= 1.06;
    if (s.length < 8) sc *= .35;                   // 너무 짧은 말은 낮게
    if (stems[i].length < 2) sc *= .3;
    return { i, s, sc };
  });

  /* 몇 문장을 고를지 — 한 줄 요약으로 하나를 빼 쓰므로 하나 더 고른다 */
  const n = sents.length;
  const want = n <= 2 ? 1 : Math.max(2, Math.min(6, Math.round(n * .34)));
  const K = Math.min(n, want + 1);
  const picked = scored.slice().sort((a, b) => b.sc - a.sc);

  /* 비슷한 문장은 건너뛴다 */
  const chosen = [];
  for (const c of picked) {
    if (chosen.length >= K) break;
    const a = new Set(stems[c.i]);
    const dup = chosen.some(o => {
      const b = new Set(stems[o.i]);
      if (!a.size || !b.size) return false;
      let inter = 0;
      for (const k of a) if (b.has(k)) inter++;
      return inter / Math.min(a.size, b.size) > .68;
    });
    if (!dup) chosen.push(c);
  }
  if (!chosen.length) chosen.push(picked[0]);
  chosen.sort((a, b) => a.i - b.i);

  /* 자주 나온 말 — 두 번 이상 나온 것을 먼저 쓰고, 모자라면 점수순으로 채운다 */
  const ranked = [...wScore.entries()].sort((a, b) => b[1] - a[1]);
  let picks = ranked.filter(([k]) => freq.get(k) >= 2);
  if (picks.length < 4) picks = ranked;
  const keywords = picks.slice(0, 10).map(([k]) => ({ w: k, n: freq.get(k) }));

  const chars = text.length;
  const words = countWords(text);
  const mins = S.elapsed / 60000;

  /* 한 줄 요약으로 뽑은 문장은 아래 목록에서 빼 둔다 — 같은 말을 두 번 보일 까닭이 없다 */
  const oneline = picked[0].s;
  const points = chosen.map(c => c.s).filter(p => p !== oneline);

  return {
    oneline, points,
    keywords,
    stats: {
      chars, words,
      sents: sents.length,
      dur: S.elapsed,
      wpm: mins > .15 ? Math.round(words / mins) : 0,
    },
  };
}

/* ── 정리 결과 그리기 ─────────────────────────────────────── */
function summarize() {
  const r = summarizeText(script.value, deFiller.checked);
  S.summary = r;
  if (!r) {
    sumBody.style.display = 'none';
    sumEmpty.style.display = '';
    sumEmpty.textContent = '정리할 내용이 없습니다. 녹음하거나 글을 붙여넣어 주세요.';
    return;
  }
  sumEmpty.style.display = 'none';
  sumBody.style.display = '';

  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const st = r.stats;

  sumBody.innerHTML =
    `<div class="oneline">${esc(r.oneline)}</div>` +

    (r.points.length ? `<div class="sblock"><div class="slabel">핵심 내용</div>` +
      `<ol class="points">${r.points.map(p => `<li>${esc(p)}</li>`).join('')}</ol></div>` : '') +

    (r.keywords.length ? `<div class="sblock"><div class="slabel">자주 나온 말</div>` +
      `<div class="chips">${r.keywords.map(k =>
        `<span class="chip" data-w="${esc(k.w)}">${esc(k.w)}<b>${k.n}</b></span>`).join('')}</div></div>` : '') +

    `<div class="sblock"><div class="slabel">기록</div><div class="stats">` +
    (st.dur > 0 ? `<div class="stat"><div class="v">${fmtTime(st.dur)}</div><div class="k">녹음 시간</div></div>` : '') +
    `<div class="stat"><div class="v">${st.chars.toLocaleString()}</div><div class="k">글자</div></div>` +
    `<div class="stat"><div class="v">${st.words.toLocaleString()}</div><div class="k">낱말</div></div>` +
    `<div class="stat"><div class="v">${st.sents}</div><div class="k">문장</div></div>` +
    (st.wpm ? `<div class="stat"><div class="v">${st.wpm}</div><div class="k">분당 낱말</div></div>` : '') +
    `</div></div>`;

  /* 낱말을 누르면 본문에서 그 자리를 찾아 준다 */
  sumBody.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      const w = c.dataset.w;
      const i = script.value.indexOf(w);
      if (i < 0) return say('본문에서 찾지 못했습니다', true);
      script.focus();
      script.setSelectionRange(i, i + w.length);
      const line = script.value.slice(0, i).split('\n').length;
      script.scrollTop = Math.max(0, (line - 3) * 26);
    });
  });
}

function summaryAsText() {
  const r = S.summary;
  if (!r) return '';
  const st = r.stats;
  const lines = [];
  lines.push('[한 줄 요약]', r.oneline);
  if (r.points.length) {
    lines.push('', '[핵심 내용]');
    r.points.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
  }
  if (r.keywords.length) {
    lines.push('', '[자주 나온 말]');
    lines.push(r.keywords.map(k => `${k.w}(${k.n})`).join(', '));
  }
  lines.push('', '[기록]');
  const rec = [];
  if (st.dur > 0) rec.push(`녹음 ${fmtTime(st.dur)}`);
  rec.push(`${st.chars.toLocaleString()}자`, `${st.words.toLocaleString()}낱말`, `${st.sents}문장`);
  if (st.wpm) rec.push(`분당 ${st.wpm}낱말`);
  lines.push(rec.join(' · '));
  return lines.join('\n');
}

/* ═══════════════════════════════════════════════════════════════
   복사 · 저장 · 지우기
   ═══════════════════════════════════════════════════════════════ */
async function copyText(text) {
  if (!text) { say('복사할 내용이 없습니다', true); return; }
  try {
    await navigator.clipboard.writeText(text);
    say('복사했습니다');
    return;
  } catch (_) { /* iframe 안이거나 권한이 없을 때 — 아래 방법으로 */ }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (_) {}
  document.body.removeChild(ta);
  say(ok ? '복사했습니다' : '복사하지 못했습니다 — 직접 선택해 주세요', !ok);
}

$('copySum').addEventListener('click', () => {
  if (!S.summary) summarize();
  copyText(summaryAsText());
});
$('copyAll').addEventListener('click', () => copyText(script.value.trim()));

$('saveBtn').addEventListener('click', () => {
  const body = script.value.trim();
  if (!body) return say('저장할 내용이 없습니다', true);
  if (!S.summary) summarize();
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  const text = `받아쓰기 ${stamp}\n${'─'.repeat(34)}\n\n${summaryAsText()}\n\n[전문]\n${body}\n`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `받아쓰기_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  say('저장했습니다');
});

$('clearBtn').addEventListener('click', () => {
  if (!script.value.trim() && !S.elapsed) return;
  if (!confirm('받아쓴 내용과 정리를 모두 지울까요?')) return;
  if (S.want) stopRec();
  script.value = '';
  interim.textContent = '';
  S.elapsed = 0;
  S.summary = null;
  timerEl.textContent = '00:00';
  sumBody.style.display = 'none';
  sumBody.innerHTML = '';
  sumEmpty.style.display = '';
  sumEmpty.textContent = '녹음을 마치면 여기에 자동으로 정리됩니다.';
  updateCounts();
  setState('대기 중 — 버튼을 누르면 시작합니다');
});

$('sumBtn').addEventListener('click', () => {
  if (!script.value.trim()) return say('정리할 내용이 없습니다', true);
  summarize();
  say('다시 정리했습니다');
});
deFiller.addEventListener('change', () => { if (script.value.trim()) summarize(); });

script.addEventListener('input', updateCounts);

/* 스페이스바로 시작·정지 (글을 쓰는 중이 아닐 때만) */
document.addEventListener('keydown', e => {
  if (e.code !== 'Space' || e.target === script || recBtn.disabled) return;
  e.preventDefault();
  S.want ? stopRec() : startRec();
});

/* 페이지를 떠날 때 마이크를 확실히 놓아 준다 */
window.addEventListener('pagehide', () => { if (S.want) stopRec(); });

updateCounts();
