// ════════════════════════════════════════
// DATA & CONFIG MODULE
// ════════════════════════════════════════

export let AI_CHARACTERS = [];

export const ITEMS = [
  { id: 'double_sword', name: '양날검', e: '⚔️', w: 3 },
  { id: 'knife', name: '칼', e: '🔪', w: 5 },
  { id: 'handcuffs', name: '수갑', e: '⛓️', w: 3 },
  { id: 'rotten_drug', name: '썩은 약', e: '💊', w: 4 },
  { id: 'poison_dagger', name: '독단검', e: '🗡️', w: 3 },
  { id: 'drugs', name: '마약', e: '💉', w: 2 },
  { id: 'hack_tool', name: '해킹 툴', e: '💻', w: 2 },
  { id: 'steroid', name: '스테로이드', e: '💪', w: 3 },
  { id: 'blood_pack', name: '수혈팩', e: '🩸', w: 1 },
  { id: 'blanket', name: '이불', e: '🛌', w: 1 },
  { id: 'incap', name: '무능', e: '⭕', w: 0 },
];

export const TOTAL_W = ITEMS.reduce((s, i) => s + i.w, 0);

export const ACH_DEF = [
  { id: 'first_blood', name: '첫 피', e: '🩸', desc: '첫 번째 승리를 거둔다.' },
  { id: 'barely', name: '기적의 생존자', e: '💀', desc: '체력 1로 승리한다.' },
  { id: 'comeback', name: '기사회생', e: '❤️‍🔥', desc: '체력 1에서 회복 후 승리한다.' },
  { id: 'win_streak', name: '연승의 신화', e: '🔥', desc: '5연승을 달성한다.' },
  { id: 'hell_mode', name: '지옥의 왕', e: '👑', desc: '최고 난이도(0%)에서 승리한다.' },
  { id: 'quick_win', name: '속전속결', e: '⚡', desc: '10턴 이내에 승리한다.' },
  { id: 'survivor', name: '생존의 달인', e: '🛡️', desc: '총 10번 승리한다.' },
  { id: 'mastermind', name: '전략의 귀재', e: '🧠', desc: '10% 이하 난이도에서 3번 승리한다.' },
  { id: 'poison_master', name: '독의 전도사', e: '🗡️', desc: '독단검을 합산 20번 사용한다.' },
  { id: 'mad_doctor', name: '미친 의사', e: '⚗️', desc: '썩은 약을 합산 10번 사용한다.' },
  { id: 'hacker', name: '그레이 햇', e: '💻', desc: '해킹 툴을 합산 10번 사용한다.' },
  { id: 'shackler', name: '속박의 제왕', e: '⛓️', desc: '수갑을 합산 15번 사용한다.' },
  { id: 'junkie', name: '마약쟁이', e: '💉', desc: '마약을 합산 10번 사용한다.' },
  { id: 'blood_addict', name: '수혈 중독', e: '🩹', desc: '수혈팩을 합산 10번 사용한다.' },
  { id: 'roid_rage', name: '근육 바보', e: '💪', desc: '스테로이드 사용 중 합산 10번 사용한다.' },
  { id: 'gambler', name: '도박사', e: '🎰', desc: '한 게임에서 양날검을 10번 이상 사용한다.' },
  { id: 'lucky_triple', name: '럭키 트리플', e: '🍀', desc: '독단검 맹독을 한 게임에 3번 발동한다.' },
  { id: 'shackled_play', name: '속박 플레이', e: '⛓️', desc: '한 턴에 수갑을 3번 연속 사용한다.' },
  { id: 'poison_addict', name: '비소 중독자', e: '🗡️', desc: '한 게임에서 독단검을 5번 이상 사용한다.' },
  { id: 'overdose', name: '과다복용', e: '💊', desc: '스테로이드 사용 중 최대 체력이 0이 되어 사망한다.' },
];

