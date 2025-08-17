// js/TabelaGeral.js
import { DIAS, rodadas } from './configGlobal.js';

export class TabelaGeral {
  constructor({ containerId }) {
    this.container = document.getElementById(containerId);
    this.jogadorParaTime = {};
    this.times = [];
    this.timesInfo = {};
  }

  async carregarTimes() {
    try {
      const res = await fetch("dados/times.json");
      if (!res.ok) throw new Error("Arquivo times.json não encontrado");
      this.times = await res.json();

      this.times.forEach(t => {
        this.timesInfo[t.nome] = t;
        t.jogadores.forEach(j => {
          this.jogadorParaTime[j.nome] = t.nome;
        });
      });
    } catch (e) {
      console.error("Erro ao carregar times:", e);
    }
  }

  async csvValido(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const texto = await res.text();
      if (!texto.trim()) return null;

      return Papa.parse(texto, { header: true, skipEmptyLines: true }).data;
    } catch (e) {
      console.warn("Erro ao carregar CSV:", url, e);
      return null;
    }
  }

  calcularPontos(rank, kills, participou = true) {
    if (!participou) return 0;

    let ptsColocacao = 0;
    switch (rank) {
      case 1: ptsColocacao = 15; break;
      case 2: ptsColocacao = 12; break;
      case 3: ptsColocacao = 10; break;
      case 4: ptsColocacao = 8; break;
      case 5: ptsColocacao = 6; break;
      case 6: ptsColocacao = 4; break;
      case 7: ptsColocacao = 2; break;
      default: ptsColocacao = 0; break;
    }

    return ptsColocacao + kills + (participou ? 1 : 0);
  }

  async init() {
    await this.carregarTimes();

    // Inicializa totais
    const pontosPorTime = {};
    const killsPorTime = {};
    const participouPorTime = {};

    this.times.forEach(t => {
      pontosPorTime[t.nome] = 0;
      killsPorTime[t.nome] = 0;
      participouPorTime[t.nome] = 0;
    });

    // Processa todas as partidas
    for (const dia of DIAS) {
      for (const csv of rodadas[dia]) {
        const dados = await this.csvValido(csv);
        if (!dados) continue;

        // Melhor colocação e kills por time nesta partida
        const melhorPlace = {};
        const kills = {};
        this.times.forEach(t => { melhorPlace[t.nome] = Infinity; kills[t.nome] = 0; });

        dados.forEach(linha => {
          const time = this.jogadorParaTime[linha.Name];
          if (!time) return;
          const place = parseInt(linha["Win Place"]) || 99;
          const k = parseInt(linha.Kills) || 0;

          kills[time] += k;
          if (place < melhorPlace[time]) melhorPlace[time] = place;
        });

        // Atualiza totais
        this.times.forEach(t => {
          const time = t.nome;
          const p = (melhorPlace[time] === Infinity) ? 0 : this.calcularPontos(melhorPlace[time], kills[time]);
          pontosPorTime[time] += p;
          killsPorTime[time] += kills[time];
          if (melhorPlace[time] !== Infinity) participouPorTime[time] += 1;
        });
      }
    }

    // Monta tabela final
    const tabelaDados = this.times.map(t => {
      return {
        Time: t.nome,
        Kills: killsPorTime[t.nome],
        Pontos: pontosPorTime[t.nome],
        Participou: participouPorTime[t.nome] > 0
      };
    });

    // Ordena por pontos, kills
    tabelaDados.sort((a, b) => b.Pontos - a.Pontos || b.Kills - a.Kills);

    // Atribui rank
    tabelaDados.forEach((r, idx) => r.Rank = idx + 1);

    // Cabeçalho
    const thead = `
      <tr>
        <th>Rank</th>
        <th></th>
        <th>Time</th>
        <th>Kills</th>
        <th>Pontos</th>
      </tr>`;

    // Corpo da tabela
    const tbody = tabelaDados.map(r => {
      const infoTime = this.timesInfo[r.Time];
      const jogadores = infoTime ? infoTime.jogadores.map(j => j.nome).join(", ") : "";
      const logoNome = infoTime && infoTime.nome
        ? infoTime.nome.replace(/\s+/g, "_").replace(/[^\w\-]/g, "")
        : "";
      const logo = logoNome ? `imagens/times/sf/${logoNome}.png` : "";
      const classeFalta = r.Kills === 0 && r.Pontos === 0 ? 'time-falta' : '';
      return `
        <tr class="${classeFalta}">
          <td title="+ ${r.Pontos} pts">${r.Rank}</td>
          <td>${logo ? `<img src="${logo}" alt="${r.Time}" class="logo-time">` : ''}</td>
          <td title="${jogadores}">${r.Time}</td>
          <td>${r.Kills}</td>
          <td>${r.Pontos}</td>
        </tr>`;
    }).join("");

    // Renderiza tabela
    this.container.innerHTML = "";
    const tabela = document.createElement("table");
    tabela.className = "display compact";
    tabela.innerHTML = `<thead>${thead}</thead><tbody>${tbody}</tbody>`;
    this.container.appendChild(tabela);

    // Inicializa DataTable
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
