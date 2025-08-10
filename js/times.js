// js/times.js

import { fetchTimes, filterTimes } from './timesService.js';
import { renderTimes } from './timesRenderer.js';
import { createOpggLink } from './createOpggLink.js';
import { rodadas } from './configGlobal.js';

const container = document.getElementById('times-container');
const noResults = document.getElementById('no-results');
const searchInput = document.getElementById('search-bar');

const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

let timesData = [];

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
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

async function fetchCSV(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();
    return text.trim() ? text : null;
  } catch {
    return null;
  }
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return null;
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const row = line.split(',');
    if (row.length !== headers.length) return null;
    return headers.reduce((obj, h, i) => {
      obj[h.trim()] = row[i].trim();
      return obj;
    }, {});
  }).filter(Boolean);
}

async function carregarTodosJogadores() {
  const jogadoresMap = new Map();
  const arquivos = Object.values(rodadas).flat();

  const resultados = await Promise.all(
    arquivos.map(async (arquivo) => {
      const csv = await fetchCSV(arquivo);
      return csv ? parseCSV(csv) : null;
    })
  );

  for (const jogadores of resultados.filter(Boolean)) {
    for (const jogador of jogadores) {
      const nome = jogador.Name;
      const kills = parseInt(jogador.Kills) || 0;
      const damage = parseInt(jogador['Damage Dealt']) || 0;
      const assists = parseInt(jogador.Assists) || 0;
      const winPlace = parseInt(jogador['Win Place']) || Infinity;
      const timeSurvived = parseInt(jogador['Time Survived']) || 0;
      const headshotKills = parseInt(jogador['Headshot Kills']) || 0;

      if (!jogadoresMap.has(nome)) {
        jogadoresMap.set(nome, {
          nick: nome,
          kills,
          danos: damage,
          assistencias: assists,
          bestWinPlace: winPlace,
          timeSurvived,
          headshotKills,
        });
      } else {
        const j = jogadoresMap.get(nome);
        j.kills += kills;
        j.danos += damage;
        j.assistencias += assists;
        j.bestWinPlace = Math.min(j.bestWinPlace, winPlace);
        j.timeSurvived += timeSurvived;
        j.headshotKills += headshotKills;
      }
    }
  }

  return Array.from(jogadoresMap.values()).sort((a, b) => a.bestWinPlace - b.bestWinPlace);
}

const iconCapitao = '⚓';
const iconSubstituicoes = '🔄';
const iconEntrada = '↗️';
const iconSaida = '↙️';

function formatTempoSobrevivido(segundos) {
  if (segundos <= 0) return '0s';
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  return `${horas ? `${horas}h ` : ''}${minutos ? `${minutos}min ` : ''}${segs && !horas ? `${segs}s` : ''}`.trim();
}

const colunas = [
  { key: 'nome', label: 'Jogador', sortable: true, tooltip: '' },
  { key: 'kills', label: 'Kills', sortable: true, tooltip: '' },
  { key: 'assistencias', label: 'Assistências', sortable: true, tooltip: '' },
  { key: 'danos', label: 'Danos', sortable: true, tooltip: '' },
  { key: 'timeSurvived', label: 'Tempo Sobrevivido', sortable: true, tooltip: '' },
  { key: 'headshotKills', label: 'Headshot', sortable: true, tooltip: '' },
  // { 
  //   key: 'kd', label: 'KD', sortable: true,
  //   tooltip: `K/D é a relação entre o número de eliminações (kills) e mortes. Quando o K/D é maior que 1, significa que você elimina mais inimigos do que morre. Essa métrica mostra como você está se saindo nos combates — quanto maior o K/D, melhor seu desempenho.` 
  // }
];

// Estado para ordenação da tabela
let sortColIndex = null;
let sortAsc = true;

// Tooltip
let tooltipEl;
let tooltipLocked = false;

function createTooltip() {
  tooltipEl = document.createElement('div');
  tooltipEl.style.position = 'absolute';
  tooltipEl.style.background = 'rgba(0,0,0,0.85)';
  tooltipEl.style.color = '#fff';
  tooltipEl.style.padding = '6px 10px';
  tooltipEl.style.borderRadius = '5px';
  tooltipEl.style.fontSize = '0.8rem';
  tooltipEl.style.maxWidth = '220px';
  tooltipEl.style.zIndex = '9999';
  tooltipEl.style.pointerEvents = 'none';
  tooltipEl.style.transition = 'opacity 0.2s ease';
  tooltipEl.style.opacity = '0';
  tooltipEl.style.left = '0px';
  tooltipEl.style.top = '0px';
  tooltipEl.style.whiteSpace = 'normal';
  document.body.appendChild(tooltipEl);
}

