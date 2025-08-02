// js/tab_top.js

const timesJsonUrl = './dados/times.json';

// Gera dinamicamente os caminhos das rodadas
const rodadas = Object.fromEntries(
  Array.from({ length: 4 }, (_, dia) => [
    `DAY${dia + 1}`,
    Array.from({ length: 3 }, (_, i) => `csv/DAY${dia + 1}/jogo${i + 1}.csv`)
  ])
);

function formatarNumero(num, casasDecimais = 0) {
  return Number(num).toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  });
}

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

async function carregarTimes() {
  const resp = await fetch(timesJsonUrl);
  if (!resp.ok) throw new Error('Erro ao carregar lista de times');
  return await resp.json();
}

function encontrarTime(jogador, timesArray) {
  return timesArray.find(t => t.jogadores.includes(jogador))?.nome || null;
}

function ordenar(array, key, crescente = true) {
  return array.sort((a, b) => {
    const valA = a[key], valB = b[key];
    if (typeof valA === 'string') {
      return crescente ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return crescente ? valA - valB : valB - valA;
  });
}

async function criarTabelaTop() {
  const container = document.getElementById('top-container');
  container.textContent = 'Carregando top jogadores...';

  const times = await carregarTimes();
  const todosCsv = Object.values(rodadas).flat();
  const jogadoresMap = new Map();

  for (const arquivo of todosCsv) {
    const text = await fetchComTratamento(arquivo);
    if (!text) continue;

    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

    parsed.data.forEach(row => {
      const jogador = row['Name'];
      const time = encontrarTime(jogador, times);
      if (!time) return;

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

  let jogadoresArray = Array.from(jogadoresMap.values());
  jogadoresArray = ordenar(jogadoresArray, 'kills', false).slice(0, 10);

  const colunas = [
    { label: 'Jogador', key: 'jogador' },
    { label: 'Time', key: 'time' },
    { label: 'Kills', key: 'kills', icon: 'fa-skull-crossbones', class: 'icon-kill' },
    { label: 'Dano Causado', key: 'dano', icon: 'fa-bolt', class: 'icon-dano' },
    { label: 'Assistências', key: 'assists', icon: 'fa-hands-helping', class: 'icon-assist' },
  ];

  const table = document.createElement('table');
  table.classList.add('tabela-top-jogadores');

  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');

  colunas.forEach(({ label, key }) => {
    const th = document.createElement('th');
    th.textContent = label;
    th.style.userSelect = 'none';
    th.style.cursor = 'pointer';
    th.onclick = () => {
      const crescente = th.dataset.crescente !== 'true';
      jogadoresArray = ordenar(jogadoresArray, key, crescente);
      th.dataset.crescente = crescente;
      montarCorpoTabela();
    };
    trHead.appendChild(th);
  });

  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  function montarCorpoTabela() {
    tbody.textContent = '';
    jogadoresArray.forEach(jogador => {
      const tr = document.createElement('tr');

      colunas.forEach(({ key, icon, class: cssClass }) => {
        const td = document.createElement('td');
        const valor = formatarNumero(jogador[key], key === 'dano' ? 0 : 0);

        if (icon) {
          td.innerHTML = `<i class="fa-solid ${icon} ${cssClass}"></i> ${valor}`;
        } else {
          td.textContent = valor;
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
