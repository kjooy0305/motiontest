/* ══════════════════════════════════════════════════════════
   데이터팩 · 리소스팩 생성기
   외부 라이브러리 없이 브라우저에서 ZIP을 직접 만든다.
   ══════════════════════════════════════════════════════════ */

/* ─────────── 1. ZIP 작성기 (STORE 방식, 무압축) ───────────
   마인크래프트는 무압축 zip도 정상적으로 읽는다.
   파일이 몇 KB 수준이라 압축이 필요 없고, 의존성이 없어 항상 동작한다. */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function dosDateTime(d) {
  const time = ((d.getHours() & 31) << 11) | ((d.getMinutes() & 63) << 5) | ((d.getSeconds() / 2) & 31);
  const date = (((d.getFullYear() - 1980) & 127) << 9) | (((d.getMonth() + 1) & 15) << 5) | (d.getDate() & 31);
  return { time, date };
}

function buildZip(files) {
  const enc = new TextEncoder();
  const { time, date } = dosDateTime(new Date());
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const data = f.data;
    const crc = crc32(data);

    // 로컬 파일 헤더 (30바이트 + 파일명)
    const lh = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true);   // 시그니처
    lv.setUint16(4, 20, true);           // 필요 버전
    lv.setUint16(6, 0x0800, true);       // 플래그: UTF-8 파일명
    lv.setUint16(8, 0, true);            // 압축 방식 0 = STORE
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true); // 압축 크기
    lv.setUint32(22, data.length, true); // 원본 크기
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);           // extra 없음
    lh.set(nameBytes, 30);

    chunks.push(lh, data);

    // 중앙 디렉터리 항목 (46바이트 + 파일명)
    const ch = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);           // 만든 버전
    cv.setUint16(6, 20, true);           // 필요 버전
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);           // extra
    cv.setUint16(32, 0, true);           // comment
    cv.setUint16(34, 0, true);           // disk
    cv.setUint16(36, 0, true);           // internal attr
    cv.setUint32(38, 0, true);           // external attr
    cv.setUint32(42, offset, true);      // 로컬 헤더 위치
    ch.set(nameBytes, 46);
    central.push(ch);

    offset += lh.length + data.length;
  }

  const cdStart = offset;
  let cdSize = 0;
  for (const c of central) { chunks.push(c); cdSize += c.length; }

  // 중앙 디렉터리 끝 레코드
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, cdStart, true);
  ev.setUint16(20, 0, true);
  chunks.push(eocd);

  return new Blob(chunks, { type: 'application/zip' });
}

const ENC = new TextEncoder();
const T = (s) => ENC.encode(s);

