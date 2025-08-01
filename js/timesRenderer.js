// timesRenderer.js

export function renderTimes(container, times, noResults) {
  container.setAttribute('aria-busy', 'true');
  container.innerHTML = '';
  noResults.style.display = 'none';

  if (times.length === 0) {
    noResults.style.display = 'block';
    container.setAttribute('aria-busy', 'false');
    return;
  }

  const fragment = document.createDocumentFragment();

  times.forEach(time => {
    const card = document.createElement('article');
    card.className = 'time-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'link');
    card.setAttribute('aria-label', `Ver detalhes do time ${time.nome}`);
    card.dataset.tag = time.tag;

    card.innerHTML = `
      <img src="${time.logo}" alt="Logo do time ${time.nome}" class="time-logo" loading="lazy" />
      <h3 class="time-nome">${time.nome}</h3>
      <ul class="time-jogadores">
        ${time.jogadores.map(j => {
          const isCaptain = j.includes('(C)');
          const style = isCaptain ? 'text-yellow-400 font-semibold' : '';
          return `<li class="${style}">${j}</li>`;
        }).join('')}
      </ul>
    `;

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
  container.setAttribute('aria-busy', 'false');
}
