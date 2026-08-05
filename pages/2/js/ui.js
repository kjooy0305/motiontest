// ════════════════════════════════════════
// UI & VIEW MODULE
// ════════════════════════════════════════

import { S, gs, achs, bannedItems, initS, beginGame, saveData, pSuicide, pUse, resetAllData } from './core.js';
import { ITEMS, ACH_DEF, TRAITS, AI_CHARACTERS, setFontSize } from './data.js';
import { aiTurnCycle, startWaitTimer, clearWaitTimer } from './ai.js';

export function toggleLayout() {
  const phone = document.querySelector('.phone'); const isPad = phone.classList.contains('force-pad') || (window.innerWidth >= 1000 && !phone.classList.contains('mobile-locked'));
  if (isPad) { phone.classList.remove('force-pad'); phone.classList.add('mobile-locked'); localStorage.setItem('layoutMode', 'mobile'); }
  else { phone.classList.remove('mobile-locked'); phone.classList.add('force-pad'); localStorage.setItem('layoutMode', 'pad'); }
}

export function initLayout() {
  const savedMode = localStorage.getItem('layoutMode'); const phone = document.querySelector('.phone');
  if (savedMode === 'mobile') phone.classList.add('mobile-locked'); else if (savedMode === 'pad') phone.classList.add('force-pad');
  const savedSize = localStorage.getItem('fontScale'); if (savedSize) document.documentElement.style.setProperty('--f-scale', savedSize);
}

export function applyBg(id) { const el = document.getElementById('main-bg'); if (el) el.className = 'bg ' + id; }

export function renderGame() {
  const app = document.getElementById('app');
  const nickname = localStorage.getItem('playerNickname') || '나';
  app.innerHTML = `
  <div class="gs" id="gs">
    <div class="hps" id="hps">${hpsHTML()}</div>
    <div class="tind" id="tind" style="color:${S.turn === 'p' ? '#aa3333' : '#3355aa'}">${tindText()}</div>
    <div class="log" id="log"></div>
    <div class="efxbar" id="efx">${efxHTML()}</div>
    <div class="aiinf" style="display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:calc(10px * var(--f-scale));">${S.aiChar.name}의 아이템: <span id="aic" style="font-size:calc(18px * var(--f-scale));font-weight:bold;color:var(--blue);">${S.aItems.length}</span>개${S.aRnd ? ' <span style="color:#aa4400">[혼란]</span>' : ''}</span>
      <button onclick="pSuicide()" style="background:rgba(80,0,0,0.6);border:1px solid #800;color:#ff9999;font-size:calc(11px * var(--f-scale));padding:4px 8px;border-radius:6px;cursor:pointer;font-weight:bold;transition:all 0.2s;">🏳️ 항복</button>
    </div>
    <div class="isec">
      <div class="ilbl">◈ ${nickname}의 아이템 (<span id="pcount">${S.pItems.length}</span>개)</div>
      <div class="igrid" id="igrid">${igridHTML()}</div>
      <div class="dinfo" id="dinfo"></div>
    </div>
    <div id="modal"></div>
  </div>`;
  if (S.isCustom) {
    const gsEl = document.getElementById('gs'); const sBtn = document.createElement('button');
    sBtn.innerHTML = '⚙️'; sBtn.style = 'position:absolute;top:10px;right:10px;background:none;border:none;color:#555;font-size:18px;cursor:pointer;z-index:100;';
    sBtn.onclick = window.openAdvancedCustom; gsEl.appendChild(sBtn);
  }
  const la = document.getElementById('log'); S.log.forEach(l => { const d = document.createElement('div'); d.className = 'le ' + l.t; d.textContent = l.m; la.appendChild(d); });
  if (la) la.scrollTop = la.scrollHeight;
}