/* ─────────── 2. 색 유틸 & PNG 생성 ─────────── */
function hexToRgb(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function shade(hex, amt) { // amt: -1(검정) ~ +1(흰색)
  const [r, g, b] = hexToRgb(hex);
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return [f(r), f(g), f(b)];
}

// 16x16 도트 아트 — 문자 하나가 픽셀 하나
const WAND_ART = [
  '..........eCe...',
  '.........eCCCe..',
  '.........cCCCc..',
  '..........cCc...',
  '.......gg.c.....',
  '......gGg.......',
  '.....gWg........',
  '....dWg.........',
  '....Wd..........',
  '...dW...........',
  '...Wd...........',
  '..dW............',
  '..Wd............',
  '.dW.............',
  '.Wd.............',
  '.d..............'
];

function makeItemPng(accent) {
  const pal = {
    '.': [0, 0, 0, 0],
    'C': [...shade(accent, 0.55), 255],
    'c': [...shade(accent, 0.15), 255],
    'e': [...shade(accent, -0.35), 255],
    'W': [128, 86, 48, 255],
    'w': [94, 62, 34, 255],
    'd': [61, 40, 22, 255],
    'G': [255, 224, 130, 255],
    'g': [222, 175, 60, 255]
  };
  const cv = document.createElement('canvas');
  cv.width = 16; cv.height = 16;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(16, 16);
  for (let y = 0; y < 16; y++) {
    const row = (WAND_ART[y] || '................').padEnd(16, '.');
    for (let x = 0; x < 16; x++) {
      const p = pal[row[x]] || pal['.'];
      const i = (y * 16 + x) * 4;
      img.data[i] = p[0]; img.data[i + 1] = p[1]; img.data[i + 2] = p[2]; img.data[i + 3] = p[3];
    }
  }
  ctx.putImageData(img, 0, 0);
  return dataUrlToBytes(cv.toDataURL('image/png'));
}

function makePackPng(accent) {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64;
  const ctx = cv.getContext('2d');
  const [r, g, b] = hexToRgb(accent);
  const grd = ctx.createLinearGradient(0, 0, 64, 64);
  grd.addColorStop(0, `rgb(${shade(accent, -0.55).join(',')})`);
  grd.addColorStop(1, `rgb(${r},${g},${b})`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 64, 64);
  // 가운데 상자 아이콘
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.fillRect(14, 18, 36, 30);
  ctx.fillStyle = `rgb(${shade(accent, 0.6).join(',')})`;
  ctx.fillRect(14, 18, 36, 8);
  ctx.fillRect(30, 26, 4, 22);
  return dataUrlToBytes(cv.toDataURL('image/png'));
}

function dataUrlToBytes(url) {
  const b64 = url.split(',')[1];
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ─────────── 3. 버전 프리셋 ───────────
   plural  : 폴더가 복수형인가 (1.21부터 단수형)
   comp    : 아이템 컴포넌트 문법 (1.20.5+)
   nbtText : 텍스트 컴포넌트를 NBT로 (1.21.5+)
   itemModel: 아이템 모델 정의 방식 (1.21.4+) */
const VERSIONS = [
  { id: 'v1215', label: '1.21.5 이상 (최신 계열)', dp: 71, rp: 55, plural: false, comp: true, nbtText: true, itemModel: true },
  { id: 'v1214', label: '1.21.4', dp: 61, rp: 46, plural: false, comp: true, nbtText: false, itemModel: true },
  { id: 'v1212', label: '1.21.2 ~ 1.21.3', dp: 57, rp: 42, plural: false, comp: true, nbtText: false, itemModel: false },
  { id: 'v121', label: '1.21 ~ 1.21.1', dp: 48, rp: 34, plural: false, comp: true, nbtText: false, itemModel: false },
  { id: 'v1205', label: '1.20.5 ~ 1.20.6', dp: 41, rp: 32, plural: true, comp: true, nbtText: false, itemModel: false },
  { id: 'v1203', label: '1.20.3 ~ 1.20.4', dp: 26, rp: 22, plural: true, comp: false, nbtText: false, itemModel: false },
  { id: 'v1202', label: '1.20.2', dp: 18, rp: 18, plural: true, comp: false, nbtText: false, itemModel: false },
  { id: 'v120', label: '1.20 ~ 1.20.1', dp: 15, rp: 15, plural: true, comp: false, nbtText: false, itemModel: false },
  { id: 'v1194', label: '1.19.4', dp: 12, rp: 13, plural: true, comp: false, nbtText: false, itemModel: false },
  { id: 'v119', label: '1.19 ~ 1.19.3', dp: 10, rp: 9, plural: true, comp: false, nbtText: false, itemModel: false },
  { id: 'custom', label: '그 외 / 직접 입력 (26.x 등)', dp: 71, rp: 55, plural: false, comp: true, nbtText: true, itemModel: true, custom: true }
];

/* ─────────── 4. 옵션 정의 ─────────── */
const OPTIONS = [
  { g: '데이터팩 · 기본', k: 'data', id: 'core', t: '기본 뼈대', h: 'pack.mcmeta + load/tick 함수 + 태그 (필수)', fixed: true },
  { g: '데이터팩 · 기본', k: 'data', id: 'uninstall', t: '제거 함수', h: '스코어보드·팀을 되돌리는 uninstall. 좋은 팩의 필수 요소' },
  { g: '데이터팩 · 기본', k: 'data', id: 'readme', t: 'README 안내문', h: '설치법·구조 설명이 담긴 텍스트 파일' },
  { g: '데이터팩 · 예제', k: 'data', id: 'item', t: '커스텀 아이템 세트', h: '지급 → 우클릭 감지 → 효과 3단 구조. 가장 많이 쓰는 패턴' },
  { g: '데이터팩 · 예제', k: 'data', id: 'recipe', t: '제작법', h: '커스텀 조합법 JSON' },
  { g: '데이터팩 · 예제', k: 'data', id: 'loot', t: '전리품 표', h: '/loot give 로 뽑을 수 있는 보상 표' },
  { g: '데이터팩 · 예제', k: 'data', id: 'adv', t: '발전 과제', h: '이벤트 감지 + 보상 함수 연결' },
  { g: '데이터팩 · 예제', k: 'data', id: 'pred', t: 'predicate (조건)', h: '확률·위치 조건을 재사용' },
  { g: '데이터팩 · 예제', k: 'data', id: 'imod', t: 'item_modifier', h: '아이템 강화 규칙' },
  { g: '데이터팩 · 예제', k: 'data', id: 'tags', t: '태그 폴더', h: '블록·아이템 묶음 (레이캐스트 등에 사용)' },
  { g: '데이터팩 · 예제', k: 'data', id: 'mob', t: '커스텀 몹 소환', h: '속성·장비·이름이 붙은 몹' },
  { g: '데이터팩 · 예제', k: 'data', id: 'dim', t: '커스텀 차원 + 바이옴', h: '새 월드에서만 적용됩니다 (주의)' },
  { g: '리소스팩', k: 'res', id: 'rcore', t: '기본 뼈대', h: 'pack.mcmeta (필수)', fixed: true },
  { g: '리소스팩', k: 'res', id: 'ricon', t: '팩 아이콘 (pack.png)', h: '목록에 보이는 64x64 아이콘을 생성' },
  { g: '리소스팩', k: 'res', id: 'rmodel', t: '커스텀 아이템 모델 + 텍스처', h: '16x16 PNG를 만들어 넣습니다. 버전에 맞는 방식으로 자동 처리' },
  { g: '리소스팩', k: 'res', id: 'rlang', t: '한국어 언어 파일', h: '번역 키 + 바닐라 이름 덮어쓰기 예제' },
  { g: '리소스팩', k: 'res', id: 'rsound', t: 'sounds.json 틀', h: '커스텀 소리 정의 (ogg 파일은 직접 넣어야 함)' },
  { g: '리소스팩', k: 'res', id: 'rreadme', t: 'README 안내문', h: '설치법·구조 설명' }
];

const PRESETS = {
  min: ['core', 'rcore', 'readme', 'rreadme'],
  rec: ['core', 'uninstall', 'readme', 'item', 'recipe', 'pred', 'rcore', 'ricon', 'rmodel', 'rlang', 'rreadme'],
  all: OPTIONS.map(o => o.id)
};

/* ─────────── 5. 상태 ─────────── */
const S = { files: [], sel: null };

const $ = (id) => document.getElementById(id);
const el = {
  name: $('i-name'), ns: $('i-ns'), desc: $('i-desc'), ver: $('i-ver'),
  dpf: $('i-dpf'), rpf: $('i-rpf'), color: $('i-color'),
  opts: $('opts'), tree: $('tree'), prev: $('prev'), prevName: $('prev-name'),
  stat: $('stat'), guide: $('install-guide'), custom: $('custom-fmt'),
  verHint: $('ver-hint'), nsEx: $('ns-ex')
};

function kind() { return document.querySelector('input[name=kind]:checked').value; }
function checked(id) { const c = $('o-' + id); return c ? c.checked : false; }

function slug(s) {
  return (s || '').toLowerCase()
    .replace(/[^a-z0-9_\-.]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_.\-]+|[_.\-]+$/g, '')
    .slice(0, 32) || 'mypack';
}

function cfg() {
  const v = VERSIONS.find(x => x.id === el.ver.value) || VERSIONS[0];
  const ns = slug(el.ns.value);
  const P = v.plural;
  return {
    name: el.name.value.trim() || '내 팩',
    ns,
    key: ns.replace(/[^a-z0-9]/g, '_') + '_item',
    desc: el.desc.value.trim() || '',
    color: el.color.value,
    v,
    dpf: v.custom ? (parseInt(el.dpf.value) || 71) : v.dp,
    rpf: v.custom ? (parseInt(el.rpf.value) || 55) : v.rp,
    d: {
      fn: P ? 'functions' : 'function',
      adv: P ? 'advancements' : 'advancement',
      loot: P ? 'loot_tables' : 'loot_table',
      pred: P ? 'predicates' : 'predicate',
      rec: P ? 'recipes' : 'recipe',
      imod: P ? 'item_modifiers' : 'item_modifier',
      tfn: P ? 'tags/functions' : 'tags/function',
      tbl: P ? 'tags/blocks' : 'tags/block',
      tit: P ? 'tags/items' : 'tags/item'
    }
  };
}

/* ─────────── 6. 텍스트 컴포넌트 헬퍼 ─────────── */
// NBT 안에 들어가는 텍스트 (item_name, CustomName 등)
function nbtTxt(c, o) {
  if (c.v.nbtText) {
    const parts = Object.entries(o).map(([k, val]) =>
      typeof val === 'string' ? `${k}:"${val}"` : `${k}:${val}`);
    return `{${parts.join(',')}}`;
  }
  return `'${JSON.stringify(o)}'`;
}
// tellraw 등 명령 인수로 들어가는 JSON 텍스트
function jsonTxt(o) { return JSON.stringify(o); }
// 클릭 이벤트 (1.21.5에서 이름이 바뀜)
function clickEv(c, cmd) {
  return c.v.nbtText
    ? { click_event: { action: 'run_command', command: cmd } }
    : { clickEvent: { action: 'run_command', value: cmd } };
}

/* ─────────── 7. 파일 생성 ─────────── */
function genFiles() {
  const c = cfg();
  const K = kind();
  const out = [];
  const add = (name, text) => out.push({ name, data: T(text), text });
  const addBin = (name, bytes) => out.push({ name, data: bytes, bin: true });

  const wantData = (K === 'data' || K === 'both');
  const wantRes = (K === 'res' || K === 'both');
  const PRE = (K === 'both');           // 둘 다면 zip 안에서 폴더를 나눈다
  const dRoot = PRE ? 'datapack/' : '';
  const rRoot = PRE ? 'resourcepack/' : '';

  /* ════ 데이터팩 ════ */
  if (wantData) {
    const NS = c.ns, D = c.d;
    const F = (p) => `${dRoot}data/${NS}/${D.fn}/${p}.mcfunction`;

    // pack.mcmeta
    const dmeta = { pack: { description: c.desc || c.name, pack_format: c.dpf } };
    if (c.dpf >= 18) dmeta.pack.supported_formats = { min_inclusive: 4, max_inclusive: 9999 };
    add(dRoot + 'pack.mcmeta', JSON.stringify(dmeta, null, 2) + '\n');

    // load / tick 태그
    add(`${dRoot}data/minecraft/${D.tfn}/load.json`, JSON.stringify({ values: [`${NS}:load`] }, null, 2) + '\n');
    add(`${dRoot}data/minecraft/${D.tfn}/tick.json`, JSON.stringify({ values: [`${NS}:tick`] }, null, 2) + '\n');

    // load.mcfunction
    const welcome = [
      { text: `[${c.name}] `, color: 'green', bold: true },
      { text: '불러오기 완료. ', color: 'white', bold: false }
    ];
    if (checked('item')) {
      welcome.push(Object.assign({ text: '[아이템 받기]', color: 'aqua', underlined: true }, clickEv(c, `/function ${NS}:item/give`)));
    }
    add(F('load'),
`# ${NS}:load
# 데이터팩이 로드/리로드될 때마다 1회 실행된다.
# minecraft:load 함수 태그에 등록되어 있다.
#
# ★ 원칙: 여기에는 "선언"만 넣는다. 스코어보드 등록, 팀 생성, 기본값 세팅.
#   월드를 바꾸는 작업(setblock, summon 등)은 절대 넣지 마라.
#   리로드할 때마다 실행되므로 몇 번 실행해도 결과가 같아야 한다.

# 스코어보드 등록 (이미 있으면 오류가 뜨지만 무해하다)
scoreboard objectives add ${NS}.sys dummy
scoreboard objectives add ${NS}.tmp dummy
${checked('item') ? `
# 커스텀 아이템 우클릭 감지용 통계 목표
# minecraft.used:<아이템> = 그 아이템을 우클릭한 횟수
scoreboard objectives add ${NS}.use minecraft.used:minecraft.carrot_on_a_stick
` : ''}
# 기본값 (없을 때만 넣는다 = 리로드 안전)
scoreboard players add #tick ${NS}.sys 0

tellraw @a ${jsonTxt(welcome)}
`);

    // tick.mcfunction
    add(F('tick'),
`# ${NS}:tick
# 매 틱(1초 = 20번) 실행된다.
#
# ★ 성능 규칙 — 이게 데이터팩 실력의 절반이다
#   1) @e 만 쓰지 마라. 반드시 type= 으로 좁혀라
#   2) 매 틱 필요 없는 건 아래 카운터로 나눠 실행하라
#   3) 여기가 무거우면 서버 전체가 느려진다

# 20틱(1초) 카운터
scoreboard players add #tick ${NS}.sys 1
execute if score #tick ${NS}.sys matches 20.. run scoreboard players set #tick ${NS}.sys 0
${checked('item') ? `
# 커스텀 아이템 우클릭 감지
# 점수가 1 이상인 플레이어만 잡아서 처리한다 (대상을 좁히는 게 중요)
execute as @a[scores={${NS}.use=1..}] at @s run function ${NS}:item/detect
` : ''}
# 1초에 1번만 하는 처리는 여기에
# execute if score #tick ${NS}.sys matches 0 run function ${NS}:tick_slow
`);

    if (checked('uninstall')) {
      add(F('uninstall'),
`# ${NS}:uninstall
# 데이터팩을 지우기 전에 실행한다.  /function ${NS}:uninstall
#
# ★ 스코어보드·팀·보스바는 데이터팩 파일을 지워도 월드에 그대로 남는다.
#   그래서 제대로 된 팩은 반드시 제거 함수를 제공한다.

kill @e[tag=${NS}.entity]

scoreboard objectives remove ${NS}.sys
scoreboard objectives remove ${NS}.tmp
${checked('item') ? `scoreboard objectives remove ${NS}.use\n` : ''}
tellraw @a ${jsonTxt([{ text: `[${c.name}] `, color: 'red' }, { text: '제거 완료. 이제 팩 파일을 삭제하고 /reload 하세요.', color: 'white' }])}
`);
    }

    /* 커스텀 아이템 세트 */
    if (checked('item')) {
      const nameTxt = nbtTxt(c, { text: '마법 지팡이', color: 'aqua', bold: true });
      const loreTxt = c.v.nbtText
        ? `[${nbtTxt(c, { text: '우클릭 — 바라보는 곳에 번개', color: 'gray', italic: false })}]`
        : `[${nbtTxt(c, { text: '우클릭 — 바라보는 곳에 번개', color: 'gray', italic: false })}]`;

      let give;
      if (c.v.comp) {
        const parts = [
          `minecraft:item_name=${nameTxt}`,
          `minecraft:lore=${loreTxt}`,
          `minecraft:custom_data={${c.key}:"wand"}`,
          `minecraft:enchantment_glint_override=true`,
          `minecraft:max_stack_size=1`
        ];
        if (checked('rmodel') && wantRes) {
          parts.push(c.v.itemModel ? `minecraft:item_model="${NS}:wand"` : `minecraft:custom_model_data=1`);
        }
        give = `give @s minecraft:carrot_on_a_stick[${parts.join(',')}]`;
      } else {
        const cmd = (checked('rmodel') && wantRes) ? ',CustomModelData:1' : '';
        give = `give @s minecraft:carrot_on_a_stick{display:{Name:${nameTxt},Lore:${loreTxt}},${c.key}:"wand"${cmd}}`;
      }

      add(F('item/give'),
`# ${NS}:item/give
# 커스텀 아이템 지급.  /function ${NS}:item/give
#
# ★ 왜 '당근 낚싯대'인가?
#   우클릭에 반응하면서 자체 동작이 없는 아이템이라 커스텀 아이템의 표준 베이스다.
#   (음식·활·엔더진주는 자체 동작이 있어 부작용이 생긴다)
#
# ★ custom_data 는 게임에 영향을 주지 않는 "내 표식"이다.
#   이걸로 어떤 커스텀 아이템인지 구분한다.
${c.v.comp ? `#
# ★ 이 문법은 아이템 컴포넌트 방식(1.20.5+)이다.` : `#
# ★ 이 문법은 구버전 NBT 방식(1.20.4 이하)이다.`}

${give}

playsound minecraft:entity.player.levelup player @s ~ ~ ~ 1 1.4
tellraw @s ${jsonTxt([{ text: '마법 지팡이를 받았다. 우클릭해 보세요.', color: 'green' }])}
`);

      const match = c.v.comp
        ? `nbt={SelectedItem:{components:{"minecraft:custom_data":{${c.key}:"wand"}}}}`
        : `nbt={SelectedItem:{tag:{${c.key}:"wand"}}}`;

      add(F('item/detect'),
`# ${NS}:item/detect
# 우클릭 감지 디스패처. tick 에서 호출된다.
#
# ★ 마인크래프트에는 "우클릭 이벤트"가 없다. 그래서 이렇게 우회한다:
#   1) load 에서 minecraft.used:<아이템> 통계 목표를 만든다
#   2) 우클릭하면 그 점수가 +1 된다
#   3) tick 에서 점수 1 이상인 플레이어를 잡는다
#   4) 처리 후 반드시 0으로 되돌린다  ← 안 하면 매 틱 발동한다!

# 리셋을 제일 먼저 한다 (아래에서 중단되어도 반드시 리셋되도록)
scoreboard players set @s ${NS}.use 0

# 주 손에 든 아이템의 표식으로 어떤 아이템인지 구분
execute if entity @s[${match}] run function ${NS}:item/use

# 아이템을 더 만들려면 여기에 한 줄씩 추가하면 된다
# execute if entity @s[nbt={SelectedItem:{...{${c.key}:"sword"}}}] run function ${NS}:item/sword
`);

      add(F('item/use'),
`# ${NS}:item/use
# 실제 효과. @s = 사용한 플레이어, 실행 위치 = 플레이어 위치.

# ── 쿨다운 검사 (2초) ─────────────────────────
execute if score @s ${NS}.tmp matches 1.. run return run title @s actionbar ${jsonTxt([{ text: '아직 쿨다운 중', color: 'red' }])}
scoreboard players set @s ${NS}.tmp 40

# ── 효과: 바라보는 방향 5칸 앞에 번개 ──────────
# ^ ^ ^5 는 캐럿 좌표. "바라보는 방향으로 5칸 앞"이라는 뜻이다.
# anchored eyes 를 넣어야 발밑이 아니라 눈높이 기준이 된다.
execute at @s anchored eyes run summon minecraft:lightning_bolt ^ ^ ^5

playsound minecraft:entity.illusioner_cast_spell player @a ~ ~ ~ 1 1.4
particle minecraft:electric_spark ~ ~1.2 ~ 0.3 0.3 0.3 0.02 20 normal @a
`);

      // 쿨다운 감소를 tick 에 추가하기 위한 안내는 README 에서 처리
    }

    /* 제작법 */
    if (checked('recipe')) {
      const result = c.v.comp
        ? { id: 'minecraft:carrot_on_a_stick', count: 1 }
        : { item: 'minecraft:carrot_on_a_stick', count: 1 };
      add(`${dRoot}data/${NS}/${D.rec}/wand.json`, JSON.stringify({
        type: 'minecraft:crafting_shaped',
        category: 'equipment',
        pattern: ['  D', ' S ', 'S  '],
        key: { D: 'minecraft:diamond', S: 'minecraft:stick' },
        result
      }, null, 2) + '\n');
    }

    /* 전리품 표 */
    if (checked('loot')) {
      add(`${dRoot}data/${NS}/${D.loot}/reward.json`, JSON.stringify({
        type: 'minecraft:chest',
        pools: [
          {
            rolls: 1,
            entries: [
              { type: 'minecraft:item', name: 'minecraft:diamond', weight: 3, functions: [{ function: 'minecraft:set_count', count: { min: 1, max: 3 } }] },
              { type: 'minecraft:item', name: 'minecraft:emerald', weight: 5 },
              { type: 'minecraft:item', name: 'minecraft:gold_ingot', weight: 8 },
              { type: 'minecraft:empty', weight: 2 }
            ]
          }
        ]
      }, null, 2) + '\n');
    }

    /* 발전 과제 */
    if (checked('adv')) {
      add(`${dRoot}data/${NS}/${D.adv}/root.json`, JSON.stringify({
        display: {
          icon: c.v.comp ? { id: 'minecraft:carrot_on_a_stick', count: 1 } : { item: 'minecraft:carrot_on_a_stick' },
          title: c.name,
          description: c.desc || '팩이 적용되었습니다',
          frame: 'task',
          background: 'minecraft:textures/block/stone.png',
          show_toast: true,
          announce_to_chat: false,
          hidden: false
        },
        criteria: { joined: { trigger: 'minecraft:tick' } }
      }, null, 2) + '\n');
    }

    /* predicate */
    if (checked('pred')) {
      add(`${dRoot}data/${NS}/${D.pred}/chance_50.json`,
        JSON.stringify({ condition: 'minecraft:random_chance', chance: 0.5 }, null, 2) + '\n');
    }

    /* item_modifier */
    if (checked('imod')) {
      add(`${dRoot}data/${NS}/${D.imod}/upgrade.json`, JSON.stringify([
        { function: 'minecraft:set_lore', entity: 'this', mode: 'append', lore: [{ text: '◈ 강화 +1', color: 'gold', italic: false }] },
        { function: 'minecraft:set_enchantments', enchantments: { 'minecraft:sharpness': 1 }, add: true }
      ], null, 2) + '\n');
    }

    /* 태그 */
    if (checked('tags')) {
      add(`${dRoot}data/${NS}/${D.tbl}/passable.json`, JSON.stringify({
        values: ['minecraft:air', 'minecraft:cave_air', 'minecraft:void_air', 'minecraft:water',
          'minecraft:short_grass', 'minecraft:tall_grass', 'minecraft:snow', 'minecraft:light']
      }, null, 2) + '\n');
      add(`${dRoot}data/${NS}/${D.tit}/gems.json`, JSON.stringify({
        values: ['minecraft:diamond', 'minecraft:emerald', 'minecraft:amethyst_shard']
      }, null, 2) + '\n');
    }

    /* 커스텀 몹 */
    if (checked('mob')) {
      const mobName = nbtTxt(c, { text: '수호자', color: 'gold', bold: true });
      const attrs = c.v.nbtText
        ? `attributes:[{id:"minecraft:max_health",base:60},{id:"minecraft:attack_damage",base:8},{id:"minecraft:movement_speed",base:0.28}]`
        : (c.v.comp
          ? `Attributes:[{Name:"minecraft:max_health",Base:60},{Name:"minecraft:attack_damage",Base:8},{Name:"minecraft:movement_speed",Base:0.28}]`
          : `Attributes:[{Name:"generic.max_health",Base:60},{Name:"generic.attack_damage",Base:8},{Name:"generic.movement_speed",Base:0.28}]`);
      const equip = c.v.nbtText
        ? `equipment:{mainhand:{id:"minecraft:iron_sword",count:1}}`
        : `HandItems:[{id:"minecraft:iron_sword",Count:1b},{}]`;
      add(F('mob/summon'),
`# ${NS}:mob/summon
# 커스텀 몹 소환.  /function ${NS}:mob/summon
#
# ★ 데이터팩으로 "새로운 엔티티 종류"를 만들 수는 없다.
#   대신 바닐라 몹을 껍데기로 쓰고 속성·장비·이름을 갈아 끼운다.
#
# ★ PersistenceRequired:1b 를 빼먹으면 몹이 저절로 사라진다. 가장 흔한 실수.
# ★ ${NS}.entity 태그를 붙여 두면 나중에 kill @e[tag=${NS}.entity] 한 줄로 정리된다.

summon minecraft:zombie ~ ~ ~ {Tags:["${NS}.entity","${NS}.guard"],CustomName:${mobName},CustomNameVisible:1b,PersistenceRequired:1b,Health:60f,${attrs},${equip}}

particle minecraft:soul ~ ~1 ~ 0.4 0.6 0.4 0.05 40 normal @a
playsound minecraft:entity.zombie_villager.converted hostile @a ~ ~ ~ 1 0.7
`);
    }

    /* 커스텀 차원 + 바이옴 */
    if (checked('dim')) {
      add(`${dRoot}data/${NS}/dimension_type/${NS}_dim.json`, JSON.stringify({
        ultrawarm: false, natural: true, coordinate_scale: 1.0,
        has_skylight: true, has_ceiling: false, ambient_light: 0.3,
        fixed_time: 18000, monster_spawn_light_level: 0, monster_spawn_block_light_limit: 0,
        piglin_safe: false, bed_works: true, respawn_anchor_works: false, has_raids: false,
        logical_height: 256, min_y: 0, height: 256,
        infiniburn: '#minecraft:infiniburn_overworld', effects: 'minecraft:the_end'
      }, null, 2) + '\n');
      add(`${dRoot}data/${NS}/dimension/${NS}_dim.json`, JSON.stringify({
        type: `${NS}:${NS}_dim`,
        generator: {
          type: 'minecraft:flat',
          settings: {
            biome: `${NS}:${NS}_biome`,
            lakes: false, features: false,
            layers: [
              { block: 'minecraft:bedrock', height: 1 },
              { block: 'minecraft:deepslate', height: 20 },
              { block: 'minecraft:polished_deepslate', height: 2 }
            ],
            structure_overrides: []
          }
        }
      }, null, 2) + '\n');
      add(`${dRoot}data/${NS}/worldgen/biome/${NS}_biome.json`, JSON.stringify({
        has_precipitation: false, temperature: 0.8, downfall: 0.4,
        effects: {
          sky_color: 9319167, fog_color: 4600482,
          water_color: 4159204, water_fog_color: 329011,
          particle: { probability: 0.006, options: { type: 'minecraft:end_rod' } }
        },
        spawners: { monster: [], creature: [], ambient: [], axolotls: [], underground_water_creature: [], water_creature: [], water_ambient: [], misc: [] },
        spawn_costs: {}, features: []
      }, null, 2) + '\n');
    }

    /* README */
    if (checked('readme')) {
      add(dRoot + 'README.txt', dpReadme(c, K));
    }
  }

  /* ════ 리소스팩 ════ */
  if (wantRes) {
    const NS = c.ns;
    const rmeta = { pack: { description: c.desc || c.name, pack_format: c.rpf } };
    if (c.rpf >= 18) rmeta.pack.supported_formats = { min_inclusive: 4, max_inclusive: 9999 };
    add(rRoot + 'pack.mcmeta', JSON.stringify(rmeta, null, 2) + '\n');

    if (checked('ricon')) addBin(rRoot + 'pack.png', makePackPng(c.color));

    if (checked('rmodel')) {
      addBin(`${rRoot}assets/${NS}/textures/item/wand.png`, makeItemPng(c.color));
      add(`${rRoot}assets/${NS}/models/item/wand.json`, JSON.stringify({
        parent: 'minecraft:item/handheld',
        textures: { layer0: `${NS}:item/wand` }
      }, null, 2) + '\n');

      if (c.v.itemModel) {
        // 1.21.4+ : 아이템 모델 정의. 바닐라를 덮어쓰지 않는다.
        add(`${rRoot}assets/${NS}/items/wand.json`, JSON.stringify({
          model: { type: 'minecraft:model', model: `${NS}:item/wand` }
        }, null, 2) + '\n');
      } else {
        // 구버전 : 바닐라 모델을 덮어쓰고 custom_model_data 로 분기
        add(`${rRoot}assets/minecraft/models/item/carrot_on_a_stick.json`, JSON.stringify({
          parent: 'minecraft:item/handheld',
          textures: { layer0: 'minecraft:item/carrot_on_a_stick' },
          overrides: [{ predicate: { custom_model_data: 1 }, model: `${NS}:item/wand` }]
        }, null, 2) + '\n');
      }
    }

    if (checked('rlang')) {
      add(`${rRoot}assets/${NS}/lang/ko_kr.json`, JSON.stringify({
        [`item.${NS}.wand`]: '마법 지팡이',
        [`${NS}.msg.hello`]: '팩이 적용되었습니다',
        [`biome.${NS}.${NS}_biome`]: '수정 평원',
        [`dimension.${NS}.${NS}_dim`]: '이계'
      }, null, 2) + '\n');
      add(`${rRoot}assets/minecraft/lang/ko_kr.json`, JSON.stringify({
        'item.minecraft.carrot_on_a_stick': '마법 지팡이'
      }, null, 2) + '\n');
    }

    if (checked('rsound')) {
      add(`${rRoot}assets/${NS}/sounds.json`, JSON.stringify({
        'magic.cast': {
          category: 'player',
          subtitle: `${NS}.subtitle.cast`,
          sounds: [{ name: `${NS}:magic/cast`, volume: 1.0, pitch: 1.0, stream: false }]
        }
      }, null, 2) + '\n');
      add(`${rRoot}assets/${NS}/sounds/magic/README.txt`,
`여기에 cast.ogg 파일을 넣으세요.

★ 반드시 .ogg 여야 합니다. .mp3 / .wav 는 인식되지 않습니다.
  변환: Audacity(무료)로 열어서 "Ogg Vorbis"로 내보내기
  모노 채널이어야 3D 위치 효과가 정상 작동합니다.

넣은 뒤 게임에서:
  /playsound ${NS}:magic.cast player @s ~ ~ ~ 1 1
`);
    }

    if (checked('rreadme')) add(rRoot + 'README.txt', rpReadme(c, K));
  }

  return out;
}

/* ─────────── 8. README 본문 ─────────── */
function dpReadme(c, K) {
  const NS = c.ns;
  return `${c.name} — 데이터팩
${'='.repeat(50)}

■ 설치
  1) 이 zip 을 압축 풀지 말고 그대로
     <월드 폴더>/datapacks/  에 넣으세요.
${K === 'both' ? `     ※ 둘 다 받으셨다면 zip 안의 datapack 폴더 내용만
        따로 zip 으로 묶거나, 폴더째 datapacks/ 에 넣으면 됩니다.\n` : ''}  2) 게임에서  /reload
  3) 확인:  /datapack list   ← 목록에 있으면 성공

  월드 폴더 찾기: 게임 월드 목록 → 월드 선택 → [편집] → [월드 폴더 열기]

■ 기본 명령
  /function ${NS}:load        직접 다시 불러오기
${checked('item') ? `  /function ${NS}:item/give   커스텀 아이템 받기\n` : ''}${checked('mob') ? `  /function ${NS}:mob/summon  커스텀 몹 소환\n` : ''}${checked('loot') ? `  /loot give @s loot ${NS}:reward   전리품 표 뽑기\n` : ''}${checked('imod') ? `  /item modify entity @s weapon.mainhand ${NS}:upgrade   아이템 강화\n` : ''}${checked('dim') ? `  /execute in ${NS}:${NS}_dim run tp @s 0 70 0   커스텀 차원 이동\n` : ''}${checked('uninstall') ? `  /function ${NS}:uninstall   제거 (파일 삭제 전에 실행)\n` : ''}
■ 버전
  대상: ${c.v.label}
  pack_format: ${c.dpf}
  폴더 이름: ${c.v.plural ? '복수형 (functions, advancements ...)' : '단수형 (function, advancement ...)'}
  아이템 문법: ${c.v.comp ? '컴포넌트 방식 [minecraft:item_name=...]' : '구버전 NBT 방식 {display:{Name:...}}'}

  숫자가 안 맞아 경고가 뜨면 pack.mcmeta 의 pack_format 만 고치면 됩니다.
  정확한 숫자는 .minecraft/versions/<버전>/<버전>.jar 안의
  version.json 에서 "pack_version" → "data" 값을 보면 됩니다.

■ 구조
  pack.mcmeta                        팩 신분증 (최상단 필수)
  data/minecraft/${c.d.tfn}/  load·tick 등록
  data/${NS}/${c.d.fn}/          내 함수들
${checked('recipe') ? `  data/${NS}/${c.d.rec}/            제작법\n` : ''}${checked('loot') ? `  data/${NS}/${c.d.loot}/         전리품 표\n` : ''}${checked('adv') ? `  data/${NS}/${c.d.adv}/         발전 과제\n` : ''}${checked('pred') ? `  data/${NS}/${c.d.pred}/         조건(predicate)\n` : ''}${checked('imod') ? `  data/${NS}/${c.d.imod}/     아이템 변형\n` : ''}${checked('tags') ? `  data/${NS}/tags/                    블록·아이템 태그\n` : ''}${checked('dim') ? `  data/${NS}/dimension/               커스텀 차원\n  data/${NS}/worldgen/biome/          커스텀 바이옴\n` : ''}
■ 고치는 법
  · 시작 메시지        → ${c.d.fn}/load.mcfunction 의 tellraw
  · 매 틱 동작         → ${c.d.fn}/tick.mcfunction  (가볍게 유지!)
${checked('item') ? `  · 아이템 이름·능력   → ${c.d.fn}/item/give.mcfunction
  · 우클릭 효과        → ${c.d.fn}/item/use.mcfunction
  · 아이템 종류 추가   → ${c.d.fn}/item/detect.mcfunction 에 분기 한 줄
` : ''}
■ 주의
  · 파일·폴더 이름에 대문자·한글·공백을 쓰면 조용히 무시됩니다.
  · zip 안에 폴더가 한 겹 더 들어가면 인식되지 않습니다.
    (이 zip 은 그렇게 되어 있지 않으니 그대로 쓰시면 됩니다)
${checked('item') ? `  · 쿨다운을 쓰려면 tick.mcfunction 에 아래 한 줄을 추가하세요:
      scoreboard players remove @a[scores={${NS}.tmp=1..}] ${NS}.tmp 1
` : ''}${checked('dim') ? `  · 커스텀 차원·바이옴은 "새로 생성되는 청크"에만 적용됩니다.
    이미 만들어진 월드에서는 /fillbiome 으로 바이옴만 바꿀 수 있습니다.
    오류가 나면 dimension/ 과 worldgen/ 폴더를 지우면 됩니다.
` : ''}${checked('recipe') ? `  · 제작법에서 오류가 나면 recipe JSON 의 result 형식을 확인하세요.
    1.20.5 이상은 "id", 그 이전은 "item" 키를 씁니다.
` : ''}
■ 문제 해결 순서
  1) /reload 후 빨간 오류 메시지를 읽는다  ← 대부분 여기서 답이 나온다
  2) /datapack list 로 로드됐는지 확인
  3) /function ${NS}:  까지 치고 자동완성에 뜨는지 확인
  4) 안 뜨면 폴더 이름(단수/복수)이나 zip 구조 문제
