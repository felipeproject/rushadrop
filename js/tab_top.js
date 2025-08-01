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

const timesJsonUrl = './dados/times.json';

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

function comparar(a, b, coluna, crescente) {
  if (crescente) return a[coluna] - b[coluna];
  return b[coluna] - a[coluna];
}

async function criarTabelaTop() {
  const container = document.getElementById('top-container');
  container.textContent = 'Carregando top jogadores...';

  const times = await carregarTimes();

  const todosCsv = Object.values(rodadas).flat();

  const jogadoresMap = new Map();

  for (const arquivo of todosCsv) {
    try {
      const resp = await fetch(arquivo);
      if (!resp.ok) continue;
      const text = await resp.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      parsed.data.forEach(row => {
        const jogador = row['Name'];
        const time = encontrarTime(jogador, times);
        if (!time) return; // remove intrusos
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
    } catch {
      continue;
    }
  }

  let jogadoresArray = Array.from(jogadoresMap.values());

  jogadoresArray.sort((a, b) => b.kills - a.kills);

  jogadoresArray = jogadoresArray.slice(0, 10);

  const colunas = [
    { label: 'Jogador', key: 'jogador' },
    { label: 'Time', key: 'time' },
    { label: 'Kills', key: 'kills' },
    { label: 'Dano Causado', key: 'dano' },
    { label: 'Assistências', key: 'assists' },
  ];

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');

  colunas.forEach(({ label, key }) => {
    const th = document.createElement('th');
    th.textContent = label;
    th.style.userSelect = 'none';
    th.style.cursor = 'pointer';
    th.onclick = () => {
      const crescente = th.dataset.crescente !== 'true';
      jogadoresArray.sort((a, b) => {
        if (typeof a[key] === 'string') {
          if (crescente) return a[key].localeCompare(b[key]);
          else return b[key].localeCompare(a[key]);
        } else {
          if (crescente) return a[key] - b[key];
          else return b[key] - a[key];
        }
      });
      th.dataset.crescente = crescente;
      montarCorpoTabela();
    };
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  function formatarValor(key, val) {
    if (key === 'dano') return formatarNumero(val);
    if (typeof val === 'number') return val.toString();
    return val;
  }

  function montarCorpoTabela() {
    tbody.textContent = '';
    jogadoresArray.forEach(j => {
      const tr = document.createElement('tr');
      colunas.forEach(({ key }) => {
        const td = document.createElement('td');

        // Adiciona ícones Font Awesome inline para colunas específicas
        if (key === 'kills') {
          td.innerHTML = `<i class="fa-solid fa-skull-crossbones" style="color: red; margin-right: 6px;"></i> ${formatarValor(key, j[key])}`;
        } else if (key === 'dano') {
          td.innerHTML = `<i class="fa-solid fa-bolt" style="color: orange; margin-right: 6px;"></i> ${formatarValor(key, j[key])}`;
        } else if (key === 'assists') {
          td.innerHTML = `<i class="fa-solid fa-hands-helping" style="color: blue; margin-right: 6px;"></i> ${formatarValor(key, j[key])}`;
        } else {
          td.textContent = formatarValor(key, j[key]);
        }

        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  montarCorpoTabela();

  container.textContent = '';
  container.appendChild(table);
}

criarTabelaTop();
