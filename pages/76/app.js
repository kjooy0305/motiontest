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

/* ─── 검색 ───────────────────────────────── */
const searchEl=document.getElementById('search');
const hitCnt=document.getElementById('hit-cnt');
let items=[];

function initItems(){
  // 용어 항목(.gl-i)까지 포함해야 용어 검색이 된다
  items=[...document.querySelectorAll('.card,.tbl-wrap,.hi-card,.callout,.gl-i')];
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
    const match=c.textContent.toLowerCase().includes(q);
    c.classList.toggle('hidden',!match);
    if(match) hits++;
  });
  hitCnt.textContent=hits?hits+'개 결과':'결과 없음';
});

initItems();