`;
}

function rpReadme(c, K) {
  const NS = c.ns;
  return `${c.name} — 리소스팩
${'='.repeat(50)}

■ 설치
  1) 이 zip 을 압축 풀지 말고 그대로
     <.minecraft>/resourcepacks/  에 넣으세요.
  2) 게임 → 설정 → 리소스팩 → 활성화
  3) 수정 후 다시 불러오기:  F3+T  (게임 재시작 불필요)

  .minecraft 위치
    Windows : %appdata%\\.minecraft
    macOS   : ~/Library/Application Support/minecraft
    Linux   : ~/.minecraft

■ 버전
  대상: ${c.v.label}
  pack_format: ${c.rpf}
  아이템 외형 방식: ${c.v.itemModel
      ? '아이템 모델 정의 (assets/' + NS + '/items/*.json) — 1.21.4+'
      : 'custom_model_data + overrides — 1.21.3 이하'}

  ※ 데이터팩과 리소스팩은 pack_format 숫자가 서로 다릅니다.

■ 구조
  pack.mcmeta                         팩 신분증 (최상단 필수)
${checked('ricon') ? '  pack.png                            목록 아이콘 64x64\n' : ''}${checked('rmodel') ? `  assets/${NS}/textures/item/wand.png   텍스처 (16x16)
  assets/${NS}/models/item/wand.json    모델
${c.v.itemModel
      ? `  assets/${NS}/items/wand.json          아이템 모델 정의`
      : `  assets/minecraft/models/item/carrot_on_a_stick.json  (바닐라 덮어쓰기)`}
` : ''}${checked('rlang') ? `  assets/${NS}/lang/ko_kr.json          번역
  assets/minecraft/lang/ko_kr.json      바닐라 이름 덮어쓰기
` : ''}${checked('rsound') ? `  assets/${NS}/sounds.json              소리 정의
  assets/${NS}/sounds/magic/            여기에 .ogg 를 넣으세요
` : ''}
■ 텍스처 바꾸기
  assets/${NS}/textures/item/wand.png 를
  16x16 PNG 로 덮어쓰면 됩니다. (투명 배경 지원)
  그림판·아세프라이트·포토샵 등 아무거나 괜찮습니다.

