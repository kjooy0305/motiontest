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

  // 10, 14, 16 ~ 100: 아직 미등록 — 번호 추가 시 위 형식으로 작성
};
