const timesJsonUrl = './dados/times.json';

const rodadas = {
  DAY1: [
    'csv/DAY1/jogo1.csv',
    'csv/DAY1/jogo2.csv',
    'csv/DAY1/jogo3.csv',
  ],
  DAY2: [
    'csv/DAY2/jogo1.csv',
    'csv/DAY2/jogo2.csv',
    'csv/DAY2/jogo3.csv',
  ],
  DAY3: [
    'csv/DAY3/jogo1.csv',
    'csv/DAY3/jogo2.csv',
    'csv/DAY3/jogo3.csv',
  ],
  DAY4: [
    'csv/DAY4/jogo1.csv',
    'csv/DAY4/jogo2.csv',
    'csv/DAY4/jogo3.csv',
  ],
};

function pontosPorColocacao(pos) {
  switch (pos) {
    case 1: return 15;
    case 2: return 12;
    case 3: return 10;
    case 4: return 8;
    case 5: return 6;
    case 6: return 4;
    case 7: return 2;
    default: return 1;
  }
}

function formatarNumero(num) {
  return Math.round(num).toLocaleString('pt-BR');
}

async function carregarTimes() {
  const resp = await fetch(timesJsonUrl);
  if (!resp.ok) throw new Error('Erro ao carregar lista de times');
  return await resp.json();
}

function encontrarTime(jogador, timesArray) {
  for (const timeObj of timesArray) {
    if (timeObj.jogadores.includes(jogador)) {
      return timeObj.nome;
    }
  }
  return null;
}

async function criarTabelaGeral() {
  const container = document.getElementById('geral-container');
  container.textContent = 'Carregando...';

  const times = await carregarTimes();

  const geral = {};
  const todosCsv = Object.values(rodadas).flat();

  for (const arquivo of todosCsv) {
    try {
      const resp = await fetch(arquivo);
      if (!resp.ok) continue;
      const text = await resp.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      parsed.data.forEach(row => {
        const jogador = row['Name'];
        const time = encontrarTime(jogador, times);
        if (!time) return;
        if (!geral[time]) geral[time] = { kills: 0, pontos: 0 };
        geral[time].kills += Number(row['Kills']) || 0;
        const pos = Number(row['Win Place']);
        geral[time].pontos += pontosPorColocacao(pos) + (Number(row['Kills']) || 0);
      });
    } catch {
      continue;
    }
  }

  const geralArray = Object.entries(geral)
    .map(([time, stats]) => ({ time, kills: stats.kills, pontos: stats.pontos }))
    .sort((a, b) => b.pontos - a.pontos);

  const colunas = ['Rank', 'Time', 'Kills', 'Pontos'];
  const table = document.createElement('table');

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
  geralArray.forEach((item, idx) => {
    const tr = document.createElement('tr');
    [
      idx + 1,
      item.time,
      formatarNumero(item.kills),
      formatarNumero(item.pontos)
    ].forEach((text, i) => {
      const td = document.createElement('td');

      if (i === 1) {
        // Alinhamento flex para logo circular + nome
        td.style.display = 'flex';
        td.style.alignItems = 'center';

        const circle = document.createElement('div');
        circle.style.width = '80px';
        circle.style.height = '80px';
        circle.style.borderRadius = '50%';
        circle.style.overflow = 'hidden';
        circle.style.flexShrink = '0';
        circle.style.marginRight = '12px';

        const img = document.createElement('img');
        img.src = `imagens/times/${item.time}.png`;
        img.alt = item.time;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';

        // Fallback para .jpg se .png não carregar
        img.onerror = () => {
          img.onerror = null;
          img.src = `imagens/times/${item.time}.jpg`;
        };

        circle.appendChild(img);

        const span = document.createElement('span');
        span.textContent = item.time;
        span.style.fontWeight = '600';
        span.style.fontSize = '1rem';

        td.appendChild(circle);
        td.appendChild(span);
      } else {
        td.textContent = text;
      }

      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  container.textContent = '';
  container.appendChild(table);
}

criarTabelaGeral();
