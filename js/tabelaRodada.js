// js/tabelaRodada.js
import { DIAS, MAPAS_POR_DIA, rodadas, PONTOS_POR_COLOCACAO } from './configGlobal.js';

export class TabelaRodada {
  constructor({ logDivId, tabelaId, tituloId }) {
    this.logDiv = logDivId ? document.getElementById(logDivId) : null;
    this.tabelaId = tabelaId;
    this.tituloId = tituloId;
    this.jogadorParaTime = {};
    this.times = [];
  }

  log(msg) {
    if (!this.logDiv) return;
    const now = new Date().toLocaleTimeString();
    this.logDiv.textContent += `[${now}] ${msg}\n`;
    this.logDiv.scrollTop = this.logDiv.scrollHeight;
  }

  async carregarTimes() {
    try {
      const res = await fetch("dados/times.json");
      if (!res.ok) { this.log("Erro: times.json não encontrado"); return; }
      this.times = await res.json();

      // Mapear jogadores para times
      this.jogadorParaTime = {};
      this.times.forEach(t => {
        t.jogadores.forEach(j => {
          this.jogadorParaTime[j.nome] = t.nome;
        });
      });

      this.log("Times carregados com sucesso");
    } catch (e) {
      this.log("Erro ao carregar times.json: " + e);
    }
  }

  async csvValido(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) { this.log(`Arquivo ${url} não encontrado`); return null; }
      const texto = await res.text();
      if (!texto.trim()) { this.log(`Arquivo ${url} vazio`); return null; }

      const data = Papa.parse(texto, { header: true, skipEmptyLines: true }).data;
      const temKill = data.some(l => parseInt(l["Kills"]) > 0);
      if (!temKill) { this.log(`Arquivo ${url} sem kills`); return null; }

      return data;
    } catch (e) {
      this.log(`Erro ao carregar ${url}: ${e}`);
      return null;
    }
  }

  async carregarListaEAbrirUltimo(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = ""; // Limpa opções anteriores
    let ultimoValido = null;

    for (let i = 0; i < DIAS.length; i++) {
      const dia = DIAS[i];
      const optgroup = document.createElement("optgroup");
      optgroup.label = dia;

      for (let j = 0; j < rodadas[dia].length; j++) {
        const caminho = rodadas[dia][j];
        const data = await this.csvValido(caminho);
        if (data) {
          const option = document.createElement("option");
          option.value = caminho;
          option.textContent = MAPAS_POR_DIA[i][j];
          optgroup.appendChild(option);
          ultimoValido = caminho; // grava o último válido
        }
      }

      select.appendChild(optgroup);
    }

    if (ultimoValido) {
      select.value = ultimoValido;
      await this.carregarCSV(ultimoValido);
    }
  }

  async carregarCSV(caminho) {
    const data = await this.csvValido(caminho) || [];

    // Inicializa os acumuladores
    const killsPorTime = {}; // soma de kills por time
    const lastDeathByTime = {}; // última morte (menor tempo de sobrevivência) por time

    // Inicializa os objetos
    this.times.forEach(t => {
      killsPorTime[t.nome] = 0;
      lastDeathByTime[t.nome] = { deathTime: Infinity, winPlace: 0 };
    });

    // Processa as linhas do CSV
    data.forEach(linha => {
      const nomeJogador = linha.Name;
      const time = this.jogadorParaTime[nomeJogador];
      if (!time) return;

      const kills = parseInt(linha["Kills"]) || 0;
      const timeSurvived = parseFloat(linha["Time Survived"]) || Infinity;
      const winPlace = parseInt(linha["Win Place"]) || 0;

      // Soma kills ao time
      killsPorTime[time] += kills;

      // Verifica se essa morte é a mais próxima (menor tempo de sobrevivência)
      if (timeSurvived < lastDeathByTime[time].deathTime) {
        lastDeathByTime[time] = { deathTime: timeSurvived, winPlace: winPlace };
      }
    });

    // Cria array de times com seus dados
    const tabelaDados = this.times.map(t => {
      const totalKills = killsPorTime[t.nome] || 0;
      const winPlaceTime = lastDeathByTime[t.nome]?.winPlace || 0;
      return {
        Rank: 0, // será atualizado após ordenação
        Time: t.nome,
        TotalKills: totalKills,
        WinPlace: winPlaceTime
      };
    });

    // Ordena pelo WinPlace asc, depois por Kills desc
    tabelaDados.sort((a, b) => {
      if (a.WinPlace !== b.WinPlace) {
        return a.WinPlace - b.WinPlace; // menor WinPlace primeiro
      }
      return b.TotalKills - a.TotalKills; // maior kills em caso de empate
    });

    // Atribui ranks após ordenação
    tabelaDados.forEach((r, idx) => r.Rank = idx + 1);

    // Renderiza a tabela
    const thead = "<tr><th>Win Place</th><th>Time</th><th>Kills</th></tr>";
    const tbody = tabelaDados.map(r => {
      return `<tr>
        <td>${r.WinPlace}</td>
        <td>${r.Time}</td>
        <td>${r.TotalKills}</td>
      </tr>`;
    }).join("");

    const tabela = $(`#${this.tabelaId}`);
    if ($.fn.DataTable.isDataTable(`#${this.tabelaId}`)) {
      tabela.DataTable().clear().destroy();
    }
    tabela.find("thead").html(thead);
    tabela.find("tbody").html(tbody);
    tabela.DataTable({ paging: false, searching: false, info: false, order: false });

    // Atualiza o título e a imagem do mapa
    if (this.tituloId) {
      const partes = caminho.split("/"); // exemplo: ["csv", "DIA1", "jogo2.csv"]
      const dia = partes[1].replace("DIA", "DIA ");
      const jogoNum = parseInt(partes[2].replace("jogo", "").replace(".csv", ""));
      const totalJogos = rodadas[partes[1]].length;
      const mapaIndex = jogoNum - 1;
      const mapa = MAPAS_POR_DIA[DIAS.indexOf(partes[1])][mapaIndex];

      // Atualiza o título da tabela
      document.getElementById(this.tituloId).textContent = `${dia} | ${mapa} | Jogo ${jogoNum}/${totalJogos}`;

      // Atualiza a imagem do mapa
      const imgMapa = document.getElementById('imagemMapa');
      if (imgMapa) {
        imgMapa.src = `imagens/mapas/${mapa}.jpg`; // ajuste o caminho e extensão se necessário
        imgMapa.alt = `Mapa: ${mapa}`;
      }
    }
  }

  async init(selectId) {
    await this.carregarTimes();
    await this.carregarListaEAbrirUltimo(selectId);
  }
}