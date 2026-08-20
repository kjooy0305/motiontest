/* ─── 탭 전환 ─────────────────────────────── */
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
    document.querySelectorAll('.sec').forEach(s=>s.classList.remove('on'));
    tab.classList.add('on');
    const s=document.getElementById('sec-'+tab.dataset.tab);
    if(s) s.classList.add('on');
    window.scrollTo(0,0);
  });
});

/* ─── Luau 문법 강조 ───────────────────────── */
const KEYWORDS=['local','function','end','if','then','else','elseif','for','in','do',
  'while','repeat','until','return','break','continue','and','or','not','nil',
  'true','false','type','export','self'];
const GLOBALS=['game','workspace','script','Instance','Enum','task','math','table',
  'string','os','coroutine','debug','utf8','Vector3','Vector2','CFrame','Color3',
  'UDim','UDim2','TweenInfo','Random','DateTime','NumberRange','BrickColor','Font',
  'Region3','RaycastParams','ImageData','print','warn','error','assert','pcall','xpcall',
  'require','tick','typeof','tonumber','tostring','ipairs','pairs','next','select',
  'setmetatable','getmetatable','unpack','rawget','rawset'];

const KW_RE=new RegExp('\\b('+KEYWORDS.join('|')+')\\b','g');
const GL_RE=new RegExp('\\b('+GLOBALS.join('|')+')\\b','g');

function highlight(src){
  // 이미 &lt; 같은 엔티티로 들어오지 않도록 textContent 를 받아 다시 이스케이프한다
  let s=src.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  // 주석·문자열은 먼저 빼둔다 (다른 규칙이 건드리지 못하게)
  const store=[];
  const stash=html=>{
    store.push(html);
    // 사용자 영역 문자 하나로 치환 — 숫자가 없어야 숫자 규칙에 걸리지 않는다
    return String.fromCharCode(0xE000+store.length-1);
  };

  s=s.replace(/--\[\[[\s\S]*?\]\]|--[^\n]*/g, m=>stash('<span class="c">'+m+'</span>'));
  s=s.replace(/"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/g, m=>stash('<span class="s">'+m+'</span>'));

  s=s.replace(GL_RE,'<span class="g">$1</span>');
  s=s.replace(KW_RE,'<span class="k">$1</span>');
  s=s.replace(/\b(\d+\.?\d*)\b/g,'<span class="n">$1</span>');

  // 저장해둔 조각 복원
  s=s.replace(/[\uE000-\uF8FF]/g, ch=>{
    const i=ch.charCodeAt(0)-0xE000;
    return store[i]!==undefined ? store[i] : ch;
  });
  return s;
}

document.querySelectorAll('pre.code').forEach(el=>{
  el.dataset.plain=el.textContent;      // 검색용 원본 보관
  el.innerHTML=highlight(el.textContent);
});

/* ─── 검색 ───────────────────────────────── */
const searchEl=document.getElementById('search');
const hitCnt=document.getElementById('hit-cnt');
let items=[];

function initItems(){
  items=[...document.querySelectorAll('.card,.tbl-wrap,.hi-card,.callout,.gl-i,.code-box,.diag')];
}

function textOf(el){
  // 코드 블록은 강조 마크업 대신 원본 텍스트로 검색한다
  const pre=el.querySelector?.('pre.code');
  const base=el.textContent.toLowerCase();
  return pre&&pre.dataset.plain ? base+' '+pre.dataset.plain.toLowerCase() : base;
}

searchEl.addEventListener('input',function(){
  if(!items.length) initItems();
  const q=this.value.trim().toLowerCase();

  if(!q){
    items.forEach(c=>c.classList.remove('hidden'));
    hitCnt.textContent='';
    document.querySelectorAll('.sec').forEach(s=>s.classList.remove('on'));
    const at=document.querySelector('.tab.on');
    if(at){const s=document.getElementById('sec-'+at.dataset.tab);if(s)s.classList.add('on');}
    return;
  }

  // 검색 중에는 모든 섹션을 펼쳐 결과를 한 번에 보여준다
  document.querySelectorAll('.sec').forEach(s=>s.classList.add('on'));
  let hits=0;
  items.forEach(c=>{
    const match=textOf(c).includes(q);
    c.classList.toggle('hidden',!match);
    if(match) hits++;
  });
  hitCnt.textContent=hits?hits+'개 결과':'결과 없음';
});

initItems();
