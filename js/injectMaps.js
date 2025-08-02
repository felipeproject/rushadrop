import { mapas } from './configGlobal.js';

function injectMaps() {
  Object.entries(mapas).forEach(([dia, mapasDoDia]) => {
    const container = document.getElementById(`mapas-${dia.toLowerCase()}`);
    if (container) {
      container.innerHTML = '';
      mapasDoDia.forEach(mapa => {
        const div = document.createElement('div');
        div.className = 'mapa-item';
        div.textContent = mapa;
        container.appendChild(div);
      });
    }
  });
}

export { injectMaps };
