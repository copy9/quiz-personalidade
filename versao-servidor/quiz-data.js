// Perguntas e resultados do quiz (20 perguntas).
// Cada opção aponta para um tipo de personalidade: A, B, C ou D.
// O cálculo acontece só no servidor, então o resultado não vaza para o navegador.

const QUESTIONS = [
  {
    text: 'Como você prefere começar um fim de semana?',
    options: [
      { label: 'Planejando uma aventura nova', type: 'A' },
      { label: 'Chamando os amigos para sair', type: 'B' },
      { label: 'Ficando em casa com um bom livro', type: 'C' },
      { label: 'Organizando a agenda da semana', type: 'D' },
    ],
  },
  {
    text: 'Diante de um problema difícil, você costuma...',
    options: [
      { label: 'Testar soluções até encontrar uma que funcione', type: 'A' },
      { label: 'Pedir a opinião de alguém de confiança', type: 'B' },
      { label: 'Procurar uma saída criativa e fora do comum', type: 'C' },
      { label: 'Montar um plano passo a passo', type: 'D' },
    ],
  },
  {
    text: 'Em uma festa, você geralmente...',
    options: [
      { label: 'Vai direto para a parte mais animada', type: 'A' },
      { label: 'Circula e conversa com todo mundo', type: 'B' },
      { label: 'Observa as pessoas e inventa histórias sobre elas', type: 'C' },
      { label: 'Acompanha o horário e garante que tudo corra bem', type: 'D' },
    ],
  },
  {
    text: 'Qual destas frases mais combina com você?',
    options: [
      { label: 'Gosto de sentir a adrenalina do novo', type: 'A' },
      { label: 'Minha energia vem de estar com gente', type: 'B' },
      { label: 'Minha cabeça vive cheia de ideias', type: 'C' },
      { label: 'Prefiro saber exatamente o que vem depois', type: 'D' },
    ],
  },
  {
    text: 'Em uma viagem, você é quem...',
    options: [
      { label: 'Escolhe o destino mais inusitado', type: 'A' },
      { label: 'Puxa conversa com os moradores locais', type: 'B' },
      { label: 'Se perde nas paisagens e nos detalhes', type: 'C' },
      { label: 'Monta o roteiro com horários', type: 'D' },
    ],
  },
  {
    text: 'Qual destes elogios você mais gostaria de receber?',
    options: [
      { label: '"Você é corajoso(a)"', type: 'A' },
      { label: '"Você faz as pessoas se sentirem bem"', type: 'B' },
      { label: '"Você tem uma imaginação incrível"', type: 'C' },
      { label: '"Você é muito confiável"', type: 'D' },
    ],
  },
  {
    text: 'Se pudesse ter um superpoder, qual escolheria?',
    options: [
      { label: 'Teletransporte, para ir a qualquer lugar agora', type: 'A' },
      { label: 'Ler mentes, para entender as pessoas', type: 'B' },
      { label: 'Criar qualquer coisa que imaginar', type: 'C' },
      { label: 'Controlar o tempo, para cumprir tudo no prazo', type: 'D' },
    ],
  },
  {
    text: 'Seu trabalho ideal envolveria...',
    options: [
      { label: 'Explorar lugares e desafios novos', type: 'A' },
      { label: 'Trabalhar em equipe e ajudar pessoas', type: 'B' },
      { label: 'Criar algo original e artístico', type: 'C' },
      { label: 'Organizar processos e acompanhar resultados', type: 'D' },
    ],
  },
  {
    text: 'Quando um plano dá errado, você...',
    options: [
      { label: 'Improvisa na hora', type: 'A' },
      { label: 'Pede ajuda a quem está por perto', type: 'B' },
      { label: 'Vê o erro como chance de fazer algo diferente', type: 'C' },
      { label: 'Revisa o plano e refaz as etapas', type: 'D' },
    ],
  },
  {
    text: 'Qual presente você mais gosta de ganhar?',
    options: [
      { label: 'Ingresso para uma experiência radical', type: 'A' },
      { label: 'Um jantar com amigos queridos', type: 'B' },
      { label: 'Um livro de arte ou um álbum inspirador', type: 'C' },
      { label: 'Uma agenda ou planner de qualidade', type: 'D' },
    ],
  },
  {
    text: 'Você se considera mais...',
    options: [
      { label: 'Impulsivo(a)', type: 'A' },
      { label: 'Sociável', type: 'B' },
      { label: 'Sonhador(a)', type: 'C' },
      { label: 'Metódico(a)', type: 'D' },
    ],
  },
  {
    text: 'Em uma discussão, você tende a...',
    options: [
      { label: 'Defender sua ideia com coragem', type: 'A' },
      { label: 'Procurar um ponto em comum', type: 'B' },
      { label: 'Trazer um ponto de vista diferente', type: 'C' },
      { label: 'Apresentar dados e fatos', type: 'D' },
    ],
  },
  {
    text: 'Qual lugar você escolheria para morar?',
    options: [
      { label: 'Um lugar desafiador, longe da rotina', type: 'A' },
      { label: 'Uma cidade movimentada, com vida social intensa', type: 'B' },
      { label: 'Um lugar tranquilo, perto da natureza', type: 'C' },
      { label: 'Uma cidade bem organizada, com boa infraestrutura', type: 'D' },
    ],
  },
  {
    text: 'Quando você sente mais energia?',
    options: [
      { label: 'Fazendo algo arriscado ou novo', type: 'A' },
      { label: 'Estando com pessoas que ama', type: 'B' },
      { label: 'Criando ou sonhando com ideias', type: 'C' },
      { label: 'Terminando uma tarefa importante', type: 'D' },
    ],
  },
  {
    text: 'Ao ver alguém sozinho em um evento, você...',
    options: [
      { label: 'Convida para uma atividade nova', type: 'A' },
      { label: 'Vai até essa pessoa e puxa conversa', type: 'B' },
      { label: 'Pensa na história dela e no que a trouxe ali', type: 'C' },
      { label: 'Garante que ela se sinta acolhida pela organização', type: 'D' },
    ],
  },
  {
    text: 'Qual palavra mais descreve você?',
    options: [
      { label: 'Destemido(a)', type: 'A' },
      { label: 'Caloroso(a)', type: 'B' },
      { label: 'Criativo(a)', type: 'C' },
      { label: 'Confiável', type: 'D' },
    ],
  },
  {
    text: 'Em um grupo de amigos, você costuma ser quem...',
    options: [
      { label: 'Propõe o próximo desafio', type: 'A' },
      { label: 'Une todo mundo', type: 'B' },
      { label: 'Traz ideias que ninguém tinha pensado', type: 'C' },
      { label: 'Organiza as decisões do grupo', type: 'D' },
    ],
  },
  {
    text: 'Qual tipo de filme você mais gosta?',
    options: [
      { label: 'Aventura e ação', type: 'A' },
      { label: 'Comédia ou drama de amizade', type: 'B' },
      { label: 'Fantasia e mundos imaginários', type: 'C' },
      { label: 'Suspense com enredo bem amarrado', type: 'D' },
    ],
  },
  {
    text: 'Como você costuma lidar com suas metas?',
    options: [
      { label: 'Decido na hora e corro atrás', type: 'A' },
      { label: 'Conto para os amigos para me motivar', type: 'B' },
      { label: 'Sonho com elas em detalhes', type: 'C' },
      { label: 'Escrevo com prazos e etapas', type: 'D' },
    ],
  },
  {
    text: 'Se pudesse aprender uma habilidade nova, qual seria?',
    options: [
      { label: 'Pilotar um avião ou mergulhar', type: 'A' },
      { label: 'Falar vários idiomas para conversar com todo mundo', type: 'B' },
      { label: 'Tocar um instrumento ou pintar', type: 'C' },
      { label: 'Dominar finanças e planejamento', type: 'D' },
    ],
  },
];

const RESULTS = {
  A: {
    title: 'O Aventureiro',
    text: 'Você é curioso, corajoso e gosta de experimentar. Enquanto outros esperam o momento certo, você cria o momento.',
  },
  B: {
    title: 'O Conector',
    text: 'Você tem um talento raro para aproximar pessoas. Sua energia vem das relações e você faz os outros se sentirem em casa.',
  },
  C: {
    title: 'O Sonhador',
    text: 'Sua mente vive em outros mundos cheios de ideias. Você enxerga beleza e possibilidades onde a maioria não percebe.',
  },
  D: {
    title: 'O Estrategista',
    text: 'Você é organizado, confiável e pensa à frente. As pessoas sabem que podem contar com você quando as coisas precisam dar certo.',
  },
};

module.exports = { QUESTIONS, RESULTS };
