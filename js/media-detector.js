// media-detector.js

export function detectDevice() {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  document.body.classList.toggle('mobile', isMobile);
  document.body.classList.toggle('desktop', !isMobile);
  return isMobile ? 'mobile' : 'desktop';
}

// Opcional: executar a detecção ao carregar o script
detectDevice();
