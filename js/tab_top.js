// js/tab_top.js

// URL do arquivo JSON com a lista de times e jogadores
const timesJsonUrl = './dados/times.json';

// Objeto com as rodadas e os arquivos CSV dos jogos (4 dias, 3 jogos por dia)
const rodadas = Object.fromEntries(
  Array.from({ length: 4 }, (_, dia) => [
    `DAY${dia + 1}`,
    Array.from({ length: 3 }, (_, i) => `csv/DAY${dia + 1}/jogo${i + 1}.csv`)
  ])
);

/**
 * Formata um número com casas decimais, no padrão pt-BR
 * @param {number|string} num Número a formatar
 * @param {number} casasDecimais Quantidade de casas decimais (padrão 0)
 * @returns {string} Número formatado
 */
function formatarNumero(num, casasDecimais = 0) {
  return Number(num).toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  });
}

/**
 * Faz fetch com tratamento de erros e retorna texto, ou null em falha
 * @param {string} url URL para buscar o arquivo
 * @returns {Promise<string|null>} Texto do arquivo ou null se erro
 */
async function fetchComTratamento(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Erro ao carregar ${url} (status ${resp.status})`);
    return await resp.text();
  } catch (err) {
    console.warn(err.message);
    return null;
  }
}

/**
 * Carrega JSON com a lista de times e jogadores
 * @returns {Promise<Object[]>} Array de times
 */
async function carregarTimes() {
  try {
    const resp = await fetch(timesJsonUrl);
    if (!resp.ok) throw new Error('Erro ao carregar lista de times');
    return await resp.json();
  } catch (err) {
    console.error(err.message);
    return [];
  }
}

/**
 * Encontra o nome do time que contém o jogador
 * @param {string} jogador Nome do jogador
 * @param {Array} timesArray Array de objetos times, com propriedade 'jogadores' (array)
 * @returns {string|null} Nome do time ou null se não encontrado
 */
function encontrarTime(jogador, timesArray) {
  const timeEncontrado = timesArray.find(t => Array.isArray(t.jogadores) && t.jogadores.includes(jogador));
  return timeEncontrado ? timeEncontrado.nome : null;
}

/**
 * Ordena um array por uma chave, crescente ou decrescente
 * @param {Array} array Array de objetos a ordenar
 * @param {string} key Chave para ordenar
 * @param {boolean} crescente Ordem crescente (default true)
 * @returns {Array} Array ordenado (mesmo array original)
 */
function ordenar(array, key, crescente = true) {
  return array.sort((a, b) => {
    const valA = a[key], valB = b[key];
    if (typeof valA === 'string' && typeof valB === 'string') {
      return crescente ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return crescente ? valA - valB : valB - valA;
  });
}

/**
 * Ordena pelo ranking composto: kills > assists > dano > nome do jogador
 * @param {Array} array Array de jogadores
 * @param {boolean} crescente Ordem crescente? (default false = decrescente)
 * @returns {Array} Array ordenado (mesmo array original)
 */
function ordenarPorRank(array, crescente = false) {
  return array.sort((a, b) => {
    if (a.kills !== b.kills) return crescente ? a.kills - b.kills : b.kills - a.kills;
    if (a.assists !== b.assists) return crescente ? a.assists - b.assists : b.assists - a.assists;
    if (a.dano !== b.dano) return crescente ? a.dano - b.dano : b.dano - a.dano;
    return crescente ? a.jogador.localeCompare(b.jogador) : b.jogador.localeCompare(a.jogador);
  });
}

/**
 * Cria a tabela de top jogadores e insere no container #top-container
 * Agora exibe o top geral (todos os jogadores)
 */
async function criarTabelaTop() {
  const container = document.getElementById('top-container');
  if (!container) {
    console.error('Elemento com id "top-container" não encontrado.');
    return;
  }

  container.textContent = 'Carregando dados dos jogadores...';

  // Carregar times
  const times = await carregarTimes();
  if (!times.length) {
    container.textContent = 'Não foi possível carregar a lista de times.';
    return;
  }

  // Pega todos os CSVs de todas as rodadas e jogos
  const todosCsv = Object.values(rodadas).flat();

  // Mapa para acumular dados dos jogadores
  const jogadoresMap = new Map();

  // Processar todos os CSVs sequencialmente (pode paralelizar se quiser)
  for (const arquivo of todosCsv) {
    const text = await fetchComTratamento(arquivo);
    if (!text) continue;

    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

    // Processa cada linha do CSV
    parsed.data.forEach(row => {
      const jogador = row['Name']?.trim();
      if (!jogador) return;

      const time = encontrarTime(jogador, times);
      if (!time) return; // jogador sem time, ignora

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

      // Soma valores, parseando para número e tratando NaN
      player.kills += Number(row['Kills']) || 0;
      player.dano += Number(row['Damage Dealt']) || 0;
      player.assists += Number(row['Assists']) || 0;
    });
  }

  let jogadoresArray = Array.from(jogadoresMap.values());

  // Ordena pelo ranking decrescente (melhor primeiro)
  jogadoresArray = ordenarPorRank(jogadoresArray, false);

  // Define a propriedade rank para exibição
  jogadoresArray.forEach((jogador, i) => {
    jogador.rank = i + 1;
  });

  // Definição das colunas da tabela e ícones
  const colunas = [
    { label: 'Rank', key: 'rank' },
    { label: 'Jogador', key: 'jogador' },
    { label: 'Time', key: 'time' },
    { label: 'Kills', key: 'kills', icon: '💀' },
    { label: 'Assistências', key: 'assists', icon: '🤝' },
    { label: 'Dano Causado', key: 'dano', icon: '⚡' },
  ];

  // Limpa o container antes de montar a tabela
  container.textContent = '';

  // Criação da tabela HTML
  const table = document.createElement('table');
  Object.assign(table.style, {
    width: '100%',
    borderCollapse: 'collapse',
    color: '#ddd',
    fontSize: '0.95rem',
    userSelect: 'none',
  });

  // Cabeçalho da tabela
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');

  colunas.forEach(({ label, key }) => {
    const th = document.createElement('th');
    th.textContent = label;
    Object.assign(th.style, {
      padding: '12px 10px',
      borderBottom: '2px solid #444',
      cursor: 'pointer',
      position: 'relative',
      backgroundColor: '#1f1f1f',
      color: '#9ae6b4',
      fontWeight: '600',
      textAlign: key === 'rank' ? 'center' : 'left',
      userSelect: 'none',
    });

    // Tooltip só para a coluna Rank, explicando a regra do ranking
    if (key === 'rank') {
      const tooltip = document.createElement('div');
      tooltip.textContent = 'Ranking prioriza Kills > Assistências > Dano.';
      Object.assign(tooltip.style, {
        visibility: 'hidden',
        opacity: '0',
        width: '220px',
        backgroundColor: '#222',
        color: '#9ae6b4',
        textAlign: 'center',
        borderRadius: '6px',
        padding: '8px',
        position: 'absolute',
        zIndex: '10',
        bottom: '125%',
        left: '50%',
        transform: 'translateX(-50%)',
        transition: 'opacity 0.3s',
        fontSize: '13px',
        pointerEvents: 'none',
        userSelect: 'none',
        boxShadow: '0 0 8px rgba(154,230,180,0.7)',
      });

      const arrow = document.createElement('div');
      Object.assign(arrow.style, {
        position: 'absolute',
        top: '100%',
        left: '50%',
        marginLeft: '-5px',
        borderWidth: '5px',
        borderStyle: 'solid',
        borderColor: '#222 transparent transparent transparent',
      });
      tooltip.appendChild(arrow);
      th.appendChild(tooltip);

      th.addEventListener('mouseenter', () => {
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
      });
      th.addEventListener('mouseleave', () => {
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
      });
    }

    // Evento de clique para ordenar a tabela
    th.addEventListener('click', () => {
      // Alterna entre crescente e decrescente ao clicar
      const crescente = th.dataset.crescente !== 'true';
      th.dataset.crescente = crescente;

      // Ordena de acordo com a coluna clicada
      if (key === 'rank') {
        jogadoresArray = ordenarPorRank(jogadoresArray, crescente);
      } else {
        jogadoresArray = ordenar(jogadoresArray, key, crescente);
      }

      // Atualiza o rank após ordenação
      jogadoresArray.forEach((jogador, i) => {
        jogador.rank = i + 1;
      });

      montarCorpoTabela();
    });

    trHead.appendChild(th);
  });

  thead.appendChild(trHead);
  table.appendChild(thead);

  // Corpo da tabela (tbody)
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  /**
   * Função para montar o corpo da tabela baseado no array jogadoresArray atual
   */
  function montarCorpoTabela() {
    tbody.textContent = ''; // limpa corpo da tabela

    jogadoresArray.forEach(jogador => {
      const tr = document.createElement('tr');

      // Destaque suave para 1º, 2º e 3º colocados
      if (jogador.rank === 1) {
        tr.style.backgroundColor = 'rgba(43, 255, 0, 0.2)'; // verde suave
      } else if (jogador.rank === 2) {
        tr.style.backgroundColor = 'rgba(0, 255, 179, 0.12)'; // verde mais claro
      } else if (jogador.rank === 3) {
        tr.style.backgroundColor = 'rgba(0, 47, 255, 0.08)'; // azul suave
      } else if (jogador.rank % 2 === 0) {
        tr.style.backgroundColor = '#1a1a1a'; // linhas pares com cor um pouco diferente
      } else {
        tr.style.backgroundColor = '#111'; // linhas ímpares mais escuras
      }

      colunas.forEach(({ key, icon }) => {
        const td = document.createElement('td');
        Object.assign(td.style, {
          padding: '10px 12px',
          borderBottom: '1px solid #333',
          color: '#ddd',
          textAlign: key === 'rank' ? 'center' : 'left',
          fontWeight: key === 'rank' ? '700' : 'normal',
          width: key === 'rank' ? '50px' : 'auto',
          whiteSpace: 'nowrap',
        });

        if (key === 'rank') {
          td.textContent = jogador.rank;
        } else if (icon) {
          // Mostra o ícone + valor formatado para kills, assists, dano
          td.innerHTML = `<span style="margin-right:6px;">${icon}</span>${formatarNumero(jogador[key], 0)}`;
        } else {
          td.textContent = jogador[key];
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  // Monta a tabela inicialmente
  montarCorpoTabela();

  // Adiciona tabela ao container
  container.appendChild(table);
}

// Executa a função para criar a tabela assim que o script carregar
criarTabelaTop();
