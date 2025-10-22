// src/views/peliculasView.js
import { Navbar, initNavbarSearch } from './navbar.js';
import { renderCards } from './shared/renderCards.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { resolveImagePath } from './shared/resolve-image-path.js';
import { Footer } from './footer.js';

export function PeliculasView() {
  const html = `
    ${Navbar()}
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 class="h3 mb-0"><i class="bi bi-camera-reels"></i> Películas</h1>

        <div class="d-flex gap-2 align-items-center">
          <select id="genre" class="form-select form-select-sm w-auto">
            <option value="">Género</option>
          </select>
          <select id="year" class="form-select form-select-sm w-auto">
            <option value="">Año</option>
            ${Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i)
              .map((y) => `<option>${y}</option>`)
              .join('')}
          </select>
        </div>
      </div>

      <div id="grid"></div>
    </div>
    ${Footer()}
  `;

  return {
    html,
    async bind() {
      // 🔹 Inicialización de sesión y buscador global
      initNavbarSessionWatcher();
      updateNavbarSessionUI();
      initNavbarSearch(); // <<--- se activa el buscador del navbar aquí

      const { ContentModel } = await import('../models/contentModel.js');
      let data = await ContentModel.listPeliculas();

      // Normaliza los datos a un formato estándar
      const normalize = (arr) =>
        (arr || []).map((x) => {
          const genres = Array.isArray(x.genero) ? x.genero : (x.genre ? [x.genre] : []);
          const year = x.año ?? x.year ?? '';
          const director = x.director ?? '';
          const imgCandidate = x.imagen ?? x.img ?? x.image ?? 'inception.jpg';
          const img = resolveImagePath(imgCandidate);

          return {
            id: x.id,
            title: x.titulo ?? x.title ?? 'Sin título',
            img,
            tag: genres[0] ?? 'Película',
            genres,
            subtitle: [director, year].filter(Boolean).join(' • '),
            year: year ? String(year) : '',
            description: x.descripcion ?? x.description ?? '',
          };
        });

      data = normalize(data);

      // Poblar géneros en el <select>
      const gEl = document.getElementById('genre');
      const uniqueGenres = [...new Set(data.flatMap((d) => d.genres || []).filter(Boolean))];
      gEl.innerHTML =
        `<option value="">Género</option>` +
        uniqueGenres.map((g) => `<option>${g}</option>`).join('');

      // Render inicial de tarjetas
      const draw = (arr) =>
        renderCards('#grid', arr, {
          showDescription: true,
          ctaText: 'Leer reseña',
          onCardClick: (item) => {
            sessionStorage.setItem("detalleItem", JSON.stringify(item));
            sessionStorage.setItem("detalleCategoria", "peliculas");
            location.hash = "#/detalle";
          },
        });

      draw(data);

      // Filtros locales
      const yEl = document.getElementById('year');

      const applyFilters = (q = "") => {
        const g = String(gEl?.value || '').toLowerCase().trim();
        const y = String(yEl?.value || '').trim();

        const filtered = data.filter((x) => {
          const hayTexto =
            !q ||
            [x.title, x.subtitle, x.description, ...(x.genres || [])]
              .filter(Boolean)
              .some((f) => String(f).toLowerCase().includes(q));

          const hayGenero =
            !g || (x.genres || []).some((gg) => String(gg).toLowerCase() === g);

          const hayAnio = !y || x.year === y;

          return hayTexto && hayGenero && hayAnio;
        });

        draw(filtered);
      };

      gEl?.addEventListener('change', () => applyFilters());
      yEl?.addEventListener('change', () => applyFilters());

      // 🔹 Escuchar el buscador global del Navbar
      window.addEventListener("globalSearch", (e) => {
        const q = e.detail.query;
        applyFilters(q);
      });

      // Logout
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
    },
  };
}
