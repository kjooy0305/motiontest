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

/* ─────────── 4-1. 표준 폴더 사전 ───────────
   "어느 폴더에 뭘 넣는지"가 가장 헷갈리는 부분이다.
   폴더 뼈대 모드에서 이 목록대로 폴더를 만들고 안내문을 넣는다.
   d: 폴더 키(버전별 단수/복수는 cfg().d 로 치환), p: 고정 경로 */
const DP_FOLDERS = [
  { d: 'fn', desc: '함수(.mcfunction). /function <네임스페이스>:<파일경로> 로 실행한다.\n하위 폴더를 만들면 그대로 이름에 들어간다 → item/give.mcfunction = ns:item/give' },
  { d: 'tfn', desc: '함수 태그. load.json·tick.json 이 여기 들어간다.\n여러 함수를 묶어 #ns:이름 으로 한 번에 호출할 수 있다.' },
  { d: 'tbl', desc: '블록 태그. #ns:이름 으로 여러 블록을 한 묶음으로 다룬다.\n예) 레이캐스트가 통과할 수 있는 블록 목록' },
  { d: 'tit', desc: '아이템 태그. 레시피 재료를 여러 종류 허용할 때 쓴다.' },
  { p: 'tags/entity_type', pp: 'tags/entity_types', desc: '엔티티 태그. 몹 종류를 묶는다. 셀렉터에서 type=#ns:이름 으로 사용.' },
  { p: 'tags/damage_type', pp: 'tags/damage_types', desc: '데미지 종류 태그. 특정 피해를 무시하거나 분류할 때.' },
  { d: 'adv', desc: '발전 과제. 화면에 뜨는 업적이자 "이벤트 감지기"다.\nrewards.function 으로 조건 달성 시 함수를 실행할 수 있다 — 매우 중요.' },
  { d: 'loot', desc: '전리품 표. 몹 드롭·상자 내용물·블록 파괴 결과를 정의한다.\n/loot give 나 몹의 DeathLootTable 로 연결한다.' },
  { d: 'rec', desc: '제작법. 조합대·화로·석재절단기 등의 레시피 JSON.' },
  { d: 'pred', desc: '조건(predicate). 확률·위치·장비·날씨 등을 재사용 가능한 조건으로 저장.\nexecute if predicate ns:이름 으로 쓴다.' },
  { d: 'imod', desc: '아이템 변형 규칙. /item modify 로 아이템에 로어·인챈트·속성을 붙인다.\n강화 시스템의 기반.' },
  { p: 'structure', pp: 'structures', desc: '구조물 .nbt 파일. 구조물 블록으로 저장한 건축물을 여기 넣으면\n/place structure ns:이름 으로 배치할 수 있다.' },
  { p: 'dimension', desc: '커스텀 차원 정의. 어떤 지형 생성기를 쓸지 정한다.' },
  { p: 'dimension_type', desc: '차원의 물리 법칙. 하늘 유무·시간 고정·높이 범위·침대 작동 여부 등.' },
  { p: 'worldgen/biome', desc: '커스텀 바이옴. 하늘색·안개색·물색·몹 스폰·파티클을 정의한다.' },
  { p: 'worldgen/noise_settings', desc: '지형 생성 규칙. 해수면·기본 블록·밀도 함수.\n"원래 지형 규칙을 부수는" 작업이 여기서 이뤄진다.' },
  { p: 'worldgen/configured_feature', desc: '배치물 정의 (나무·광석 덩어리·식물 등 무엇을 놓을지).' },
  { p: 'worldgen/placed_feature', desc: '배치 규칙 (얼마나 자주·어느 높이에 놓을지).' },
  { p: 'worldgen/structure', desc: '구조물 생성 정의 (어느 바이옴에 어떻게 생성될지).' },
  { p: 'worldgen/structure_set', desc: '구조물 배치 간격. spacing·separation 으로 밀도를 정한다.' },
  { p: 'worldgen/template_pool', desc: '지그소 조각 목록. 마을처럼 무작위 조립되는 구조물에 쓴다.' },
  { p: 'worldgen/processor_list', desc: '구조물 블록 치환 규칙. 벽돌 일부를 이끼 낀 것으로 바꾸는 등.' },
  { p: 'enchantment', desc: '커스텀 인챈트 (1.21+). 효과·비용·적용 대상을 직접 정의한다.' },
  { p: 'damage_type', desc: '커스텀 데미지 종류. 사망 메시지와 피해 특성을 정한다.' },
  { p: 'banner_pattern', desc: '현수막 무늬.' },
  { p: 'painting_variant', desc: '그림(액자) 종류.' },
  { p: 'jukebox_song', desc: '주크박스 음반 정의.' }
];

const RP_FOLDERS = [
  { p: 'items', desc: '아이템 모델 정의 (1.21.4+). item_model 컴포넌트가 여기를 가리킨다.\n바닐라 모델을 덮어쓰지 않아 다른 팩과 충돌하지 않는다.' },
  { p: 'models/item', desc: '아이템 모델 JSON. parent 와 textures 를 지정한다.\nhandheld=손에 들면 기울어짐, generated=평평한 아이템.' },
  { p: 'models/block', desc: '블록 모델 JSON.' },
  { p: 'blockstates', desc: '블록 상태별로 어떤 모델을 쓸지 매핑한다.' },
  { p: 'textures/item', desc: '아이템 텍스처 PNG. 보통 16x16.' },
  { p: 'textures/block', desc: '블록 텍스처 PNG. 보통 16x16.' },
  { p: 'textures/entity', desc: '몹·엔티티 텍스처.' },
  { p: 'textures/gui', desc: 'GUI 이미지 (인벤토리 배경 등).' },
  { p: 'textures/particle', desc: '파티클 텍스처.' },
  { p: 'textures/font', desc: '커스텀 폰트용 비트맵 이미지.\n글자 자리에 그림을 넣어 HUD·게이지를 만들 수 있다.' },
  { p: 'font', desc: '폰트 정의 JSON. bitmap provider 로 이미지를 문자에 매핑한다.' },
  { p: 'lang', desc: '번역 파일 (ko_kr.json 등). 모든 네임스페이스의 lang 이 합쳐진다.' },
  { p: 'sounds', desc: '소리 파일(.ogg). mp3·wav 는 인식되지 않는다.' },
  { p: 'shaders', desc: '코어 셰이더 (고급).' },
  { p: 'texts', desc: 'splashes.txt(시작 화면 문구), end.txt 등.' }
];

