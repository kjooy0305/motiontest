// ════════════════════════════════════════
// CORE LOGIC MODULE
// ════════════════════════════════════════

import { ITEMS, TRAITS, ACH_DEF, LINES, shuffle } from './data.js';
import { updateUI, addLog, shk, showResult, showBlanketModal, showHackModal, applyBg } from './ui.js';
import { aiTurnCycle, startWaitTimer, clearWaitTimer } from './ai.js';

export let gs = {};
export let achs = {};
export let S = {};
export let bannedItems = [];
export let mirrorSet = null;
export let spawnTarget = 'p';

export function save() {
  localStorage.setItem('drk_gs', JSON.stringify(gs));
  localStorage.setItem('drk_achs', JSON.stringify(achs));
}

export function loadData() {
  try { achs = JSON.parse(localStorage.getItem('drk_achs') || '{}'); } catch { achs = {}; }
  try { gs = JSON.parse(localStorage.getItem('drk_gs') || '{}'); } catch { gs = {}; }
  gs.wins = gs.wins || 0; gs.streak = gs.streak || 0;
  gs.masterW = gs.masterW || 0; gs.use = gs.use || {};
  gs.bloodDebt = gs.bloodDebt || 0;
  gs.unlockedTraits = gs.unlockedTraits || [];
  gs.unlockedBgs = gs.unlockedBgs || ['bg_default'];
  gs.currentBg = gs.currentBg || 'bg_default';
  gs.hardUnlocked = gs.hardUnlocked || false;
  gs.equippedTrait = gs.equippedTrait || null;
}

export function saveData() { save(); }

export function genItems(n, isAI = false) {
  const res = [];
  const pool = ITEMS.filter(it => !bannedItems.includes(it.id) && it.w > 0);
  const totalW = pool.reduce((s, i) => s + i.w, 0);

  if (S.gameMode === 'mirror') {
    if (!isAI) {
      mirrorSet = [];
      for (let k = 0; k < n; k++) {
        let r = Math.random() * totalW;
        for (const it of pool) { r -= it.w; if (r <= 0) { mirrorSet.push({ ...it }); break; } }
        if (mirrorSet.length < k + 1) mirrorSet.push({ ...pool[0] });
      }
      return [...mirrorSet];
    } else { return mirrorSet ? [...mirrorSet] : genItems(n, false); }
  }

  for (let k = 0; k < n; k++) {
    let r = Math.random() * totalW;
    for (const it of pool) { r -= it.w; if (r <= 0) { res.push({ ...it }); break; } }
    if (res.length < k + 1) res.push({ ...pool[0] });
  }
  return res;
}

export function initS(diff, isCustom = false, gameMode = 'normal') {
  const { AI_CHARACTERS } = window;
  let char;
  if (gameMode === 'hard') {
    char = AI_CHARACTERS[Math.floor(Math.random() * AI_CHARACTERS.length)];
  } else {
    char = AI_CHARACTERS.find(c => c.id === diff) || AI_CHARACTERS[5];
  }
  const pTrait = gs.equippedTrait ? TRAITS.find(t => t.id === gs.equippedTrait) : null;
  let aTrait = null;
  if (gameMode === 'hard' || diff <= 10) aTrait = TRAITS[Math.floor(Math.random() * TRAITS.length)];

  S = {
    diff, isCustom, gameMode, aiChar: char, pTrait, aTrait,
    pHP: 10, pMax: 10, aHP: 10, aMax: 10, pItems: [], aItems: [],
    pObs: false, aRnd: false, turn: Math.random() < .5 ? 'p' : 'a',
    pSkip: 0, aSkip: 0, pPoi: 0, aPoi: 0, pBld: 0, aBld: 0,
    pBlkAtk: 0, aBlkAtk: 0, pShield: 0, aShield: 0,
    aiAttackOn: true, specialEndingsOn: true,
    pDrgX: 0, pDrgSkip: false, aDrgSkip: false, aDrgX: 0,
    turnN: 0, log: [], pDmgDealt: 0, pDmgRecv: 0, aDmgDealt: 0,
    pDmg: 0, pMinHP: 10, hadLow: false,
    dsTotal: 0, luckyTriple: 0, pHandcuffStreak: 0, pDaggerInGame: 0, isOverdose: false,
    newAchs: [],
  };
  S.pItems = genItems(5, false); S.aItems = genItems(5, true);
}

