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
let cards=[];
function initCards(){cards=[...document.querySelectorAll('.card,.tbl-wrap,.hi-card,.callout,.pq')];}
searchEl.addEventListener('input',function(){
  if(!cards.length) initCards();
  const q=this.value.trim().toLowerCase();
  if(!q){
    cards.forEach(c=>c.classList.remove('hidden'));
    hitCnt.textContent='';
    document.querySelectorAll('.sec').forEach(s=>s.classList.remove('on'));
    const at=document.querySelector('.tab.on');
    if(at){const s=document.getElementById('sec-'+at.dataset.tab);if(s)s.classList.add('on');}
    return;
  }
  document.querySelectorAll('.sec').forEach(s=>{if(s.id!=='sec-quiz')s.classList.add('on');});
  let hits=0;
  cards.forEach(c=>{
    const match=c.textContent.toLowerCase().includes(q);
    c.classList.toggle('hidden',!match);
    if(match) hits++;
  });
  hitCnt.textContent=hits?hits+'개 결과':'결과 없음';
});

/* ─── 실기 예시문제 렌더링 ──────────────────── */
function renderPractical(id,data){
  const wrap=document.getElementById(id);
  if(!wrap||!data) return;
  wrap.innerHTML=data.map((p,i)=>
    `<div class="pq">
      <div class="pq-hd">
        <span class="pq-no">문제 ${i+1}</span>
        <span class="pq-cat">${p.cat}</span>
      </div>
      <div class="pq-q">${p.q}</div>
      <button class="pq-toggle">정답 · 해설 보기</button>
      <div class="pq-a">${p.a}</div>
    </div>`).join('');
  wrap.querySelectorAll('.pq-toggle').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const box=btn.nextElementSibling;
      const open=box.classList.toggle('show');
      btn.textContent=open?'해설 접기':'정답 · 해설 보기';
    });
  });
}
renderPractical('pr2-list',window.PRACTICAL_2);
renderPractical('pr1-list',window.PRACTICAL_1);

/* ─── 퀴즈 엔진 ───────────────────────────── */
const QZ={
  subject:'g2s1',
  list:[],        // 현재 출제 목록
  idx:0,
  answers:{},     // 문제 원본 index -> 고른 보기
  wrongOnly:false
};

const subjSel=document.getElementById('q-subject');
const qArea=document.getElementById('q-area');
const dots=document.getElementById('dots');
const statEl=document.getElementById('quiz-stat');
const progIn=document.getElementById('prog-in');

function pool(){ return (window.QUIZ&&window.QUIZ[QZ.subject])||[]; }

function loadSubject(){
  const p=pool();
  QZ.list=p.map((q,i)=>({q:q,id:i}));
  QZ.idx=0;
  QZ.answers={};
  QZ.wrongOnly=false;
  render();
}

function render(){
  const item=QZ.list[QZ.idx];
  if(!item){
    qArea.innerHTML='<div class="q-card"><div class="q-text">표시할 문제가 없습니다. [초기화]를 눌러 주세요.</div></div>';
    dots.innerHTML='';statEl.textContent='';progIn.style.width='0';
    return;
  }
  const q=item.q;
  const picked=QZ.answers[item.id];
  const done=picked!==undefined;
  qArea.innerHTML=
    `<div class="q-card">
      <div class="q-meta">
        <span class="q-no">${QZ.idx+1} / ${QZ.list.length}</span>
        <span class="q-topic">${q.t||'기본'}</span>
        ${QZ.wrongOnly?'<span class="q-topic">오답 복습 모드</span>':''}
      </div>
      <div class="q-text">${q.q}</div>
      <div id="opts">
        ${q.o.map((o,i)=>{
          let cls='opt';
          if(done){
            cls+=' lock';
            if(i===q.a) cls+=' ok';
            else if(i===picked) cls+=' no';
          }
          return `<div class="${cls}" data-i="${i}"><span class="num">${i+1}</span><span>${o}</span></div>`;
        }).join('')}
      </div>
      <div class="q-exp ${done?'show':''}">
        <b>${done?(picked===q.a?'✅ 정답':'❌ 오답'):''}</b>
        ${done?` — 정답은 <strong>${q.a+1}번</strong>입니다.<br>`:''}
        ${q.e}
      </div>
    </div>`;
  if(!done){
    qArea.querySelectorAll('.opt').forEach(el=>{
      el.addEventListener('click',()=>{
        QZ.answers[item.id]=parseInt(el.dataset.i);
        render();
      });
    });
  }
  renderDots();
  renderStat();
  document.getElementById('q-prev').disabled=QZ.idx===0;
  document.getElementById('q-next').disabled=QZ.idx>=QZ.list.length-1;
}

function renderDots(){
  dots.innerHTML=QZ.list.map((item,i)=>{
    const p=QZ.answers[item.id];
    let cls='';
    if(i===QZ.idx) cls='cur';
    else if(p!==undefined) cls=(p===item.q.a?'ok':'no');
    return `<span class="${cls}" data-i="${i}">${i+1}</span>`;
  }).join('');
  dots.querySelectorAll('span').forEach(el=>{
    el.addEventListener('click',()=>{QZ.idx=parseInt(el.dataset.i);render();});
  });
}

function renderStat(){
  let solved=0,ok=0;
  QZ.list.forEach(item=>{
    const p=QZ.answers[item.id];
    if(p!==undefined){solved++;if(p===item.q.a)ok++;}
  });
  const wrong=solved-ok;
  const rate=solved?Math.round(ok/solved*100):0;
  statEl.innerHTML=`푼 문제 <b>${solved}</b>/${QZ.list.length} · 정답 <b>${ok}</b> · <span class="wr">오답 ${wrong}</span> · 정답률 <b>${rate}%</b>`;
  progIn.style.width=(QZ.list.length?solved/QZ.list.length*100:0)+'%';
}

subjSel.addEventListener('change',()=>{QZ.subject=subjSel.value;loadSubject();});
document.getElementById('q-prev').addEventListener('click',()=>{if(QZ.idx>0){QZ.idx--;render();}});
document.getElementById('q-next').addEventListener('click',()=>{if(QZ.idx<QZ.list.length-1){QZ.idx++;render();}});
document.getElementById('q-go').addEventListener('click',()=>{
  const n=parseInt(document.getElementById('q-jump').value);
  if(n>=1&&n<=QZ.list.length){QZ.idx=n-1;render();}
});
document.getElementById('q-jump').addEventListener('keydown',e=>{
  if(e.key==='Enter') document.getElementById('q-go').click();
});
document.getElementById('q-shuffle').addEventListener('click',()=>{
  for(let i=QZ.list.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [QZ.list[i],QZ.list[j]]=[QZ.list[j],QZ.list[i]];
  }
  QZ.idx=0;render();
});
document.getElementById('q-wrong').addEventListener('click',()=>{
  const p=pool();
  const wrong=p.map((q,i)=>({q:q,id:i})).filter(it=>{
    const a=QZ.answers[it.id];
    return a!==undefined&&a!==it.q.a;
  });
  if(!wrong.length){alert('오답이 없습니다. 먼저 문제를 풀어 보세요.');return;}
  wrong.forEach(it=>{delete QZ.answers[it.id];});
  QZ.list=wrong;QZ.idx=0;QZ.wrongOnly=true;render();
});
document.getElementById('q-reset').addEventListener('click',loadSubject);

loadSubject();
