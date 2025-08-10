// timesService.js

// Busca os times do arquivo JSON
export async function fetchTimes() {
  const res = await fetch('dados/times.json');
  if (!res.ok) throw new Error('Erro ao carregar times');
  const times = await res.json();

  // Garante que cada time tenha uma "tag" única para identificação
  times.forEach(t => {
    if (!t.tag) t.tag = t.nome.toLowerCase().replace(/\s+/g, '');
  });

  return times;
}

// Filtra os times pelo nome ou nome dos jogadores, ignorando maiúsculas/minúsculas
export function filterTimes(times, query) {
  query = query.trim().toLowerCase();
  if (!query) return times;

  return times.filter(time => {
    if (time.nome.toLowerCase().includes(query)) return true;
    return time.jogadores.some(j => j.toLowerCase().includes(query));
  });
}