export function updateUI() {
  const ah = document.getElementById('ahrt'), ph = document.getElementById('phrt'), an = document.getElementById('anum'), pn = document.getElementById('pnum'), ab = document.getElementById('abar'), pb = document.getElementById('pbar');
  if (ah) ah.innerHTML = hrtsH(S.aHP, S.aMax, true); if (ph) ph.innerHTML = hrtsH(S.pHP, S.pMax, false);
  if (an) an.textContent = `${S.aHP}/${S.aMax}`; if (pn) pn.textContent = `${S.pHP}/${S.pMax}`;
  if (ab) ab.style.width = `${(S.aHP / S.aMax) * 100}%`; if (pb) pb.style.width = `${(S.pHP / S.pMax) * 100}%`;
  const sw = document.querySelector('.screen-wrap'); if (sw) sw.style.boxShadow = S.pDrgX > 0 ? 'inset 0 0 30px rgba(180,180,0,0.5)' : 'inset 0 0 20px rgba(0,0,0,.8)';
  const ef = document.getElementById('efx'); if (ef) ef.innerHTML = efxHTML();
  const ig = document.getElementById('igrid'); if (ig) ig.innerHTML = igridHTML();
  const pc = document.getElementById('pcount'); if (pc) pc.textContent = S.pItems.length;
  const ac = document.getElementById('aic'); if (ac) ac.textContent = S.aItems.length;
  const adg = document.getElementById('ai-debug-grid'); if (adg) adg.innerHTML = aiDebugHTML();
  const ti = document.getElementById('tind'); if (ti) { ti.textContent = tindText(); ti.style.color = S.pDrgX > 0 ? '#ffff00' : (S.turn === 'p' ? '#aa3333' : '#3355aa'); if (S.pDrgX > 0) ti.style.textShadow = '0 0 10px rgba(255,255,0,0.5)'; else ti.style.textShadow = 'none'; }
}

export function showMenu() {
  const app = document.getElementById('app'); const equipped = gs.equippedTrait ? TRAITS.find(t => t.id === gs.equippedTrait) : null; const allAchieved = Object.keys(achs).length >= ACH_DEF.length;
  const nickname = localStorage.getItem('playerNickname') || '플레이어';
  app.innerHTML = `
  <div class="menu">
    <div class="gtitle" onclick="window.unlockEverythingTrigger()">
      <div style="font-size:calc(9px * var(--f-scale));color:#330011;letter-spacing:4px;margin-bottom:10px">▓ SYSTEM ACTIVE ▓</div>
      <h1>다크<br>룰렛</h1>
      <div class="sub">◈ DARK ROULETTE ◈</div>
    </div>
    <div style="text-align:center; margin: 10px 0;">
      <div style="color:var(--red); font-size:14px; font-weight:bold; cursor:pointer;" onclick="window.setNickname()">👤 ${nickname}</div>
      <div style="font-size:8px; color:#444;">(클릭하여 닉네임 변경)</div>
    </div>
    <div class="bi">🩸</div>
    ${equipped ? `<div style="font-size:calc(10px * var(--f-scale));color:#00ff00;margin-bottom:5px;">장착된 특성: ${equipped.e} ${equipped.name}</div>` : ''}
    <div class="mquote">"살아남는 자가 규칙을 만든다.<br>"죽는 자가 규칙을 따른다."</div>
    <div class="mbtns">
      <div style="display:flex;gap:5px;">
        <button class="btn btn-r" style="flex:2;" onclick="showDiff()">⚔ 게임 시작</button>
        ${gs.hardUnlocked ? `<button class="btn btn-r" style="flex:1.2;border-color:#ff4400;color:#ff4400;" onclick="window.startHidden('hard')">🔥 하드</button>` : ''}
      </div>
      ${allAchieved ? `<button class="btn btn-r" style="border-color:#aa00ff;color:#aa00ff;" onclick="showHiddenModes()">✨ 히든 모드</button>` : ''}
      <div style="display:flex;gap:5px;">
        <button class="btn btn-r" style="flex:1;border-color:#996622;color:#996622;" onclick="showCustomMenu()">🛠 커스텀</button>
        ${gs.hardUnlocked ? `<button class="btn btn-r" style="flex:1;border-color:#cc4422;color:#cc4422;" onclick="showShop()">🛒 상점</button>` : ''}
      </div>
      <button class="btn btn-d" style="font-size:11px;" onclick="showAchsScreen()">🏆 업적 (${Object.keys(achs).length}/${ACH_DEF.length})</button>
      <button class="btn btn-d" style="border-color:#300; color:#533; font-size:9px; padding:5px;" onclick="window.resetAllData()">⚠️ 데이터 초기화</button>
    </div>
  </div>`;
}

