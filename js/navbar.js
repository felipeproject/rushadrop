// rushadrop/js/navbar.js

export function injectNavbar() {
  // Adiciona Font Awesome via JS
  if (!document.getElementById('fa-css')) {
    const faLink = document.createElement('link');
    faLink.id = 'fa-css';
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css';
    faLink.integrity = 'sha512-papv+GfqZk9LlT9D9x9J8F2bSg2tFjv8Q0a/6oXg/7Mljf9WZBx7v2Kz+1Xx0Qh5nR1qU2ZYD2T0/c61h2yJGw==';
    faLink.crossOrigin = 'anonymous';
    faLink.referrerPolicy = 'no-referrer';
    document.head.appendChild(faLink);
  }

  // Cria a navbar
  const navbarHTML = `
    <nav id="navbar-top" style="
      position: fixed;
      top: 0; left: 0; width: 100%;
      background: rgba(0, 0, 0, 0.9);
      box-shadow: 0 2px 8px rgba(0,0,0,0.7);
      z-index: 9999;
      transition: transform 0.3s ease;
      margin-top: 0px;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem;">
        <div id="navbar-logo" style="font-weight: bold; color: #facc15; font-size: 1.2rem; cursor: pointer;">
          RUSHA DROP
        </div>
        <button id="menu-toggle" aria-label="Abrir menu" style="
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          display: none;
        ">
          <i class="fas fa-bars"></i>
        </button>
      </div>
      <ul id="navbar-links" style="
        display: flex;
        justify-content: center;
        gap: 2rem;
        padding-bottom: 1rem;
        margin: 0;
        list-style: none;
        font-weight: 50;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        flex-wrap: wrap;
        transition: max-height 0.3s ease;
        overflow: hidden;
      ">
        ${createNavItem('index.html', 'fa-home', 'Início')}
        ${createNavItem('times.html', 'fa-users', 'Times')}
        ${createNavItem('tabelas.html', 'fa-table', 'Tabelas')}
        ${createNavItem('informacoes.html', 'fa-info-circle', 'Informações')}
        ${createNavItem('https://www.twitch.tv/', 'fa-twitch', 'Live Twitch', 'twitch', 'fab')}
      </ul>

      <style>
        @media (max-width: 768px) {
          #menu-toggle { display: block !important; }
          #navbar-links { flex-direction: column; align-items: center; width: 100%; max-height: 500px; }
          #navbar-links.collapsed { max-height: 0; padding-bottom: 0 !important; }
        }

        .nav-link { position: relative; color: white; text-decoration: none; transition: color 0.3s ease; display: inline-block; padding-bottom: 4px; }
        .nav-link .underline { position: absolute; height: 2px; bottom: 0; left: 0; background-color: #facc15; width: 0%; transition: width 0.3s ease; }

        .nav-link.twitch { color: #9146FF; font-weight: bold; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.1);} }
      </style>
    </nav>
  `;

  const container = document.createElement('div');
  container.innerHTML = navbarHTML;
  document.body.prepend(container.firstElementChild);

  const navbar = document.getElementById('navbar-top');
  const navLinks = document.querySelectorAll('#navbar-top .nav-link');
  const toggleButton = document.getElementById('menu-toggle');
  const logo = document.getElementById('navbar-logo');
  const linksContainer = document.getElementById('navbar-links');
  let isMobile = window.innerWidth <= 768;

  const currentPage = window.location.pathname.split('/').pop();
  navLinks.forEach(link => {
    const underline = link.querySelector('.underline');
    if (link.getAttribute('href') === currentPage) { link.style.color = '#facc15'; underline.style.width = '100%'; }
    else {
      link.addEventListener('mouseover', () => { link.style.color = link.classList.contains('twitch') ? '#9146FF' : '#facc15'; underline.style.width = '100%'; });
      link.addEventListener('mouseout', () => { link.style.color = link.classList.contains('twitch') ? '#9146FF' : 'white'; underline.style.width = '0%'; });
    }
    if (link.classList.contains('twitch')) { link.setAttribute('target', '_blank'); link.setAttribute('rel', 'noopener noreferrer'); }
  });

  const toggleMenu = () => linksContainer.classList.toggle('collapsed');
  toggleButton.addEventListener('click', toggleMenu);
  logo.addEventListener('click', () => { if (isMobile) toggleMenu(); });

  if (isMobile) setTimeout(() => { linksContainer.classList.add('collapsed'); }, 1000);
  window.addEventListener('scroll', () => { if (isMobile && !linksContainer.classList.contains('collapsed')) linksContainer.classList.add('collapsed'); });

  function ajustarMainSpacing() {
    const main = document.querySelector('main');
    if (!main) return;
    main.style.paddingTop = window.innerWidth > 768 ? `${navbar.offsetHeight}px` : '0';
  }

  ajustarMainSpacing();
  window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 768;
    if (!isMobile) linksContainer.classList.remove('collapsed');
    else linksContainer.classList.add('collapsed');
    ajustarMainSpacing();
  });
}

function createNavItem(href, iconClass, label, extraClass = '', iconPrefix = 'fas') {
  return `
    <li>
      <a href="${href}" class="nav-link ${extraClass}" target="${extraClass === 'twitch' ? '_blank' : ''}" rel="${extraClass === 'twitch' ? 'noopener noreferrer' : ''}">
        <i class="${iconPrefix} ${iconClass}"></i> ${label}
        <span class="underline"></span>
      </a>
    </li>
  `;
}
