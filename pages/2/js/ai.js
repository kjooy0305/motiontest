// ════════════════════════════════════════
// AI CONTROLLER MODULE
// ════════════════════════════════════════

import { S, applyFx, goCheck, applyStartFx, pTurnCycle, checkResupply } from './core.js';
import { updateUI, addLog } from './ui.js';

export let waitTimer = null;

export function rndWaitLine() {
  const { AI_CHARACTERS } = window;
  const char = S.aiChar || AI_CHARACTERS[AI_CHARACTERS.length - 1];
  const lines = char.lines.wait || ['...'];
  return lines[Math.floor(Math.random() * lines.length)];
}

export function startWaitTimer() {
  clearWaitTimer(); if (S.turn !== 'p') return;
  waitTimer = setTimeout(() => { addLog(`《${S.aiChar.name}: "${rndWaitLine()}"》`, 'ai'); startWaitTimer(); }, 12000);
}

export function clearWaitTimer() { if (waitTimer) { clearTimeout(waitTimer); waitTimer = null; } }

export function aiTurnCycle() {
  applyStartFx('a'); if (goCheck()) return; 
  checkResupply();
  updateUI();
  if (!S.aiAttackOn) { addLog('🛠 커스텀: AI 공격 비활성화됨', 'sys'); S.turn = 'p'; setTimeout(pTurnCycle, 700); return; }
  if (S.aSkip > 0) { S.aSkip--; addLog(`⛓️ AI 행동 불능! (${S.aSkip}턴 남음)`, 'sys'); updateUI(); S.turn = 'p'; setTimeout(pTurnCycle, 700); return; }
  if (S.aDrgSkip) { S.aDrgSkip = false; addLog('💉 AI 마약 부작용 — AI 턴 스킵', 'sys'); updateUI(); S.turn = 'p'; setTimeout(pTurnCycle, 700); return; }
  setTimeout(() => aiPickUse(() => { if (S.aDrgX > 0) doAIExtra(endAITurn); else endAITurn(); }), 600);
}

export function doAIExtra(done) {
  if (S.aDrgX <= 0) { done(); return; } S.aDrgX--;
  setTimeout(() => { if (S.pHP <= 0 || S.aHP <= 0) return; aiPickUse(() => doAIExtra(done)); }, 1200);
}

export function endAITurn() { S.turn = 'p'; addLog('──────────────', 'sys'); updateUI(); setTimeout(pTurnCycle, 700); }

export function aiPickUse(done) {
  if (S.aItems.length === 0) { done(); return; }
  const char = S.aiChar; const weights = char.weights || {}; let pickedIdx = -1;
  if (S.aHP <= 3) pickedIdx = S.aItems.findIndex(it => it.id === 'blood_pack' || it.id === 'steroid');
  if (pickedIdx === -1 && S.pSkip === 0) pickedIdx = S.aItems.findIndex(it => it.id === 'handcuffs');
  if (pickedIdx === -1 && S.pHP <= 3) pickedIdx = S.aItems.findIndex(it => it.id === 'double_sword' || it.id === 'knife' || it.id === 'poison_dagger');
  if (pickedIdx === -1) {
    const itemsWithWeights = S.aItems.map((it, i) => ({ idx: i, w: (weights[it.id] || 1) })); const totalW = itemsWithWeights.reduce((s, x) => s + x.w, 0);
    let r = Math.random() * totalW; for (const item of itemsWithWeights) { r -= item.w; if (r <= 0) { pickedIdx = item.idx; break; } }
  }
  if (pickedIdx === -1) pickedIdx = 0; const it = S.aItems[pickedIdx];
  if (it.id === 'hack_tool' && S.pItems.length > 0) {
    const targetIdx = Math.floor(Math.random() * S.pItems.length); const targetItem = S.pItems[targetIdx];
    S.pItems.splice(targetIdx, 1); S.aItems.splice(pickedIdx, 1); S.aItems.push(targetItem);
    addLog(`《${char.name}: "${char.lines.item.hack_tool || '당신의 것을 가져가겠습니다.'}"》`, 'ai'); addLog(`💻 AI가 당신의 ${targetItem.name}을(를) 탈취했습니다!`, 'fx');
  } else { S.aItems.splice(pickedIdx, 1); applyFx(false, it); }
  checkResupply();
  updateUI(); if (goCheck()) return; done();
}
