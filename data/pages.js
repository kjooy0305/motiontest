/**
 * pages.js — 페이지 목록 설정
 *
 * 새 항목 추가 방법:
 *   번호: {
 *     label : '버튼에 표시할 이름',
 *     url   : '임베드할 사이트 URL (없으면 null)',
 *     thumb : '썸네일 이미지 경로 (없으면 null)',
 *              예) 'assets/images/thumbnails/1.png'
 *     desc  : '버튼 아래 작은 설명 (없으면 null)',
 *   },
 *
 * url이 null이면 빈 페이지, url이 있으면 iframe으로 임베드됩니다.
 * 번호가 없는 항목은 자동으로 '테스트 N'으로 표시됩니다.
 */

const PAGES = {
  1: {
    label : '콘웨이의 생명실험',
    url   : 'pages/1/',
    thumb : null,
    desc  : '셀룰러 오토마타 시뮬레이션',
  },
  2: {
    label : '러시안 룰렛 실패 버전',
    url   : 'pages/2/',
    thumb : null,
    desc  : null,
  },
  3: {
    label : '마지막 하루',
    url   : 'pages/3/',
    thumb : null,
    desc  : '텍스트 던전 · 좀비 아포칼립스',
  },
  4: {
    label : '카카오 지도',
    url   : 'pages/4/',
    thumb : null,
    desc  : '장소 검색 · 마커 · 현재 위치',
  },

  5: {
    label : '아이콘 목록',
    url   : 'pages/5/',
    thumb : null,
    desc  : 'Lucide 아이콘 27종 · 이름 및 사용처',
  },
  6: {
    label : '러시안 룰렛',
    url   : 'pages/6/',
    thumb : null,
    desc  : '6연발 리볼버 · SVG 그래픽',
  },

  7: {
    label : '숫자 도박',
    url   : 'pages/7/',
    thumb : null,
    desc  : '높을지 · 낮을지 · 같을지 — 1~10 숫자 베팅',
  },

  8: {
    label : '랜덤 미로',
    url   : 'pages/8/',
    thumb : null,
    desc  : '랜덤 생성 · 벽 충돌 시 리셋 · 키/마우스/터치',
  },

  9: {
    label : 'AI 미로 탈출',
    url   : 'pages/9/',
    thumb : null,
    desc  : 'BFS · DFS · A* · 벽따라가기 · 랜덤 탐색 시각화',
  },

  11: {
    label : '브라이언의 뇌',
    url   : 'pages/11/',
    thumb : null,
    desc  : '3상태 셀룰러 오토마타 · 신경세포 발화 시뮬레이션',
  },

  13: {
    label : '타자 펑!',
    url   : 'pages/13/',
    thumb : null,
    desc  : '키보드를 치면 글자가 튀어나왔다가 펑! 하고 사라짐',
  },

  12: {
    label : '딥러닝의 원리',
    url   : 'pages/12/',
    thumb : null,
    desc  : '순전파 · 역전파 · 활성화 함수 · 학습 과정 시각화',
  },

  15: {
    label : '색 물결',
    url   : 'pages/15/',
    thumb : null,
    desc  : '클릭한 지점에서 새 색이 물결처럼 퍼져 배경을 바꿈',
  },

  14: {
    label : '폭죽 불꽃놀이',
    url   : 'pages/14/',
    thumb : null,
    desc  : '클릭 위치에 로켓이 날아가 터지는 폭죽 · 국화 · 버드나무 · 고리',
  },

  16: {
    label : '반응속도 테스트',
    url   : 'pages/16/',
    thumb : null,
    desc  : '원 크기·시간 설정 후 원이 사라지기 전에 눌러 반응속도 측정',
  },

  10: {
    label : '출근해야 한다',
    url   : 'pages/10/',
    thumb : null,
    desc  : '괴담 속 탈출기 · 오염·타락·미니게임 · 7개 엔딩',
  },

  17: {
    label : '모의 주식 경매장',
    url   : 'pages/17/',
    thumb : null,
    desc  : '주식 20종 · 뉴스 100개 · 도박 · 구걸 · 은행 · 제한 시간 내 최대 수익',
  },

  18: {
    label : '단축키 모음',
    url   : 'pages/18/',
    thumb : null,
    desc  : '윈도우 & 크롬 전체 단축키 · 카테고리 필터 · 실시간 검색',
  },

  19: {
    label : 'Python 코드 레퍼런스',
    url   : 'pages/19/',
    thumb : null,
    desc  : '문법·내장함수·주요모듈 48종 · 일반·심화·실전 예제 · 실시간 검색',
  },

  20: {
    label : '유니티 가이드',
    url   : 'pages/20/',
    thumb : null,
    desc  : '사용법 · 인터페이스 · 단축키 · 주요 기능 · 스크립팅 정리',
  },

  21: {
    label : 'Godot Engine 정리',
    url   : 'pages/21/',
    thumb : null,
    desc  : 'GDScript · 노드 시스템 · 엔진 기능 · 에디터 단축키 총정리',
  },

  22: {
    label : 'GitHub 정리',
    url   : 'pages/22/',
    thumb : null,
    desc  : '단축키 · 주요 기능 · CLI(gh) 명령어 · 워크플로우 총정리',
  },

  23: {
    label : '코드의 세계',
    url   : 'pages/23/',
    thumb : null,
    desc  : 'HTML·CSS·JS·TS·React·Vue·Python·Go·Java·Rust 등 30종 · 기초·주요기능·실전 코드',
  },

  24: {
    label : '번개 시뮬레이터',
    url   : 'pages/24/',
    thumb : null,
    desc  : '2D 재귀 중점변위 번개 + 빗소리 · 3D Three.js 번개 · 클릭으로 소환',
  },

  25: {
    label : 'DOOM 레이캐스터',
    url   : 'pages/25/',
    thumb : null,
    desc  : '레이캐스팅 FPS · 10마리 처치 후 출구 탈출 · 버그 수정판',
  },

  26: {
    label : 'HTML 완전 정복',
    url   : 'pages/26/',
    thumb : null,
    desc  : '초급·중급·고급 3단계 — 태그 설명·예제·미리보기·검색 포함',
  },

  27: {
    label : '터미널 명령어 정리',
    url   : 'pages/27/',
    thumb : null,
    desc  : '기본·텍스트처리·권한·네트워크·Git·팁 — 설명과 예제 포함',
  },

  28: {
    label : 'R 코드 정리',
    url   : 'pages/28/',
    thumb : null,
    desc  : '기초문법·데이터구조·통계함수·dplyr·ggplot2·실전예제 — 공식과 출력값 포함',
  },

  29: {
    label : '마크 데이터팩',
    url   : 'pages/29/',
    thumb : null,
    desc  : '데이터팩 구조·execute·scoreboard·NBT·파티클·소리·레시피·실전예제 총정리',
  },

  30: {
    label : '떨어지는 모래',
    url   : 'pages/30/',
    thumb : null,
    desc  : '모래 물리 시뮬레이션 · 밀도·소환량 조절 · 밑 열기',
  },

  31: {
    label : '모래시계',
    url   : 'pages/31/',
    thumb : null,
    desc  : '모래시계 타이머 · 시간 자동 분해 · 10가지 테마 · 뒤집기 애니메이션',
  },

  32: {
    label : '마크 리소스팩',
    url   : 'pages/32/',
    thumb : null,
    desc  : '리소스팩 구조·모델·CMD·소리·파티클 전체목록·폰트UI·가능/불가능·맵 제작 기법 총정리',
  },

  33: {
    label : 'Notion 완전 정복',
    url   : 'pages/33/',
    thumb : null,
    desc  : '기능·단축키·DB·AI·학생 활용법·방송 노출 가이드 · Student Plus 기준',
  },

  34: {
    label : '엑셀 완전 정복',
    url   : 'pages/34/',
    thumb : null,
    desc  : '기초·단축키·함수·VLOOKUP/XLOOKUP·피벗·조건부서식·VBA 매크로·실전 수식·오류 해결',
  },

  35: {
    label : '그리스 로마 신화',
    url   : 'pages/35/',
    thumb : null,
    desc  : '올림포스 12신·기타 신들·영웅·신화 이야기·무기·유물·괴물 총정리',
  },

  36: {
    label : '북유럽 신화',
    url   : 'pages/36/',
    thumb : null,
    desc  : '신들·거인·무기·아홉 세계·라그나로크·룬 24자·생명체·원전 총정리',
  },

  37: {
    label : '병합 폭포',
    url   : 'pages/37/',
    thumb : null,
    desc  : '물방울 낙하 시뮬레이션 · 닿으면 병합 · 수면 물결·물보라 · 폭포/비 모드 · 배수',
  },

  38: {
    label : '메소포타미아 신화',
    url   : 'pages/38/',
    thumb : null,
    desc  : '수메르·바빌론 신들·악마·무기·Me·에누마 엘리시·길가메시·저승 하강·생명체 총정리',
  },

  39: {
    label : '3D 바다',
    url   : 'pages/39/',
    thumb : null,
    desc  : '거스너파·사인파·복합파·변칙파·쓰나미 · 스카이박스 · OrbitControls · 시간대 조절',
  },

  40: {
    label : '절차적 맵 생성',
    url   : 'pages/40/',
    thumb : null,
    desc  : '시드 기반 던전(보물·감옥·제단·함정·창고·무기고·보스방)과 야외(마을·묘지·폐허·바위지대) · 에셋 3팩 686칸 전부 사용 · PNG 저장',
  },

  41: {
    label : '이모지 & 특수문자',
    url   : 'pages/41/',
    thumb : null,
    desc  : '표정·동물·음식·카오모지·특수기호 — 터치하면 바로 복사',
  },

  42: {
    label : '마크 커멘드 명령어',
    url   : 'pages/42/',
    thumb : null,
    desc  : '기본·엔티티·아이템·블록·플레이어·점수판·execute·선택자 전체 명령어 총정리',
  },

  43: {
    label : '복셀 입체 게임',
    url   : 'pages/43/',
    thumb : null,
    desc  : '펄린 노이즈 지형 · 블록/듀얼 컨투어링 표면화 · DDA 레이캐스팅 · 다익스트라 · 플로우 필드 · 코너 보정 · Pity 타이머',
  },

  44: {
    label : '빌보드 테스트',
    url   : 'pages/44/',
    thumb : null,
    desc  : '투영면 정렬·시점 지향·축 정렬 3종 비교 · 이미지 업로드 · Three.js',
  },

  45: {
    label : 'BDEngine 완전 정복',
    url   : 'pages/45/',
    thumb : null,
    desc  : 'UI구성·모델링·단축키·애니메이션·내보내기·신기능 — Display Entity 에디터 총정리',
  },

  46: {
    label : 'Axiom 완전 정복',
    url   : 'pages/46/',
    thumb : null,
    desc  : '단축키·빌더도구7종·에디터도구전체·윈도우패널·응용방법 — Fabric 월드에디터 모드 총정리',
  },

  48: {
    label : '텍스트 작성기',
    url   : 'pages/48/',
    thumb : null,
    desc  : '자수 실시간 측정 · 띄어쓰기·줄바꿈 포함 여부 선택 · 단어·문장·단락 통계',
  },

  47: {
    label : 'AI 이미지 생성 완전 정복',
    url   : 'pages/47/',
    thumb : null,
    desc  : '프롬프트 작성법·스타일·구도·조명·품질태그·네거티브·파라미터·모델·용어사전 총정리',
  },

  49: {
    label : 'Suno 완전 정복',
    url   : 'pages/49/',
    thumb : null,
    desc  : 'AI 음악 생성 팁 — 스타일 프롬프트 공식·메타태그 118종·한국어 가사·장르 레시피 16종·문제 해결·요금과 저작권',
  },

  50: {
    label : 'Node.js 완전 정복',
    url   : 'pages/50/',
    thumb : null,
    desc  : '이름의 유래·핵심 개념·내장 모듈·npm·실전 예제·생태계 — 이벤트 루프부터 Express까지',
  },

  51: {
    label : 'Incredibox 완전 정복',
    url   : 'pages/51/',
    thumb : null,
    desc  : '게임 소개·이름 유래·플레이 방법·10개 버전 정리·보너스 조합·팁·Sprunki·커뮤니티',
  },

  52: {
    label : '크툴루 신화 완전 정복',
    url   : 'pages/52/',
    thumb : null,
    desc  : '코즈믹 호러 총정리 — 러브크래프트·외부 신·위대한 고대 존재·신화 속 종족·주요 작품·TRPG·게임·용어 사전',
  },

  54: {
    label : '잔혹 동화 & 일반 동화 대백과',
    url   : 'pages/54/',
    thumb : null,
    desc  : '그림·안데르센·페로·바실레 — 캐릭터·장소·스토리라인·원본 vs 현대 비교·잔혹 요소 사전·작가 총정리',
  },

  53: {
    label : '세계 종교의 악마·천사 대백과',
    url   : 'pages/53/',
    thumb : null,
    desc  : '기독교·유대교·이슬람·조로아스터·힌두·그리스·메소포타미아·이집트·북유럽·일본·에녹서 — 무기·능력·장소·외모·약점 총정리',
  },

  55: {
    label : '인크레디믹스 — 뮤직 믹서',
    url   : 'pages/55/',
    thumb : null,
    desc  : '실제 플레이 가능한 웹 음악 믹서 — 100종 사운드, 16스텝 시퀀서, 장르별 랜덤 생성, 저장 목록 관리(이름 지정·패턴 수정), WAV 음원 내보내기',
  },

  56: {
    label : 'Blender 완전 정복',
    url   : 'pages/56/',
    thumb : null,
    desc  : '인터페이스·워크스페이스·에디트 모드·스컬프트·애니메이션·셰이딩·렌더링·모디파이어·전체 단축키 총정리',
  },

  58: {
    label : 'Zalgo 공포 텍스트 생성기',
    url   : 'pages/58/',
    thumb : null,
    desc  : '한글 완벽 지원 · 글자별 위아래 강도 조절 · 글리치·깜빡임·혈흔 등 공포 효과 10종',
  },

  57: {
    label : '3D 인체 포즈 레퍼런스',
    url   : 'pages/57/',
    thumb : null,
    desc  : '그림 구도용 3D 인체 모형 — 관절 클릭+드래그 자세 조정·남/여/중성 체형·신체 비율 슬라이더·포즈 12종 프리셋·조명·캡쳐',
  },

  61: {
    label : '옵시디언 노트',
    url   : 'pages/61/',
    thumb : null,
    desc  : '마크다운 에디터·위키링크·태그·그래프 보기·단축키 요청하기 — Obsidian 스타일 노트앱',
  },

  60: {
    label : '트럼프 카드 게임 대백과',
    url   : 'pages/60/',
    thumb : null,
    desc  : '52장 1묶음으로 할 수 있는 모든 게임 — 솔리테어·2인·다인·포커 변형 규칙과 예시 총정리',
  },

  59: {
    label : '将棋(쇼기) AI 대전',
    url   : 'pages/59/',
    thumb : null,
    desc  : 'futamoji 기물 · 튜토리얼 20단계 + 詰み 퀴즈 100문제(단계별 힌트·정답 해설) + AI 5단계 · 시간제한 알파-베타 탐색',
  },

  62: {
    label : 'Obsidian 완전 가이드',
    url   : 'pages/62/',
    thumb : null,
    desc  : '핵심 기능·코어 플러그인·인기 커뮤니티 플러그인·단축키 전체·마크다운 문법·PARA·Zettelkasten 워크플로',
  },

  64: {
    label : '프로젝트 문 세계관',
    url   : 'pages/64/',
    thumb : null,
    desc  : '로보토미·루이나·림버스 — 캐릭터·이상존재(기록)·EGO·에고기프트·단체·타임라인·원작 차이점 완전 정리',
  },

  63: {
    label : 'PC 부품 완전 가이드',
    url   : 'pages/63/',
    thumb : null,
    desc  : 'CPU·GPU·RAM·SSD·메인보드·파워·케이스·쿨러 — 초보자 친화 스펙 해설 + 등급 비교 + 가격 추이',
  },

  65: {
    label : 'SCP 재단 세계관',
    url   : 'pages/65/',
    thumb : null,
    desc  : '유명 SCP 50개+·등급 체계·MTF·GOI·O5·안티밈·세계관 설정·종말 시나리오 완전 총정리',
  },

  66: {
    label : '정보 보안 완전 정리',
    url   : 'pages/66/',
    thumb : null,
    desc  : 'CIA삼각형·OWASP Top 10·공격기법·방어기법·암호학(AES/RSA/TLS)·포렌식·도구(Nmap/Burp/Metasploit)·자격증·법규 완전 정리',
  },

  67: {
    label : '소설 작법 완전 가이드',
    url   : 'pages/67/',
    thumb : null,
    desc  : '전투·로맨스·세계관·몬스터 창조·계급 표현·잔잔한 글·역동적 글·괴담·감정/대화/복선/악당 — 장르별 500자+ 예시 수록',
  },

  // 61, 68 ~ 100: 아직 미등록 — 번호 추가 시 위 형식으로 작성
};
