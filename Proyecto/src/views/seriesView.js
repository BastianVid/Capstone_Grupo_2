import { Navbar } from './navbar.js';
import { renderCards } from './shared/renderCards.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher  } from './navbarSession.js';

export function SeriesView() {
  const html = `
    ${Navbar()}
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 class="h3 mb-0"><i class="bi bi-tv"></i> Series</h1>

        <div class="d-flex gap-2 align-items-center">
          <div class="input-group w-auto">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input id="q" class="form-control" placeholder="Buscar por título, género o año...">
          </div>
          <select id="genre" class="form-select form-select-sm w-auto">
            <option value="">Género</option>
            <option>Acción</option>
            <option>Aventura</option>
            <option>Ciencia Ficción</option>
            <option>Drama</option>
            <option>Comedia</option>
            <option>Terror</option>
            <option>Animación</option>
          </select>
          <select id="year" class="form-select form-select-sm w-auto">
            <option value="">Año</option>
            ${Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i)
              .map((y) => `<option>${y}</option>`)
              .join('')}
          </select>
        </div>
      </div>

      <div id="grid"></div>
    </div>
  `;

  return {
    html,
    async bind() {
      // Actualiza UI del navbar según sesión
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      const { ContentModel } = await import('../models/contentModel.js');
      let data = await ContentModel.listSeries();

      // Normalización de campos (flexible con tus docs)
      const normalize = (arr) =>
        (arr || []).map((x) => ({
          id: x.id,
          title: x.title ?? x.name ?? 'Sin título',
          img: x.img ?? x.image ?? './src/assets/img/stranger-things.jpg',
          tag: x.genre ?? 'Serie',
          subtitle: x.year ? String(x.year) : (x.studio ?? ''),
          description: x.description ?? x.synopsis ?? '',
        }));
      data = normalize(data);

      const draw = (arr) =>
        renderCards('#grid', arr, {
          showDescription: true,
          ctaText: 'Leer reseña',
          onCardClick: (item) => {
            // import { navigate } from '../core/router.js'; navigate(`/series/${item.id}`);
            alert(`Próximamente reseña de: ${item.title}`);
          },
        });

      draw(data);

      // Filtros (texto + género + año)
      const qEl = document.getElementById('q');
      const gEl = document.getElementById('genre');
      const yEl = document.getElementById('year');

      const applyFilters = () => {
        const q = String(qEl?.value || '').toLowerCase().trim();
        const g = String(gEl?.value || '').toLowerCase().trim();
        const y = String(yEl?.value || '').trim();

        const filtered = data.filter((x) => {
          const hitQ =
            !q ||
            [x.title, x.tag, x.subtitle, x.description]
              .filter(Boolean)
              .some((f) => String(f).toLowerCase().includes(q));
          const hitG = !g || String(x.tag).toLowerCase() === g;
          const hitY = !y || String(x.subtitle) === y;
          return hitQ && hitG && hitY;
        });

        draw(filtered);
      };

      qEl?.addEventListener('input', applyFilters);
      gEl?.addEventListener('change', applyFilters);
      yEl?.addEventListener('change', applyFilters);

      // Logout en navbar
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
    },
  };
}