export const LINES = {
  double_sword: {
    p: ['"날의 운명은 둘 중 하나야... 네 것이냐, 내 것이냐."', '"아무도 몰라. 피가 어디로 튈지."', '"위험하다고? 그게 핵심이잖아."'],
    a: ['《AI: 확률을 계산합니다.》', '《AI: 위험을 감수합니다.》'],
    hit3: '"세 방울의 피가 흘렀다. 완벽한 일격."', hit2: '"두 배의 고통을 선사한다."', self: '"...이런. 날이 내 쪽으로 돌아왔다."'
  },
  knife: {
    p: ['"흔한 칼 하나. 하지만 살은 베인다."', '"너무 생각하지 마. 그냥 찌를 뿐이야."', '"초라하지만, 충분해."'],
    a: ['《AI: 칼을 사용합니다.》'], hit: '"칼날이 살을 가른다."'
  },
  handcuffs: {
    p: ['"딸깍. 이제 네 차례는 없어."', '"움직이지 마. 잠깐이면 돼."', '"자유가 얼마나 소중한지 느껴봐."'],
    a: ['《AI: 당신을 속박합니다.》', '《AI: 행동을 제한합니다.》']
  },
  rotten_drug: {
    p: ['"맛이 이상한데... 뭐가 들었는지 모르겠어."', '"독인지 약인지도 모를 걸 삼킨다."', '"에라 모르겠다. 마신다."'],
    a: ['《AI: 약물을 투여합니다.》'], good: '"오, 효과가 있어."', bad: '"...역시 이건 아닌 것 같은데."'
  },
  poison_dagger: {
    p: ['"이 검에 뭐가 발려있는지 나도 몰라."', '"독단검 — 이름부터가 위험하다."', '"운명이 결정한다. 나는 그저 찌를 뿐."'],
    a: ['《AI: 독단검을 사용합니다.》'],
    e1: '"독이 퍼지며... 뭔가 이상해진다."', e2: '"이 맹독은 심장까지 닿는다. 즉시 효과다."', e3: '"서서히... 천천히... 독이 흐르기 시작한다."'
  },
  drugs: {
    p: ['"세상이 흐릿해진다. 하지만 지금은 더 잘 보여."', '"머릿속이 타오른다. 손이 떨리지 않는다."', '"위험한 선택이지만, 지금은 더 많은 게 필요해."'],
    a: ['《AI: 최대 행동력을 발휘합니다.》']
  },
  hack_tool: {
    p: ['"네 것이 내 것. 이게 해킹의 매력이야."', '"방화벽? 그런 거 없어."', '"1초면 충분해."'],
    a: ['《AI: 아이템을 탈취합니다.》']
  },
  steroid: {
    p: ['"근육이 타오른다. 하지만 이 쾌감에는 대가가 있어."', '"지금 당장은 살아있다는 느낌이 들어."', '"짧고 굵게. 그게 내 방식이야."'],
    a: ['《AI: 체력을 강화합니다.》']
  },
  blood_pack: {
    p: ['"피가 돌기 시작한다. 조금씩, 조금씩."', '"수혈은 시간이 필요해. 기다려."', '"생명이 다시 흐른다."'],
    a: ['《AI: 지속 회복을 활성화합니다.》']
  }
};

export const TRAITS = [
  { id: 'undead', name: '불사자', e: '💀', cost: 1000, desc: '체력이 0이 될 때 최대 체력이 절반이 되며 부활합니다. (최대 체력이 1일 때 사망)' },
  { id: 'iron_skin', name: '강철 피부', e: '🛡️', cost: 150, desc: '모든 피해가 1 감소합니다. (최소 피해 1)' },
  { id: 'poison_master', name: '독의 군주', e: '🐍', cost: 100, desc: '중독 데미지에 면역이 됩니다.' },
  { id: 'berserker', name: '광전사', e: '🪓', cost: 250, desc: '누적 피해 15당 공격력+1, 최대HP+1. 대신 받는 피해가 1 증가합니다.' },
  { id: 'vampire', name: '흡혈귀', e: '🧛', cost: 200, desc: '가한 피해의 20%만큼 체력을 회복합니다.' },
  { id: 'alchemist', name: '연금술사', e: '⚗️', cost: 80, desc: '썩은 약이 더 이상 자신에게 데미지를 입히지 않습니다.' },
  { id: 'thorn_mail', name: '가시 갑옷', e: '🌵', cost: 120, desc: '직접 공격을 받을 때 공격자에게 1의 반사 피해를 줍니다.' },
  { id: 'sharpshooter', name: '저격수', e: '🎯', cost: 70, desc: '칼의 데미지가 1에서 2로 증가합니다.' },
  { id: 'steady_hand', name: '침착한 손', e: '✋', cost: 150, desc: '양날검의 자해 확률이 절반으로 감소합니다.' },
  { id: 'regenerator', name: '재생가', e: '🌱', cost: 180, desc: '매 5턴마다 체력을 1 회복합니다.' },
  { id: 'tactician', name: '전술가', e: '🧠', cost: 200, desc: '수갑의 지속 시간이 2턴으로 증가합니다.' },
  { id: 'shadow', name: '그림자', e: '👤', cost: 300, desc: '20% 확률로 모든 직접 피해를 회피합니다.' },
  { id: 'blood_thirsty', name: '피에 굶주린', e: '🩸', cost: 150, ach: 'survivor', desc: '상대의 체력이 5 이하일 때 데미지가 1 증가합니다. (업적: 생존의 달인 필요)' },
  { id: 'lucky_seven', name: '럭키 세븐', e: '🎰', cost: 777, ach: 'lucky_triple', desc: '7턴마다 무작위 이로운 효과를 얻습니다. (업적: 럭키 트리플 필요)' }
];

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

export function clkTick() {
  const n = new Date();
  const el = document.getElementById('clk');
  if (el) el.textContent = n.getHours().toString().padStart(2, '0') + ':' + n.getMinutes().toString().padStart(2, '0');
}

export function setFontSize(scale) {
  document.documentElement.style.setProperty('--f-scale', scale);
  localStorage.setItem('fontScale', scale);
}
