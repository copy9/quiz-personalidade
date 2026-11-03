(() => {
  const state = { questions: [], platforms: [], answers: [], current: 0, token: null, retryTimer: null };
  const TOKEN_KEY = 'quizToken';
  const $ = (id) => document.getElementById(id);
  const screens = ['intro', 'quiz', 'gate', 'result'];

  const ERRORS = {
    not_subscribed: 'Não encontramos sua inscrição no canal. Inscreva-se e tente de novo.',
    youtube_failed: 'Não conseguimos verificar sua conta do YouTube. Tente novamente.',
    cancelled: 'Login cancelado. Tente de novo para ver o resultado.',
    session: 'Sessão expirada. Refaça o quiz.',
  };

  function show(name) {
    screens.forEach((s) => $(`screen-${s}`).classList.toggle('active', s === name));
  }

  function setGateMsg(text, isError = false) {
    const el = $('gate-msg');
    el.textContent = text;
    el.className = isError ? 'error' : 'muted';
  }

  async function api(path, options) {
    const res = await fetch(path, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || 'Erro inesperado.'), { data, status: res.status });
    return data;
  }

  async function loadQuiz() {
    const data = await api('/api/quiz');
    state.questions = data.questions;
    state.platforms = data.platforms;
  }

  function renderQuestion() {
    const q = state.questions[state.current];
    $('progress').textContent = `Pergunta ${state.current + 1} de ${state.questions.length}`;
    $('question-text').textContent = q.text;

    const box = $('options');
    box.replaceChildren();
    q.options.forEach((label, index) => {
      const btn = document.createElement('button');
      btn.className = 'option';
      btn.textContent = label;
      btn.addEventListener('click', () => answer(index));
      box.appendChild(btn);
    });
  }

  function answer(index) {
    state.answers.push(index);
    state.current++;
    if (state.current < state.questions.length) {
      renderQuestion();
    } else {
      submit();
    }
  }

  async function submit() {
    try {
      const data = await api('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: state.answers }),
      });
      state.token = data.token;
      sessionStorage.setItem(TOKEN_KEY, data.token);
      renderGate();
      show('gate');
      setGateMsg('Siga uma das redes e depois volte para ver o resultado.');
    } catch (err) {
      alert(err.message);
    }
  }

  function renderGate() {
    const list = $('platforms');
    list.replaceChildren();

    state.platforms.forEach((p) => {
      if (p.gate === 'oauth') {
        // YouTube: primeiro inscrever-se no canal, depois verificar com login.
        if (p.profileUrl) {
          const follow = document.createElement('a');
          follow.className = 'btn';
          follow.textContent = `Inscrever-se no ${p.label}`;
          follow.href = p.profileUrl;
          follow.target = '_blank';
          follow.rel = 'noopener noreferrer';
          list.appendChild(follow);
        }
        const verify = document.createElement('a');
        verify.className = 'btn primary';
        verify.textContent = `Já me inscrevi: verificar com ${p.label}`;
        verify.href = `/auth/youtube?token=${encodeURIComponent(state.token)}`;
        list.appendChild(verify);
      } else {
        // Instagram: abre o perfil em nova aba e inicia o cronômetro no servidor.
        const link = document.createElement('a');
        link.className = 'btn primary';
        link.textContent = `Seguir no ${p.label}`;
        link.href = p.profileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.addEventListener('click', () => startWait(p.id));
        list.appendChild(link);
      }
    });
  }

  // Não bloqueia a abertura da rede: o clique segue normalmente.
  async function startWait(platform) {
    try {
      await api('/api/quiz/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: state.token, platform }),
      });
      setGateMsg('Depois de seguir, volte para esta página. O resultado libera automaticamente.');
    } catch (err) {
      setGateMsg(err.message, true);
    }
  }

  async function tryResult() {
    if (!state.token || !$('screen-gate').classList.contains('active')) return;
    clearTimeout(state.retryTimer);
    try {
      const result = await api(`/api/quiz/result/${encodeURIComponent(state.token)}`);
      $('result-title').textContent = result.title;
      $('result-text').textContent = result.text;
      show('result');
    } catch (err) {
      if (err.data && err.data.retryInMs) {
        setGateMsg(`Quase lá! Aguarde ${Math.ceil(err.data.retryInMs / 1000)} segundos...`);
        state.retryTimer = setTimeout(tryResult, err.data.retryInMs + 300);
      } else {
        setGateMsg(err.message, true);
      }
    }
  }

  function restart() {
    state.answers = [];
    state.current = 0;
    state.token = null;
    sessionStorage.removeItem(TOKEN_KEY);
    show('intro');
  }

  // Ao reabrir a página, após o login do YouTube ou depois de seguir no Instagram,
  // verifica o resultado de novo.
  function onReturn() {
    if (document.visibilityState === 'visible') tryResult();
  }

  async function init() {
    await loadQuiz();

    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    const error = params.get('error');
    const unlocked = params.get('unlocked');
    if (urlToken || error) history.replaceState(null, '', location.pathname);

    const token = urlToken || sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;

    state.token = token;
    sessionStorage.setItem(TOKEN_KEY, token);
    renderGate();
    show('gate');

    if (error) {
      setGateMsg(ERRORS[error] || 'Não foi possível verificar. Tente novamente.', true);
      if (error === 'session') restart();
      return;
    }
    if (unlocked) setGateMsg('Inscrição confirmada!');
    tryResult();
  }

  $('btn-start').addEventListener('click', () => {
    state.answers = [];
    state.current = 0;
    renderQuestion();
    show('quiz');
  });
  $('btn-check').addEventListener('click', tryResult);
  $('btn-restart').addEventListener('click', restart);
  document.addEventListener('visibilitychange', onReturn);
  window.addEventListener('focus', tryResult);

  init().catch((e) => {
    $('btn-start').disabled = true;
    alert(`Não foi possível carregar o quiz: ${e.message}`);
  });
})();
