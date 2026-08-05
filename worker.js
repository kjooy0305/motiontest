// ─────────────────────────────────────────────────────────────
//  onlinetest – Cloudflare Worker
//  환경 변수: KAKAO_REST_KEY
//  KV 바인딩: STATE_KV
// ─────────────────────────────────────────────────────────────

const HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>실시간 버튼</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100dvh;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 28px;
      background: #7f8c8d;
      transition: background .2s;
      font-family: 'Apple SD Gothic Neo', sans-serif;
    }
    body.red   { background: #c0392b; }
    body.green { background: #27ae60; }

    #status {
      color: rgba(255,255,255,.9);
      font-size: 20px; font-weight: 700;
      text-align: center;
    }
    #btn {
      width: 220px; height: 220px;
      border-radius: 50%;
      border: 4px solid rgba(255,255,255,.5);
      background: rgba(255,255,255,.15);
      color: #fff;
      font-size: 18px; font-weight: 700;
      cursor: pointer;
      touch-action: none;
      user-select: none; -webkit-user-select: none;
      transition: transform .1s, background .1s;
      outline: none;
    }
    #btn.on { background: rgba(255,255,255,.35); transform: scale(.94); }
    #info { color: rgba(255,255,255,.6); font-size: 13px; }

    /* 로그인 */
    #login {
      display: flex; flex-direction: column;
      align-items: center; gap: 20px;
    }
    #login h1 { color: #fff; font-size: 22px; }
    #login p  { color: rgba(255,255,255,.8); font-size: 14px; text-align: center; line-height: 1.6; }
    #kakao-btn {
      display: flex; align-items: center; gap: 8px;
      background: #FEE500; color: #000;
      border: none; border-radius: 10px;
      padding: 13px 26px;
      font-size: 16px; font-weight: 700; cursor: pointer;
    }
    #app { display: none; flex-direction: column; align-items: center; gap: 28px; }
  </style>
</head>
<body id="body">

  <div id="login">
    <h1>🔴 실시간 버튼</h1>
    <p>같은 카카오 계정으로 두 기기에서 로그인 후<br>둘 다 버튼을 누르고 있으면 초록으로 바뀝니다.</p>
    <button id="kakao-btn" onclick="kakaoLogin()">
      <img src="https://t1.kakaocdn.net/kakao_for_business/favicon/kakaobusiness.ico"
           width="20" height="20" style="border-radius:4px" alt="">
      카카오로 로그인
    </button>
  </div>

  <div id="app">
    <div id="status">연결 중...</div>
    <button id="btn">누르고<br>있어!</button>
    <div id="info"></div>
  </div>

  <script>
    const DEVICE_KEY  = 'rtbtn_device';
    const SESSION_KEY = 'rtbtn_session';

    if (!localStorage.getItem(DEVICE_KEY))
      localStorage.setItem(DEVICE_KEY, 'dev_' + crypto.randomUUID());

    const deviceId = localStorage.getItem(DEVICE_KEY);

    // OAuth 콜백에서 session 수신
    const sp = new URLSearchParams(location.search);
    if (sp.get('session')) {
      localStorage.setItem(SESSION_KEY, sp.get('session'));
      history.replaceState({}, '', '/');
    }
    const sessionId = localStorage.getItem(SESSION_KEY);

    function kakaoLogin() { location.href = '/api/auth/kakao'; }

    async function init() {
      if (!sessionId) return;
      const r = await fetch('/api/state?session=' + sessionId + '&device=' + deviceId).catch(() => null);
      if (!r || r.status === 401) { localStorage.removeItem(SESSION_KEY); return; }
      document.getElementById('login').style.display = 'none';
      document.getElementById('app').style.display   = 'flex';
      setupButton();
      startPolling();
    }

    // ── 버튼 ─────────────────────────────────────────
    let pressed = false;

    function setupButton() {
      const btn = document.getElementById('btn');
      const dn = () => { pressed = true;  btn.classList.add('on');    write(); };
      const up = () => { pressed = false; btn.classList.remove('on'); write(); };
      btn.addEventListener('mousedown',   dn);
      btn.addEventListener('mouseup',     up);
      btn.addEventListener('mouseleave',  up);
      btn.addEventListener('touchstart',  e => { e.preventDefault(); dn(); }, {passive:false});
      btn.addEventListener('touchend',    e => { e.preventDefault(); up(); }, {passive:false});
      btn.addEventListener('touchcancel', e => { e.preventDefault(); up(); }, {passive:false});
    }

    async function write() {
      await fetch('/api/state', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({session: sessionId, device: deviceId, pressed})
      }).catch(() => {});
    }

    // ── 폴링 (500ms) + 하트비트 (5초) ───────────────
    function startPolling() {
      write(); // 초기 등록
      setInterval(write, 5000); // 하트비트: 기기 활성 유지
      setInterval(async () => {
        const r = await fetch('/api/state?session=' + sessionId + '&device=' + deviceId).catch(() => null);
        if (!r) return;
        if (r.status === 401) { localStorage.removeItem(SESSION_KEY); location.reload(); return; }
        const d = await r.json();
        render(d);
      }, 500);
    }

    function render({deviceCount, pressedCount, allPressed}) {
      const body   = document.getElementById('body');
      const status = document.getElementById('status');
      const info   = document.getElementById('info');
      info.textContent = '연결 기기: ' + deviceCount + '개  |  누름: ' + pressedCount + '개';
      if (deviceCount < 2) {
        body.className = '';
        status.textContent = '⏳ 다른 기기 연결 대기 중...';
      } else if (allPressed) {
        body.className = 'green';
        status.textContent = '🟢 모두 누르고 있음!';
      } else {
        body.className = 'red';
        status.textContent = '🔴 버튼을 누르고 있어!';
      }
    }

    init();
  </script>
