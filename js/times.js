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
let jogadoresParaTabela = [];

// Funções de abrir e fechar modal
function openModal() {
  modal.setAttribute('aria-hidden', 'false');
  modalBody.focus();
}

function closeModal() {
  modal.setAttribute('aria-hidden', 'true');
  modalBody.innerHTML = '';
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
    closeModal();
  }
});

// Busca CSV
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

// Parse CSV
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

// Carregar todos jogadores
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

// Ícones
const iconCapitao = '⚓';
const iconSubstituicoes = '🔄';
const iconEntrada = '↗️';
const iconSaida = '↙️';

// Formatar tempo
function formatTempoSobrevivido(segundos) {
  if (segundos <= 0) return '0s';
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  return `${horas ? `${horas}h ` : ''}${minutos ? `${minutos}min ` : ''}${segs && !horas ? `${segs}s` : ''}`.trim();
}

// Colunas da tabela
const colunas = [
  { key: 'nome', label: 'Jogador', sortable: true, tooltip: '' },
  { key: 'kills', label: 'Kills', sortable: true, tooltip: '' },
  { key: 'assistencias', label: 'Assistências', sortable: true, tooltip: '' },
  { key: 'danos', label: 'Danos', sortable: true, tooltip: '' },
  { key: 'headshotKills', label: 'Headshot', sortable: true, tooltip: '' },
  { key: 'timeSurvived', label: 'Tempo Sobrevivido', sortable: true, tooltip: '' },
];

let sortColIndex = null;
let sortAsc = true;

let tooltipEl;
let tooltipLocked = false;

