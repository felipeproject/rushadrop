// createOpggLink.js

/**
 * Cria um elemento <a> com o link do op.gg para um nickname
 * @param {string} jogadorNome - Nome do jogador (com ou sem (C))
 * @returns {HTMLAnchorElement}
 */
export function createOpggLink(jogadorNome) {
  const isCaptain = jogadorNome.includes('(C)');
  const nick = jogadorNome.replace(' (C)', '');
  const link = document.createElement('a');

  link.href = `https://op.gg/pubg/user/${encodeURIComponent(nick)}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = jogadorNome;
  link.style.color = 'inherit';
  link.style.textDecoration = 'underline';

  if (isCaptain) {
    link.style.color = '#fbbf24';
    link.style.fontWeight = '600';
  }

  return link;
}
