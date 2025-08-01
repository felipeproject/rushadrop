export function initScrollButton() {
  const scrollBtn = document.getElementById('scroll-down-btn');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', () => {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    });
  }
}