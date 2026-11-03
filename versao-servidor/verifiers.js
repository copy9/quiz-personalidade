// Configuração das redes e funções de verificação.
//
// YouTube: verificação real. O usuário faz login com Google (OAuth, escopo
// youtube.readonly) e a API confirma se ele está inscrito no canal.
//
// Instagram: sem verificação. Após o clique, o servidor libera o resultado
// depois de GATE_WAIT_MS. Não confirma que a pessoa seguiu o perfil.

const GATE_WAIT_MS = 15 * 1000;

const PLATFORMS = {
  youtube: {
    label: 'YouTube',
    gate: 'oauth',
    channelUrl: () => process.env.YOUTUBE_CHANNEL_URL || '',
  },
  instagram: {
    label: 'Instagram',
    gate: 'timer',
    waitMs: GATE_WAIT_MS,
    profileUrl: () => process.env.INSTAGRAM_PROFILE_URL || '',
  },
};

function publicPlatforms() {
  return Object.entries(PLATFORMS).map(([id, p]) => ({
    id,
    label: p.label,
    gate: p.gate,
    profileUrl: id === 'instagram' ? p.profileUrl() : p.channelUrl(),
  }));
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw Object.assign(new Error(`${name} não configurado.`), { status: 500 });
  return v;
}

function youtubeAuthUrl(state) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', requireEnv('GOOGLE_CLIENT_ID'));
  url.searchParams.set('redirect_uri', requireEnv('GOOGLE_REDIRECT_URI'));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.readonly');
  url.searchParams.set('state', state);
  url.searchParams.set('access_type', 'online');
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

// Troca o código de autorização pelo access token. O token é usado uma vez
// e não é guardado.
async function exchangeYoutubeCode(code) {
  const body = new URLSearchParams({
    code,
    client_id: requireEnv('GOOGLE_CLIENT_ID'),
    client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
    redirect_uri: requireEnv('GOOGLE_REDIRECT_URI'),
    grant_type: 'authorization_code',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw Object.assign(new Error('Falha ao autenticar no Google.'), { status: 502 });
  const data = await res.json();
  return data.access_token;
}

// Consulta se o usuário está inscrito no canal configurado.
async function checkYouTubeSubscription(accessToken) {
  const channelId = requireEnv('YOUTUBE_CHANNEL_ID');
  const url = new URL('https://www.googleapis.com/youtube/v3/subscriptions');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('mine', 'true');
  url.searchParams.set('forChannelId', channelId);

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw Object.assign(new Error('Não foi possível consultar o YouTube.'), { status: 502 });
  const data = await res.json();
  return Array.isArray(data.items) && data.items.length > 0;
}

module.exports = {
  GATE_WAIT_MS,
  PLATFORMS,
  publicPlatforms,
  youtubeAuthUrl,
  exchangeYoutubeCode,
  checkYouTubeSubscription,
};