export function pDmgTrack(amt, isPassive = false) {
  if (S.pGod) { addLog('✨ [무적] 내 데미지가 무효화되었습니다.', 'fx'); return; }
  let actualAmt = amt;
  if (!isPassive && S.pTrait?.id === 'shadow' && Math.random() < 0.2) { addLog('👤 [그림자] 공격을 회피했습니다!', 'fx'); return; }
  if (!isPassive && S.pTrait?.id === 'iron_skin') { actualAmt = Math.max(1, actualAmt - 1); if (actualAmt < amt) addLog('🛡️ [강철 피부] 피해를 1 경감했습니다.', 'fx'); }
  if (!isPassive && S.pTrait?.id === 'berserker') { actualAmt += 1; addLog('🪓 [광전사] 받는 피해가 1 증가했습니다.', 'dm'); }
  if (!isPassive && S.pBlkAtk > 0) { S.pBlkAtk--; if (S.pBlkAtk === 0) addLog('🛌 이불 회복 효과가 종료되었습니다. (상대 공격 3회 완료)', 'fx'); }
  if (S.pShield > 0) { const absorbed = Math.min(S.pShield, actualAmt); S.pShield -= absorbed; actualAmt -= absorbed; addLog(`🛡️ 방어막이 ${absorbed} 데미지를 흡수했습니다! (남은 방어막: ${S.pShield})`, 'fx'); }
  if (actualAmt > 0) {
    S.pHP = Math.max(0, S.pHP - actualAmt); S.pDmgRecv += actualAmt; S.pDmg += actualAmt; S.pMinHP = Math.min(S.pMinHP, S.pHP);
    if (S.pHP === 1) S.hadLow = true;
    shk('phrt');
    if (!isPassive && S.pTrait?.id === 'thorn_mail') { addLog('🌵 [가시 갑옷] 데미지를 반사합니다!', 'fx'); aDmgTrack(1, true); }
    if (S.pHP <= 0 && S.pTrait?.id === 'undead' && S.pMax > 1) { S.pMax = Math.floor(S.pMax / 2); S.pHP = S.pMax; addLog('💀 [불사자] 죽음을 거부하고 부활했습니다!', 'hl'); updateUI(); }
  }
}

export function aDmgTrack(amt, isPassive = false) {
  if (S.aGod) { addLog(`✨ [무적] ${S.aiChar.name}의 데미지가 무효화되었습니다.`, 'fx'); return; }
  let actualAmt = amt;
  if (!isPassive && S.aTrait?.id === 'shadow' && Math.random() < 0.2) { addLog('👤 AI: [그림자] 공격을 회피했습니다!', 'fx'); return; }
  if (!isPassive && S.aTrait?.id === 'iron_skin') actualAmt = Math.max(1, actualAmt - 1);
  if (!isPassive && S.aTrait?.id === 'berserker') actualAmt += 1;
  if (!isPassive && S.aBlkAtk > 0) { S.aBlkAtk--; if (S.aBlkAtk === 0) addLog('🛌 AI의 이불 회복 효과가 종료되었습니다. (상대 공격 3회 완료)', 'fx'); }
  if (S.aShield > 0) { const absorbed = Math.min(S.aShield, actualAmt); S.aShield -= absorbed; actualAmt -= absorbed; addLog(`🛡️ AI 방어막이 ${absorbed} 데미지를 흡수했습니다!`, 'fx'); }
  if (actualAmt > 0) {
    S.aHP = Math.max(0, S.aHP - actualAmt); S.pDmgDealt += actualAmt; shk('ahrt');
    if (!isPassive && S.pTrait?.id === 'vampire') { const heal = Math.max(1, Math.floor(actualAmt * 0.2)); S.pHP = Math.min(S.pMax, S.pHP + heal); addLog(`🧛 [흡혈귀] 체력을 ${heal} 회복했습니다.`, 'hl'); }
    if (!isPassive && S.aTrait?.id === 'thorn_mail') { addLog('🌵 AI: [가시 갑옷] 데미지 반사!', 'fx'); pDmgTrack(1, true); }
    if (S.aHP <= 0 && S.aTrait?.id === 'undead' && S.aMax > 1) { S.aMax = Math.floor(S.aMax / 2); S.aHP = S.aMax; addLog('💀 AI: [불사자] 죽음을 거부하고 부활했습니다!', 'hl'); updateUI(); }
  }
}