/* ─────────── 4-2. 옵션 정의 · 키트 ─────────── */
const OPTIONS = [
  { g: '데이터팩 · 기본', k: 'data', id: 'core', t: '기본 뼈대', h: 'pack.mcmeta + load/tick 함수 + 태그 (필수)', fixed: true },
  { g: '데이터팩 · 기본', k: 'data', id: 'skel', t: '📁 표준 폴더 전부 만들기', h: '데이터팩이 가질 수 있는 모든 폴더를 만들고, 각 폴더에 "여기엔 뭘 넣는지" 안내문을 넣습니다' },
  { g: '데이터팩 · 기본', k: 'data', id: 'uninstall', t: '제거 함수', h: '스코어보드·팀을 되돌리는 uninstall. 좋은 팩의 필수 요소' },
  { g: '데이터팩 · 기본', k: 'data', id: 'readme', t: 'README 안내문', h: '설치법·구조·고치는 법이 담긴 텍스트 파일' },
  { g: '데이터팩 · 예제', k: 'data', id: 'item', t: '커스텀 아이템 세트', h: '지급 → 우클릭 감지 → 효과 3단 구조. 가장 많이 쓰는 패턴' },
  { g: '데이터팩 · 예제', k: 'data', id: 'raycast', t: '레이캐스트 유틸', h: '바라보는 방향으로 선을 뻗어 첫 충돌을 찾는다. 지팡이·총·조준의 기반' },
  { g: '데이터팩 · 예제', k: 'data', id: 'macro', t: '매크로 예제', h: '명령어에 변수를 넣는 방법 ($(변수)). 1.20.2+' },
  { g: '데이터팩 · 예제', k: 'data', id: 'rpg', t: 'RPG 시스템', h: '레벨·경험치·마나·액션바 HUD. 스코어보드 활용의 교본' },
  { g: '데이터팩 · 예제', k: 'data', id: 'boss', t: '보스 싸움', h: '페이즈 전환·보스바 연동·사망 정리' },
  { g: '데이터팩 · 예제', k: 'data', id: 'recipe', t: '제작법', h: '커스텀 조합법 JSON' },
  { g: '데이터팩 · 예제', k: 'data', id: 'loot', t: '전리품 표', h: '/loot give 로 뽑을 수 있는 보상 표' },
  { g: '데이터팩 · 예제', k: 'data', id: 'adv', t: '발전 과제', h: '이벤트 감지 + 보상 함수 연결' },
  { g: '데이터팩 · 예제', k: 'data', id: 'pred', t: 'predicate (조건)', h: '확률·위치 조건을 재사용' },
  { g: '데이터팩 · 예제', k: 'data', id: 'imod', t: 'item_modifier', h: '아이템 강화 규칙' },
  { g: '데이터팩 · 예제', k: 'data', id: 'tags', t: '태그 예제', h: '블록·아이템 묶음 (레이캐스트에 필요)' },
  { g: '데이터팩 · 예제', k: 'data', id: 'mob', t: '커스텀 몹 소환', h: '속성·장비·이름이 붙은 몹' },
  { g: '데이터팩 · 예제', k: 'data', id: 'dim', t: '커스텀 차원 + 바이옴', h: '새 월드에서만 적용됩니다 (주의)' },
  { g: '리소스팩', k: 'res', id: 'rcore', t: '기본 뼈대', h: 'pack.mcmeta (필수)', fixed: true },
  { g: '리소스팩', k: 'res', id: 'rskel', t: '📁 표준 폴더 전부 만들기', h: '리소스팩의 모든 폴더 + 각 폴더 안내문' },
  { g: '리소스팩', k: 'res', id: 'ricon', t: '팩 아이콘 (pack.png)', h: '목록에 보이는 64x64 아이콘을 생성' },
  { g: '리소스팩', k: 'res', id: 'rmodel', t: '커스텀 아이템 모델 + 텍스처', h: '16x16 PNG를 만들어 넣습니다. 버전에 맞는 방식으로 자동 처리' },
  { g: '리소스팩', k: 'res', id: 'rlang', t: '한국어 언어 파일', h: '번역 키 + 바닐라 이름 덮어쓰기 예제' },
  { g: '리소스팩', k: 'res', id: 'rsound', t: 'sounds.json 틀', h: '커스텀 소리 정의 (ogg 파일은 직접 넣어야 함)' },
  { g: '리소스팩', k: 'res', id: 'rreadme', t: 'README 안내문', h: '설치법·구조 설명' }
];