■ 주의
  · 리소스팩은 데이터팩과 달리 각 플레이어가 직접 켜야 합니다.
  · 싱글 월드에 자동 적용하려면 <월드 폴더>/resources.zip 으로 넣으면 됩니다.
  · 텍스처를 바꿔도 안 보이면 F3+T 를 눌러 다시 불러오세요.
${!c.v.itemModel && checked('rmodel') ? `  · 이 버전은 바닐라 carrot_on_a_stick 모델을 덮어씁니다.
    다른 리소스팩과 충돌할 수 있습니다. 1.21.4 이상이라면
    생성기에서 버전을 올려 다시 받는 쪽이 깔끔합니다.
` : ''}`;
}

/* ─────────── 9. UI 렌더링 ─────────── */
function renderOptions() {
  const groups = {};
  OPTIONS.forEach(o => { (groups[o.g] = groups[o.g] || []).push(o); });
  let html = '';
  for (const g in groups) {
    html += `<div class="chk-group" data-kind="${groups[g][0].k}"><div class="gt">${g}</div><div class="checks">`;
    groups[g].forEach(o => {
      html += `<label><input type="checkbox" id="o-${o.id}" ${o.fixed ? 'checked disabled' : ''}>
        <span><b>${o.t}</b><i>${o.h}</i></span></label>`;
    });
    html += '</div></div>';
  }
  el.opts.innerHTML = html;
  applyPreset('rec');
  el.opts.querySelectorAll('input').forEach(i => i.addEventListener('change', refresh));
}

function applyPreset(p) {
  const set = new Set(PRESETS[p]);
  OPTIONS.forEach(o => {
    const c = $('o-' + o.id);
    if (c && !o.fixed) c.checked = set.has(o.id);
  });
}

function syncKindUI() {
  const K = kind();
  el.opts.querySelectorAll('.chk-group').forEach(g => {
    const k = g.dataset.kind;
    g.style.display = (K === 'both' || K === k) ? '' : 'none';
  });
}

function renderVersions() {
  el.ver.innerHTML = VERSIONS.map(v => `<option value="${v.id}">${v.label}</option>`).join('');
  const tb = $('ver-table');
  VERSIONS.filter(v => !v.custom).forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${v.label}</strong></td><td>${v.dp}</td><td>${v.rp}</td>
      <td>${v.plural ? '복수형' : '<em>단수형</em>'}</td>
      <td>${v.comp ? (v.nbtText ? '<em>컴포넌트 + NBT 텍스트</em>' : '컴포넌트') : '구 NBT'}</td>`;
    tb.appendChild(tr);
  });
}

