import { fetchTimes, filterTimes } from './timesService.js';
import { renderTimes } from './timesRenderer.js';
import { createOpggLink } from './createOpggLink.js'; // Importa a função para criar link do op.gg

const container = document.getElementById('times-container');
const noResults = document.getElementById('no-results');
const searchInput = document.getElementById('search-bar');

const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

let timesData = [];

// ---------- Controle do modal ----------

// Fecha modal ao clicar no "X"
modalClose.addEventListener('click', closeModal);

// Fecha modal ao clicar fora do conteúdo
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

// Fecha modal ao apertar Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
    closeModal();
  }
});

function openModal() {
  modal.setAttribute('aria-hidden', 'false');
  modalBody.focus();
}

function closeModal() {
  modal.setAttribute('aria-hidden', 'true');
  modalBody.innerHTML = '';
}

// ---------- Configuração dos arquivos CSV das rodadas ----------

const rodadas = {
  DAY1: ['csv/DAY1/jogo1.csv', 'csv/DAY1/jogo2.csv', 'csv/DAY1/jogo3.csv'],
  DAY2: ['csv/DAY2/jogo1.csv', 'csv/DAY2/jogo2.csv', 'csv/DAY2/jogo3.csv'],
  DAY3: ['csv/DAY3/jogo1.csv', 'csv/DAY3/jogo2.csv', 'csv/DAY3/jogo3.csv'],
  DAY4: ['csv/DAY4/jogo1.csv', 'csv/DAY4/jogo2.csv', 'csv/DAY4/jogo3.csv'],
};

// ---------- Função para buscar CSV remoto ----------

async function fetchCSV(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();
    if (!text.trim()) return null;
    return text;
  } catch {
    return null;
  }
}

// ---------- Função para converter CSV em objeto ----------

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return null;
  const headers = lines[0].split(',');
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    if (row.length !== headers.length) continue;
    const entry = {};
    for (let j = 0; j < headers.length; j++) {
      entry[headers[j].trim()] = row[j].trim();
    }
    data.push(entry);
  }
  return data;
}

// ---------- Função para carregar e agregar dados de todos os jogadores ----------

async function carregarTodosJogadores() {
  const jogadoresMap = new Map();
  for (const day of Object.keys(rodadas)) {
    for (const arquivo of rodadas[day]) {
      const csvText = await fetchCSV(arquivo);
      if (!csvText) continue;
      const jogadores = parseCSV(csvText);
      if (!jogadores) continue;
      for (const jogador of jogadores) {
        const nome = jogador.Name;
        const kills = parseInt(jogador.Kills) || 0;
        const damage = parseInt(jogador['Damage Dealt']) || 0;
        const assists = parseInt(jogador.Assists) || 0;
        const winPlace = parseInt(jogador['Win Place']) || Infinity;

        if (!jogadoresMap.has(nome)) {
          jogadoresMap.set(nome, {
            nick: nome,
            kills,
            danos: damage,
            assistencias: assists,
            bestWinPlace: winPlace,
          });
        } else {
          const j = jogadoresMap.get(nome);
          j.kills += kills;
          j.danos += damage;
          j.assistencias += assists;
          j.bestWinPlace = Math.min(j.bestWinPlace, winPlace);
        }
      }
    }
  }
  return Array.from(jogadoresMap.values()).sort((a, b) => a.bestWinPlace - b.bestWinPlace);
}

// ---------- Ícones usados no modal ----------

const iconCapitao = '⚓';
const iconSubstituicoes = '🔄';
const iconEntrada = '↗️';
const iconSaida = '↙️';

// ---------- Função para carregar detalhes do time e mostrar no modal ----------

