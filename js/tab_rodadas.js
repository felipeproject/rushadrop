import { rodadas, mapas, PONTOS_POR_COLOCACAO } from './configGlobal.js';

const PONTOS_PADRAO = 1;
const MAPA_IMG_TAMANHO = 200; // px

let rodadaAtual = null;
let jogoIndexAtual = 0;
let timesGlobais = null;

function pontosPorColocacao(pos) {
  return PONTOS_POR_COLOCACAO[pos] || PONTOS_PADRAO;
}

function formatarNumero(num) {
  return Math.round(num).toLocaleString('pt-BR');
}

// Carrega o JSON externo
async function carregarTimes() {
  const resp = await fetch('./dados/times.json');
  if (!resp.ok) throw new Error('Erro ao carregar lista de times');
  return await resp.json();
}

// Converte JSON detalhado para objeto { nomeTime: [jogadores] }
function converterTimes(jsonTimes) {
  const timesObj = {};
  jsonTimes.forEach(time => {
    timesObj[time.nome] = time.jogadores;
  });
  return timesObj;
}

function encontrarTime(jogador, timesObj) {
  for (const [time, jogadores] of Object.entries(timesObj)) {
    if (jogadores.includes(jogador)) return time;
  }
  return null;
}

async function processarJogo(arquivo, times) {
  const resp = await fetch(arquivo);
  if (!resp.ok) throw new Error(`Erro ao carregar: ${arquivo}`);

  const text = await resp.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

  if (parsed.data.length === 0) throw new Error(`Jogo vazio: ${arquivo}`);

  const killsPorTime = {};
  const melhorPosPorTime = {};

  parsed.data.forEach(row => {
    const jogador = row['Name']?.trim();
    const kills = Number(row['Kills']);
    const pos = Number(row['Win Place']);
    if (!jogador || isNaN(kills) || isNaN(pos)) return;
    const time = encontrarTime(jogador, times);
    if (!time) return;

    killsPorTime[time] = (killsPorTime[time] || 0) + kills;
    if (!melhorPosPorTime[time] || pos < melhorPosPorTime[time]) {
      melhorPosPorTime[time] = pos;
    }
  });

  const geralJogo = {};
  for (const time in killsPorTime) {
    const kills = killsPorTime[time];
    const pos = melhorPosPorTime[time];
    const pontos = pontosPorColocacao(pos) + kills;
    geralJogo[time] = { kills, pontos };
  }

  return geralJogo;
}

function btnStyle() {
  return `
    cursor: pointer;
    background-color: #222;
    border: none;
    color: #eee;
    font-size: 1.5rem;
    padding: 0 12px;
    border-radius: 6px;
    transition: background-color 0.3s ease;
    user-select: none;
  `;
}

function criarBarraDetalhes() {
  const containerPai = document.getElementById('rodada-container').parentNode;
  let barra = document.getElementById('barra-detalhes');

  if (!barra) {
    barra = document.createElement('div');
    barra.id = 'barra-detalhes';
    barra.style.cssText = `
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 8px 16px;
      margin-bottom: 12px;
      background-color: rgba(0,0,0,0.7);
      border-radius: 8px;
      color: #eee;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    `;
    containerPai.insertBefore(barra, document.getElementById('rodada-container'));
  }

  barra.innerHTML = '';

  const nomeMapa = mapas[rodadaAtual]?.[jogoIndexAtual] || 'Desconhecido';
  const imgMapa = document.createElement('img');
  imgMapa.src = `imagens/mapas/${nomeMapa.toLowerCase()}.png`;
  imgMapa.alt = nomeMapa;
  imgMapa.title = nomeMapa;
  imgMapa.style.cssText = `
    width: ${MAPA_IMG_TAMANHO}px;
    height: ${MAPA_IMG_TAMANHO}px;
    border-radius: 6px;
    object-fit: cover;
    box-shadow: 0 0 5px rgba(0,0,0,0.8);
  `;

  const textoMapa = document.createElement('div');
  textoMapa.textContent = `${nomeMapa} — Jogo ${jogoIndexAtual + 1} de ${rodadas[rodadaAtual].length} (${rodadaAtual})`;
  textoMapa.style.cssText = `
    font-weight: 600;
    font-size: 1.1rem;
    user-select: none;
    flex-grow: 1;
  `;

  // Botões Navegação
  const btnPrev = document.createElement('button');
  btnPrev.id = 'btn-prev';
  btnPrev.textContent = '‹';
  btnPrev.title = 'Jogo anterior';
  btnPrev.style.cssText = btnStyle();

  const btnNext = document.createElement('button');
  btnNext.id = 'btn-next';
  btnNext.textContent = '›';
  btnNext.title = 'Próximo jogo';
  btnNext.style.cssText = btnStyle();

  btnPrev.addEventListener('click', () => {
    if (jogoIndexAtual > 0) {
      jogoIndexAtual--;
      criarTabelaJogo(rodadaAtual, jogoIndexAtual);
    }
  });

  btnNext.addEventListener('click', () => {
    if (jogoIndexAtual < rodadas[rodadaAtual].length - 1) {
      jogoIndexAtual++;
      criarTabelaJogo(rodadaAtual, jogoIndexAtual);
    }
  });

  barra.appendChild(imgMapa);
  barra.appendChild(textoMapa);
  barra.appendChild(btnPrev);
  barra.appendChild(btnNext);

  atualizarBotoesNavegacao();
}

