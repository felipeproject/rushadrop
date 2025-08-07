// js/tab_geral.js
const timesJsonUrl = './dados/times.json';
const DIAS = ['DIA1', 'DIA2', 'DIA3', 'DIA4'];
const ARQUIVOS_POR_DIA = 3;

const rodadas = Object.fromEntries(
  DIAS.map(dia => [dia, Array.from({ length: ARQUIVOS_POR_DIA }, (_, i) => `csv/${dia}/jogo${i + 1}.csv`)])
);

const PONTOS_POR_COLOCACAO = {
  1: 15, 2: 12, 3: 10, 4: 8, 5: 6, 6: 4, 7: 2
};

const getPontosPorColocacao = (pos) => PONTOS_POR_COLOCACAO[pos] || 1;

const formatarNumero = (num) => Math.round(num).toLocaleString('pt-BR');

const carregarTimes = async () => {
  const resp = await fetch(timesJsonUrl);
  if (!resp.ok) throw new Error('Erro ao carregar lista de times');
  return resp.json();
};

const encontrarTime = (jogador, times) =>
  times.find(t => t.jogadores.includes(jogador))?.nome || null;

async function processarCSV(arquivo, times, geral) {
  try {
    const resp = await fetch(arquivo);
    if (!resp.ok) return;

    const text = await resp.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

    const killsJogo = {};
    const melhorPos = {};

    parsed.data.forEach(({ Name, Kills, 'Win Place': Pos }) => {
      const jogador = Name?.trim();
      const kills = Number(Kills) || 0;
      const pos = Number(Pos);
      const time = encontrarTime(jogador, times);
      if (!time) return;

      geral[time].kills += kills;
      killsJogo[time] = (killsJogo[time] || 0) + kills;

      if (!melhorPos[time] || pos < melhorPos[time]) {
        melhorPos[time] = pos;
      }
    });

    for (const time in killsJogo) {
      if (killsJogo[time] > 0) {
        const pos = melhorPos[time];
        geral[time].pontos += getPontosPorColocacao(pos) + killsJogo[time];
      }
    }
  } catch (err) {
    console.warn(`Erro ao processar ${arquivo}:`, err);
  }
}

async function criarTabelaGeral() {
  const container = document.getElementById('geral-container');
  container.textContent = 'Carregando...';

  const times = await carregarTimes();
  const geral = Object.fromEntries(times.map(t => [t.nome, { kills: 0, pontos: 0 }]));

  const arquivos = Object.values(rodadas).flat();
  for (const arquivo of arquivos) {
    await processarCSV(arquivo, times, geral);
  }

  const geralArray = Object.entries(geral)
    .map(([time, stats]) => ({ time, ...stats }))
    .sort((a, b) => b.pontos - a.pontos);

  renderizarTabela(container, geralArray);
}

function renderizarTabela(container, dados) {
  const table = document.createElement('table');
  const colunas = ['Rank', 'Time', 'Kills', 'Pontos'];

  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  colunas.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  dados.forEach((item, idx) => {
    const tr = document.createElement('tr');

    [
      idx + 1,
      gerarCelulaTime(item.time),
      formatarNumero(item.kills),
      formatarNumero(item.pontos)
    ].forEach((conteudo, i) => {
      const td = document.createElement('td');
      if (i === 1 && conteudo instanceof HTMLElement) {
        td.appendChild(conteudo);
      } else {
        td.textContent = conteudo;
      }
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.textContent = '';
  container.appendChild(table);
}

function gerarCelulaTime(nomeTime) {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';

  const img = document.createElement('img');
  img.src = `imagens/times/sf/${nomeTime}.png`;
  img.alt = nomeTime;
  Object.assign(img.style, {
    width: '80px',
    height: '80px',
    objectFit: 'contain',  // garante que a logo inteira fique visível
    marginRight: '12px',
    display: 'block',
  });

  img.onerror = () => {
    img.onerror = null;
    img.src = `imagens/times/sf/${nomeTime}.jpg`;
  };

  const span = document.createElement('span');
  span.textContent = nomeTime;
  span.style.fontWeight = '600';
  span.style.fontSize = '1rem';

  wrapper.appendChild(img);
  wrapper.appendChild(span);
  return wrapper;
}


criarTabelaGeral();
