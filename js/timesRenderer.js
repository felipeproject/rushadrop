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
    // === CARD ===
    const card = document.createElement('article');
    card.className = 'time-card';
    card.tabIndex = 0;
    card.role = 'link';
    card.ariaLabel = `Ver detalhes do time ${time.nome}`;
    card.dataset.tag = time.tag;

    Object.assign(card.style, {
      position: 'relative',
      cursor: 'pointer',
      borderRadius: '8px',
      overflow: 'visible',
      padding: '1rem',
      backgroundColor: '#111',
      color: 'white',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
      transition: 'transform 0.2s ease',
      marginBottom: '1rem',
      minHeight: '300px'
    });

    // === LOGO CONTAINER ===
    const logoWrapper = document.createElement('div');
    Object.assign(logoWrapper.style, {
      width: '100%',
      height: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
      backgroundColor: '#111',
      marginBottom: '0.5rem',
      paddingTop: '30px'
    });

    const logo = document.createElement('img');
    logo.src = time.logo;
    logo.alt = `Logo do time ${time.nome}`;
    logo.className = 'time-logo';
    logo.loading = 'lazy';

    Object.assign(logo.style, {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      display: 'block'
    });

    logoWrapper.appendChild(logo);

    // === NOME DO TIME ===
    const nome = document.createElement('h3');
    nome.className = 'time-nome';
    nome.textContent = time.nome;

    Object.assign(nome.style, {
      margin: '0.5rem 0',
      fontSize: '1.2rem'
    });

    // === LISTA DE JOGADORES ===
    const ul = document.createElement('ul');
    ul.className = 'time-jogadores';

    Object.assign(ul.style, {
      paddingLeft: '1rem',
      margin: '0'
    });

    time.jogadores.forEach(jogador => {
      const li = document.createElement('li');
      li.textContent = typeof jogador === 'string' ? jogador : jogador.nome || '[Nome não definido]';
      ul.appendChild(li);
    });

    // === TOOLTIP "Ver mais" ===
    const verMais = document.createElement('div');
    verMais.innerHTML = `Clique para ver mais <span class="seta">→</span>`;
    verMais.style.position = 'absolute';
    verMais.style.top = '-20px';
    verMais.style.left = '10%';
    verMais.style.transform = 'translateX(-50%)';
    verMais.style.backgroundColor = 'rgba(0, 0, 0, 0.18)';
    verMais.style.color = '#fff';
    verMais.style.padding = '6px 14px';
    verMais.style.borderRadius = '6px';
    verMais.style.fontSize = '1rem';
    verMais.style.fontWeight = '600';
    verMais.style.textShadow = '1px 1px 3px rgba(0, 0, 0, 0.14)';
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

    // === Tooltip Interações ===
    let showTimeoutId;
    let hideTimeoutId;

    const scheduleShow = () => {
      clearTimeout(showTimeoutId);
      clearTimeout(hideTimeoutId);
      showTimeoutId = setTimeout(() => {
        verMais.style.opacity = '1';
        verMais.style.pointerEvents = 'auto';
        seta.style.transform = 'translateX(6px)';
        hideTimeoutId = setTimeout(() => {
          verMais.style.opacity = '0';
          verMais.style.pointerEvents = 'none';
          seta.style.transform = 'translateX(0)';
        }, 3000);
      }, 100);
    };

    const cancelAndHideQuickly = () => {
      clearTimeout(showTimeoutId);
      clearTimeout(hideTimeoutId);
      hideTimeoutId = setTimeout(() => {
        verMais.style.opacity = '0';
        verMais.style.pointerEvents = 'none';
        seta.style.transform = 'translateX(0)';
      }, 100);
    };

    // === MONTA CARD ===
    card.appendChild(logoWrapper);
    card.appendChild(nome);
    card.appendChild(ul);
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