export function showDiff() {
  const diffs = [ { v: 0, l: '0%', n: '신의 지능' }, { v: 10, l: '10%', n: '악마급' }, { v: 20, l: '20%', n: '초고수' }, { v: 30, l: '30%', n: '고수' }, { v: 40, l: '40%', n: '숙련' }, { v: 50, l: '50%', n: '보통' }, { v: 60, l: '60%', n: '입문' }, { v: 70, l: '70%', n: '쉬움' }, { v: 80, l: '80%', n: '초보' }, { v: 90, l: '90%', n: '연습' }, { v: 100, l: '100%', n: '허수아비' } ];
  const app = document.getElementById('app'); app.innerHTML = `
  <div class="diffs">
    <div class="stitle">◈ 난이도 선택 ◈</div>
    <div style="font-size:calc(9px * var(--f-scale));color:#553333;text-align:center;margin-bottom:12px;line-height:1.7;">낮을수록 AI가 실수를 안 한다 → 더 어려움</div>
    <div class="dgrid" id="dgr">
      ${diffs.map(d => `<div class="dbtn${d.v === window.selDiff ? ' active' : ''}" data-v="${d.v}" onclick="pickD(${d.v})">
        <div style="font-weight:bold">${d.l}</div><div class="dlbl">${d.n}</div>
      </div>`).join('')}
    </div>
    <div class="ddesc" id="ddes">${window.dDesc(window.selDiff)}</div>
    <div style="display:flex;flex-direction:column;gap:8px;"><button class="btn btn-r" onclick="beginGame()">⚔ 전투 시작</button><button class="btn btn-d" onclick="showMenu()">← 뒤로</button></div>
    <div style="height:8px"></div>
  </div>`;
}

export let shopSort = 'desc'; // default high to low
export function showShop(restoreScroll = 0) {
  const sortedTraits = [...TRAITS].sort((a, b) => shopSort === 'asc' ? a.cost - b.cost : b.cost - a.cost);
  
  const html = sortedTraits.map(t => {
    const isUnlocked = gs.unlockedTraits.includes(t.id); const isEquipped = gs.equippedTrait === t.id; const canAfford = gs.bloodDebt >= t.cost; const achReq = t.ach && !achs[t.ach];
    return `<div class="ait ${isUnlocked ? 'ok' : ''}" style="flex-direction:column;align-items:stretch;gap:5px;">
      <div style="display:flex;justify-content:space-between;align-items:center;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:20px;">${t.e}</span><span class="aname">${t.name}</span></div><div style="font-size:11px;color:${canAfford ? '#cc4422' : '#444'};">🩸 ${t.cost}</div></div>
      <div class="adesc" style="font-size:calc(8px * var(--f-scale));">${t.desc}</div>
      ${achReq ? `<div style="font-size:calc(8px * var(--f-scale));color:#aa3333;">🔒 필요 업적: ${ACH_DEF.find(a => a.id === t.ach).name}</div>` : ''}
      <div style="display:flex;gap:5px;margin-top:5px;">${!isUnlocked ? `<button class="btn btn-d" style="flex:1;padding:5px;font-size:calc(9px * var(--f-scale));" onclick="window.buyTrait('${t.id}')" ${(!canAfford || achReq) ? 'disabled' : ''}>구매하기</button>` : `<button class="btn btn-r" style="flex:1;padding:5px;font-size:calc(9px * var(--f-scale));border-color:${isEquipped ? '#00ff00' : '#777'};color:${isEquipped ? '#00ff00' : '#777'};" onclick="window.equipTrait('${t.id}')">${isEquipped ? '장착됨' : '장착하기'}</button>`}</div></div>`;
  }).join('');
  
  const app = document.getElementById('app'); 
  app.innerHTML = `
  <div class="achs-wrap" style="display:flex; flex-direction:column; height:100%;">
    <div style="padding:16px 16px 10px; flex-shrink:0;">
      <div class="stitle" style="margin-bottom:5px;">🩸 혈채 상점 🩸</div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div style="font-size:calc(11px * var(--f-scale));color:#cc4422;font-weight:bold;">보유: ${gs.bloodDebt}</div>
        <button class="btn btn-d" style="width:auto; padding:2px 8px; font-size:9px;" onclick="window.toggleShopSort()">
          ${shopSort === 'asc' ? '가격 낮은순 ↑' : '가격 높은순 ↓'}
        </button>
      </div>
    </div>
    <div id="shop-scroll" style="flex:1; overflow-y:auto; padding:0 16px;">
      ${html}
      <div style="height:10px;"></div>
    </div>
    <div style="padding:12px 16px; border-top:1px solid #2a0808; background:rgba(0,0,0,0.8); flex-shrink:0;">
      <button class="btn btn-d" onclick="showMenu()">← 뒤로</button>
    </div>
  </div>`;
  
  if (restoreScroll) {
    const el = document.getElementById('shop-scroll');
    if (el) el.scrollTop = restoreScroll;
  }
}

