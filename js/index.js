import { DIAS, mapas } from './configGlobal.js';
import { renderCalendario } from './Calendario.js';
import { startCountdown } from './countdown.js';

const valorPorTime = 50;
const metaTimes = 16;
const metaTotal = valorPorTime * metaTimes;
const dataBaseISO = '2025-08-16T21:00:00';

startCountdown(dataBaseISO, 'countdown');
renderCalendario('dias-campeonato', dataBaseISO, DIAS, mapas);

async function fetchTimes() {
  const response = await fetch('dados/times.json');
  const times = await response.json();
  return times;
}

async function atualizarDados() {
  try {
    const times = await fetchTimes();
    const equipeInscritas = times.filter(t => t.statusInscricao === 'Inscrito ✅').length;
    const arrecadado = equipeInscritas * valorPorTime;

    document.getElementById("num-equipes").textContent = equipeInscritas;
    document.getElementById("valor-arrecadado").textContent = formatarMoeda(arrecadado);
    document.getElementById("meta-arrecadacao").textContent = formatarMoeda(metaTotal);

    const porcentagem = Math.min((arrecadado / metaTotal) * 100, 100);
    document.getElementById("barraProgresso").style.width = `${porcentagem}%`;

    const marksContainer = document.getElementById("marcacoes");
    marksContainer.innerHTML = '';

    for (let i = 0; i < metaTimes; i++) {
      const mark = document.createElement('div');
      mark.textContent = '|';
      mark.style.color = i < equipeInscritas ? '#00ff5e' : '#555';
      marksContainer.appendChild(mark);
    }
  } catch (err) {
    console.error('Erro ao atualizar dados:', err);
  }
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

atualizarDados();
// setInterval(atualizarDados, 30000); // opcional