/* 목적별 키트 — 체크박스를 하나씩 고르지 않아도 되게 */
const KITS = [
  { id: 'skel', t: '📁 폴더 뼈대만', h: '모든 표준 폴더 + 각 폴더 설명서. 구조를 익히거나 처음부터 직접 짤 때', v: ['core', 'skel', 'readme', 'rcore', 'rskel', 'rreadme'] },
  { id: 'min', t: '🌱 최소', h: '돌아가는 가장 작은 구성', v: ['core', 'readme', 'rcore', 'rreadme'] },
  { id: 'rec', t: '⭐ 추천', h: '기본 + 커스텀 아이템 + 리소스팩', v: ['core', 'uninstall', 'readme', 'item', 'recipe', 'pred', 'tags', 'rcore', 'ricon', 'rmodel', 'rlang', 'rreadme'] },
  { id: 'wand', t: '🔮 마법 지팡이', h: '레이캐스트로 조준하는 지팡이 (검증된 코드)', v: ['core', 'uninstall', 'readme', 'item', 'raycast', 'tags', 'pred', 'rcore', 'ricon', 'rmodel', 'rlang', 'rreadme'] },
  { id: 'rpg', t: '⚔️ RPG 스타터', h: '레벨·마나·HUD·스탯 시스템', v: ['core', 'uninstall', 'readme', 'item', 'raycast', 'rpg', 'macro', 'tags', 'adv', 'rcore', 'ricon', 'rmodel', 'rlang', 'rreadme'] },
  { id: 'boss', t: '👹 보스 싸움', h: '페이즈·보스바·스킬·드롭', v: ['core', 'uninstall', 'readme', 'boss', 'mob', 'loot', 'adv', 'tags', 'rcore', 'rreadme'] },
  { id: 'all', t: '📦 전부', h: '모든 예제를 다 넣는다', v: OPTIONS.map(o => o.id) }
];

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

    /* ── 표준 폴더 전부 만들기 ──
       zip 은 빈 폴더를 담을 수 없다. 그래서 각 폴더에 안내문을 하나씩 넣어
       폴더를 만들면서 동시에 "여기엔 뭘 넣는지" 설명한다. */
    if (checked('skel')) {
      const fpath = (f) => f.d ? D[f.d] : (c.v.plural && f.pp ? f.pp : f.p);
      DP_FOLDERS.forEach(f => {
        const p = fpath(f);
        add(`${dRoot}data/${NS}/${p}/_README.txt`,
`[ data/${NS}/${p}/ ]

${f.desc}

${'-'.repeat(60)}
· 이 파일은 폴더를 만들기 위한 안내문입니다. 지워도 됩니다.
· 파일·폴더 이름은 영문 소문자·숫자·_·-·. 만 씁니다.
· 대상 버전: ${c.v.label}  (폴더 이름 ${c.v.plural ? '복수형' : '단수형'})
`);
      });
    }

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
` : ''}${checked('rpg') ? `
# RPG 스탯
scoreboard objectives add ${NS}.level dummy ${jsonTxt({ text: '레벨', color: 'gold' })}
scoreboard objectives add ${NS}.exp dummy
scoreboard objectives add ${NS}.expmax dummy
scoreboard objectives add ${NS}.mana dummy
scoreboard objectives add ${NS}.manamax dummy
` : ''}${checked('boss') ? `
# 보스바 (한 번만 만들면 월드에 계속 남는다)
bossbar add ${NS}:boss ${jsonTxt({ text: '보스', color: 'red' })}
bossbar set ${NS}:boss color red
bossbar set ${NS}:boss style notched_10
bossbar set ${NS}:boss visible false
scoreboard players add #phase ${NS}.sys 0
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