export function applyStartFx(who) {
  const isP = who === 'p'; const tr = isP ? S.pTrait : S.aTrait;
  if (S.turnN % 5 === 0 && tr?.id === 'regenerator') { if (isP) { S.pHP = Math.min(S.pMax, S.pHP + 1); addLog('🌱 [재생가] 체력이 1 회복되었습니다.', 'hl'); } else { S.aHP = Math.min(S.aMax, S.aHP + 1); } }
  if (S.turnN % 7 === 0 && tr?.id === 'lucky_seven' && isP) {
    const effect = ['hp', 'item', 'shield'][Math.floor(Math.random() * 3)];
    if (effect === 'hp') { S.pHP = Math.min(S.pMax, S.pHP + 2); addLog('🎰 [럭키 세븐] 체력이 2 회복되었습니다!', 'hl'); }
    else if (effect === 'item') { S.pItems.push({ ...ITEMS[Math.floor(Math.random() * ITEMS.length)] }); addLog('🎰 [럭키 세븐] 무작위 아이템을 얻었습니다!', 'fx'); }
    else { S.pShield = 5; addLog('🎰 [럭키 세븐] 방어막을 얻었습니다!', 'fx'); }
  }
  if (tr?.id === 'berserker') { const dealt = isP ? S.pDmgDealt : S.aDmgDealt; const bonus = Math.floor(dealt / 15); const currentMax = isP ? S.pMax : S.aMax; if (currentMax < 10 + bonus) { if (isP) { S.pMax++; addLog('🪓 [광전사] 힘이 솟구칩니다! 최대 체력+1', 'hl'); } else { S.aMax++; } } }
  if (isP && S.pPoi > 0) { if (S.pTrait?.id === 'poison_master') { S.pPoi = 0; addLog('🐍 [독의 군주] 독기를 중화했습니다!', 'hl'); } else { S.pHP = Math.max(0, S.pHP - 1); S.pPoi--; addLog(`🟢 독 데미지 -1 (${S.pPoi}턴 남음)`, 'dm'); pDmgTrack(1, true); } }
  if (!isP && S.aPoi > 0) { if (S.aTrait?.id === 'poison_master') S.aPoi = 0; else { S.aHP = Math.max(0, S.aHP - 1); S.aPoi--; addLog(`🟢 AI 독 데미지 -1 (${S.aPoi}턴 남음)`, 'dm'); aDmgTrack(1, true); } }
  if (isP && S.pBld > 0) { if (S.pHP >= S.pMax) { S.pMax++; S.pHP = S.pMax; addLog('🩹 수혈 보너스! 최대 체력 +1', 'hl'); } else { S.pHP++; addLog(`🩹 수혈 회복 +1`, 'hl'); } S.pBld--; }
  if (!isP && S.aBld > 0) { if (S.aHP >= S.aMax) { S.aMax++; S.aHP = S.aMax; } else { S.aHP++; } S.aBld--; }
  if (isP && S.pBlkAtk > 0) { S.pHP = Math.min(S.pMax, S.pHP + 1); addLog(`🛌 이불 회복 +1 (상대 공격 ${S.pBlkAtk}회 남음)`, 'hl'); }
  if (!isP && S.aBlkAtk > 0) { S.aHP = Math.min(S.aMax, S.aHP + 1); addLog(`🛌 AI 이불 회복 +1 (상대 공격 ${S.aBlkAtk}회 남음)`, 'hl'); }
}