function showTooltip(el, text) {
  if (!tooltipEl) createTooltip();
  tooltipEl.textContent = text;
  const rect = el.getBoundingClientRect();
  tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
  tooltipEl.style.top = `${rect.top - 32}px`;
  tooltipEl.style.opacity = '1';
  tooltipEl.style.pointerEvents = 'auto';
}

function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.style.opacity = '0';
    tooltipEl.style.pointerEvents = 'none';
  }
}

function toggleTooltipClick(event, el) {
  event.stopPropagation();
  if (tooltipLocked) {
    hideTooltip();
    tooltipLocked = false;
  } else {
    showTooltip(el, colunas[6].tooltip);
    tooltipLocked = true;
  }
}

document.body.addEventListener('click', () => {
  if (tooltipLocked) {
    hideTooltip();
    tooltipLocked = false;
  }
});

function renderTabela(jogadores) {
  // Cabeçalho da tabela com colunas clicáveis
  const theadHTML = `
    <thead>
      <tr style="background-color: #1f1f1f; color: #9ae6b4;">
        ${colunas.map((col, i) => `
          <th
            style="padding: 0.75rem; text-align: center; cursor: pointer; user-select:none;"
            tabindex="0"
            onclick="handleSort(${i})"
            onkeydown="if(event.key==='Enter' || event.key===' ') { event.preventDefault(); handleSort(${i}); }"
          >
            ${col.label}
            ${sortColIndex === i ? (sortAsc ? ' ▲' : ' ▼') : ''}
          </th>
        `).join('')}
      </tr>
    </thead>
  `;

  // Corpo da tabela
  const tbodyHTML = jogadores.map(j => `
    <tr>
      <td style="text-align:center; font-weight: 500; color: #ddd;">${j.nome}</td>
      <td style="text-align:center;">${j.kills}</td>
      <td style="text-align:center;">${j.assistencias}</td>
      <td style="text-align:center;">${j.danos}</td>
      <td style="text-align:center;">${j.timeSurvived}</td>
      <td style="text-align:center;">${j.headshotKills}</td>
      <td
        style="text-align:center; position: relative; cursor: pointer;"
        onclick="toggleTooltipClick(event, this)"
        tabindex="0"
        onkeydown="if(event.key==='Enter' || event.key===' ') { event.preventDefault(); toggleTooltipClick(event, this); }"
      >${j.kd}</td>
    </tr>
  `).join('');

  modalBody.querySelector('#modal-team-table').outerHTML = `
    <table id="modal-team-table" style="width:100%; border-collapse: collapse; font-size: 0.95rem;">
      ${theadHTML}
      <tbody>${tbodyHTML}</tbody>
    </table>
  `;
}

