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

    // Card style
    card.style.position = 'relative';
    card.style.cursor = 'pointer';
    card.style.borderRadius = '8px';
    card.style.overflow = 'visible';
    card.style.padding = '1rem';
    card.style.backgroundColor = '#111';
    card.style.color = 'white';
    card.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
    card.style.transition = 'transform 0.2s ease';
    card.style.marginBottom = '1rem';

    const logo = document.createElement('img');
    logo.src = time.logo;
    logo.alt = `Logo do time ${time.nome}`;
    logo.className = 'time-logo';
    logo.loading = 'lazy';
    logo.style.width = '100%';
    logo.style.display = 'block';
    logo.style.borderRadius = '8px';
    logo.style.objectFit = 'contain';
    logo.style.marginBottom = '0.5rem';

    const nome = document.createElement('h3');
    nome.className = 'time-nome';
    nome.textContent = time.nome;
    nome.style.margin = '0.5rem 0';
    nome.style.fontSize = '1.2rem';

    const ul = document.createElement('ul');
    ul.className = 'time-jogadores';
    ul.style.paddingLeft = '1rem';
    ul.style.margin = '0';

    // Aqui, só adiciona o nome do jogador, sem link
    time.jogadores.forEach(jogadorNome => {
      const li = document.createElement('li');
      li.textContent = jogadorNome;
      ul.appendChild(li);
    });

    card.appendChild(logo);
    card.appendChild(nome);
    card.appendChild(ul);

    // Ver mais (tooltip)
    const verMais = document.createElement('div');
    verMais.innerHTML = `Clique para ver mais <span class="seta">→</span>`;
    verMais.style.position = 'absolute';
    verMais.style.top = '-20px';
    verMais.style.left = '50%';
    verMais.style.transform = 'translateX(-50%)';
    verMais.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    verMais.style.color = '#fff';
    verMais.style.padding = '6px 14px';
    verMais.style.borderRadius = '6px';
    verMais.style.fontSize = '1rem';
    verMais.style.fontWeight = '600';
    verMais.style.textShadow = '1px 1px 3px rgba(0,0,0,0.7)';
    verMais.style.opacity = '0';
    verMais.style.transition = 'opacity 0.3s ease';
    verMais.style.pointerEvents = 'none';
    verMais.style.userSelect = 'none';
    verMais.style.display = 'flex';
    verMais.style.alignItems = 'center';
    verMais.style.gap = '6px';
    verMais.style.zIndex = '10';

    const seta = verMais.querySelector('.seta');
    seta.style.transition = 'transform 0.3s ease';
    seta.style.display = 'inline-block';

    let showTimeoutId;
    let hideTimeoutId;

    function scheduleShow() {
      clearTimeout(showTimeoutId);
      clearTimeout(hideTimeoutId);
      showTimeoutId = setTimeout(() => {
        verMais.style.opacity = '1';
        verMais.style.pointerEvents = 'auto';
        seta.style.transform = 'translateX(6px)';
        hideTimeoutId = setTimeout(() => {
          verMais.style.opacity = '0';
          verMais.style.pointerEvents = 'none';
          seta.style.transform = 'translateX(0px)';
        }, 3000);
      }, 100);
    }

    function cancelAndHideQuickly() {
      clearTimeout(showTimeoutId);
      clearTimeout(hideTimeoutId);
      hideTimeoutId = setTimeout(() => {
        verMais.style.opacity = '0';
        verMais.style.pointerEvents = 'none';
        seta.style.transform = 'translateX(0px)';
      }, 100);
    }

    card.appendChild(verMais);

    card.addEventListener('mouseenter', scheduleShow);
    card.addEventListener('mousemove', scheduleShow);
    card.addEventListener('mouseleave', cancelAndHideQuickly);
    card.addEventListener('focus', scheduleShow);
    card.addEventListener('blur', cancelAndHideQuickly);

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
  container.setAttribute('aria-busy', 'false');
}
