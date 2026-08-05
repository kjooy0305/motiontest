// 버튼 상태 동기화 — KV에서 유저별 기기 상태를 읽고 씀
const ACTIVE_MS = 2000; // 2초 내 heartbeat 없으면 기기 오프라인 처리

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  const sessionId = url.searchParams.get('session');
  const deviceId  = url.searchParams.get('device');
  const pressed   = url.searchParams.get('pressed') === 'true';

  // 세션 검증 → 카카오 ID 조회
  const kakaoId = await env.STATE_KV.get(`session_${sessionId}`);
  if (!kakaoId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userKey = `user_${kakaoId}`;
  const now = Date.now();

  // 현재 전체 유저 상태 읽기
  const raw = await env.STATE_KV.get(userKey);
  const state = raw ? JSON.parse(raw) : { devices: {} };

  // 이 기기 상태 업데이트
  state.devices[deviceId] = { pressed, lastSeen: now };

  // 오래된 기기 제거 (10초 이상 응답 없음)
  for (const [id, data] of Object.entries(state.devices)) {
    if (now - data.lastSeen > 10000) delete state.devices[id];
  }

  // KV 저장 (60초 TTL — 모든 기기가 꺼지면 자동 만료)
  await env.STATE_KV.put(userKey, JSON.stringify(state), { expirationTtl: 60 });

  // 활성 기기만 집계 (ACTIVE_MS 내 응답한 기기)
  const active = Object.values(state.devices).filter(d => now - d.lastSeen < ACTIVE_MS);
  const deviceCount  = active.length;
  const pressedCount = active.filter(d => d.pressed).length;
  const allPressed   = deviceCount >= 2 && pressedCount === deviceCount;

  return Response.json({ deviceCount, pressedCount, allPressed });
}