window.toggleShopSort = () => {
  shopSort = shopSort === 'asc' ? 'desc' : 'asc';
  showShop();
};

export function addLog(m, t) { if (!S.log) S.log = []; S.log.push({ m, t }); const la = document.getElementById('log'); if (!la) return; const d = document.createElement('div'); d.className = 'le ' + t; d.textContent = m; la.appendChild(d); la.scrollTop = la.scrollHeight; }

export function shk(id) { const el = document.getElementById(id); if (!el) return; el.classList.remove('shaking'); void el.offsetWidth; el.classList.add('shaking'); setTimeout(() => el.classList.remove('shaking'), 500); }

export function hpsHTML() { 
  const nickname = localStorage.getItem('playerNickname') || '나';
  return `<div class="hrow"><div><div class="hlbl">${S.aiChar.name}</div><div class="hnum a" id="anum">${S.aHP}/${S.aMax}</div></div><div class="hrt" id="ahrt">${hrtsH(S.aHP, S.aMax, true)}</div></div><div class="hbbg"><div class="hb a" id="abar" style="width:${(S.aHP / S.aMax) * 100}%"></div></div><div class="vsdv"></div><div class="hrow"><div><div class="hlbl">${nickname}</div><div class="hnum p" id="pnum">${S.pHP}/${S.pMax}</div></div><div class="hrt" id="phrt">${hrtsH(S.pHP, S.pMax, false)}</div></div><div class="hbbg"><div class="hb p" id="pbar" style="width:${(S.pHP / S.pMax) * 100}%"></div></div>`; 
}

export function hrtsH(hp, max, isA) { let h = ''; const c = isA ? '#4488cc' : '#cc2222'; for (let i = 0; i < Math.min(max, 10); i++) h += `<span class="ht" style="color:${i < hp ? c : '#2a0808'}">${i < hp ? '♥' : '♡'}</span>`; return h; }

export function igridHTML() { const isMyTurn = S.turn === 'p'; return S.pItems.map((it, i) => { if (S.pObs) return `<button class="ibtn hid" onclick="pUse(${i})" ${!isMyTurn ? 'disabled' : ''}><div class="ie">❓</div><div class="in">???</div></button>`; return `<button class="ibtn" onclick="pUse(${i})" ${!isMyTurn ? 'disabled' : ''}><div class="ie">${it.e}</div><div class="in">${it.name}</div></button>`; }).join(''); }

