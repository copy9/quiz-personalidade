# Quiz de personalidade (20 perguntas) com gatilho de rede social

Quiz com 20 perguntas. Depois de responder, a pessoa precisa seguir uma das redes para ver o resultado.

## Como funciona

**YouTube (verificado):**
1. A pessoa clica em "Inscrever-se no YouTube" para seguir o canal, se ainda não seguiu.
2. Clica em "Já me inscrevi: verificar com YouTube" e faz login com Google.
3. O servidor troca o código de autorização por um token, usa o token uma vez para consultar a API `subscriptions.list` e descarta o token.
4. Se a pessoa estiver inscrita, o resultado é liberado. Se não, a mensagem pede que ela se inscreva e tente de novo.

**Instagram (gatilho de espera, sem verificação):**
1. A pessoa clica em "Seguir no Instagram". O perfil abre em nova aba.
2. Ao clicar, o servidor registra o horário e começa a contar 15 segundos.
3. Quando a pessoa volta à página, o resultado aparece se os 15 segundos já tiverem passado. Se não tiverem, a página mostra o tempo restante e tenta de novo sozinha.

O cronômetro roda no servidor. Um cronômetro só no navegador poderia ser burlado.

## Limitação importante do Instagram

O gatilho de 15 segundos **não confirma que a pessoa seguiu o perfil**. Quem simplesmente esperar 15 segundos recebe o resultado. Isso é uma escolha de produto, não uma verificação. A API do Instagram não permite checar quem segue uma conta (ver a análise anterior).

Antes de publicar, vale checar as políticas da Meta sobre incentivo a seguidores e as regras do YouTube sobre inscrições exigidas para acesso a conteúdo.

## Configuração do YouTube

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um projeto (gratuito).
2. Ative a **YouTube Data API v3**.
3. Em "Credenciais", crie um **ID do cliente OAuth** do tipo "Aplicativo da Web".
4. Adicione `http://localhost:3000/auth/youtube/callback` (ou sua URL de produção) como URI de redirecionamento.
5. Configure a tela de consentimento. Enquanto o app estiver em modo de teste, só os usuários de teste cadastrados conseguem logar. Para uso público, é preciso submeter o app à verificação do Google.

A consulta usa 1 unidade de quota por verificação, e a cota padrão cobre um volume grande para um quiz.

## Rodando localmente

```bash
npm install
npm start            # produção: OAuth real com o YouTube
npm run start:dev    # desenvolvimento: desbloqueia o YouTube sem login (DEV_MOCK_VERIFY=1)
```

Abra http://localhost:3000.

## Variáveis de ambiente

| Variável | Uso |
|---|---|
| `PORT` | Porta do servidor (padrão 3000) |
| `GOOGLE_CLIENT_ID` | ID do cliente OAuth |
| `GOOGLE_CLIENT_SECRET` | Segredo do cliente OAuth (nunca vai para o navegador) |
| `GOOGLE_REDIRECT_URI` | URL de callback, igual à cadastrada no Google Cloud |
| `YOUTUBE_CHANNEL_ID` | ID do canal do criador (começa com `UC`) |
| `YOUTUBE_CHANNEL_URL` | Link do canal, usado no botão de inscrição |
| `INSTAGRAM_PROFILE_URL` | Link do perfil do Instagram |
| `DEV_MOCK_VERIFY=1` | Desbloqueia o YouTube sem login. Nunca use em produção. |

## Estrutura

```
server.js          API, sessões, OAuth do YouTube e cronômetro do Instagram
quiz-data.js       20 perguntas, opções e textos dos resultados
verifiers.js       Configuração das redes e chamadas ao Google
public/            Interface (HTML, CSS, JS puro)
```

## Antes de ir para produção

- Trocar o armazenamento em memória (`Map`) por Redis ou banco de dados. Hoje, reiniciar o servidor apaga as sessões.
- Colocar HTTPS: o OAuth do Google exige isso fora de localhost.
- Adicionar limite de requisições nas rotas de verificação.
- Concluir a verificação do app no Google para permitir login de qualquer usuário.
