// 카카오 OAuth 콜백 — code를 받아 토큰 교환 → 세션 생성
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('code 파라미터 없음', { status: 400 });
  }

  const redirectUri = `${url.origin}/api/auth/callback`;

  // 1) 인가 코드 → 액세스 토큰
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.KAKAO_REST_KEY,
      redirect_uri: redirectUri,
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return new Response('토큰 발급 실패: ' + JSON.stringify(tokenData), { status: 400 });
  }

  // 2) 사용자 정보 조회 (카카오 ID 획득)
  const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();
  const kakaoId = String(userData.id);

  // 3) 세션 생성 → KV 저장 (7일 유효)
  const sessionId = crypto.randomUUID();
  await env.STATE_KV.put(`session_${sessionId}`, kakaoId, {
    expirationTtl: 60 * 60 * 24 * 7,
  });

  // 4) 프론트엔드로 리다이렉트 (세션 ID를 쿼리로 전달)
  return Response.redirect(`${url.origin}/?session=${sessionId}`, 302);
}
