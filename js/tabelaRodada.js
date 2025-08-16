// js/tabelaRodada.js
import { DIAS, MAPAS_POR_DIA, rodadas, PONTOS_POR_COLOCACAO } from './configGlobal.js';

export class TabelaRodada {
  constructor({ logDivId, tabelaId, tituloId }) {
    this.logDiv = logDivId ? document.getElementById(logDivId) : null;
    this.tabelaId = tabelaId;
    this.tituloId = tituloId;
    this.jogadorParaTime = {};
    this.killsPorTime = {};
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
      this.times.forEach(t => {
        t.jogadores.forEach(j => { this.jogadorParaTime[j.nome] = t.nome; });
        this.killsPorTime[t.nome] = 0;
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
          ultimoValido = caminho;
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

    // Reset kills e Win Place por time
    Object.keys(this.killsPorTime).forEach(t => this.killsPorTime[t] = 0);
    const winPlacePorTime = {};

    // Processa cada linha
    data.forEach(linha => {
      const time = this.jogadorParaTime[linha.Name] || linha.TeamName;
      if (!time) return;

      // Soma kills
      const kills = parseInt(linha.Kills) || 0;
      this.killsPorTime[time] = (this.killsPorTime[time] || 0) + kills;

      // Win Place mais alto do time
      const wp = parseInt(linha["Win Place"]) || 0;
      if (!winPlacePorTime[time] || wp > winPlacePorTime[time]) {
        winPlacePorTime[time] = wp;
      }
    });

    // Monta dados da tabela
    const tabelaDados = this.times.map(t => {
      const kills = this.killsPorTime[t.nome] || 0;
      const participou = data.some(l => (this.jogadorParaTime[l.Name] === t.nome) || l.TeamName === t.nome);

      const winPlace = winPlacePorTime[t.nome] || 0;
      const ptsColocacao = PONTOS_POR_COLOCACAO[winPlace] || (winPlace >= 8 ? 1 : 0);
      const pontos = ptsColocacao + kills + (participou ? 1 : 0);

      // Tooltip do time com nomes dos jogadores
      const jogadoresNomes = t.jogadores.map(j => j.nome).join(", ");

      return {
        Time: t.nome,
        Kills: kills,
        Participou: participou,
        Pontos: pontos,
        PontosTooltip: `+ ${ptsColocacao} pts`,
        TimeTooltip: jogadoresNomes
      };
    });

    tabelaDados.sort((a, b) => b.Pontos - a.Pontos || b.Kills - a.Kills);
    tabelaDados.forEach((r, idx) => r.Rank = idx + 1);

    // Render tabela com tooltips
    const thead = "<tr><th>Rank</th><th>Time</th><th>Kills</th><th>Pontos</th></tr>";
    const tbody = tabelaDados.map(r => {
      const classe = r.Participou ? "" : "time-falta";
      return `<tr class="${classe}">
        <td title="${r.PontosTooltip}">${r.Rank}</td>
        <td title="${r.TimeTooltip}">${r.Time}</td>
        <td>${r.Kills}</td>
        <td>${r.Pontos}</td>
      </tr>`;
    }).join("");

    const tabela = $(`#${this.tabelaId}`);
    if ($.fn.DataTable.isDataTable(`#${this.tabelaId}`)) {
      tabela.DataTable().clear().destroy();
    }
    tabela.find("thead").html(thead);
    tabela.find("tbody").html(tbody);
    tabela.DataTable({ paging: false, searching: false, info: false, ordering: true });

    // Atualiza título: DIA | MAPA | Jogo X/Y
    if (this.tituloId) {
      const partes = caminho.split("/"); // ex: ["csv", "DIA1", "jogo2.csv"]
      const dia = partes[1].replace("DIA", "DIA "); // DIA1 -> DIA 1
      const jogoIndex = parseInt(partes[2].replace("jogo", "").replace(".csv", "")); // 2
      const totalJogos = rodadas[partes[1]].length; // total de jogos do dia
      const mapa = MAPAS_POR_DIA[DIAS.indexOf(partes[1])][jogoIndex - 1]; // nome do mapa
      document.getElementById(this.tituloId).textContent = `${dia} | ${mapa} | Jogo ${jogoIndex}/${totalJogos}`;
    }
  }

  async init(selectId) {
    await this.carregarTimes();
    await this.carregarListaEAbrirUltimo(selectId);
  }
}