</body>
</html>`;

// ─── 라우터 ───────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;

    if (path === '/')                   return serveHTML();
    if (path === '/api/auth/kakao')     return kakaoRedirect(request, env);
    if (path === '/api/auth/callback')  return kakaoCallback(request, env);
    if (path === '/api/state') {
      if (request.method === 'POST')    return postState(request, env);
      return getState(request, env);
    }
    return new Response('Not Found', { status: 404 });
  },
};

function serveHTML() {
  return new Response(HTML, { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
}

// ─── 카카오 OAuth ─────────────────────────────────────────────
function kakaoRedirect(request, env) {
  const origin      = new URL(request.url).origin;
  const redirectUri = origin + '/api/auth/callback';
  const dest        = 'https://kauth.kakao.com/oauth/authorize'
    + '?client_id='    + env.KAKAO_REST_KEY
    + '&redirect_uri=' + encodeURIComponent(redirectUri)
    + '&response_type=code';
  return Response.redirect(dest, 302);
}

async function kakaoCallback(request, env) {
  const url         = new URL(request.url);
  const code        = url.searchParams.get('code');
  const redirectUri = url.origin + '/api/auth/callback';

  if (!code) return new Response('code 없음', { status: 400 });

  // 1) 액세스 토큰 교환
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:   'authorization_code',
      client_id:    env.KAKAO_REST_KEY,
      redirect_uri: redirectUri,
      code,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token)
    return new Response('토큰 실패: ' + JSON.stringify(tokenData), { status: 400 });

  // 2) 카카오 사용자 ID 조회
  const userRes  = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: 'Bearer ' + tokenData.access_token },
  });
  const userData = await userRes.json();
  const kakaoId  = String(userData.id);

  // 3) 세션 생성 → KV 저장 (7일)
  const sessionId = crypto.randomUUID();
  await env.STATE_KV.put('session_' + sessionId, kakaoId, { expirationTtl: 604800 });

  return Response.redirect(url.origin + '/?session=' + sessionId, 302);
}

// ─── 상태 읽기 (GET) ──────────────────────────────────────────
async function getState(request, env) {
  const url     = new URL(request.url);
  const session = url.searchParams.get('session');

  const kakaoId = await env.STATE_KV.get('session_' + session);
  if (!kakaoId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const raw   = await env.STATE_KV.get('state_' + kakaoId);
  const state = raw ? JSON.parse(raw) : { devices: {} };

  return Response.json(calcState(state));
}

// ─── 상태 쓰기 (POST) ─────────────────────────────────────────
async function postState(request, env) {
  const { session, device, pressed } = await request.json();

  const kakaoId = await env.STATE_KV.get('session_' + session);
  if (!kakaoId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const key   = 'state_' + kakaoId;
  const raw   = await env.STATE_KV.get(key);
  const state = raw ? JSON.parse(raw) : { devices: {} };

  const now = Date.now();
  state.devices[device] = { pressed: !!pressed, lastSeen: now };

  // 10초 이상 응답 없는 기기 제거
  for (const [id, d] of Object.entries(state.devices))
    if (now - d.lastSeen > 10000) delete state.devices[id];

  await env.STATE_KV.put(key, JSON.stringify(state), { expirationTtl: 30 });

  return Response.json(calcState(state));
}

// ─── 상태 계산 ───────────────────────────────────────────────
function calcState(state) {
  const now    = Date.now();
  const active = Object.values(state.devices).filter(d => now - d.lastSeen < 10000);
  const deviceCount  = active.length;
  const pressedCount = active.filter(d => d.pressed).length;
  return {
    deviceCount,
    pressedCount,
    allPressed: deviceCount >= 2 && pressedCount === deviceCount,
  };
}
