const cardsContainerId = 'top-cards-container';
const timesJsonUrl = './dados/times.json';

// Estrutura das rodadas e jogos (4 dias, 3 jogos por dia)
const rodadas = Object.fromEntries(
  Array.from({ length: 4 }, (_, dia) => [
    `DIA${dia + 1}`,
    Array.from({ length: 3 }, (_, i) => `csv/DIA${dia + 1}/jogo${i + 1}.csv`)
  ])
);

// Formata números no padrão brasileiro
function formatarNumero(num) {
  return Number(num).toLocaleString('pt-BR');
}

// Busca um arquivo via fetch com tratamento de erro
async function fetchComTratamento(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Erro ao carregar ${url}`);
    return await resp.text();
  } catch (err) {
    console.warn(err.message);
    return null;
  }
}

// Carrega o JSON dos times e jogadores
async function carregarTimes() {
  const resp = await fetch(timesJsonUrl);
  if (!resp.ok) throw new Error('Erro ao carregar lista de times');
  return await resp.json();
}

// Encontra o nome do time a partir do nome do jogador
function encontrarTime(jogador, timesArray) {
  return timesArray.find(t => t.jogadores.includes(jogador))?.nome || 'Desconhecido';
}

// Verifica se a imagem existe fazendo uma requisição HEAD
async function verificarImagemExiste(src) {
  try {
    const res = await fetch(src, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

// Sanitiza nome para uso em nome de arquivo (remove acentos, espaços e caracteres inválidos)
function sanitizarNome(nome) {
  return nome.trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, '_')                            // substitui espaços por underline
    .replace(/[^\w\-]/g, '');                        // remove caracteres inválidos
}

async function gerarTopCards() {
  const container = document.getElementById(cardsContainerId);
  if (!container) return;

  container.innerHTML = 'Carregando...';

  let times;
  try {
    times = await carregarTimes();
  } catch (err) {
    container.innerHTML = 'Erro ao carregar dados dos times.';
    console.error(err);
    return;
  }

  // Junta todos os arquivos CSV das rodadas
  const todosCsv = Object.values(rodadas).flat();
  const jogadoresMap = new Map();

  // Processa cada CSV para acumular stats dos jogadores
  for (const arquivo of todosCsv) {
    const text = await fetchComTratamento(arquivo);
    if (!text) continue;

    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

    parsed.data.forEach(row => {
      const jogador = row['Name'];
      const time = encontrarTime(jogador, times);
      if (!jogador || !time) return;

      if (!jogadoresMap.has(jogador)) {
        jogadoresMap.set(jogador, {
          jogador,
          time,
          kills: 0,
          dano: 0,
          assists: 0,
        });
      }

      const player = jogadoresMap.get(jogador);
      player.kills += Number(row['Kills']) || 0;
      player.dano += Number(row['Damage Dealt']) || 0;
      player.assists += Number(row['Assists']) || 0;
    });
  }

  const jogadoresArray = Array.from(jogadoresMap.values());

  // Filtra jogadores que tenham algum dado relevante
  const jogadoresValidos = jogadoresArray.filter(j =>
    j.kills > 0 || j.assists > 0 || j.dano > 0
  );

  if (jogadoresValidos.length === 0) {
    container.innerHTML = '<p style="color:#ccc; text-align:center; margin-top:1rem;">Sem dados disponíveis para exibir.</p>';
    return;
  }

  // Seleciona os melhores jogadores em cada categoria
  const topKills = jogadoresValidos.reduce((a, b) => (a.kills > b.kills ? a : b));
  const topAssists = jogadoresValidos.reduce((a, b) => (a.assists > b.assists ? a : b));
  const topDano = jogadoresValidos.reduce((a, b) => (a.dano > b.dano ? a : b));

  const cardsData = [
    {
      titulo: 'Top Kills',
      jogador: topKills.jogador,
      valor: `${formatarNumero(topKills.kills)} Kills`,
      time: topKills.time,
      cor: '#f87171',
      icone: '💀',
      fallback: 'kills.png'
    },
    {
      titulo: 'Top Assistências',
      jogador: topAssists.jogador,
      valor: `${formatarNumero(topAssists.assists)} Assistências`,
      time: topAssists.time,
      cor: '#60a5fa',
      icone: '🤝',
      fallback: 'assis.png'
    },
    {
      titulo: 'Top Dano',
      jogador: topDano.jogador,
      valor: `${formatarNumero(topDano.dano)} Dano`,
      time: topDano.time,
      cor: '#facc15',
      icone: '⚡',
      fallback: 'dano.png'
    },
  ];

  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 1rem;
  `;

  for (const card of cardsData) {
    const nomeSanitizado = sanitizarNome(card.jogador);
    const pastaJogadores = './imagens/times/jogadores/';
    const imagemJogador = `${pastaJogadores}${nomeSanitizado}.png`;
    const imagemFallback = `${pastaJogadores}${card.fallback}`;

    let imagemFinal = imagemJogador;
    const existe = await verificarImagemExiste(imagemJogador);
    if (!existe) {
      imagemFinal = imagemFallback;
    }

    const div = document.createElement('div');
    div.style.cssText = `
      flex: 1;
      min-width: 280px;
      background-color: #1e1e1e;
      border-left: 6px solid ${card.cor};
      padding: 1rem;
      box-shadow: 0 0 8px rgba(0,0,0,0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
    `;

    div.innerHTML = `
      <h3 style="color: ${card.cor}; font-size: 1.2rem; margin-bottom: 0.5rem;">
        ${card.icone} ${card.titulo}
      </h3>
      <img src="${imagemFinal}" alt="${card.jogador}" style="width: 250px; height: 300px; margin-bottom: 0.5rem; object-fit: cover; border-radius: 6px;">
      <p style="font-size: 1.1rem; font-weight: 600; color: #f5f5f5; margin: 0;">
        ${card.jogador}
      </p>
      <p style="color: #ccc; margin: 0.2rem 0;">
        ${card.valor}
      </p>
      <p style="color: #999; font-size: 0.9rem; margin: 0;">
        Time: ${card.time}
      </p>
    `;

    wrapper.appendChild(div);
  }

  container.appendChild(wrapper);
}

// Inicia a função assim que o script carregar
gerarTopCards();
