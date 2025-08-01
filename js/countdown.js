export function startCountdown(targetDateStr, countdownElementId = 'countdown') {
  const countdown = document.getElementById(countdownElementId);
  if (!countdown) {
    console.log('Elemento countdown não encontrado!');
    return;
  }

  const target = new Date(targetDateStr);
  console.log('Data alvo:', target);

  function updateCountdown() {
    const now = new Date();
    const diff = target - now;
    console.log('Diferença em ms:', diff);

    if (diff <= 0) {
      countdown.textContent = 'O campeonato começou!';
      clearInterval(timer);
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    countdown.textContent = `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }

  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
}