function buildTree(files) {
  const root = {};
  files.forEach(f => {
    const parts = f.name.split('/');
    let cur = root;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) (cur.__f = cur.__f || []).push({ n: p, f });
      else cur = (cur[p] = cur[p] || {});
    });
  });
  const lines = [];
  const walk = (node, depth) => {
    const dirs = Object.keys(node).filter(k => k !== '__f').sort();
    dirs.forEach(d => {
      lines.push(`<span class="tn d">${'  '.repeat(depth)}📁 ${esc(d)}/</span>`);
      walk(node[d], depth + 1);
    });
    (node.__f || []).sort((a, b) => a.n.localeCompare(b.n)).forEach(x => {
      const sz = x.f.data.length;
      lines.push(`<span class="tn f" data-p="${esc(x.f.name)}">${'  '.repeat(depth)}📄 ${esc(x.n)} <span class="sz">${sz}B</span></span>`);
    });
  };
  walk(root, 0);
  return lines.join('');
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function refresh() {
  syncKindUI();
  const c = cfg();
  el.nsEx.textContent = `${c.ns}:load`;
  if (el.ns.value !== c.ns) el.ns.classList.add('bad'); else el.ns.classList.remove('bad');

  const v = VERSIONS.find(x => x.id === el.ver.value) || VERSIONS[0];
  el.custom.style.display = v.custom ? '' : 'none';
  el.verHint.innerHTML = v.custom
    ? '아래에 숫자를 직접 넣으세요. 몰라도 <code>supported_formats</code>가 넓어 대부분 작동합니다.'
    : `데이터팩 <code>${v.dp}</code> · 리소스팩 <code>${v.rp}</code> · 폴더 ${v.plural ? '<b>복수형</b>' : '<b>단수형</b>'}`;

  const files = genFiles();
  S.files = files;

  let bytes = 0; files.forEach(f => bytes += f.data.length);
  el.stat.innerHTML = `파일 <b>${files.length}</b>개 · 총 <b>${(bytes / 1024).toFixed(1)}</b> KB
    · 버전 <b>${esc(v.label)}</b> · 네임스페이스 <b>${esc(c.ns)}</b>`;

  el.tree.innerHTML = buildTree(files);
  el.tree.querySelectorAll('.tn.f').forEach(n => n.addEventListener('click', () => showFile(n.dataset.p)));

  // 이전에 보던 파일 유지, 없으면 첫 텍스트 파일
  const keep = S.sel && files.find(f => f.name === S.sel);
  showFile(keep ? S.sel : (files.find(f => !f.bin) || files[0] || {}).name);

  const K = kind();
  el.guide.innerHTML = `<strong>설치:</strong> `
    + (K !== 'res' ? `데이터팩 zip → <code>&lt;월드 폴더&gt;/datapacks/</code> → <code>/reload</code>` : '')
    + (K === 'both' ? '<br>' : '')
    + (K !== 'data' ? `리소스팩 zip → <code>&lt;.minecraft&gt;/resourcepacks/</code> → 설정에서 활성화 (<code>F3+T</code>로 새로고침)` : '')
    + (K === 'both' ? `<br><span style="color:var(--txt3)">둘 다 선택하면 zip 안에 <code>datapack/</code> · <code>resourcepack/</code> 폴더로 나뉘어 담깁니다. 각 폴더 <em>안의 내용</em>을 해당 위치에 넣으세요.</span>` : '')
    + `<br><strong>압축을 풀지 마세요.</strong> zip 그대로 넣으면 됩니다.`;
}

