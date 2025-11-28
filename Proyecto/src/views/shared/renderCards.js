import { resolveImagePath } from './resolve-image-path.js';

/**
 * Renderiza una grilla de cards Bootstrap.
 *
 * @param {string} selector - CSS selector del contenedor (ej: "#grid")
 * @param {Array<Object>} items - Arreglo de elementos a pintar.
 *   Cada item puede incluir: { id?, title, img, tag?, subtitle?, description?, href? }
 * @param {Object} options - Opciones de renderizado.
 *   - cols: string clases de columna (default "col-6 col-md-4 col-lg-3")
 *   - showTag: boolean para mostrar badge de tag (default true)
 *   - showSubtitle: boolean para mostrar subtítulo (default true)
 *   - showDescription: boolean para mostrar descripción (default false)
 *   - ctaText: string para botón de acción (si hay onCardClick) (default "Ver más")
 *   - onCardClick: function(item, index, evt) callback al hacer click en la card o botón
 */
export function renderCards(selector, items = [], options = {}) {
  const host = document.querySelector(selector);
  if (!host) throw new Error(`renderCards: no se encontró el contenedor "${selector}"`);

  const {
    cols = 'col-6 col-md-4 col-lg-3',
    showTag = true,
    showSubtitle = true,
    showDescription = false,
    ctaText = 'Ver más',
    onCardClick = null,
  } = options;

  // Estado vacío elegante
  if (!items || items.length === 0) {
    host.innerHTML = `
      <div class="text-center text-secondary py-5">
        <i class="bi bi-emoji-frown fs-1 d-block mb-2"></i>
        <p class="mb-1">No hay elementos para mostrar.</p>
        <small class="text-secondary">Intenta cambiar el filtro o recargar.</small>
      </div>
    `;
    return;
  }

  // Normaliza items y build template
  const safe = (v) => (v == null ? '' : String(v));
  const html = `
    <div class="row g-3">
      ${items.map((x, i) => {
        const title = safe(x.title);
        const img = resolveImagePath(x.img ?? x.image ?? '');
        const tag = safe(x.tag);
        const subtitle = safe(x.subtitle);
        const description = safe(x.description);
        const idAttr = x.id != null ? `data-id="${String(x.id)}"` : '';
        const href = safe(x.href);

        // Wrapper interactivo: si hay onCardClick o href, ponemos role/button
        const clickableAttr = onCardClick || href ? 'tabindex="0" role="button"' : '';

        return `
          <div class="${cols}">
            <div class="card h-100 shadow-sm overflow-hidden" data-index="${i}" ${idAttr} ${clickableAttr}>
              <div class="ratio ratio-4x3 bg-body-tertiary">
                <img
                  src="${img}"
                  alt="${escapeHtml(title)}"
                  class="card-img-top object-fit-cover"
                  loading="lazy"
                  onerror="this.src='https://placehold.co/600x450?text=CulturaX'; this.classList.add('opacity-50');"
                />
              </div>
              <div class="card-body d-flex flex-column">
                <h6 class="card-title mb-1 text-truncate" title="${escapeHtml(title)}">${escapeHtml(title)}</h6>
                ${showTag && tag ? `<span class="badge text-bg-secondary mb-2 align-self-start">${escapeHtml(tag)}</span>` : ''}
                ${showSubtitle && subtitle ? `<div class="small text-secondary mb-2 text-truncate" title="${escapeHtml(subtitle)}">${escapeHtml(subtitle)}</div>` : ''}
                ${showDescription && description ? `<p class="small text-secondary mb-3">${escapeHtml(description)}</p>` : '<div class="mb-2"></div>'}
                ${onCardClick || href ? `
                  <div class="mt-auto">
                    ${href
                      ? `<a href="${href}" class="btn btn-dark btn-sm w-100">${escapeHtml(ctaText)}</a>`
                      : `<button class="btn btn-dark btn-sm w-100 cx-card-cta">${escapeHtml(ctaText)}</button>`
                    }
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  host.innerHTML = html;

  // Bind de interacciones si corresponde
  if (typeof onCardClick === 'function') {
    // Click en botón CTA
    host.querySelectorAll('.cx-card-cta').forEach((btn) => {
      btn.addEventListener('click', (evt) => {
        const card = btn.closest('.card');
        if (!card) return;
        const idx = Number(card.getAttribute('data-index'));
        onCardClick(items[idx], idx, evt);
      });
    });

    // Click en la card (excepto si hay <a>)
    host.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('click', (evt) => {
        if (evt.target.closest('a')) return; // no robar click a links
        const idx = Number(card.getAttribute('data-index'));
        onCardClick(items[idx], idx, evt);
      });
      // Accesibilidad: Enter/Space
      card.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          const idx = Number(card.getAttribute('data-index'));
          onCardClick(items[idx], idx, evt);
        }
      });
    });
  }
}

/** Utilidad mínima para escapar HTML en textos */
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
