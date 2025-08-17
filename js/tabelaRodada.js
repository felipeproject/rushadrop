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

      return Papa.parse(texto, { header: true, skipEmptyLines: true }).data;
    } catch (e) {
      this.log(`Erro ao carregar ${url}: ${e}`);
      return null;
    }
  }

  calcularPontos(rank, kills, participou = true) {
    if (!participou) return 0;

    let ptsColocacao = PONTOS_POR_COLOCACAO[rank] || 0;
    return ptsColocacao + kills + 1; // +1 por participação
  }

  async carregarCSV(caminho) {
    const data = await this.csvValido(caminho) || [];

    const killsPorTime = {};
    const melhorPlacePorTime = {};

    this.times.forEach(t => {
      killsPorTime[t.nome] = 0;
      melhorPlacePorTime[t.nome] = Infinity;
    });

    data.forEach(linha => {
      const nomeJogador = linha.Name;
      const time = this.jogadorParaTime[nomeJogador];
      if (!time) return;

      const kills = parseInt(linha.Kills) || 0;
      const winPlace = parseInt(linha["Win Place"]) || 99;

      killsPorTime[time] += kills;
      if (winPlace < melhorPlacePorTime[time]) melhorPlacePorTime[time] = winPlace;
    });

    const tabelaDados = this.times.map(t => {
      const place = melhorPlacePorTime[t.nome] === Infinity ? 99 : melhorPlacePorTime[t.nome];
      const totalKills = killsPorTime[t.nome] || 0;
      const participacao = place !== 99 ? true : false;
      const total = this.calcularPontos(place, totalKills, participacao);

      return { Place: place, Time: t.nome, Kills: totalKills, Total: total, Participou: participacao };
    });

    tabelaDados.sort((a, b) => {
      if (b.Total !== a.Total) return b.Total - a.Total;
      if (b.Kills !== a.Kills) return b.Kills - a.Kills;
      return a.Place - b.Place;
    });

    const thead = `
      <tr>
        <th>Rank</th>
        <th>Place</th>
        <th>Time</th>
        <th>Kills</th>
        <th>Total</th>
      </tr>`;

    const tbody = tabelaDados.map((r, idx) => `
      <tr${!r.Participou ? ' class="time-falta"' : ''}>
        <td>${idx + 1}</td>
        <td>${r.Place === 99 ? '-' : r.Place}</td>
        <td>${r.Time}</td>
        <td>${r.Kills}</td>
        <td><b>${r.Total}</b></td>
      </tr>`).join("");

    const tabela = $(`#${this.tabelaId}`);
    if ($.fn.DataTable.isDataTable(`#${this.tabelaId}`)) tabela.DataTable().clear().destroy();
    tabela.find("thead").html(thead);
    tabela.find("tbody").html(tbody);
    tabela.DataTable({ paging: false, searching: false, info: false, ordering: false });

    if (this.tituloId) {
      const partes = caminho.split("/");
      const dia = partes[1].replace("DIA", "DIA ");
      const jogoNum = parseInt(partes[2].replace("jogo", "").replace(".csv", ""));
      const totalJogos = rodadas[partes[1]].length;
      const mapaIndex = jogoNum - 1;
      const mapa = MAPAS_POR_DIA[DIAS.indexOf(partes[1])][mapaIndex];

      document.getElementById(this.tituloId).textContent = `${dia} | ${mapa} | Jogo ${jogoNum}/${totalJogos}`;

      const imgMapa = document.getElementById('imagemMapa');
      if (imgMapa) {
        imgMapa.src = `imagens/mapas/${mapa}.jpg`;
        imgMapa.alt = `Mapa: ${mapa}`;
      }
    }
  }

  async carregarListaEAbrirUltimo(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = "";
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

  async init(selectId) {
    await this.carregarTimes();
    await this.carregarListaEAbrirUltimo(selectId);
  }
}
