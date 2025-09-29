import { Navbar } from './navbar.js';
import { renderCards } from './shared/renderCards.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { resolveImagePath } from './shared/resolve-image-path.js';

export function LibrosView() {
  const html = `
    ${Navbar()}
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 class="h3 mb-0"><i class="bi bi-book"></i> Libros</h1>

        <div class="d-flex gap-2 align-items-center">
          <div class="input-group w-auto">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input id="q" class="form-control" placeholder="Buscar por título, autor, género o año...">
          </div>
          <select id="genre" class="form-select form-select-sm w-auto">
            <option value="">Género</option>
          </select>
          <select id="year" class="form-select form-select-sm w-auto">
            <option value="">Año</option>
            ${Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i)
              .map((y) => `<option>${y}</option>`).join('')}
          </select>
        </div>
      </div>

      <div id="grid"></div>
    </div>
  `;

  return {
    html,
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      const { ContentModel } = await import('../models/contentModel.js');
      let dataRaw = await ContentModel.listLibros();

      // Normaliza según tu esquema en Firestore
      // { titulo, imagen, genero(array|string), autor, año, descripcion }
      const normalize = (arr) =>
        (arr || []).map((x) => {
          const genres = Array.isArray(x.genero)
            ? x.genero
            : (x.genero ? String(x.genero).split(',').map(s => s.trim()) : []);
          const year = x.año ?? x.year ?? '';
          const meta = [x.autor ?? x.author, year].filter(Boolean).join(' • ');

          return {
            id: x.id ?? x.slug ?? null,
            title: x.titulo ?? x.title ?? 'Sin título',
            img: resolveImagePath(x.imagen ?? x.img ?? 'placeholder.jpg'),
            tag: genres[0] ?? 'Libro',
            genres,
            subtitle: meta,
            year: year ? String(year) : '',
            description: x.descripcion ?? x.description ?? '',
          };
        });

      let data = normalize(dataRaw);

      // Poblar géneros dinámicamente
      const gEl = document.getElementById('genre');
      const uniqueGenres = [...new Set(data.flatMap((d) => d.genres || []).filter(Boolean))];
      gEl.innerHTML = `<option value="">Género</option>` + uniqueGenres.map((g) => `<option>${g}</option>`).join('');

      // Dibujar cards
      const draw = (arr) =>
        renderCards('#grid', arr, {
          showDescription: false,           // solo título para que quede compacto
          ctaText: 'Ver más',
          onCardClick: (item) => {
            sessionStorage.setItem("detalleItem", JSON.stringify(item));
            sessionStorage.setItem("detalleCategoria", "peliculas");
            location.hash = "#/detalle";
          },
        });

      draw(data);

      // Filtros
      const qEl = document.getElementById('q');
      const yEl = document.getElementById('year');

      const applyFilters = () => {
        const q = String(qEl?.value || '').toLowerCase().trim();
        const g = String(gEl?.value || '').toLowerCase().trim();
        const y = String(yEl?.value || '').trim();

        const filtered = data.filter((x) => {
          const textoOk =
            !q ||
            [x.title, x.subtitle, ...(x.genres || [])]
              .filter(Boolean)
              .some((f) => String(f).toLowerCase().includes(q));

          const generoOk = !g || (x.genres || []).some((gg) => String(gg).toLowerCase() === g);
          const yearOk = !y || x.year === y;

          return textoOk && generoOk && yearOk;
        });

        draw(filtered);
      };

      qEl?.addEventListener('input', applyFilters);
      gEl?.addEventListener('change', applyFilters);
      yEl?.addEventListener('change', applyFilters);

      // Navbar actions
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
      document.getElementById('siteSearch')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = e.currentTarget.querySelector('input').value.trim();
        if (q) sessionStorage.setItem('cx:q', q);
        location.hash = '#/libros';
      });
    },
  };
}
