// src/views/shared/renderRail.js
import { applyImgFallback } from './image-fallback.js';
import { resolveImagePath } from './resolve-image-path.js';

/**
 * Renderiza una rail horizontal de tarjetas uniformes.
 * items: [{ id, title, img, tag, subtitle, description }]
 * opts:  { onItemClick, ctaText='Ver más', showDescription=false }
 */
export function renderRail(mountSelector, items = [], opts = {}) {
  const {
    onItemClick,
    ctaText = 'Ver más',
    // quitamos descripciones por defecto
    showDescription = false,
  } = opts;

  const host = typeof mountSelector === 'string'
    ? document.querySelector(mountSelector)
    : mountSelector;

  if (!host) return;

  const list = Array.isArray(items) ? items : [];
  if (!list.length) {
    host.innerHTML = `<div class="text-secondary small">No hay contenido disponible.</div>`;
    return;
  }

  const cards = list.map((x) => {
    const src = resolveImagePath(x.img || x.imagen || x.image || '');
    const meta = [
      x.tag ? String(x.tag) : null,
      x.subtitle ? String(x.subtitle) : (x.year ? String(x.year) : null)
    ].filter(Boolean).join(' • ');

    return `
      <article class="cx-rail-card" data-id="${x.id ?? ''}">
        <img
          class="cx-rail-thumb img-with-fallback"
          src="${src}"
          alt="${escapeHtml(x.title ?? 'Sin título')}"
          data-fallback data-w="360" data-h="540" data-ph="CulturaX"
        >
        <div class="cx-rail-body">
          ${meta ? `<div class="cx-rail-meta">${escapeHtml(meta)}</div>` : ''}
          <h3 class="cx-rail-title text-truncate-2">${escapeHtml(x.title ?? 'Sin título')}</h3>
          ${showDescription
            ? `<p class="cx-rail-desc text-truncate-3">${escapeHtml(x.description ?? '')}</p>`
            : ''
          }
          <div class="cx-rail-actions">
            <button type="button" class="btn btn-secondary btn-sm">${ctaText}</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  host.innerHTML = `
    <div class="cx-rail">
      <div class="cx-rail-track">
        ${cards}
      </div>
    </div>
  `;

  // Fallback dinámico
  applyImgFallback(host, 'img.img-with-fallback');

  // Click handling
  if (onItemClick) {
    host.querySelectorAll('.cx-rail-card').forEach((card, idx) => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const item = items[idx];
        if (item) onItemClick(item);
      });
    });
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