export function efxHTML() { const t = []; if (S.pPoi > 0) t.push(`<span class="etag ep">🟢내독(${S.pPoi})</span>`); if (S.aPoi > 0) t.push(`<span class="etag ep" style="border-color:#004488;color:#3366aa">🟢AI독(${S.aPoi})</span>`); if (S.pBld > 0) t.push(`<span class="etag eh">🩹수혈(${S.pBld})</span>`); if (S.aBld > 0) t.push(`<span class="etag eh" style="border-color:#224488;color:#4466cc">🩹AI수혈(${S.aBld})</span>`); if (S.pBlkH > 0) t.push(`<span class="etag eh" style="border-color:#664444;color:#aa8888">🛌이불(${S.pBlkH})</span>`); if (S.aBlkH > 0) t.push(`<span class="etag eh" style="border-color:#444466;color:#8888aa">🛌AI이불(${S.aBlkH})</span>`); if (S.pShield > 0) t.push(`<span class="etag es" style="border-color:#4488cc;color:#88ccff">🛡️방패(${S.pShield})</span>`); if (S.aShield > 0) t.push(`<span class="etag es" style="border-color:#3355aa;color:#6688cc">🛡️AI방패(${S.aShield})</span>`); if (S.pSkip > 0) t.push(`<span class="etag es">⛓내스킵(${S.pSkip})</span>`); if (S.aSkip > 0) t.push(`<span class="etag es" style="border-color:#333344;color:#4455aa">⛓AI스킵(${S.aSkip})</span>`); if (S.pDrgSkip) t.push(`<span class="etag er">💉다음턴스킵</span>`); if (!t.length) t.push(`<span class="etag" style="font-size:7px">상태이상없음</span>`); return t.join(''); }

export function tindText() { if (S.pDrgX > 0) return `💉 [마약 효과 중] ${S.pDrgX - 1}회 추가 사용 가능!`; if (S.aDrgX > 0) return `💉 [AI 마약 효과 중...]`; return S.turn === 'p' ? '◈ 당신의 차례' : '◈ AI의 차례...'; }

export function aiDebugHTML() { return S.aItems.map(it => `<div class="ai-debug-item" title="${it.name}">${it.e}</div>`).join('') || '<div style="grid-column:1/-1;color:#444;font-size:calc(8px * var(--f-scale));text-align:center;">없음</div>'; }

export function showHiddenModes() { const app = document.getElementById('app'); app.innerHTML = `<div class="diffs"><div class="stitle" style="color:#aa00ff;text-shadow:0 0 15px #6600aa;">✨ 히든 모드 ✨</div><div style="font-size:calc(10px * var(--f-scale));color:#7744aa;text-align:center;margin-bottom:16px;">특별한 규칙으로 게임을 즐기세요.</div><div style="display:flex;flex-direction:column;gap:10px;width:100%;"><button class="btn btn-r" style="border-color:#aa00ff;color:#aa00ff;" onclick="window.startHidden('mirror')">🪞 거울 전투 (아이템 일치)</button><button class="btn btn-r" style="border-color:#aa00ff;color:#aa00ff;" onclick="showBanMenu()">🚫 밴 모드 (아이템 금지)</button><button class="btn btn-r" style="border-color:#aa00ff;color:#aa00ff;" onclick="window.startHidden('infinite')">♾️ 무한 모드 (체력 100/100)</button><button class="btn btn-d" onclick="showMenu()">← 뒤로</button></div></div>`; }

export function showBanMenu() {
  const app = document.getElementById('app'); app.innerHTML = `<div class="achs"><div class="stitle" style="color:#aa00ff;">🚫 아이템 밴 설정</div><div style="font-size:calc(9px * var(--f-scale));color:#553333;text-align:center;margin-bottom:12px;">금지할 아이템을 선택하세요. (최소 3개는 남겨야 함)</div><div class="mgrid" style="grid-template-columns:repeat(3,1fr);margin-bottom:12px;">
      ${ITEMS.filter(it => it.w > 0).map(it => `<button class="mitm ${bannedItems.includes(it.id) ? 'active' : ''}" id="ban-${it.id}" onclick="window.toggleBan('${it.id}')" style="${bannedItems.includes(it.id) ? 'border-color:#f00;color:#f00;background:rgba(255,0,0,0.1);' : ''}">${it.e}<br>${it.name}</button>`).join('')}
    </div><button class="btn btn-r" onclick="window.startHidden('ban')">⚔ 밴 모드로 시작</button><div style="height:8px"></div><button class="btn btn-d" onclick="showHiddenModes()">← 뒤로</button></div>`;
}

