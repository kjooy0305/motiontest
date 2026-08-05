// 카카오 OAuth 로그인 시작 → 카카오 인증 페이지로 리다이렉트
export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback`;

  const url = new URL('https://kauth.kakao.com/oauth/authorize');
  url.searchParams.set('client_id', env.KAKAO_REST_KEY);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');

  return Response.redirect(url.toString(), 302);
}
