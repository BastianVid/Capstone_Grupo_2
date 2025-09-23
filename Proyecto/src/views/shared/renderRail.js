// Fila horizontal tipo "carrusel" simple con scroll
export function renderRail(selector, items = [], { onItemClick = null } = {}) {
  const host = document.querySelector(selector);
  if (!host) return;

  const uid = Math.random().toString(36).slice(2, 8);
  host.innerHTML = `
    <div class="position-relative">
      <div id="rail-${uid}" class="d-flex gap-3 flex-nowrap overflow-auto pb-2">
        ${items.map((x, i) => `
          <div class="card shadow-sm" style="min-width:180px; max-width:180px" data-index="${i}" role="button" tabindex="0">
            <div class="ratio ratio-2x3 bg-body-tertiary">
              <img src="${x.img}" alt="${escapeHtml(x.title)}" class="object-fit-cover"
                   onerror="this.src='https://placehold.co/360x540?text=CulturaX'; this.classList.add('opacity-50')" />
            </div>
            <div class="card-body p-2">
              <div class="small fw-semibold text-truncate" title="${escapeHtml(x.title)}">${escapeHtml(x.title)}</div>
              <div class="small text-secondary text-truncate">${escapeHtml([x.tag, x.year].filter(Boolean).join(' • '))}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-dark btn-sm position-absolute top-50 start-0 translate-middle-y d-none d-md-inline-flex"
              style="--bs-btn-padding-y:.25rem; --bs-btn-padding-x:.5rem" data-dir="-1">‹</button>
      <button class="btn btn-dark btn-sm position-absolute top-50 end-0 translate-middle-y d-none d-md-inline-flex"
              style="--bs-btn-padding-y:.25rem; --bs-btn-padding-x:.5rem" data-dir="1">›</button>
    </div>
  `;

  const rail = host.querySelector(`#rail-${uid}`);
  host.querySelectorAll('button[data-dir]').forEach(btn => {
    btn.addEventListener('click', () => rail.scrollBy({ left: 300 * Number(btn.dataset.dir), behavior: 'smooth' }));
  });

  if (typeof onItemClick === 'function') {
    host.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const i = Number(card.getAttribute('data-index'));
        onItemClick(items[i], i);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const i = Number(card.getAttribute('data-index'));
          onItemClick(items[i], i);
        }
      });
    });
  }

  function escapeHtml(s) {
    return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
  }
}
