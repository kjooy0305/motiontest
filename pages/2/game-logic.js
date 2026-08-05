import { AI_CHARACTERS, ITEMS, ACH_DEF, LINES, TRAITS, shuffle, clamp, clkTick, setFontSize } from './js/data.js';
import { 
  S, gs, achs, bannedItems, mirrorSet, spawnTarget,
  save, loadData, saveData, genItems, initS, pDmgTrack, aDmgTrack, applyStartFx, pUse, applyFx, goCheck, beginGame, pSuicide, resetAllData 
} from './js/core.js';
import { aiTurnCycle, doAIExtra, endAITurn, aiPickUse, rndWaitLine, startWaitTimer, clearWaitTimer } from './js/ai.js';
import { 
  toggleLayout, initLayout, applyBg, renderGame, updateUI, showMenu, showDiff, showShop, addLog, shk, 
  hpsHTML, hrtsH, igridHTML, efxHTML, tindText, aiDebugHTML, showHiddenModes, showBanMenu, showAchsScreen, showCustomMenu, showBlanketModal, showHackModal 
} from './js/ui.js';
import { openAdvancedCustom } from './js/custom.js';

// Global state for simplicity and HTML compatibility
window.AI_CHARACTERS = AI_CHARACTERS;
window.selDiff = 50;
window.unlockClickCount = 0;