export function showAchsScreen() {
  const achCount = Object.keys(achs).length;
  const totalAch = ACH_DEF.length;
  const progressPercent = (achCount / totalAch) * 100;
  const html = ACH_DEF.map(a => { const u = achs[a.id]; return `<div class="ait${u ? ' ok' : ''}"><div class="aemj">${a.e}</div><div><div class="aname">${u ? a.name : '???'}</div><div class="adesc">${a.desc}</div></div></div>`; }).join('');
  const app = document.getElementById('app'); 
  app.innerHTML = `
  <div class="achs-wrap">
    <div class="achs-list">
      <div class="stitle">◈ 업적 ◈</div>
      <div style="text-align:center;margin-bottom:15px;padding:0 10px;">
        <div style="font-size:calc(36px * var(--f-scale));color:var(--red);font-weight:900;text-shadow:0 0 15px rgba(200,0,0,0.5);">${achCount} / ${totalAch}</div>
        <div style="font-size:calc(10px * var(--f-scale));color:#553333;margin-bottom:8px;letter-spacing:2px;">ACHIEVEMENT PROGRESS</div>
        <div style="width:100%;height:8px;background:#1a0808;border-radius:4px;overflow:hidden;border:1px solid #2a0808;">
          <div style="width:${progressPercent}%;height:100%;background:linear-gradient(90deg, #8b0000, #ff0000);box-shadow:0 0 10px rgba(255,0,0,0.5);"></div>
        </div>
      </div>
      ${html}
      <div style="height:8px"></div>
    </div>
    <div class="achs-foot">
      <button class="btn btn-d" onclick="showMenu()">← 뒤로</button>
    </div>
  </div>`;
}

export function showCustomMenu() {
  const app = document.getElementById('app');
  app.innerHTML = `
  <div class="diffs">
    <div class="stitle">◈ 커스텀 모드 ◈</div>
    <div style="font-size:calc(10px * var(--f-scale));color:#553333;text-align:center;margin-bottom:16px;line-height:1.7;">원하는 설정으로 게임을 구성하세요.</div>
    <div style="display:flex;flex-direction:column;gap:12px;width:100%;">
      <button class="btn btn-r" onclick="initS(50, true);beginGame()">⚔ 커스텀 게임 시작</button>
      <button class="btn btn-d" onclick="showMenu()">← 뒤로</button>
    </div>
    <div style="margin-top:20px;font-size:calc(9px * var(--f-scale));color:#442222;text-align:center;">* 게임 중 우측 상단 ⚙️ 아이콘을 눌러<br>세부 설정을 변경할 수 있습니다.</div>
  </div>`;
}

export function showResult(outcome, newA, debtEarned) {
  const win = outcome === 'win', draw = outcome === 'draw'; const char = S.aiChar; const isSpecial = S.specialEndingsOn && (S.isOverdose || S.pHandcuffStreak >= 3 || S.pDaggerInGame >= 5);
  let msg = ''; let titleClass = outcome; let titleText = win ? '생존' : draw ? '무승부' : '사망';
  if (draw) msg = '\"둘 다 쓰러졌다. 아무도 이기지 못했다.\"'; else if (S.specialEndingsOn && S.isOverdose) { msg = '\"욕심이 과했습니다. 심장이 버티지 못하고 멈춰버렸군요.\"'; titleClass = 'special'; titleText = '과다복용'; } else if (S.specialEndingsOn && S.pHandcuffStreak >= 3) { msg = `《${char.name}: "...이건 좀 너무한 거 아닌가요? 완벽한 속박 플레이네요."》`; titleClass = 'special'; titleText = '속박 완료'; } else if (S.specialEndingsOn && S.pDaggerInGame >= 5) { msg = `《${char.name}: "당신... 독에 미친 사람 같군요. 비소 중독자라고 불러드려야 할까요?"》`; titleClass = 'special'; titleText = '비소 중독'; } else msg = `《${char.name}: "${win ? char.lines.win : char.lines.lose}"》`;
  const achHTML = newA.length ? `<div style="width:100%;margin-bottom:14px;"><div style="font-size:calc(9px * var(--f-scale));color:#553322;margin-bottom:6px;letter-spacing:2px;">◈ 업적 달성 ◈</div>${newA.map(a => `<div class="nach">${a.e} ${a.name}</div>`).join('')}</div>` : '';
  const app = document.getElementById('app'); app.innerHTML = `<div class="res ${isSpecial ? 'special' : ''}"><div style="font-size:calc(10px * var(--f-scale));color:#330011;letter-spacing:3px;">─ ${S.turnN}턴 경과 ─</div><div class="rtitle ${titleClass}">${titleText}</div><div class="rsub">${isSpecial ? '◈ HIDDEN EVENT ◈' : (win ? '◈ VICTORY ◈' : draw ? '◈ DRAW ◈' : '◈ DEFEAT ◈')}</div><div class="rmsg">${msg}</div><div style="font-size:11px;color:#cc4422;margin-bottom:10px;">🩸 획득한 혈채: ${debtEarned}</div>${achHTML}<div style="width:100%;"><button class="btn btn-r" onclick="showMenu()">◈ 메인으로</button></div></div>`;
}