# 쿨다운 감소 — 0보다 큰 플레이어만 대상으로 (성능)
scoreboard players remove @a[scores={${NS}.tmp=1..}] ${NS}.tmp 1
` : ''}${checked('boss') ? `
# 보스 로직 (보스가 없으면 셀렉터가 아무것도 안 잡아 부하가 거의 없다)
execute as @e[type=zombie,tag=${NS}.boss,limit=1] at @s run function ${NS}:boss/tick
` : ''}${checked('rpg') ? `
# ── 4틱마다: HUD (매 틱은 낭비, 20틱은 반응이 느리다) ──
execute if score #tick ${NS}.sys matches 0 as @a run function ${NS}:rpg/hud
execute if score #tick ${NS}.sys matches 4 as @a run function ${NS}:rpg/hud
execute if score #tick ${NS}.sys matches 8 as @a run function ${NS}:rpg/hud
execute if score #tick ${NS}.sys matches 12 as @a run function ${NS}:rpg/hud
execute if score #tick ${NS}.sys matches 16 as @a run function ${NS}:rpg/hud
` : ''}
# ── 1초에 1번만 하는 무거운 처리 ──
${checked('rpg') ? `execute if score #tick ${NS}.sys matches 0 run function ${NS}:rpg/tick\n` : ''}${checked('boss') ? `execute if score #tick ${NS}.sys matches 0 run function ${NS}:boss/check\n` : ''}${(!checked('rpg') && !checked('boss')) ? `# execute if score #tick ${NS}.sys matches 0 run function ${NS}:tick_slow\n` : ''}`);

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
${checked('item') ? `scoreboard objectives remove ${NS}.use\n` : ''}${checked('rpg') ? `scoreboard objectives remove ${NS}.level
scoreboard objectives remove ${NS}.exp
scoreboard objectives remove ${NS}.expmax
scoreboard objectives remove ${NS}.mana
scoreboard objectives remove ${NS}.manamax\n` : ''}${checked('boss') ? `bossbar remove ${NS}:boss\n` : ''}
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

      const effect = checked('raycast')
        ? `# ── 효과: 레이캐스트로 조준한 지점에 명중 ─────
# 바라보는 방향으로 선을 뻗어 처음 부딪힌 곳에서 효과가 터진다.
# 실제 처리는 util/raycast/hit.mcfunction 에 있다.
function ${NS}:util/raycast/start`
        : `# ── 효과: 바라보는 방향 5칸 앞에 번개 ──────────
# ^ ^ ^5 는 캐럿 좌표. "바라보는 방향으로 5칸 앞"이라는 뜻이다.
# anchored eyes 를 넣어야 발밑이 아니라 눈높이 기준이 된다.
#
# ※ 벽 뒤에도 그냥 뚫고 나간다. 정확히 조준하려면
#   생성기에서 "레이캐스트 유틸"을 함께 선택하세요.
execute at @s anchored eyes run summon minecraft:lightning_bolt ^ ^ ^5`;

      add(F('item/use'),
`# ${NS}:item/use
# 실제 효과. @s = 사용한 플레이어, 실행 위치 = 플레이어 위치.

# ── 쿨다운 검사 (2초) ─────────────────────────
# tick.mcfunction 에서 ${NS}.tmp 를 매 틱 1씩 줄이고 있다.
execute if score @s ${NS}.tmp matches 1.. run return run title @s actionbar ${jsonTxt([{ text: '아직 쿨다운 중', color: 'red' }])}
scoreboard players set @s ${NS}.tmp 40
${checked('rpg') ? `
# ── 마나 검사 (RPG 시스템과 연동) ──────────────
execute unless score @s ${NS}.mana matches 10.. run return run title @s actionbar ${jsonTxt([{ text: '마나가 부족합니다', color: 'blue' }])}
scoreboard players remove @s ${NS}.mana 10
` : ''}
${effect}

playsound minecraft:entity.illusioner_cast_spell player @a ~ ~ ~ 1 1.4
particle minecraft:electric_spark ~ ~1.2 ~ 0.3 0.3 0.3 0.02 20 normal @a
`);

      // 쿨다운 감소를 tick 에 추가하기 위한 안내는 README 에서 처리
    }

    /* ── 레이캐스트 유틸 ──
       지팡이·총·조준·순간이동의 기반. 실제로 검증된 구현을 그대로 옮겼다. */
    if (checked('raycast')) {
      add(F('util/raycast/start'),
`# ${NS}:util/raycast/start
# ══════════════════════════════════════════════════════════
# 레이캐스트 = "바라보는 방향으로 가상의 선을 뻗어 처음 부딪힌 것을 찾는다"
# 데이터팩에서 가장 쓸모 있는 기술 하나. 지팡이·총·조준·순간이동의 기반이다.
#
# 원리: ^ ^ ^0.4  ← 캐럿 좌표. "내가 바라보는 방향으로 0.4칸 전진"
#      이걸 재귀 함수로 반복하며 매 지점에서 충돌을 검사한다.
#
# 사용법:
#   execute as <플레이어> at @s run function ${NS}:util/raycast/start
#   명중하면 ${NS}:util/raycast/hit 이 그 위치에서 실행된다.
# ══════════════════════════════════════════════════════════

# 상태 초기화 (# 으로 시작하는 이름 = 전역 변수처럼 쓰는 가짜 플레이어)
scoreboard players set #ray_dist ${NS}.tmp 0
scoreboard players set #ray_done ${NS}.tmp 0

# ★ anchored eyes 를 빼먹으면 발밑에서 쏴서 조준이 아래로 쏠린다
execute anchored eyes positioned ^ ^ ^ run function ${NS}:util/raycast/step
`);

      add(F('util/raycast/step'),
`# ${NS}:util/raycast/step
# 재귀 1스텝. 0.4칸씩 전진하며 최대 150회 = 60블록 사거리.
#
# ★ #ray_done 플래그가 핵심이다.
#   재귀에서 return 은 "현재 호출"만 끝낸다. 부모 호출은 계속 실행된다.
#   전역 플래그로 막지 않으면 명중 처리가 여러 번 실행되는 버그가 생긴다.
#   이걸 모르면 반드시 한 번은 당한다.

execute if score #ray_done ${NS}.tmp matches 1 run return 0

scoreboard players add #ray_dist ${NS}.tmp 1

# 1) 블록 충돌 검사 — passable 태그에 없는 블록이면 명중
execute unless block ~ ~ ~ #${NS}:passable run function ${NS}:util/raycast/hit
execute if score #ray_done ${NS}.tmp matches 1 run return 0

# 2) 최대 사거리 도달 → 허공에서 종료
execute if score #ray_dist ${NS}.tmp matches 150.. run function ${NS}:util/raycast/hit
execute if score #ray_done ${NS}.tmp matches 1 run return 0

# 3) 계속 전진 (재귀)
# 궤적을 눈으로 보고 싶으면 아래 줄의 # 을 지워라. 디버깅에 매우 유용하다.
# particle minecraft:end_rod ~ ~ ~ 0 0 0 0 1 force @a
execute positioned ^ ^ ^0.4 run function ${NS}:util/raycast/step
`);

      add(F('util/raycast/hit'),
`# ${NS}:util/raycast/hit
# 명중 처리. 실행 위치 = 부딪힌 지점, @s = 시전자.
# 여기 내용을 바꾸면 지팡이의 효과가 바뀐다.

scoreboard players set #ray_done ${NS}.tmp 1

# ── 여기에 원하는 효과를 쓴다 ──
particle minecraft:explosion ~ ~ ~ 0 0 0 0 1 force @a
particle minecraft:electric_spark ~ ~ ~ 0.4 0.4 0.4 0.1 30 normal @a
playsound minecraft:entity.generic.explode player @a ~ ~ ~ 0.6 1.5

# 주변에 피해를 주려면 (damage 명령은 1.19.4+)
# execute as @e[type=#minecraft:zombies,distance=..3] run damage @s 6 minecraft:magic by @p

# 블록을 놓으려면 — ^ ^ ^-0.4 가 "블록 앞면"이다
# execute positioned ^ ^ ^-0.4 run setblock ~ ~ ~ minecraft:glass keep
`);
    }

    /* ── 매크로 예제 ── */
    if (checked('macro')) {
      add(F('util/macro_demo'),
`# ${NS}:util/macro_demo
# ══════════════════════════════════════════════════════════
# 매크로 — 1.20.2 부터 생긴 기능. 데이터팩의 최대 한계를 깼다.
#
# 이전에는 명령어에 "변수"를 넣을 수 없었다.
#   /tp @s ~ <점수> ~   ← 이런 게 불가능했다
# 매크로는 $(변수) 를 쓰고 줄 앞에 $ 를 붙이면 값이 치환된다.
#
# 값을 넘기는 3가지 방법
#   1) 직접:      function ${NS}:util/macro_give {item:"minecraft:diamond",amount:5}
#   2) 스토리지:  function ${NS}:util/macro_give with storage ${NS}:tmp
#   3) 엔티티NBT: function ${NS}:util/macro_give with entity @s
# ══════════════════════════════════════════════════════════

# 예제 1 — 값을 직접 넘긴다
function ${NS}:util/macro_give {item:"minecraft:diamond",amount:5}

# 예제 2 — 점수를 명령어에 꽂아 넣기 (점수 → 스토리지 → 매크로)
scoreboard players set #demo ${NS}.tmp 7
execute store result storage ${NS}:tmp amount int 1 run scoreboard players get #demo ${NS}.tmp
data modify storage ${NS}:tmp item set value "minecraft:emerald"
function ${NS}:util/macro_give with storage ${NS}:tmp

tellraw @s ${jsonTxt([{ text: '[매크로] ', color: 'light_purple' }, { text: '두 가지 예제를 실행했습니다. 파일을 열어 코드를 보세요.', color: 'white' }])}
`);

      add(F('util/macro_give'),
`# ${NS}:util/macro_give
# ★ 줄 맨 앞에 $ 가 있어야 매크로 줄이 된다. 들여쓰기 뒤에 있으면 안 된다.
# ★ 전달한 값이 없으면 함수 실행이 실패한다.
# ★ 호출마다 명령을 새로 컴파일하므로 매 틱 수천 번 돌리지는 마라.

$give @s $(item) $(amount)
$tellraw @s ["지급: ",{"text":"$(item) x$(amount)","color":"green"}]
`);
    }

    /* ── RPG 시스템 ── */
    if (checked('rpg')) {
      add(F('rpg/init'),
`# ${NS}:rpg/init
# 플레이어 초기화. tick 에서 "점수가 아예 없는 플레이어"를 찾아 호출한다.
#
# ★ 신규 감지 관용구
#   unless score @s <목표> matches -2147483648..
#   → int 전체 범위에 안 걸리면 "점수가 설정된 적 없음"이라는 뜻이다.

scoreboard players set @s ${NS}.level 1
scoreboard players set @s ${NS}.exp 0
scoreboard players set @s ${NS}.expmax 100
scoreboard players set @s ${NS}.mana 50
scoreboard players set @s ${NS}.manamax 50

tellraw @s ${jsonTxt([{ text: '[RPG] ', color: 'gold', bold: true }, { text: '캐릭터가 생성되었습니다. Lv.1', color: 'white', bold: false }])}
`);

      add(F('rpg/tick'),
`# ${NS}:rpg/tick
# 1초에 1번 호출한다 (tick 에서 카운터로 분산).

# 신규 플레이어 초기화
execute as @a unless score @s ${NS}.level matches -2147483648.. run function ${NS}:rpg/init

# 마나 재생 (+2), 최대치를 넘지 않게 자른다
scoreboard players add @a ${NS}.mana 2
# ★ 상한 클램프 관용구: < 는 "더 작은 값을 취한다"는 뜻이다
scoreboard players operation @a ${NS}.mana < @a ${NS}.manamax

# 레벨업 판정
execute as @a[scores={${NS}.exp=1..}] if score @s ${NS}.exp >= @s ${NS}.expmax run function ${NS}:rpg/levelup
`);

      add(F('rpg/levelup'),
`# ${NS}:rpg/levelup
# 여러 레벨이 한 번에 오를 수 있게 스스로를 재귀 호출한다.

# 초과분 이월
scoreboard players operation @s ${NS}.exp -= @s ${NS}.expmax
scoreboard players add @s ${NS}.level 1

# 다음 요구 경험치 = 이전 x 1.25  (정수만 되므로 x5 ÷4 로 근사)
scoreboard players set #five ${NS}.tmp 5
scoreboard players set #four ${NS}.tmp 4
scoreboard players operation @s ${NS}.expmax *= #five ${NS}.tmp
scoreboard players operation @s ${NS}.expmax /= #four ${NS}.tmp

# 최대 마나 성장 + 가득 채우기
scoreboard players add @s ${NS}.manamax 10
scoreboard players operation @s ${NS}.mana = @s ${NS}.manamax

title @s title ${jsonTxt({ text: 'LEVEL UP', color: 'gold', bold: true })}
title @s subtitle ["Lv. ",{"score":{"name":"@s","objective":"${NS}.level"},"color":"yellow"}]
playsound minecraft:entity.player.levelup player @a ~ ~ ~ 1 1
particle minecraft:totem_of_undying ~ ~1 ~ 0.5 1 0.5 0.3 80 normal @a

# 아직도 넘치면 또 레벨업
execute if score @s ${NS}.exp >= @s ${NS}.expmax run function ${NS}:rpg/levelup
`);

      add(F('rpg/hud'),
`# ${NS}:rpg/hud
# 액션바 HUD. 4틱마다 갱신하는 게 적당하다.
#   매 틱 = 낭비 / 20틱 = 반응이 느리게 느껴짐
#
# ★ {"score":{"name":"@s","objective":"..."}} 로 점수를 글자에 박아 넣는다.
#   name 에 * 를 쓰면 안 된다(대상이 여럿이라 오류).

title @s actionbar ["",{"text":"Lv.","color":"gold"},{"score":{"name":"@s","objective":"${NS}.level"},"color":"yellow","bold":true},{"text":"  \\u2726 ","color":"blue"},{"score":{"name":"@s","objective":"${NS}.mana"},"color":"aqua"},{"text":"/","color":"dark_gray"},{"score":{"name":"@s","objective":"${NS}.manamax"},"color":"blue"},{"text":"  \\u2727 ","color":"dark_green"},{"score":{"name":"@s","objective":"${NS}.exp"},"color":"green"},{"text":"/","color":"dark_gray"},{"score":{"name":"@s","objective":"${NS}.expmax"},"color":"dark_green"}]
`);
    }

    /* ── 보스 ── */
    if (checked('boss')) {
      const bossName = nbtTxt(c, { text: '고대의 수호자', color: 'dark_red', bold: true });
      const bAttrs = c.v.nbtText
        ? `attributes:[{id:"minecraft:max_health",base:200},{id:"minecraft:attack_damage",base:12},{id:"minecraft:movement_speed",base:0.26},{id:"minecraft:knockback_resistance",base:0.8},{id:"minecraft:follow_range",base:40}]`
        : (c.v.comp
          ? `Attributes:[{Name:"minecraft:max_health",Base:200},{Name:"minecraft:attack_damage",Base:12},{Name:"minecraft:movement_speed",Base:0.26},{Name:"minecraft:knockback_resistance",Base:0.8},{Name:"minecraft:follow_range",Base:40}]`
          : `Attributes:[{Name:"generic.max_health",Base:200},{Name:"generic.attack_damage",Base:12},{Name:"generic.movement_speed",Base:0.26},{Name:"generic.knockback_resistance",Base:0.8},{Name:"generic.follow_range",Base:40}]`);

      add(F('boss/summon'),
`# ${NS}:boss/summon
# 보스 소환.  /function ${NS}:boss/summon
#
# ★ 커스텀 보스의 구조
#   ① 바닐라 몹을 껍데기로 쓴다 (히트박스·AI·체력 담당)
#   ② attributes 로 능력치를 갈아 끼운다
#   ③ tick 함수에서 페이즈·스킬을 돌린다
#   ④ 보스바로 체력을 보여준다

# 중복 소환 방지
execute if entity @e[tag=${NS}.boss] run return run tellraw @s ${jsonTxt([{ text: '이미 보스가 있습니다.', color: 'red' }])}

summon minecraft:zombie ~ ~ ~ {Tags:["${NS}.entity","${NS}.boss"],CustomName:${bossName},CustomNameVisible:0b,PersistenceRequired:1b,Health:200f,${bAttrs}}

scoreboard players set #phase ${NS}.sys 1
bossbar set ${NS}:boss name ${jsonTxt({ text: '고대의 수호자', color: 'dark_red', bold: true })}
bossbar set ${NS}:boss max 200
bossbar set ${NS}:boss value 200
bossbar set ${NS}:boss color red
bossbar set ${NS}:boss visible true
bossbar set ${NS}:boss players @a

title @a title ${jsonTxt({ text: '고대의 수호자', color: 'dark_red', bold: true })}
playsound minecraft:entity.wither.spawn hostile @a ~ ~ ~ 3 0.6
particle minecraft:explosion_emitter ~ ~1 ~ 0 0 0 0 2 force @a
`);

      add(F('boss/tick'),
`# ${NS}:boss/tick
# 매 틱, @s = 보스. tick 에서 호출된다.

# 체력을 점수로 읽어 보스바에 반영
# ★ execute store result score ... run data get ... 이 "NBT → 점수" 변환의 표준
execute store result score #hp ${NS}.sys run data get entity @s Health 1
execute store result bossbar ${NS}:boss value run scoreboard players get #hp ${NS}.sys

# 페이즈 전환 — 조건에 "현재 페이즈"를 넣어야 매 틱 반복되지 않는다
execute if score #hp ${NS}.sys matches ..100 if score #phase ${NS}.sys matches 1 run function ${NS}:boss/phase2

# 스킬 타이머
scoreboard players add #btimer ${NS}.sys 1
execute if score #btimer ${NS}.sys matches 100.. run function ${NS}:boss/skill_slam

# 페이즈별 파티클
execute if score #phase ${NS}.sys matches 1 run particle minecraft:soul ~ ~0.2 ~ 0.5 0.1 0.5 0.01 2 normal @a
execute if score #phase ${NS}.sys matches 2 run particle minecraft:flame ~ ~0.2 ~ 0.6 0.2 0.6 0.02 4 normal @a
`);

      add(F('boss/phase2'),
`# ${NS}:boss/phase2
scoreboard players set #phase ${NS}.sys 2
scoreboard players set #btimer ${NS}.sys 0

bossbar set ${NS}:boss color yellow
title @a title ${jsonTxt({ text: 'PHASE 2', color: 'gold', bold: true })}
playsound minecraft:entity.ender_dragon.growl hostile @a ~ ~ ~ 2 0.8
particle minecraft:flash ~ ~1 ~ 0 0 0 0 1 force @a

# 능력 강화
attribute @s minecraft:movement_speed base set 0.34
attribute @s minecraft:attack_damage base set 18
effect give @s minecraft:fire_resistance 999999 0 true
`);

      add(F('boss/skill_slam'),
`# ${NS}:boss/skill_slam — 광역 강타
scoreboard players set #btimer ${NS}.sys 0

# ★ 좋은 보스는 반드시 "예고"가 있다. 피할 기회를 주는 것이 재미다.
playsound minecraft:entity.ravager.roar hostile @a ~ ~ ~ 2 0.8
particle minecraft:sweep_attack ~ ~0.5 ~ 3 0.2 3 0 40 force @a

# ★ damage 명령의 by <가해자> 를 꼭 쓴다. 어그로·통계가 정상 기록된다.
execute as @a[distance=..5,gamemode=!creative,gamemode=!spectator] run damage @s 8 minecraft:mob_attack by @e[tag=${NS}.boss,limit=1]
`);

      add(F('boss/check'),
`# ${NS}:boss/check
# 보스 사망 감지. 1초에 1번 호출한다.
#
# ★ 본체가 죽어도 보스바는 켜진 채로 남는다. 반드시 정리해야 한다.
#   모델·이름표를 붙였다면 그것들도 함께 kill 해야 한다.

execute if score #phase ${NS}.sys matches 1.. unless entity @e[tag=${NS}.boss] run function ${NS}:boss/death
`);

      add(F('boss/death'),
`# ${NS}:boss/death
scoreboard players set #phase ${NS}.sys 0
scoreboard players set #btimer ${NS}.sys 0
bossbar set ${NS}:boss visible false
kill @e[tag=${NS}.entity]

title @a title ${jsonTxt({ text: 'VICTORY', color: 'gold', bold: true })}
playsound minecraft:ui.toast.challenge_complete master @a ~ ~ ~ 1 1
tellraw @a ${jsonTxt([{ text: '[보스] ', color: 'gold', bold: true }, { text: '고대의 수호자를 물리쳤습니다!', color: 'white', bold: false }])}
`);
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

    /* 태그 — 레이캐스트를 쓰면 passable 태그가 반드시 필요하므로 자동 포함 */
    if (checked('tags') || checked('raycast')) {
      add(`${dRoot}data/${NS}/${D.tbl}/passable.json`, JSON.stringify({
        values: ['minecraft:air', 'minecraft:cave_air', 'minecraft:void_air', 'minecraft:water',
          'minecraft:lava', 'minecraft:short_grass', 'minecraft:tall_grass', 'minecraft:fern',
          'minecraft:dead_bush', 'minecraft:vine', 'minecraft:snow', 'minecraft:fire',
          'minecraft:light', 'minecraft:structure_void',
          '#minecraft:flowers', '#minecraft:saplings', '#minecraft:signs', '#minecraft:buttons']
      }, null, 2) + '\n');
    }
    if (checked('tags')) {
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

    if (checked('rskel')) {
      RP_FOLDERS.forEach(f => {
        add(`${rRoot}assets/${NS}/${f.p}/_README.txt`,
`[ assets/${NS}/${f.p}/ ]

${f.desc}

${'-'.repeat(60)}
· 이 파일은 폴더를 만들기 위한 안내문입니다. 지워도 됩니다.
· 바닐라를 덮어쓰려면 assets/minecraft/<같은 경로>/ 에 같은 이름으로 넣습니다.
· 대상 버전: ${c.v.label}
`);
      });
      add(`${rRoot}assets/minecraft/_README.txt`,
`[ assets/minecraft/ ]

바닐라 리소스를 "덮어쓰는" 자리입니다.
바닐라와 똑같은 경로·파일명으로 넣으면 원본을 대체합니다.

예)
  assets/minecraft/textures/block/stone.png       돌 텍스처 교체
  assets/minecraft/lang/ko_kr.json                아이템·블록 이름 교체
  assets/minecraft/textures/gui/                  인벤토리 이미지 교체
  assets/minecraft/sounds.json                    바닐라 소리 교체

반면 assets/${NS}/ 는 "새로 추가하는" 자리입니다.
가능하면 덮어쓰기보다 추가를 쓰는 쪽이 다른 팩과 충돌하지 않습니다.
`);
    }

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
${K === 'both' ? `     ※ 리소스팩은 별도의 zip 으로 따로 받아집니다.
        그쪽은 resourcepacks/ 폴더에 넣으면 됩니다.\n` : ''}  2) 게임에서  /reload
  3) 확인:  /datapack list   ← 목록에 있으면 성공

  ★ 압축을 풀 필요가 없습니다. 마인크래프트가 zip 안을 직접 읽습니다.
    풀어서 폴더째 넣어도 되지만, 압축 프로그램이 폴더를 한 겹 더
    만드는 경우가 많아 그대로 두는 쪽이 안전합니다.

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
  applyKit('rec');
  el.opts.querySelectorAll('input').forEach(i => i.addEventListener('change', () => { S.kit = null; refresh(); }));
}

