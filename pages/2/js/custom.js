// ════════════════════════════════════════
// ADVANCED CUSTOM MODULE
// ════════════════════════════════════════

export function openAdvancedCustom() {
  const { S, ITEMS, AI_CHARACTERS, updateUI, addLog, TRAITS, gs } = window;
  const m = document.getElementById('modal');
  if (!m) return;

  const charOptions = AI_CHARACTERS.map(c => 
    `<option value="${c.id}" ${S.aiChar.id === c.id ? 'selected' : ''}>${c.e} ${c.name}</option>`
  ).join('');

  const itemOptions = ITEMS.filter(it => it.id !== 'incap').map(it => 
    `<button class="mitm" style="font-size:calc(9px * var(--f-scale));padding:4px;" onclick="window.customSpawn('${it.id}')">${it.e}<br>${it.name}</button>`
  ).join('');

  m.innerHTML = `
  <div class="movl">
    <div class="mbox" style="max-height:90%; overflow-y:auto; width:95%; max-width:450px;">
      <div class="mtitle">🛠 어드밴스드 커스텀</div>
      
      <div style="display:flex; flex-direction:column; gap:15px; padding:5px;">
        <!-- 체력 관리 -->
        <div style="border-bottom:1px solid #300; padding-bottom:10px;">
          <div style="font-size:11px; color:#888; margin-bottom:8px;">❤️ 체력 및 무적 설정</div>
          <div class="c-row">
            <span>내 HP (${S.pHP}/${S.pMax})</span>
            <div style="display:flex; gap:5px;">
              <button class="btn btn-d" style="padding:2px 8px;" onclick="window.adjHP('p',-1)">-</button>
              <button class="btn btn-d" style="padding:2px 8px;" onclick="window.adjHP('p',1)">+</button>
            </div>
          </div>
          <div class="c-row">
            <span>상대 HP (${S.aHP}/${S.aMax})</span>
            <div style="display:flex; gap:5px;">
              <button class="btn btn-d" style="padding:2px 8px;" onclick="window.adjHP('a',-1)">-</button>
              <button class="btn btn-d" style="padding:2px 8px;" onclick="window.adjHP('a',1)">+</button>
            </div>
          </div>
          <div class="c-row" style="margin-top:5px;">
            <span>내 무적</span>
            <button class="btn btn-d" style="width:60px; padding:4px;" onclick="window.toggleGod('p',this)">${S.pGod ? 'ON' : 'OFF'}</button>
          </div>
          <div class="c-row">
            <span>상대 무적</span>
            <button class="btn btn-d" style="width:60px; padding:4px;" onclick="window.toggleGod('a',this)">${S.aGod ? 'ON' : 'OFF'}</button>
          </div>
        </div>

        <!-- 캐릭터 변경 -->
        <div style="border-bottom:1px solid #300; padding-bottom:10px;">
          <div style="font-size:11px; color:#888; margin-bottom:8px;">👤 상대 캐릭터 변경</div>
          <select id="char-sel" style="width:100%; background:#000; color:#ccc; border:1px solid #444; padding:5px;" onchange="window.changeOpponent(this.value)">
            ${charOptions}
          </select>
        </div>

        <!-- 아이템 생성 -->
        <div style="border-bottom:1px solid #300; padding-bottom:10px;">
          <div style="font-size:11px; color:#888; margin-bottom:8px;">📦 아이템 즉시 생성</div>
          <div style="display:flex; gap:5px; margin-bottom:8px;">
            <button id="sp-p" class="btn btn-d" style="flex:1; padding:4px; background:#300;" onclick="window.setSpTarget('p',this)">나에게</button>
            <button id="sp-a" class="btn btn-d" style="flex:1; padding:4px;" onclick="window.setSpTarget('a',this)">상대에게</button>
          </div>
          <div class="mgrid" style="grid-template-columns:repeat(4,1fr); gap:4px;">
            ${itemOptions}
          </div>
        </div>

        <!-- 기타 설정 -->
        <div>
          <div style="font-size:11px; color:#888; margin-bottom:8px;">⚙️ 기타</div>
          <div class="c-row">
            <span>히든 엔딩 활성</span>
            <button class="btn btn-d" style="width:60px; padding:4px;" onclick="window.toggleSpecEnd(this)">${S.specialEndingsOn ? 'ON' : 'OFF'}</button>
          </div>
        </div>
      </div>

      <button class="btn btn-r" style="margin-top:20px;" onclick="document.getElementById('modal').innerHTML=''">닫기</button>
    </div>
  </div>`;
}

// Global window functions for the custom modal
window.adjHP = (who, amt) => {
  const { S, updateUI } = window;
  if (who === 'p') { S.pMax = Math.max(1, S.pMax + amt); S.pHP = Math.min(S.pHP, S.pMax); }
  else { S.aMax = Math.max(1, S.aMax + amt); S.aHP = Math.min(S.aHP, S.aMax); }
  updateUI();
  openAdvancedCustom();
};

window.toggleGod = (who, btn) => {
  const { S } = window;
  if (who === 'p') S.pGod = !S.pGod; else S.aGod = !S.aGod;
  btn.textContent = (who === 'p' ? S.pGod : S.aGod) ? 'ON' : 'OFF';
};

window.changeOpponent = (id) => {
  const { S, AI_CHARACTERS, addLog, updateUI } = window;
  const char = AI_CHARACTERS.find(c => String(c.id) === String(id));
  if (char) {
    S.aiChar = char;
    addLog(`🛠 커스텀: 상대를 ${char.name}(으)로 변경했습니다.`, 'sys');
    updateUI();
  }
};

window.setSpTarget = (who, btn) => {
  window.spawnTarget = who;
  document.getElementById('sp-p').style.background = who === 'p' ? '#300' : '';
  document.getElementById('sp-a').style.background = who === 'a' ? '#300' : '';
};

window.customSpawn = (id) => {
  const { S, ITEMS, updateUI, addLog } = window;
  const it = ITEMS.find(x => x.id === id);
  if (window.spawnTarget === 'p') {
    if (S.pItems.length < 10) S.pItems.push({ ...it });
  } else {
    if (S.aItems.length < 10) S.aItems.push({ ...it });
  }
  updateUI();
  addLog(`🛠 아이템 생성 (${window.spawnTarget === 'p' ? '내' : '상대'}): ${it.name}`, 'sys');
};