export function showBlanketModal() {
  const m = document.getElementById('modal'); if (!m) return;
  m.innerHTML = `<div class="movl"><div class="mbox"><div class="mtitle">🛌 이불 사용</div><div style="font-size:calc(9px * var(--f-scale));color:#664444;text-align:center;margin-bottom:8px;">어떤 효과를 사용할까?</div><div class="mgrid"><button class="mitm" onclick="blkChoice(1)">❤️ 회복<br>(상대 공격 3회까지)</button><button class="mitm" onclick="blkChoice(2)">🎁 선물<br>(상대 무능 추가)</button><button class="mitm" onclick="blkChoice(4)">🎁 자신에게 선물<br>(자신 무능 추가)</button><button class="mitm" onclick="blkChoice(3)">🛡️ 방어막<br>(5 피해 흡수)</button></div></div></div>`;
  window.blkChoice = c => { m.innerHTML = ''; if (c === 1) { S.pBlkAtk = 3; addLog('🛌 이불 회복 모드 — 상대가 3번 공격할 때까지 매 턴 HP가 회복됩니다.', 'fx'); } else if (c === 2) { S.aHP = Math.min(S.aMax, S.aHP + 1); if (S.aItems.length < 10) S.aItems.push({ ...ITEMS.find(x => x.id === 'incap') }); else if (S.aItems.length > 0) S.aItems[Math.floor(Math.random() * S.aItems.length)] = { ...ITEMS.find(x => x.id === 'incap') }; addLog('🛌 AI에게 이불을 선물했습니다. (무능 아이템 추가, AI HP+1)', 'fx'); } else if (c === 4) { S.pHP = Math.min(S.pMax, S.pHP + 1); if (S.pItems.length < 10) S.pItems.push({ ...ITEMS.find(x => x.id === 'incap') }); else if (S.pItems.length > 0) S.pItems[Math.floor(Math.random() * S.pItems.length)] = { ...ITEMS.find(x => x.id === 'incap') }; addLog('🛌 자신에게 이불을 선물했습니다. (무능 아이템 추가, HP+1)', 'fx'); } else { S.pShield = 5; addLog('🛌 이불 방어막 모드 — 5 데미지를 흡수합니다.', 'fx'); } updateUI(); };
}

export function showHackModal(aiItems, cb) { const m = document.getElementById('modal'); if (!m) return; const btns = aiItems.map((it, i) => `<button class="mitm" onclick="hackPick(${i})">${it.e}<br>${it.name}</button>`).join(''); m.innerHTML = `<div class="movl"><div class="mbox"><div class="mtitle">💻 AI 아이템 탈취</div><div style="font-size:calc(9px * var(--f-scale));color:#664444;text-align:center;margin-bottom:8px;">어떤 것을 가져갈까?</div><div class="mgrid">${btns}</div></div></div>`; window.hackPick = i => { m.innerHTML = ''; cb(aiItems[i]); }; }
