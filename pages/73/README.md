# MythicCraft 공식 플러그인 통합 위키 (테스트 73)

MythicCraft 공식 위키(<https://git.mythiccraft.io/mythiccraft>)의 저장소 11개에서
문서를 내려받아 **전문을 한국어로 옮기고** 한 페이지에서 검색·열람할 수 있게 재구성한 정적 위키입니다.

## 다루는 플러그인

| 플러그인 | 원본 저장소 |
|---|---|
| MythicMobs | `mythiccraft/MythicMobs` |
| ModelEngine 4 | `mythiccraft/model-engine-4` (+ 레거시 `mythiccraft/modelengine`) |
| MythicCrucible | `mythiccraft/mythiccrucible` |
| MythicDungeons | `mythiccraft/MythicDungeons` |
| MythicRPG | `mythiccraft/mythicrpg` |
| MythicEnchantments | `mythiccraft/mythicenchants` |
| MythicHUD | `mythiccraft/mythichud` |
| MythicCosmetics | `mythiccraft/mythiccosmetics` |
| MythicArmors | `mythiccraft/mythicarmors` |
| MythicAchievements | `mythiccraft/mythicachievements` |

## 번역 방침

- 설명문·표의 설명 열·제목 등 **읽는 글은 모두 한국어**로 옮겼습니다.
- 아래는 실제로 설정 파일에 입력하는 값이므로 **원문 그대로** 둡니다.
  - 코드 블록 전체 (YAML 예시)
  - 속성/설정 키 이름 — `amount`, `ignoreArmor`, `MovementSpeed` …
  - 메카닉·조건·타게터·트리거 이름 — `projectile`, `@PIR`, `~onTimer`, `?health` …
  - 열거값·상수 — `true`, `false`, `NORMAL`, `PLAYERS_ONLY` …
  - 플러그인·클래스·경로·URL
- 우측 상단 **원문 EN** 버튼으로 영문 원문과 즉시 전환할 수 있습니다 (선택은 저장됨).

## 파일 구조

```
index.html        UI 셸 (스타일 포함)
app.js            뷰어 로직 — 탭·검색·라우팅·YAML 하이라이트·원문 토글
data/index.js     전체 문서 색인 (이름·별칭·분류·요약·청크 번호)
data/c0..cN.js    한국어 본문 — 필요한 청크만 지연 로드
data/o0..oN.js    영문 원문 본문 — 원문 모드일 때만 지연 로드
data/ko*.js       항목별 한글 한 줄 요약 사전 (손으로 작성)
```

## 유의사항

- 스냅샷 시점: 2026-08-17. 플러그인 업데이트에 따라 원문이 달라질 수 있습니다.
- 각 문서 상단의 **공식 위키** 링크로 최신 원문을 확인할 수 있습니다.
- 홈 화면의 가이드·치트시트와 항목별 한 줄 요약은 직접 작성한 내용입니다.