async function loadTeamDetails(tag) {
  const time = timesData.find(t => t.tag.toLowerCase() === tag.toLowerCase());
  if (!time) {
    modalBody.innerHTML = `<p>Time não encontrado.</p>`;
    openModal();
    return;
  }

  modalBody.innerHTML = `<p>Carregando dados...</p>`;
  openModal();

  try {
    const jogadoresDetalhados = await carregarTodosJogadores();

    // Limpa sufixos tipo (C) para comparar nomes
    const jogadoresDoTime = time.jogadores.map(j => j.replace(/\s*\(.*?\)/g, '').trim());

    // Filtra jogadores que pertencem ao time
    const jogadoresFiltrados = jogadoresDetalhados.filter(j =>
      jogadoresDoTime.some(nomeTime => nomeTime.toLowerCase() === j.nick.toLowerCase())
    );

    // Mapa para busca rápida dos dados dos jogadores
    const dadosMap = new Map(jogadoresFiltrados.map(j => [j.nick.toLowerCase(), j]));

    // Monta as linhas da tabela dos jogadores com o link criado via createOpggLink
    const linhasTabela = jogadoresDoTime.map(nomeJogador => {
      if (nomeJogador.includes('⏳Aguardando')) {
        // Não cria link para jogadores aguardando
        return `
          <tr>
            <td>${nomeJogador}</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
          </tr>
        `;
      }

      const j = dadosMap.get(nomeJogador.toLowerCase());
      if (j) {
        const link = createOpggLink(j.nick);
        return `
          <tr>
            <td>${link.outerHTML}</td>
            <td>${j.kills}</td>
            <td>${j.assistencias}</td>
            <td>${j.danos}</td>
          </tr>
        `;
      } else {
        return `
          <tr>
            <td>${nomeJogador}</td>
            <td>0</td>
            <td>0</td>
            <td>0</td>
          </tr>
        `;
      }
    }).join('');

    // Status do time com cor condicional
    const status = time.statusInscricao || '';
    let statusColor = '';

    switch (status.toLowerCase()) {
      case 'inscrito ✅': statusColor = 'green'; break;
      case 'aguardando pagamento.. ⏳': statusColor = 'orange'; break;
      case 'não inscrito❌':
      case 'nao inscrito❌': statusColor = 'red'; break;
      default: statusColor = '';
    }

    const statusLinha = status ? `<p><strong>Status do time:</strong> <span style="color:${statusColor}; font-weight:bold;">${status}</span></p>` : '';

    const substituicoesCount = Array.isArray(time.entradasSaidas) ? time.entradasSaidas.length : 0;
    const maxSubstituicoes = 2;

    const substituicoesHTML = (time.entradasSaidas || []).map(sub => `
      <p class="substituicao-item">
        ${iconEntrada} Entrada: <strong>${sub.entrada}</strong> &nbsp; - &nbsp; ${iconSaida} Saída: <strong>${sub.saida}</strong>
      </p>
    `).join('');

    // Monta o HTML do modal completo
    const html = `
      <section class="team-hero">
        <img src="${time.logo}" alt="Logo do time ${time.nome}" class="team-logo" />
        <div class="team-info">
          <h1>${time.nome}</h1>
          ${statusLinha}
          <p>${iconCapitao} <strong>Capitão:</strong> ${time.capitao || 'Não definido'}</p>
          <p>${iconSubstituicoes} <strong>Substituições feitas:</strong> ${substituicoesCount} de ${maxSubstituicoes}</p>
          ${substituicoesHTML}
          <p>${time.descricao || ''}</p>
          ${time.linkSite ? `<p><a href="${time.linkSite}" target="_blank" rel="noopener noreferrer">Site do time</a></p>` : ''}
        </div>
      </section>

      <h2>Jogadores e Estatísticas</h2>
      <table>
        <thead>
          <tr>
            <th>Jogador</th>
            <th>Kills</th>
            <th>Assistências</th>
            <th>Danos</th>
          </tr>
        </thead>
        <tbody>
          ${linhasTabela}
        </tbody>
      </table>

      ${time.galeria ? `
      <section class="gallery" aria-label="Galeria de imagens do time ${time.nome}">
        ${time.galeria.map(img => `<img src="${img}" alt="Imagem do time ${time.nome}" loading="lazy" />`).join('')}
      </section>
      ` : ''}

      <style>
        .team-hero {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }
        .team-logo {
          width: 1050px;
          height: 150px;
          object-fit: contain;
          border-radius: 8px;
          border: 1px solid #ccc;
        }
        .team-info p {
          margin: 5px 0;
          font-size: 1rem;
        }
        .substituicao-item {
          margin-left: 30px;
          font-size: 0.95rem;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 0.95rem;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background-color: rgb(37, 37, 37);
          color: white;
        }
        a {
          color: inherit;
          text-decoration: underline;
        }
        a:hover {
          text-decoration: none;
        }
      </style>
    `;

    modalBody.innerHTML = html;

  } catch (e) {
    modalBody.innerHTML = `<p>Erro ao carregar detalhes do time.</p>`;
    console.error(e);
  }
}

// ---------- Função para tratar clique no card do time ----------

function handleCardClick(e) {
  // Evita abrir modal ao clicar em link (ex: link do op.gg)
  if (e.target.tagName === 'A') return;

  const card = e.target.closest('.time-card');
  if (!card) return;
  const tag = card.dataset.tag;
  if (!tag) return;
  loadTeamDetails(tag);
}

// ---------- Função para tratar tecla Enter ou Espaço no card do time ----------

function handleCardKeyDown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleCardClick(e);
  }
}

// ---------- Função inicial que busca times, renderiza e adiciona listeners ----------

async function init() {
  try {
    timesData = await fetchTimes();
    renderTimes(container, timesData, noResults);
  } catch {
    container.textContent = 'Falha ao carregar os times.';
  }

  // Filtro de times conforme texto digitado na busca
  searchInput.addEventListener('input', () => {
    const filtered = filterTimes(timesData, searchInput.value);
    renderTimes(container, filtered, noResults);
  });

  container.addEventListener('click', handleCardClick);
  container.addEventListener('keydown', handleCardKeyDown);
}

init();