// Export everything to window
const exports = {
  ITEMS, ACH_DEF, TRAITS, LINES, shuffle, clamp, clkTick, setFontSize,
  S, gs, achs, bannedItems, mirrorSet, spawnTarget, save, loadData, saveData, genItems, initS, pDmgTrack, aDmgTrack, applyStartFx, pUse, applyFx, goCheck, beginGame, pSuicide, resetAllData,
  aiTurnCycle, doAIExtra, endAITurn, aiPickUse, rndWaitLine, startWaitTimer, clearWaitTimer,
  toggleLayout, initLayout, applyBg, renderGame, updateUI, showMenu, showDiff, showShop, addLog, shk,
  hpsHTML, hrtsH, igridHTML, efxHTML, tindText, aiDebugHTML, showHiddenModes, showBanMenu, showAchsScreen, showCustomMenu, showBlanketModal, showHackModal,
  openAdvancedCustom,

  // UI Helpers
  pickD: (v) => { window.selDiff = v; document.querySelectorAll('.dbtn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.v) === v)); const d = document.getElementById('ddes'); if (d) d.innerHTML = window.dDesc(v); },
  dDesc: (v) => { const p = `<strong style="color:#cc4422">${v}%</strong>`; if (v === 0) return `AI 실수 확률 ${p} — AI가 절대 실수하지 않는다. 완벽한 전략만 구사한다.`; if (v <= 20) return `AI 실수 확률 ${p} — 극히 드물게만 실수한다. 거의 최선을 다한다.`; if (v <= 40) return `AI 실수 확률 ${p} — 가끔 실수한다. 상당히 어렵다.`; if (v <= 60) return `AI 실수 확률 ${p} — 종종 잘못된 선택을 한다. 균형잡힌 난이도.`; if (v <= 80) return `AI 실수 확률 ${p} — 자주 실수한다. 비교적 쉽다.`; if (v < 100) return `AI 실수 확률 ${p} — 매우 자주 실수한다. 초보자용.`; return `AI 실수 확률 ${p} — 항상 랜덤하게 행동한다. 전략이 전혀 없다.`; },
  startHidden: (mode) => { initS(0, false, mode); if (mode === 'infinite') { S.pHP = S.pMax = S.aHP = S.aMax = 100; } beginGame(); },
  toggleBan: (id) => { const idx = bannedItems.indexOf(id); if (idx === -1) { if (ITEMS.filter(it => it.w > 0).length - bannedItems.length <= 3) return alert('최소 3개의 아이템은 남겨야 합니다.'); bannedItems.push(id); } else bannedItems.splice(idx, 1); showBanMenu(); },
  changeFontSize: (amt) => { let scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--f-scale')) || 1; scale = Math.max(0.5, Math.min(2.0, scale + amt)); setFontSize(scale); },
  toggleAIAtk: (btn) => { S.aiAttackOn = !S.aiAttackOn; btn.textContent = S.aiAttackOn ? 'ON' : 'OFF'; },
  toggleSpecEnd: (btn) => { S.specialEndingsOn = !S.specialEndingsOn; btn.textContent = S.specialEndingsOn ? 'ON' : 'OFF'; },
  toggleAIDebug: () => { const el = document.getElementById('ai-debug-win'); if (el) el.classList.toggle('visible'); },
  setHP: (who, amt) => { if (who === 'p') { S.pMax = Math.max(1, S.pMax + amt); S.pHP = S.pMax; } else { S.aMax = Math.max(1, S.aMax + amt); S.aHP = S.aMax; } updateUI(); },
  buyTrait: (id) => { 
    const t = TRAITS.find(x => x.id === id); 
    if (gs.bloodDebt >= t.cost) { 
      const scroll = document.getElementById('shop-scroll')?.scrollTop || 0;
      gs.bloodDebt -= t.cost; 
      gs.unlockedTraits.push(id); 
      saveData(); 
      showShop(scroll); 
    } 
  },
  equipTrait: (id) => { 
    const scroll = document.getElementById('shop-scroll')?.scrollTop || 0;
    if (gs.equippedTrait === id) gs.equippedTrait = null; 
    else gs.equippedTrait = id; 
    saveData(); 
    showShop(scroll); 
  },
  unlockEverything: () => { const code = prompt('히든 코드를 입력하세요:'); if (code === 'vibe2026_master') { gs.hardUnlocked = true; gs.bloodDebt += 9999; ACH_DEF.forEach(a => window.achs[a.id] = true); alert('모든 기능과 업적이 해금되었습니다!'); saveData(); showMenu(); } },
  unlockEverythingTrigger: () => { window.unlockClickCount++; if (window.unlockClickCount >= 10) { window.unlockClickCount = 0; window.unlockEverything(); } },
  setSpawnTarget: (who, btn) => { window.spawnTarget = who; const pBtn = document.getElementById('spawn-p'), aBtn = document.getElementById('spawn-a'); if (pBtn) pBtn.style.background = ''; if (aBtn) aBtn.style.background = ''; btn.style.background = '#300'; },
  spawnItem: (id) => { const it = ITEMS.find(x => x.id === id); if (window.spawnTarget === 'p') { if (S.pItems.length < 10) S.pItems.push({ ...it }); } else { if (S.aItems.length < 10) S.aItems.push({ ...it }); } updateUI(); addLog(`🛠 아이템 생성 (${window.spawnTarget === 'p' ? '내' : 'AI'}): ${it.name}`, 'sys'); },
  rndLine: (id, isP) => { const l = LINES[id]; if (!l) return ''; const p = isP ? l.p : l.a; if (!p || p.length === 0) return ''; return p[Math.floor(Math.random() * p.length)]; },
  setNickname: () => { const n = prompt('새로운 닉네임을 입력하세요:', localStorage.getItem('playerNickname') || '플레이어'); if (n) { localStorage.setItem('playerNickname', n.slice(0, 10)); showMenu(); } }
};

Object.entries(exports).forEach(([name, func]) => window[name] = func);

// Initialization
async function init() {
  try {
    const res = await fetch('characters.json');
    if (res.ok) {
      const chars = await res.json();
      AI_CHARACTERS.push(...chars);
    }
  } catch (e) { console.error('Failed to load characters:', e); }
  loadData(); initLayout(); applyBg(gs.currentBg); showMenu(); clkTick(); setInterval(clkTick, 15000);
}
init();

export { S, initS, updateUI, addLog, AI_CHARACTERS, ITEMS, TRAITS, gs, saveData, showMenu, beginGame };
