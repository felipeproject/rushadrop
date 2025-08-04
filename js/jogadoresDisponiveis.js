const listContainer = document.getElementById("free-agents-list");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");
const toggleButton = document.getElementById("toggle-free-agents");
const section = document.getElementById("free-agents-section");

let jogadoresDisponiveis = [];

// Função para popular a lista de jogadores na tela
function popularJogadores() {
  listContainer.innerHTML = "";
  jogadoresDisponiveis.forEach(jogador => {
    const li = document.createElement("li");
    li.innerHTML = `<button class="hover:underline text-blue-400" onclick="mostrarDetalhes('${jogador.nick}')">${jogador.nick}</button>`;
    listContainer.appendChild(li);
  });
}

// Função para atualizar o badge de contagem
function atualizarBadge() {
  const badge = document.getElementById('badge-count');
  if (badge) {
    badge.textContent = jogadoresDisponiveis.length;
  }
}

// Função para mostrar detalhes do jogador no modal
window.mostrarDetalhes = function (nick) {
  const jogador = jogadoresDisponiveis.find(j => j.nick === nick);
  if (jogador) {
    modalBody.innerHTML = `
      <h3 class="text-xl font-bold mb-2">${jogador.nick}</h3>
      <p><strong>Discord:</strong> ${jogador.Discord}</p>
      <p><strong>Contato:</strong> ${jogador.contato}</p>
    `;
    modal.setAttribute("aria-hidden", "false");
  }
};

// Fechar modal
modalClose.addEventListener("click", () => {
  modal.setAttribute("aria-hidden", "true");
  modalBody.innerHTML = "";
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.setAttribute("aria-hidden", "true");
    modalBody.innerHTML = "";
  }
});

// Toggle da seção
toggleButton.addEventListener('click', () => {
  const isHidden = section.classList.contains('hidden');
  section.classList.toggle('hidden');
  toggleButton.innerHTML = `
    ${isHidden ? 'Ocultar' : 'Mostrar'} Jogadores Disponíveis 
    <span id="badge-count" class="bg-red-600 text-white rounded-full px-2 py-0.5 text-sm font-semibold">
      ${jogadoresDisponiveis.length}
    </span>`;
});

// Fetch dos dados
fetch('dados/jogadoresDisponiveis.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Erro ao carregar o JSON de jogadores');
    }
    return response.json();
  })
  .then(data => {
    jogadoresDisponiveis = data;
    popularJogadores();
    atualizarBadge();
  })
  .catch(error => {
    console.error('Erro:', error);
  });
