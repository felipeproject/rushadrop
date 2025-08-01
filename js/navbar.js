// js/navbar.js
export function injectNavbar() {
  const navbarHTML = `
    <nav id="navbar-top" style="
      position: fixed;
      top: 0; left: 0; width: 100%;
      background: rgba(0, 0, 0, 0.9);
      box-shadow: 0 2px 8px rgba(0,0,0,0.7);
      z-index: 9999;
      visibility: hidden;
      opacity: 0;
      transition: visibility 0s linear 0.3s, opacity 0.3s ease;
    ">
      <ul style="
        display: flex;
        justify-content: center;
        gap: 2rem;
        padding: 1rem 0;
        margin: 0;
        list-style: none;
        font-weight: 600;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      ">
        <li>
          <a href="index.html" class="nav-link" style="
            position: relative;
            color: white;
            text-decoration: none;
            transition: color 0.3s ease;
            display: inline-block;
            padding-bottom: 4px;
          ">
            <i class="fas fa-home"></i> Início
            <span class="underline" style="
              position: absolute;
              height: 2px;
              bottom: 0;
              left: 0;
              background-color: #facc15;
              width: 0%;
              transition: width 0.3s ease;
            "></span>
          </a>
        </li>
        <li>
          <a href="times.html" class="nav-link" style="
            position: relative;
            color: white;
            text-decoration: none;
            transition: color 0.3s ease;
            display: inline-block;
            padding-bottom: 4px;
          ">
            <i class="fas fa-users"></i> Times
            <span class="underline" style="
              position: absolute;
              height: 2px;
              bottom: 0;
              left: 0;
              background-color: #facc15;
              width: 0%;
              transition: width 0.3s ease;
            "></span>
          </a>
        </li>
        <li>
          <a href="tabelas.html" class="nav-link" style="
            position: relative;
            color: white;
            text-decoration: none;
            transition: color 0.3s ease;
            display: inline-block;
            padding-bottom: 4px;
          ">
            <i class="fas fa-table"></i> Tabelas
            <span class="underline" style="
              position: absolute;
              height: 2px;
              bottom: 0;
              left: 0;
              background-color: #facc15;
              width: 0%;
              transition: width 0.3s ease;
            "></span>
          </a>
        </li>
        <li>
          <a href="informacoes.html" class="nav-link" style="
            position: relative;
            color: white;
            text-decoration: none;
            transition: color 0.3s ease;
            display: inline-block;
            padding-bottom: 4px;
          ">
            <i class="fas fa-info-circle"></i> Informações
            <span class="underline" style="
              position: absolute;
              height: 2px;
              bottom: 0;
              left: 0;
              background-color: #facc15;
              width: 0%;
              transition: width 0.3s ease;
            "></span>
          </a>
        </li>
      </ul>
    </nav>
  `;

  const navContainer = document.createElement('div');
  navContainer.innerHTML = navbarHTML;
  document.body.prepend(navContainer.firstElementChild);

  const navLinks = document.querySelectorAll('#navbar-top .nav-link');
  const currentPage = window.location.pathname.split('/').pop();

  navLinks.forEach(link => {
    const underline = link.querySelector('.underline');

    if (link.getAttribute('href') === currentPage) {
      // ativa cor e underline com animação
      link.style.color = '#facc15';
      underline.style.width = '100%';
    } else {
      // cor padrão
      link.style.color = 'white';
      underline.style.width = '0%';

      // animação hover
      link.addEventListener('mouseover', () => {
        link.style.color = '#facc15';
        underline.style.width = '100%';
      });
      link.addEventListener('mouseout', () => {
        link.style.color = 'white';
        underline.style.width = '0%';
      });
    }
  });

  // Mostrar navbar com transição suave para evitar piscar
  const navbar = document.getElementById('navbar-top');
  navbar.style.visibility = 'visible';
  navbar.style.opacity = '1';
}