function atualizarBotoesNavegacao() {
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  if (!btnPrev || !btnNext) return;

  btnPrev.disabled = jogoIndexAtual <= 0;
  btnNext.disabled = jogoIndexAtual >= (rodadas[rodadaAtual].length - 1);

  btnPrev.style.opacity = btnPrev.disabled ? '0.5' : '1';
  btnNext.style.opacity = btnNext.disabled ? '0.5' : '1';

  btnPrev.style.cursor = btnPrev.disabled ? 'default' : 'pointer';
  btnNext.style.cursor = btnNext.disabled ? 'default' : 'pointer';
}

async function criarTabelaJogo(rodada, jogoIndex) {
  const container = document.getElementById('rodada-container');
  container.textContent = 'Carregando jogo...';

  if (!rodadas[rodada]) {
    container.textContent = 'Rodada não encontrada.';
    return;
  }

  const arquivo = rodadas[rodada][jogoIndex];
  if (!arquivo) {
    container.textContent = 'Jogo não encontrado.';
    return;
  }

  // Carrega times globais uma vez
  const timesJson = await carregarTimes();
  timesGlobais = converterTimes(timesJson);

  let geralJogo;
  try {
    geralJogo = await processarJogo(arquivo, timesGlobais);
  } catch (err) {
    // Mensagem amigável para o usuário, substituindo erro técnico:
    container.textContent = 'Dados do jogo ainda não disponíveis. Por favor, tente novamente mais tarde.';
    return;
  }

  const geralArray = Object.entries(geralJogo)
    .map(([time, stats]) => ({ time, kills: stats.kills, pontos: stats.pontos }))
    .sort((a, b) => b.pontos - a.pontos);

  const colunas = ['Rank', 'Time', 'Kills no Jogo', 'Pontos no Jogo'];
  const table = document.createElement('table');
  table.classList.add('tabela-rodadas'); // Estilo via CSS no HTML

  criarBarraDetalhes();

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
    tr.classList.add(idx % 2 === 0 ? 'linha-par' : 'linha-impar');
    [idx + 1, item.time, formatarNumero(item.kills), formatarNumero(item.pontos)].forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  container.textContent = '';
  container.appendChild(table);
  atualizarBotoesNavegacao();
}

async function encontrarUltimoJogoValido() {
  const rodadasKeys = Object.keys(rodadas);
  for (let i = rodadasKeys.length - 1; i >= 0; i--) {
    const rodada = rodadasKeys[i];
    for (let j = rodadas[rodada].length - 1; j >= 0; j--) {
      const arquivo = rodadas[rodada][j];
      try {
        const resp = await fetch(arquivo, { method: 'HEAD' });
        if (!resp.ok) continue;
        const respGet = await fetch(arquivo);
        if (!respGet.ok) continue;
        const text = await respGet.text();
        if (text.trim().length > 0) return { rodada, jogoIndex: j };
      } catch { continue; }
    }
  }
  return { rodada: Object.keys(rodadas)[0], jogoIndex: 0 };
}

async function popularSelectorRodadas() {
  const selector = document.getElementById('rodada-selector');
  Object.keys(rodadas).forEach(r => {
    const option = document.createElement('option');
    option.value = r;
    option.textContent = r;
    selector.appendChild(option);
  });

  selector.addEventListener('change', e => {
    rodadaAtual = e.target.value;
    jogoIndexAtual = 0;
    criarTabelaJogo(rodadaAtual, jogoIndexAtual);
  });

  const ultimoJogo = await encontrarUltimoJogoValido();
  rodadaAtual = ultimoJogo.rodada;
  jogoIndexAtual = ultimoJogo.jogoIndex;
  selector.value = rodadaAtual;
  criarTabelaJogo(rodadaAtual, jogoIndexAtual);
}

popularSelectorRodadas();
