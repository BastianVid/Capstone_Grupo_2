// src/views/shared/image-fallback.js
//
// Placeholder SVG + helper para aplicar fallback a <img> que no cargan.

export function makePlaceholder(w = 800, h = 450, text = 'CulturaX') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            fill="#9ca3af" font-size="${Math.round(Math.min(w, h)/10)}"
            font-family="Inter, Arial, sans-serif">${text}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Aplica fallback a <img>. Úsalo después de inyectar HTML.
 * @param {Element|Document} root - nodo raíz
 * @param {string} selector - selector para las imágenes objetivo
 */
export function applyImgFallback(root = document, selector = 'img[data-fallback]') {
  root.querySelectorAll(selector).forEach((img) => {
    const w = parseInt(img.dataset.w || '', 10) || 800;
    const h = parseInt(img.dataset.h || '', 10) || 450;
    const t = img.dataset.ph || 'CulturaX';
    const ph = makePlaceholder(w, h, t);

    const setPh = () => {
      img.onerror = null;
      img.src = ph;
      img.classList.add('is-fallback');
    };

    // Si no hay src o falla la carga, coloca el placeholder
    if (!img.getAttribute('src')) {
      setPh();
    } else {
      img.addEventListener('error', setPh, { once: true });
    }
  });
}
