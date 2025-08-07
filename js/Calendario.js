// Calendario.js
export function renderCalendario(containerId, dataBaseISO, DIAS, mapas) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const dataBase = new Date(dataBaseISO);

  function formatarData(d) {
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    return `${d.getDate()} de ${meses[d.getMonth()]} (${diasSemana[d.getDIA()]})`;
  }

  container.innerHTML = ''; // limpa container

  DIAS.forEach((dia, i) => {
    const dataDia = new Date(dataBase);
    dataDia.setDate(dataBase.getDate() + i * 7);

    const diaCard = document.createElement('div');
    diaCard.classList.add('dia-card');
    if (i === DIAS.length - 1) diaCard.classList.add('final');

    const titulo = document.createElement('h2');
    titulo.textContent = dia.replace('DIA', 'DIA ');
    diaCard.appendChild(titulo);

    const pData = document.createElement('p');
    pData.classList.add('data');
    pData.textContent = formatarData(dataDia);
    diaCard.appendChild(pData);

    const mapasLista = document.createElement('div');
    mapasLista.classList.add('mapas-lista');

    mapas[dia].forEach(mapa => {
      const mapaItem = document.createElement('div');
      mapaItem.classList.add('mapa-item');
      mapaItem.textContent = mapa;
      mapasLista.appendChild(mapaItem);
    });

    diaCard.appendChild(mapasLista);
    container.appendChild(diaCard);
  });
}