function showFile(path) {
  if (!path) { el.prev.textContent = ''; el.prevName.textContent = ''; return; }
  S.sel = path;
  const f = S.files.find(x => x.name === path);
  el.tree.querySelectorAll('.tn.f').forEach(n => n.classList.toggle('sel', n.dataset.p === path));
  if (!f) { el.prev.textContent = ''; el.prevName.textContent = ''; return; }
  el.prevName.textContent = '▸ ' + f.name;
  el.prev.textContent = f.bin
    ? `(이미지 파일 · ${f.data.length} 바이트)\n\n생성된 PNG 입니다. 원하는 그림으로 덮어쓰면 됩니다.`
    : f.text;
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('on'), 2200);
}

function download() {
  const c = cfg();
  const files = S.files;
  if (!files.length) { toast('만들 파일이 없습니다'); return; }
  const blob = buildZip(files);
  const K = kind();
  const suffix = K === 'data' ? '_datapack' : K === 'res' ? '_resourcepack' : '_pack';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${c.ns}${suffix}.zip`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  toast(`${a.download} 다운로드 (${files.length}개 파일)`);
}

/* ─────────── 10. 이벤트 연결 ─────────── */
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

['i-name', 'i-desc', 'i-color', 'i-dpf', 'i-rpf'].forEach(id => {
  $(id).addEventListener('input', refresh);
});
el.ver.addEventListener('change', refresh);
el.ns.addEventListener('input', refresh);
el.ns.addEventListener('blur', () => { el.ns.value = slug(el.ns.value); refresh(); });
document.querySelectorAll('input[name=kind]').forEach(r => r.addEventListener('change', refresh));

// 이름을 바꾸면 네임스페이스를 자동으로 따라가게 (사용자가 직접 고치기 전까지)
let nsTouched = false;
el.ns.addEventListener('input', () => { nsTouched = true; });
el.name.addEventListener('input', () => {
  if (!nsTouched) { el.ns.value = slug(el.name.value) || 'mypack'; refresh(); }
});

$('b-all').addEventListener('click', () => { applyPreset('all'); refresh(); toast('전부 선택'); });
$('b-min').addEventListener('click', () => { applyPreset('min'); refresh(); toast('최소 구성'); });
$('b-rec').addEventListener('click', () => { applyPreset('rec'); refresh(); toast('추천 구성'); });
$('b-dl').addEventListener('click', download);
$('b-reset').addEventListener('click', () => {
  el.name.value = '내 첫 데이터팩'; el.ns.value = 'mypack';
  el.desc.value = '내가 만든 첫 번째 팩'; el.color.value = '#3fbf7f';
  el.ver.value = VERSIONS[0].id;
  document.querySelector('input[name=kind][value=both]').checked = true;
  nsTouched = false;
  applyPreset('rec'); refresh(); toast('초기화했습니다');
});
$('b-copy').addEventListener('click', async () => {
  const f = S.files.find(x => x.name === S.sel);
  if (!f || f.bin) { toast('텍스트 파일을 선택하세요'); return; }
  try { await navigator.clipboard.writeText(f.text); toast('클립보드에 복사했습니다'); }
  catch (e) { toast('복사가 차단되었습니다'); }
});

/* ─────────── 시작 ─────────── */
renderVersions();
renderOptions();
refresh();