function handleSort(colIndex) {
  if (sortColIndex === colIndex) {
    sortAsc = !sortAsc;
  } else {
    sortColIndex = colIndex;
    sortAsc = true;
  }

  const key = colunas[colIndex].key;

  jogadoresParaTabela.sort((a, b) => {
    let valA = a[key];
    let valB = b[key];

    if (key === 'timeSurvived') {
      valA = a.timeSurvivedRaw;
      valB = b.timeSurvivedRaw;
    }
    if (key === 'kd') {
      valA = a.kdRaw;
      valB = b.kdRaw;
    }

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  renderTabela(jogadoresParaTabela);
}

let jogadoresParaTabela = [];

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

    // Map de jogadores CSV para fácil busca
    const dadosMap = new Map(
      jogadoresDetalhados.map(j => [j.nick.toLowerCase(), j])
    );

    // Prepara jogadores para a tabela (com valores para sort)
    jogadoresParaTabela = time.jogadores
      .filter(jogadorTime => jogadorTime.nome && jogadorTime.nome !== '*')
      .map(jogadorTime => {
        const nomeLimpo = jogadorTime.nome.trim();
        const dadosCsv = dadosMap.get(nomeLimpo.toLowerCase());
        const link = dadosCsv ? createOpggLink(dadosCsv.nick).outerHTML : nomeLimpo;

        const kd = jogadorTime.KD ?? 0;
        return {
          nome: link,
          kills: dadosCsv?.kills || 0,
          assistencias: dadosCsv?.assistencias || 0,
          danos: dadosCsv?.danos || 0,
          timeSurvived: formatTempoSobrevivido(dadosCsv?.timeSurvived || 0),
          timeSurvivedRaw: dadosCsv?.timeSurvived || 0,
          headshotKills: dadosCsv?.headshotKills || 0,
          // kd: kd.toFixed(2),
          // kdRaw: kd,
        };
      });

    const status = time.statusInscricao || '';
    const statusColor = {
      'inscrito ✅': 'green',
      'aguardando pagamento ⏳': 'orange',
      'não inscrito❌': 'red',
      'nao inscrito❌': 'red',
    }[status.toLowerCase()] || '#ccc';

    const substituicoesHTML = (time.entradasSaidas || []).map(sub => `
      <p style="margin-left: 30px; font-size: 0.95rem;">
        ${iconEntrada} Entrada: <strong>${sub.entrada}</strong> &nbsp; - &nbsp; ${iconSaida} Saída: <strong>${sub.saida}</strong>
      </p>`).join('');

    const html = `
      <section style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
        <img src="${time.logo}" alt="Logo do time ${time.nome}" style="width: 105px; height: 150px; object-fit: contain;" />
        <div>
          <h1>${time.nome}</h1><br>
          <p>${iconCapitao} <strong>Capitão:</strong> ${time.capitao || 'Não definido'}</p>
          <p>${iconSubstituicoes} <strong>Substituições feitas:</strong> ${(time.entradasSaidas || []).length} de 2</p>
          ${substituicoesHTML}
          <p>${time.descricao || ''}</p>
          ${time.linkSite ? `<p><br><a href="${time.linkSite}" target="_blank" rel="noopener noreferrer" style="color:#9ae6b4;">Site do time</a></p>` : ''}
          <p><strong>ID do time:</strong> ${time.id || 'Não informado'}</p>
        </div>
      </section>

      <div style="text-align: right; margin-bottom: 10px; font-weight: bold; font-size: 1.1rem; color: ${statusColor};">
        <strong>Status do time:</strong> ${status}
      </div>

      <h2>Jogadores e Estatísticas</h2>
      <table id="modal-team-table" style="width:100%; border-collapse: collapse; font-size: 0.95rem;">
        <!-- tabela será gerada aqui -->
      </table>

      ${time.galeria ? `
        <section style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px;">
          ${time.galeria.map(img => `<img src="${img}" alt="Imagem do time ${time.nome}" loading="lazy" style="max-width: 150px; border-radius: 5px;" />`).join('')}
        </section>
      ` : ''}
    `;

    modalBody.innerHTML = html;

    renderTabela(jogadoresParaTabela);

    aplicarEstilosResponsivosInline();

  } catch (e) {
    modalBody.innerHTML = `<p>Erro ao carregar detalhes do time.</p>`;
    console.error(e);
  }
}

function aplicarEstilosResponsivosInline() {
  if (window.innerWidth > 768) return;

  modalBody.parentElement.style.padding = '10px';
  modalBody.parentElement.style.maxWidth = '95%';
  modalBody.parentElement.style.margin = '0 auto';
  modalBody.parentElement.style.overflowY = 'auto';
  modalBody.parentElement.style.maxHeight = '90vh';

  const section = modalBody.querySelector('section');
  if (section) {
    section.style.flexDirection = 'column';
    section.style.alignItems = 'center';
    section.style.textAlign = 'center';
  }

  const logo = modalBody.querySelector('section img');
  if (logo) {
    logo.style.width = '80px';
    logo.style.height = '100px';
  }

  const table = modalBody.querySelector('table');
  if (table) {
    table.style.fontSize = '0.8rem';
    table.style.overflowX = 'auto';
  }
}

function handleCardClick(e) {
  if (e.target.tagName === 'A') return;
  const card = e.target.closest('.time-card');
  if (!card) return;
  const tag = card.dataset.tag;
  if (!tag) return;
  loadTeamDetails(tag);
}

function handleCardKeyDown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleCardClick(e);
  }
}

async function init() {
  try {
    timesData = await fetchTimes();
    renderTimes(container, timesData, noResults);
  } catch {
    container.textContent = 'Falha ao carregar os times.';
  }

  searchInput.addEventListener('input', () => {
    const filtered = filterTimes(timesData, searchInput.value);
    renderTimes(container, filtered, noResults);
  });

  container.addEventListener('click', handleCardClick);
  container.addEventListener('keydown', handleCardKeyDown);
}

// Tornar funções globais para chamada inline no HTML
window.handleSort = handleSort;
window.toggleTooltipClick = toggleTooltipClick;

init();
