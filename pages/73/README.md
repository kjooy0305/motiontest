# MythicCraft 공식 플러그인 통합 위키 (테스트 73)

MythicCraft 공식 위키(<https://git.mythiccraft.io/mythiccraft>)의 저장소 11개에서
문서를 내려받아 한 페이지에서 검색·열람할 수 있게 재구성한 정적 위키입니다.

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

## 파일 구조

```
index.html        UI 셸 (스타일 포함)
app.js            뷰어 로직 — 탭·검색·라우팅·YAML 하이라이트
data/index.js     전체 문서 색인 (이름·별칭·분류·요약·청크 번호)
data/c0..c15.js   문서 본문 HTML — 탭/문서를 열 때 필요한 청크만 지연 로드
data/ko*.js       항목별 한글 요약 사전 (손으로 작성, 문서의 약 90%)
```

## 유의사항

- 본문은 공식 위키 원문(영문)을 마크다운 → HTML 로 변환한 것입니다.
  각 문서 상단의 **원문 보기** 링크로 최신 원문을 확인할 수 있습니다.
- 한글 요약(`data/ko*.js`)과 홈 화면의 가이드·치트시트는 직접 작성한 내용입니다.
- 스냅샷 시점: 2026-08-17. 플러그인 업데이트에 따라 원문이 달라질 수 있습니다.