export function pUse(idx) {
  if (S.turn !== 'p') return; clearWaitTimer(); const it = S.pItems[idx];
  if (it.id === 'hack_tool') {
    if (S.aItems.length === 0) { addLog('💻 상대방에게 훔칠 아이템이 없습니다.', 'sys'); return; }
    S.turn = 'busy'; const originalItem = it;
    showHackModal(S.aItems, picked => {
      const currentIdx = S.pItems.indexOf(originalItem); if (currentIdx > -1) S.pItems.splice(currentIdx, 1);
      const aidx = S.aItems.indexOf(picked); if (aidx > -1) S.aItems.splice(aidx, 1);
      S.pItems.push(picked); addLog(`💻 AI의 ${picked.name}을(를) 해킹하여 가져왔습니다!`, 'fx');
      S.pHandcuffStreak = 0; gs.use['hack_tool'] = (gs.use['hack_tool'] || 0) + 1;
      updateUI(); 
      if (S.pDrgX > 0) { 
        S.pDrgX--; 
        S.turn = 'p'; 
        addLog(`💉 마약 효과! 아이템 추가 사용 가능 (${S.pDrgX}회)`, 'sys'); 
        if (S.pItems.length === 0) checkResupply();
        updateUI(); startWaitTimer(); 
      } else { 
        checkResupply();
        S.turn = 'a'; setTimeout(aiTurnCycle, 700); 
      }
    });
    return;
  }
  S.pItems.splice(idx, 1); if (it.id !== 'incap') gs.use[it.id] = (gs.use[it.id] || 0) + 1;
  if (it.id === 'handcuffs') S.pHandcuffStreak++; else S.pHandcuffStreak = 0;
  if (it.id === 'poison_dagger') S.pDaggerInGame++;
  applyFx(true, it); updateUI();
  if (goCheck()) return;
  if (S.pDrgX > 0) { 
    S.pDrgX--; 
    addLog(`💉 마약 효과! 아이템 추가 사용 가능 (${S.pDrgX}회)`, 'sys'); 
    if (S.pItems.length === 0) checkResupply();
    updateUI(); startWaitTimer(); 
  }
  else { 
    checkResupply();
    S.turn = 'a'; setTimeout(aiTurnCycle, 700); 
  }
}

export function pTurnCycle() {
  S.turnN++;
  applyStartFx('p');
  if (goCheck()) return;
  checkResupply();
  updateUI();
  addLog('◈ 당신의 차례', 'pl');
  startWaitTimer();
}

export function pSuicide() {
  if (confirm('정말로 항복하시겠습니까?')) {
    S.pHP = 0;
    addLog('🏳️ 당신은 스스로 포기했습니다...', 'sys');
    updateUI();
    goCheck();
  }
}

export function checkResupply() {
  // 사용자가 보고한 버그: 마약 사용 후 1개가 남아도 재보급이 안됨.
  // 로직 변경: 플레이어 혹은 AI 둘 중 하나라도 아이템이 0개가 되면 즉시 재보급하도록 수정하여 흐름이 끊기지 않게 함.
  if (S.pItems.length === 0 || S.aItems.length === 0) {
    addLog('📦 아이템 재보급! 전장에 새로운 물자가 공급됩니다.', 'sys');
    const pNew = genItems(5, false);
    const aNew = genItems(5, true);
    
    // 기존 아이템이 남아있을 수 있으므로 합치기 (최대 10개)
    S.pItems = [...S.pItems, ...pNew].slice(0, 10);
    S.aItems = [...S.aItems, ...aNew].slice(0, 10);
    updateUI();
  }
}

