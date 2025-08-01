// times.js
import { fetchTimes, filterTimes } from './timesService.js';
import { renderTimes } from './timesRenderer.js';

const container = document.getElementById('times-container');
const noResults = document.getElementById('no-results');
const searchInput = document.getElementById('search-bar');

let timesData = [];

function handleCardClick(e) {
  const card = e.target.closest('.time-card');
  if (!card) return;

  const tag = card.dataset.tag;
  if (!tag) return;

  window.location.href = `time.html?tag=${encodeURIComponent(tag)}`;
}

function handleCardKeyDown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleCardClick(e);
  }
}

async function init() {
  try {
    timesData = await fetchTimes();
    renderTimes(container, timesData, noResults);
  } catch {
    container.textContent = 'Falha ao carregar os times.';
  }

  searchInput.addEventListener('input', () => {
    const filtered = filterTimes(timesData, searchInput.value);
    renderTimes(container, filtered, noResults);
  });

  container.addEventListener('click', handleCardClick);
  container.addEventListener('keydown', handleCardKeyDown);
}

init();
