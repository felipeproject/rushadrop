// js/TabelaGeral.js
import { DIAS, rodadas, PONTOS_POR_COLOCACAO } from './configGlobal.js';

export class TabelaGeral {
  constructor({ containerId }) {
    this.container = document.getElementById(containerId);
    this.jogadorParaTime = {};
    this.killsPorTime = {};
    this.times = [];
    this.timesInfo = {};
  }

  async carregarTimes() {
    try {
      const res = await fetch("dados/times.json");
      if (!res.ok) return;
      this.times = await res.json();
      this.times.forEach(t => {
        t.jogadores.forEach(j => this.jogadorParaTime[j.nome] = t.nome);
        this.killsPorTime[t.nome] = 0;
        this.timesInfo[t.nome] = t;
      });
    } catch (e) {
      console.error("Erro ao carregar times:", e);
    }
  }

  async carregarTodosCSVs() {
    let todosDados = [];
    for (let dia of DIAS) {
      for (let csv of rodadas[dia]) {
        try {
          const res = await fetch(csv);
          if (!res.ok) continue;
          const texto = await res.text();
          if (!texto.trim()) continue;
          const data = Papa.parse(texto, { header: true, skipEmptyLines: true }).data;
          todosDados.push(...data);
        } catch (e) {
          console.warn("Erro ao carregar CSV:", csv, e);
        }
      }
    }
    return todosDados;
  }

  calcularPontos(rank, kills, participou = true) {
    const ptsColocacao = PONTOS_POR_COLOCACAO[rank] ?? (rank >= 8 ? 1 : 0);
    return ptsColocacao + kills + (participou ? 1 : 0);
  }

  async init() {
    await this.carregarTimes();
    const todosDados = await this.carregarTodosCSVs();

    Object.keys(this.killsPorTime).forEach(t => this.killsPorTime[t] = 0);

    todosDados.forEach(linha => {
      const time = this.jogadorParaTime[linha["Name"]];
      const kills = parseInt(linha["Kills"]) || 0;
      if (time) this.killsPorTime[time] += kills;
    });

    const tabelaDados = this.times.map(t => {
      const kills = this.killsPorTime[t.nome] || 0;
      const participou = todosDados.some(l => this.jogadorParaTime[l["Name"]] === t.nome);
      const pontos = todosDados
        .filter(l => this.jogadorParaTime[l["Name"]] === t.nome)
        .reduce((sum, l) => {
          const rank = parseInt(l["Win Place"]) || 0;
          const k = parseInt(l["Kills"]) || 0;
          return sum + this.calcularPontos(rank, k, true);
        }, 0);
      return { Time: t.nome, Kills: kills, Participou: participou, Pontos: pontos };
    });

    tabelaDados.sort((a, b) => b.Pontos - a.Pontos || b.Kills - a.Kills);
    tabelaDados.forEach((r, idx) => r.Rank = idx + 1);

    const thead = `
      <tr>
        <th>Rank</th>
        <th></th>
        <th>Time</th>
        <th>Kills</th>
        <th>Pontos</th>
      </tr>`;

    const tbody = tabelaDados.map(r => {
      const infoTime = this.timesInfo[r.Time];
      const jogadores = infoTime ? infoTime.jogadores.map(j => j.nome).join(", ") : "";
      const logoNome = infoTime && infoTime.nome
        ? infoTime.nome.replace(/\s+/g, "_").replace(/[^\w\-]/g, "")
        : "";
      const logo = logoNome ? `imagens/times/sf/${logoNome}.png` : "";
      const classeFalta = (r.Kills === 0 && r.Pontos === 0) ? 'time-falta' : '';
      return `
      <tr class="${classeFalta}">
        <td title="+ ${r.Pontos} pts">${r.Rank}</td>
        <td>${logo ? `<img src="${logo}" alt="${r.Time}" class="logo-time">` : ''}</td>
        <td title="${jogadores}">${r.Time}</td>
        <td>${r.Kills}</td>
        <td>${r.Pontos}</td>
      </tr>`;
    }).join("");

    this.container.innerHTML = "";
    const tabela = document.createElement("table");
    tabela.className = "display compact";
    tabela.innerHTML = `<thead>${thead}</thead><tbody>${tbody}</tbody>`;
    this.container.appendChild(tabela);

    $(tabela).DataTable({
      paging: false,
      searching: false,
      info: false,
      ordering: true,
      autoWidth: false,
      columnDefs: [{ className: "dt-center", targets: "_all" }]
    });
  }
}