export function applyFx(isP, it) {
  const tHP = isP ? 'aHP' : 'pHP'; const tMax = isP ? 'aMax' : 'pMax'; const sHP = isP ? 'pHP' : 'aHP'; const sMax = isP ? 'pMax' : 'aMax';
  const tLbl = isP ? 'AI' : '플레이어'; const sLbl = isP ? '내' : 'AI'; const tr = isP ? S.pTrait : S.aTrait;
  addLog(window.rndLine(it.id, isP), isP ? 'pl' : 'ai');
  switch (it.id) {
    case 'double_sword': { if (isP) S.dsTotal++; let selfProb = 0.5; if (tr?.id === 'steady_hand') selfProb = 0.25; const self = Math.random() < selfProb; if (self) { addLog(LINES.double_sword.self, 'fx'); addLog(`⚔️ 자해! ${sLbl} 체력 데미지`, 'dm'); if (isP) pDmgTrack(1); else aDmgTrack(1); } let dmg = Math.random() < 0.5 ? 3 : 2; if (tr?.id === 'berserker') dmg += Math.floor((isP ? S.pDmgDealt : S.aDmgDealt) / 15); if (tr?.id === 'blood_thirsty' && S[tHP] <= 5) dmg += 1; addLog(LINES.double_sword[`hit${dmg}`] || `\"엄청난 위력이다!\"`, 'fx'); addLog(`⚔️ ${tLbl} 체력 -${dmg}`, 'dm'); if (isP) aDmgTrack(dmg); else pDmgTrack(dmg); break; }
    case 'knife': { let dmg = 1; if (tr?.id === 'sharpshooter') dmg = 2; if (tr?.id === 'berserker') dmg += Math.floor((isP ? S.pDmgDealt : S.aDmgDealt) / 15); if (tr?.id === 'blood_thirsty' && S[tHP] <= 5) dmg += 1; addLog(LINES.knife.hit, 'fx'); addLog(`🔪 ${tLbl} 체력 -${dmg}`, 'dm'); if (isP) aDmgTrack(dmg); else pDmgTrack(dmg); break; }
    case 'handcuffs': { let turns = 1; if (tr?.id === 'tactician') turns = 2; if (isP) { S.aSkip += turns; addLog(`⛓️ AI ${turns}턴 행동 불능!`, 'fx'); } else { S.pSkip += turns; addLog(`⛓️ 당신이 ${turns}턴 행동 불능!`, 'fx'); } break; }
    case 'rotten_drug': { const chg = Math.floor(Math.random() * 16) - 5; if (chg >= 0) { S[sHP] = Math.min(S[sMax], S[sHP] + chg); addLog(LINES.rotten_drug.good, 'fx'); addLog(`💊 ${sLbl} 체력 +${chg}`, 'hl'); } else { if (tr?.id === 'alchemist') addLog('⚗️ [연금술사] 부작용을 무시했습니다!', 'hl'); else { addLog(LINES.rotten_drug.bad, 'fx'); addLog(`💊 ${sLbl} 체력 ${chg}`, 'dm'); if (isP) pDmgTrack(Math.abs(chg)); else aDmgTrack(Math.abs(chg)); } } break; }
    case 'poison_dagger': { const r = Math.random(); if (r < 0.4) { addLog(LINES.poison_dagger.e1, 'fx'); addLog(`🗡️ ${tLbl} 체력 -1`, 'dm'); if (isP) aDmgTrack(1); else pDmgTrack(1); if (isP) { S.aRnd = true; addLog('⚠️ AI가 혼란 상태에 빠졌다!', 'fx'); } else { S.pObs = true; S.pItems = shuffle([...S.pItems]); addLog('⚠️ 혼란! 내 아이템이 뒤섞였다!', 'fx'); } } else if (r < 0.6) { addLog(LINES.poison_dagger.e2, 'fx'); addLog(`🗡️ 맹독! ${tLbl} 체력 -5`, 'dm'); if (isP) aDmgTrack(5); else pDmgTrack(5); if (isP) S.luckyTriple++; } else if (r < 0.8) { if (isP) { S.aPoi += 4; aDmgTrack(1); } else { S.pPoi += 4; pDmgTrack(1); } addLog(LINES.poison_dagger.e3, 'fx'); addLog(`🗡️ ${tLbl} 체력 -1 + 독 4턴`, 'dm'); } else { S[tMax] = Math.max(1, S[tMax] - 1); addLog('\"치명적인 독이 혈관을 영구적으로 손상시켰다!\"', 'fx'); addLog(`🗡️ ${tLbl} 체력 -1, 최대 체력 -1`, 'dm'); if (isP) aDmgTrack(1); else pDmgTrack(1); } break; }
    case 'drugs': { addLog('💉 마약! 이번 턴 아이템 2개 추가 사용!', 'fx'); if (isP) { S.pDrgX = 3; S.pDrgSkip = true; } else { S.aDrgX = 2; S.aDrgSkip = true; } break; }
    case 'steroid': { S[sHP] = Math.min(S[sMax], S[sHP] + 5); S[sMax]--; if (S[sMax] <= 0) { S[sMax] = 0; S[sHP] = 0; if (isP) S.isOverdose = true; addLog(`💊 과다복용! 심장이 버티지 못합니다!`, 'dm'); } else { S[sHP] = Math.min(S[sHP], S[sMax]); addLog(`💪 체력 +5, 최대 체력 -1`, 'hl'); } break; }
    case 'blood_pack': { if (isP) S.pBld = 3; else S.aBld = 3; addLog(`🩹 수혈팩 — 효과가 활성화되었습니다.`, 'hl'); break; }
    case 'blanket': { if (isP) showBlanketModal(); else { const r = Math.random(); if (r < 0.4) { S.aBlkAtk = 3; addLog('🛌 AI: 이불 회복 모드 (상대 공격 3회까지 HP+1)', 'fx'); } else if (r < 0.7) { S.pHP = Math.min(S.pMax, S.pHP + 1); if (S.pItems.length < 10) S.pItems.push({ ...ITEMS.find(x => x.id === 'incap') }); else if (S.pItems.length > 0) S.pItems[Math.floor(Math.random() * S.pItems.length)] = { ...ITEMS.find(x => x.id === 'incap') }; addLog('🛌 AI: 당신에게 이불을 선물했습니다. (무능 아이템 추가, HP+1)', 'fx'); } else { S.aShield = 5; addLog('🛌 AI: 이불 방어막 모드 (5 데미지 흡수)', 'fx'); } } break; }
    case 'incap': { addLog('⭕ 아무 일도 일어나지 않았습니다.', 'sys'); break; }
  }
}