function renderKits() {
  $('kits').innerHTML = KITS.map(k =>
    `<button class="kit" data-kit="${k.id}" title="${esc(k.h)}"><b>${esc(k.t)}</b><i>${esc(k.h)}</i></button>`
  ).join('');
  $('kits').querySelectorAll('.kit').forEach(b => b.addEventListener('click', () => {
    applyKit(b.dataset.kit);
    const k = KITS.find(x => x.id === b.dataset.kit);
    refresh();
    toast(`${k.t} 구성을 적용했습니다`);
  }));
}

function applyKit(id) {
  const k = KITS.find(x => x.id === id);
  if (!k) return;
  S.kit = id;
  const set = new Set(k.v);
  OPTIONS.forEach(o => {
    const c = $('o-' + o.id);
    if (c && !o.fixed) c.checked = set.has(o.id);
  });
  document.querySelectorAll('.kit').forEach(b => b.classList.toggle('on', b.dataset.kit === id));
}

function syncKindUI() {
  const K = kind();
  el.opts.querySelectorAll('.chk-group').forEach(g => {
    const k = g.dataset.kind;
    g.style.display = (K === 'both' || K === k) ? '' : 'none';
  });
}

function renderFolderTables() {
  const SING = { fn: 'function', tfn: 'tags/function', tbl: 'tags/block', tit: 'tags/item',
    adv: 'advancement', loot: 'loot_table', rec: 'recipe', pred: 'predicate', imod: 'item_modifier' };
  const dp = $('dp-folders'), rp = $('rp-folders');
  DP_FOLDERS.forEach(f => {
    const p = f.d ? SING[f.d] : f.p;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><code>${esc(p)}/</code>${f.pp ? `<br><span style="font-size:10px;color:var(--txt3)">구버전: ${esc(f.pp)}/</span>` : ''}</td>
      <td>${esc(f.desc).replace(/\n/g, '<br>')}</td>`;
    dp.appendChild(tr);
  });
  RP_FOLDERS.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><code>${esc(f.p)}/</code></td><td>${esc(f.desc).replace(/\n/g, '<br>')}</td>`;
    rp.appendChild(tr);
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
  const c0 = cfg();
  // "둘 다"일 때 최상위 두 폴더는 실제로는 별도의 zip 파일이 된다
  const zipLabel = {
    datapack: `📦 ${c0.ns}_datapack.zip`,
    resourcepack: `📦 ${c0.ns}_resourcepack.zip`
  };
  const lines = [];
  const walk = (node, depth) => {
    const dirs = Object.keys(node).filter(k => k !== '__f').sort();
    dirs.forEach(d => {
      const isZip = depth === 0 && kind() === 'both' && zipLabel[d];
      lines.push(`<span class="tn d">${'  '.repeat(depth)}${isZip ? esc(zipLabel[d]) : '📁 ' + esc(d) + '/'}</span>`);
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
  el.guide.innerHTML = `<strong>설치 — 압축을 풀지 않습니다.</strong> zip 파일 그대로 넣으면 됩니다.<br>`
    + (K === 'both' ? `<span style="color:var(--txt3)">둘 다 선택하면 <b>zip 2개</b>가 따로 내려받아집니다. 각각 pack.mcmeta가 최상단이라 바로 쓸 수 있습니다.</span><br>` : '')
    + (K !== 'res' ? `<code>${esc(c.ns)}_datapack.zip</code> → <code>&lt;월드 폴더&gt;/datapacks/</code> → <code>/reload</code>` : '')
    + (K === 'both' ? '<br>' : '')
    + (K !== 'data' ? `<code>${esc(c.ns)}_resourcepack.zip</code> → <code>&lt;.minecraft&gt;/resourcepacks/</code> → 설정에서 활성화 (<code>F3+T</code> 새로고침)` : '');
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

/* 미리보기용 경로(datapack/ · resourcepack/ 접두사)를 떼어내고
   팩별로 나눈다. ★ 각 zip 은 pack.mcmeta 가 최상단에 오도록 만들어야
   압축을 풀지 않고 그대로 넣을 수 있다. */
function splitPacks(files) {
  const K = kind();
  const d = [], r = [];
  for (const f of files) {
    if (f.name.startsWith('datapack/')) d.push(Object.assign({}, f, { name: f.name.slice(9) }));
    else if (f.name.startsWith('resourcepack/')) r.push(Object.assign({}, f, { name: f.name.slice(13) }));
    else (K === 'res' ? r : d).push(f);
  }
  return { d, r };
}

function saveZip(files, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(buildZip(files));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

function download() {
  const c = cfg();
  if (!S.files.length) { toast('만들 파일이 없습니다'); return; }
  const { d, r } = splitPacks(S.files);

  // 데이터팩과 리소스팩은 각각 별도 zip 으로 내려받는다.
  // 하나로 합치면 pack.mcmeta 가 최상단에 오지 않아 압축을 풀어야만 쓸 수 있다.
  if (d.length && r.length) {
    saveZip(d, `${c.ns}_datapack.zip`);
    // 브라우저가 연속 다운로드를 막는 경우가 있어 간격을 둔다
    setTimeout(() => saveZip(r, `${c.ns}_resourcepack.zip`), 600);
    toast(`zip 2개 다운로드 — 데이터팩 ${d.length}개 · 리소스팩 ${r.length}개 파일`);
  } else if (d.length) {
    saveZip(d, `${c.ns}_datapack.zip`);
    toast(`${c.ns}_datapack.zip 다운로드 (${d.length}개 파일)`);
  } else {
    saveZip(r, `${c.ns}_resourcepack.zip`);
    toast(`${c.ns}_resourcepack.zip 다운로드 (${r.length}개 파일)`);
  }
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

$('b-dl').addEventListener('click', download);
$('b-reset').addEventListener('click', () => {
  el.name.value = '내 첫 데이터팩'; el.ns.value = 'mypack';
  el.desc.value = '내가 만든 첫 번째 팩'; el.color.value = '#3fbf7f';
  el.ver.value = VERSIONS[0].id;
  document.querySelector('input[name=kind][value=both]').checked = true;
  nsTouched = false;
  applyKit('rec'); refresh(); toast('초기화했습니다');
});
$('b-copy').addEventListener('click', async () => {
  const f = S.files.find(x => x.name === S.sel);
  if (!f || f.bin) { toast('텍스트 파일을 선택하세요'); return; }
  try { await navigator.clipboard.writeText(f.text); toast('클립보드에 복사했습니다'); }
  catch (e) { toast('복사가 차단되었습니다'); }
});

/* ─────────── 시작 ─────────── */
renderVersions();
renderFolderTables();
renderOptions();
renderKits();
refresh();
