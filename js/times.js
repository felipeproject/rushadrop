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
    if (!text.trim()) return null;
    return text;
  } catch {
    return null;
  }
}

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

  let resultado = '';
  if (horas > 0) resultado += `${horas}h `;
  if (minutos > 0) resultado += `${minutos}min `;
  // mostrar segundos somente se não tiver horas
  if (segs > 0 && horas === 0) resultado += `${segs}s`;

  return resultado.trim();
}

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
    const jogadoresDoTime = time.jogadores.map(j => j.replace(/\s*\(.*?\)/g, '').trim());
    const jogadoresFiltrados = jogadoresDetalhados.filter(j =>
      jogadoresDoTime.some(nomeTime => nomeTime.toLowerCase() === j.nick.toLowerCase())
    );
    const dadosMap = new Map(jogadoresFiltrados.map(j => [j.nick.toLowerCase(), j]));

    const linhasTabela = jogadoresDoTime.map(nomeJogador => {
      if (nomeJogador.includes('⏳')) {
        return `
          <tr>
            <td style="text-align:center; font-weight: 500; color: #ddd;">${nomeJogador}</td>
            <td style="text-align:center;">0</td>
            <td style="text-align:center;">0</td>
            <td style="text-align:center;">0</td>
            <td style="text-align:center;">0</td>
            <td style="text-align:center;">0</td>
          </tr>`;
      }
      const j = dadosMap.get(nomeJogador.toLowerCase());
      if (j) {
        const link = createOpggLink(j.nick);
        return `
          <tr>
            <td style="text-align:center; font-weight: 500; color: #ddd;">${link.outerHTML}</td>
            <td style="text-align:center;">${j.kills}</td>
            <td style="text-align:center;">${j.assistencias}</td>
            <td style="text-align:center;">${j.danos}</td>
            <td style="text-align:center;">${formatTempoSobrevivido(j.timeSurvived)}</td>
            <td style="text-align:center;">${j.headshotKills}</td>
          </tr>`;
      } else {
        return `
          <tr>
            <td style="text-align:center; font-weight: 500; color: #ddd;">${nomeJogador}</td>
            <td style="text-align:center;">0</td>
            <td style="text-align:center;">0</td>
            <td style="text-align:center;">0</td>
            <td style="text-align:center;">0</td>
            <td style="text-align:center;">0</td>
          </tr>`;
      }
    }).join('');

    const status = time.statusInscricao || '';
    let statusColor = '';
    switch (status.toLowerCase()) {
      case 'inscrito ✅': statusColor = 'green'; break;
      case 'aguardando pagamento.. ⏳': statusColor = 'orange'; break;
      case 'não inscrito❌':
      case 'nao inscrito❌': statusColor = 'red'; break;
      default: statusColor = '#ccc';
    }

    const substituicoesCount = Array.isArray(time.entradasSaidas) ? time.entradasSaidas.length : 0;
    const substituicoesHTML = (time.entradasSaidas || []).map(sub => `
      <p style="margin-left: 30px; font-size: 0.95rem;">
        ${iconEntrada} Entrada: <strong>${sub.entrada}</strong> &nbsp; - &nbsp; ${iconSaida} Saída: <strong>${sub.saida}</strong>
      </p>
    `).join('');

    const html = `
      <section style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
        <img src="${time.logo}" alt="Logo do time ${time.nome}" style="width: 105px; height: 150px; object-fit: contain; border-radius: 8px; border: 1px solid #ccc;" />
        <div>
          <h1>${time.nome}</h1><br>
          <p>${iconCapitao} <strong>Capitão:</strong> ${time.capitao || 'Não definido'}</p>
          <p>${iconSubstituicoes} <strong>Substituições feitas:</strong> ${substituicoesCount} de 2</p>
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
      <table style="width:100%; border-collapse: collapse; font-size: 0.95rem;">
        <thead>
          <tr style="background-color: #1f1f1f; color: #9ae6b4;">
            <th style="padding: 0.75rem; text-align: center;">Jogador</th>
            <th style="padding: 0.75rem; text-align: center;">Kills</th>
            <th style="padding: 0.75rem; text-align: center;">Assistências</th>
            <th style="padding: 0.75rem; text-align: center;">Danos</th>
            <th style="padding: 0.75rem; text-align: center;">Tempo Sobrevivido</th>
            <th style="padding: 0.75rem; text-align: center;">Headshot</th>
          </tr>
        </thead>
        <tbody>
          ${linhasTabela}
        </tbody>
      </table>

      ${time.galeria ? `
        <section aria-label="Galeria de imagens do time ${time.nome}" style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px;">
          ${time.galeria.map(img => `<img src="${img}" alt="Imagem do time ${time.nome}" loading="lazy" style="max-width: 150px; border-radius: 5px;" />`).join('')}
        </section>
      ` : ''}
    `;

    modalBody.innerHTML = html;
  } catch (e) {
    modalBody.innerHTML = `<p>Erro ao carregar detalhes do time.</p>`;
    console.error(e);
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

init();