function createTooltip() {
  tooltipEl = document.createElement('div');
  Object.assign(tooltipEl.style, {
    position: 'absolute',
    background: 'rgba(0,0,0,0.85)',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '5px',
    fontSize: '0.8rem',
    maxWidth: '220px',
    zIndex: '9999',
    pointerEvents: 'none',
    transition: 'opacity 0.2s ease',
    opacity: '0',
    left: '0px',
    top: '0px',
    whiteSpace: 'normal',
  });
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

function toggleTooltipClick(e, el) {
  e.stopPropagation();
  if (tooltipLocked) {
    hideTooltip();
    tooltipLocked = false;
  } else {
    showTooltip(el, colunas.find(c => c.key === 'headshotKills').tooltip);
    tooltipLocked = true;
  }
}

document.body.addEventListener('click', () => {
  if (tooltipLocked) {
    hideTooltip();
    tooltipLocked = false;
  }
});

// Renderizar tabela
function renderTabela(jogadores) {
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
  const tbodyHTML = jogadores.map(j => `
  <tr>
    <td style="text-align:center; font-weight: 500; color: #ddd;">${j.nome}</td>
    <td style="text-align:center;">${j.kills}</td>
    <td style="text-align:center;">${j.assistencias}</td>
    <td style="text-align:center;">${j.danos}</td>
    <td style="text-align:center;">${j.headshotKills}</td>
    <td style="text-align:center;">${j.timeSurvived}</td>
  </tr>
`).join('')

  const tableHTML = `
    <table style="width:100%; border-collapse: collapse; font-size: 0.95rem;">
      ${theadHTML}
      <tbody>${tbodyHTML}</tbody>
    </table>
  `;

  // Remove tabela antiga se existir
  const oldTable = document.querySelector('#modal-team-table');
  if (oldTable) oldTable.remove();

  const containerTable = document.createElement('div');
  containerTable.id = 'modal-team-table';
  containerTable.innerHTML = tableHTML;
  modalBody.appendChild(containerTable);
}

// Funciona para ordenar
async function handleSort(colIndex) {
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

// Carregar detalhes do time
async function loadTeamDetails(tag) {
  // Proteção: verifica se a tag existe na lista de times
  const time = Array.isArray(timesData) && timesData.find(t => t.tag && t.tag.toLowerCase() === tag.toLowerCase());
  if (!time) {
    modalBody.innerHTML = `<p>Time não encontrado ou dados incompletos.</p>`;
    openModal();
    return;
  }

  modalBody.innerHTML = `<p>Carregando dados...</p>`;
  openModal();

  try {
    const jogadoresDetalhados = await carregarTodosJogadores();

    const dadosMap = new Map(
      jogadoresDetalhados.map(j => [j.nick.toLowerCase(), j])
    );

    jogadoresParaTabela = time.jogadores
      .filter(j => j.nome && j.nome !== '*')
      .map(jogadorTime => {
        const nomeLimpo = jogadorTime.nome.trim();
        const dadosCsv = dadosMap.get(nomeLimpo.toLowerCase());
        const link = dadosCsv ? createOpggLink(dadosCsv.nick).outerHTML : nomeLimpo;

        return {
          nome: link,
          kills: dadosCsv?.kills || 0,
          assistencias: dadosCsv?.assistencias || 0,
          danos: dadosCsv?.danos || 0,
          timeSurvived: dadosCsv ? formatTempoSobrevivido(dadosCsv.timeSurvived) : '0s',
          timeSurvivedRaw: dadosCsv?.timeSurvived || 0,
          headshotKills: dadosCsv?.headshotKills || 0,
        };
      });

    const status = (time.statusInscricao || '').toLowerCase();
    const statusColor = {
      'inscrito ✅': 'green',
      'aguardando pagamento ⏳': 'orange',
      'não inscrito❌': 'red',
      'nao inscrito❌': 'red',
    }[status] || '#ccc';

    const substituicoesHTML = (time.entradasSaidas || []).map(sub => `
      <p style="margin-left: 30px; font-size: 0.95rem;">
        ${iconEntrada} <strong>Entrada:</strong> ${sub.entrada} &nbsp; - &nbsp; ${iconSaida} <strong>Saída:</strong> ${sub.saida}
      </p>
    `).join('');

    const html = `
      <section style="display: flex; flex-wrap: wrap; gap: 15px; align-items: flex-start;">
        <img src="${time.logo}" alt="Logo do time ${time.nome}" style="width: 105px; height: 150px; object-fit: contain;" />
        <div>
          <h1>${time.nome}</h1>
          <p>${iconCapitao} <strong>Capitão:</strong> ${time.capitao || 'Não definido'}</p>
          <p>${iconSubstituicoes} <strong>Substituições feitas:</strong> ${time.entradasSaidas.length} de 2</p>
          ${substituicoesHTML}
          <p>${time.descricao || ''}</p>
          ${time.linkSite ? `<p><br><a href="${time.linkSite}" target="_blank" rel="noopener noreferrer" style="color:#9ae6b4;">Site do time</a></p>` : ''}
          <p><strong>ID do time:</strong> ${time.id || 'Não informado'}</p>
        </div>
      </section>
      <div style="text-align: right; margin-bottom: 10px; font-weight: bold; font-size: 1.1rem; color: ${statusColor};">
        <strong>Status do time:</strong> ${time.statusInscricao}
      </div>
      <h2>Jogadores e Estatísticas</h2>
      <div id="modal-team-table"></div>
      ${time.galeria ? `
        <section style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px;">
          ${time.galeria.map(img => `<img src="${img}" alt="Imagem do time ${time.nome}" loading="lazy" style="max-width: 150px; border-radius: 5px;">`).join('')}
        </section>
      ` : ''}
    `;

    modalBody.innerHTML = html;
    renderTabela(jogadoresParaTabela);
    aplicarEstilosResponsivosInline();

  } catch (e) {
    modalBody.innerHTML = `<p>Erro ao carregar detalhes do time.</p>`;
  }
}

// Estilos responsivos
function aplicarEstilosResponsivosInline() {
  if (window.innerWidth > 768) return;
  Object.assign(modalBody.parentElement.style, {
    padding: '10px',
    maxWidth: '95%',
    margin: '0 auto',
    overflowY: 'auto',
    maxHeight: '90vh',
  });
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

// Manipulação clique na carta
function handleCardClick(e) {
  if (e.target.tagName === 'A') return;
  const card = e.target.closest('.time-card');
  if (!card) return;
  const tag = card.dataset.tag;
  if (!tag) return; // evita erro
  loadTeamDetails(tag);
}

function handleCardKeyDown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleCardClick(e);
  }
}

// Init
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

// Tornar funções globais
window.handleSort = handleSort;
window.toggleTooltipClick = toggleTooltipClick;

// Executar
init();