export function goCheck() {
  if (S.pHP > 0 && S.aHP > 0) return false;
  const outcome = S.pHP <= 0 && S.aHP <= 0 ? 'draw' : S.pHP <= 0 ? 'lose' : 'win';
  const newA = []; function ach(id, cond) { if (cond && !achs[id]) { achs[id] = true; const a = ACH_DEF.find(x => x.id === id); if (a) newA.push(a); } }
  if (S.isCustom) { saveData(); showResult(outcome, [], 0); return true; }
  if (S.specialEndingsOn) { if (S.pHandcuffStreak >= 3) { unlockBg('bg_shackles'); ach('shackled_play', true); } if (S.pDaggerInGame >= 5) { unlockBg('bg_poison'); ach('poison_addict', true); } if (S.isOverdose) { unlockBg('bg_overdose'); ach('overdose', true); } }
  function unlockBg(id) { if (!gs.unlockedBgs.includes(id)) { gs.unlockedBgs.push(id); applyBg(id); gs.currentBg = id; } }
  const debtEarned = Math.floor(S.pDmgDealt); gs.bloodDebt += debtEarned;
  if (outcome === 'win') {
    gs.wins++; gs.streak++; if (S.diff <= 10) gs.masterW++;
    ach('first_blood', true); ach('barely', S.pHP === 1); ach('comeback', S.hadLow && S.pHP > 1); ach('win_streak', gs.streak >= 5); ach('hell_mode', S.diff === 0);
    if (S.diff === 0 && !gs.hardUnlocked) { gs.hardUnlocked = true; alert('✨ 축하합니다! "신의 지능(0%)" 난이도를 클리어하여 "하드 모드"가 해금되었습니다! ✨'); }
    ach('quick_win', S.turnN <= 10); ach('survivor', gs.wins >= 10); ach('mastermind', gs.masterW >= 3); ach('gambler', S.dsTotal >= 10); ach('lucky_triple', S.luckyTriple >= 3);
  } else gs.streak = 0;
  function uchk(id, iid, thresh) { if ((gs.use[iid] || 0) >= thresh && !achs[id]) { achs[id] = true; const a = ACH_DEF.find(x => x.id === id); if (a) newA.push(a); } }
  uchk('poison_master', 'poison_dagger', 20); uchk('mad_doctor', 'rotten_drug', 10); uchk('hacker', 'hack_tool', 10); uchk('shackler', 'handcuffs', 15); uchk('junkie', 'drugs', 10); uchk('blood_addict', 'blood_pack', 10); uchk('roid_rage', 'steroid', 10);
  saveData(); showResult(outcome, newA, debtEarned); return true;
}

export function beginGame() {
  initS(window.selDiff); renderGame();
  addLog(`◈ 전투 시작 — 상대: ${S.aiChar.e} ${S.aiChar.name}`, 'sys'); addLog(`《${S.aiChar.name}: "${S.aiChar.lines.intro}"》`, 'ai'); addLog(`◈ 선공: ${S.turn === 'p' ? '플레이어' : 'AI'}`, 'sys');
  if (S.turn === 'a') setTimeout(aiTurnCycle, 1400); else { S.turnN++; addLog('◈ 아이템을 선택하세요', 'pl'); }
}

export function resetAllData() {
  if (confirm('정말로 모든 기록(승리, 업적, 상점 등)을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    localStorage.removeItem('drk_gs');
    localStorage.removeItem('drk_achs');
    localStorage.removeItem('layoutMode');
    localStorage.removeItem('fontScale');
    localStorage.removeItem('playerNickname');
    location.reload();
  }
}
