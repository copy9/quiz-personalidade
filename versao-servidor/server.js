const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { QUESTIONS, RESULTS } = require('./quiz-data');
const {
  PLATFORMS,
  publicPlatforms,
  youtubeAuthUrl,
  exchangeYoutubeCode,
  checkYouTubeSubscription,
} = require('./verifiers');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const DEV_MOCK = process.env.DEV_MOCK_VERIFY === '1';

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// token -> { resultKey, verified, timers: { platform: startedAtMs }, createdAt }
const sessions = new Map();
// oauth state -> { quizToken, createdAt }
const oauthStates = new Map();

function getSession(token) {
  if (typeof token !== 'string') return null;
  const s = sessions.get(token);
  if (!s || Date.now() - s.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    return null;
  }
  return s;
}

setInterval(() => {
  const now = Date.now();
  for (const [token, s] of sessions) {
    if (now - s.createdAt > SESSION_TTL_MS) sessions.delete(token);
  }
  for (const [state, s] of oauthStates) {
    if (now - s.createdAt > OAUTH_STATE_TTL_MS) oauthStates.delete(state);
  }
}, 10 * 60 * 1000).unref();

app.get('/api/quiz', (req, res) => {
  res.json({
    questions: QUESTIONS.map((q) => ({
      text: q.text,
      options: q.options.map((o) => o.label),
    })),
    platforms: publicPlatforms(),
  });
});

app.post('/api/quiz/submit', (req, res) => {
  const { answers } = req.body || {};
  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) {
    return res.status(400).json({ error: 'Respostas incompletas.' });
  }

  const counts = { A: 0, B: 0, C: 0, D: 0 };
  for (let i = 0; i < QUESTIONS.length; i++) {
    const option = QUESTIONS[i].options[answers[i]];
    if (!option) return res.status(400).json({ error: 'Resposta inválida.' });
    counts[option.type]++;
  }
  const resultKey = Object.keys(counts).reduce((a, b) => (counts[b] > counts[a] ? b : a));

  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { resultKey, verified: false, timers: {}, createdAt: Date.now() });
  res.json({ token });
});

// Registra o clique em uma rede de "espera" (Instagram). O cronômetro começa
// no servidor e só começa uma vez, mesmo que a pessoa clique de novo.
app.post('/api/quiz/intent', (req, res) => {
  const { token, platform } = req.body || {};
  const session = getSession(token);
  if (!session) return res.status(404).json({ error: 'Sessão expirada. Refaça o quiz.' });
  const cfg = PLATFORMS[platform];
  if (!cfg || cfg.gate !== 'timer') return res.status(400).json({ error: 'Plataforma inválida.' });

  session.timers[platform] ??= Date.now();
  res.json({ waitMs: cfg.waitMs });
});

// Inicia o login OAuth do YouTube. Em modo de desenvolvimento, desbloqueia direto.
app.get('/auth/youtube', (req, res) => {
  const session = getSession(req.query.token);
  if (!session) return res.redirect('/?error=session');

  if (DEV_MOCK) {
    session.verified = true;
    return res.redirect(`/?token=${encodeURIComponent(req.query.token)}&unlocked=youtube`);
  }

  try {
    const state = crypto.randomBytes(24).toString('hex');
    oauthStates.set(state, { quizToken: req.query.token, createdAt: Date.now() });
    res.redirect(youtubeAuthUrl(state));
  } catch (err) {
    res.status(err.status || 500).send(err.message);
  }
});

// Retorno do Google. O código vira um token, que é usado uma vez para checar a inscrição.
app.get('/auth/youtube/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const pending = typeof state === 'string' ? oauthStates.get(state) : null;
  if (pending) oauthStates.delete(state);

  if (!pending || !getSession(pending.quizToken)) return res.redirect('/?error=session');
  const back = (extra) => res.redirect(`/?token=${encodeURIComponent(pending.quizToken)}&${extra}`);

  if (error || typeof code !== 'string') return back('error=cancelled');

  try {
    const accessToken = await exchangeYoutubeCode(code);
    const subscribed = await checkYouTubeSubscription(accessToken);
    if (!subscribed) return back('error=not_subscribed');
    getSession(pending.quizToken).verified = true;
    back('unlocked=youtube');
  } catch (err) {
    console.error('Falha na verificação do YouTube:', err.message);
    back('error=youtube_failed');
  }
});

// Libera o resultado se: a verificação do YouTube foi concluída, ou
// o tempo de espera do Instagram já passou.
app.get('/api/quiz/result/:token', (req, res) => {
  const session = getSession(req.params.token);
  if (!session) return res.status(404).json({ error: 'Sessão expirada. Refaça o quiz.' });

  const result = RESULTS[session.resultKey];
  if (session.verified) return res.json(result);

  const readyAt = Object.entries(session.timers).map(([id, started]) => started + PLATFORMS[id].waitMs);
  if (readyAt.length === 0) {
    return res.status(403).json({ error: 'Resultado bloqueado. Siga uma das redes para desbloquear.' });
  }

  const earliest = Math.min(...readyAt);
  const now = Date.now();
  if (now >= earliest) return res.json(result);

  res.status(403).json({ error: 'Aguarde para liberar o resultado.', retryInMs: earliest - now });
});

app.listen(PORT, () => {
  console.log(`Quiz rodando em http://localhost:${PORT}`);
  if (DEV_MOCK) {
    console.warn('ATENÇÃO: DEV_MOCK_VERIFY ativo. O YouTube é desbloqueado sem login. Não use em produção.');
  }
});
