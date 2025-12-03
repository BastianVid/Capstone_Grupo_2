// src/views/peliculasView.js
import { Navbar, initNavbarSearch } from './shared/navbar.js';
import { renderCards } from './shared/renderCards.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './shared/navbarSession.js';
import { resolveImagePath } from './shared/resolve-image-path.js';
import { Footer } from './shared/footer.js';

export function PeliculasView() {
  const html = `
    ${Navbar()}
    <div class="container py-4" data-category-top="peliculas">
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

      <!-- 🔹 Controles de paginación -->
      <div class="d-flex justify-content-center align-items-center gap-3 mt-4">
        <button id="prevPage" class="btn btn-outline-light btn-sm" disabled>Anterior</button>
        <span id="pageInfo" class="text-light small"></span>
        <button id="nextPage" class="btn btn-outline-light btn-sm" disabled>Siguiente</button>
      </div>
    </div>
    ${Footer()}
  `;

  return {
    html,
    async bind() {
      // === Inicialización de sesión y buscador global ===
      initNavbarSessionWatcher();
      updateNavbarSessionUI();
      initNavbarSearch();

      const categoryTop = document.querySelector('[data-category-top="peliculas"]');
      const scrollToTop = () =>
        categoryTop?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // === Cargar datos con caching para reducir lecturas ===
      let data;
      const cached = sessionStorage.getItem('peliculasData');

      if (cached) {
        data = JSON.parse(cached);
      } else {
        const { ContentModel } = await import('../models/contentModel.js');
        const rawData = await ContentModel.listPeliculas();

        const normalize = (arr) =>
          (arr || []).map((x) => {
            const genres = Array.isArray(x.genero)
              ? x.genero
              : (x.genre ? [x.genre] : []);
            const year = x.año ?? x.year ?? '';
            const director = x.director ?? '';
            const imgCandidate =
              x.imagen ?? x.img ?? x.image ?? 'inception.jpg';
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

        data = normalize(rawData);
        sessionStorage.setItem('peliculasData', JSON.stringify(data));
      }

      // === Paginación ===
      let currentPage = 1;
      const itemsPerPage = 20;
      let filteredData = [...data]; // dataset actual filtrado
      const totalPages = () => Math.ceil(filteredData.length / itemsPerPage);

      const getPaginatedData = () => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredData.slice(start, end);
      };

      const updatePaginationControls = () => {
        document.getElementById('prevPage').disabled = currentPage === 1;
        document.getElementById('nextPage').disabled = currentPage >= totalPages();
        document.getElementById('pageInfo').textContent =
          `Página ${currentPage} de ${totalPages() || 1}`;
      };

      const draw = (arr) =>
        renderCards('#grid', arr, {
          showDescription: false,
          ctaText: 'Leer reseña',
          onCardClick: (item) => {
            sessionStorage.setItem("detalleItem", JSON.stringify(item));
            sessionStorage.setItem("detalleCategoria", "peliculas");
            location.hash = "#/detalle";
          },
        });

      // === Render inicial ===
      const renderPage = () => {
        draw(getPaginatedData());
        updatePaginationControls();
      };

      // === Filtros ===
      const gEl = document.getElementById('genre');
      const yEl = document.getElementById('year');
      const uniqueGenres = [...new Set(data.flatMap((d) => d.genres || []).filter(Boolean))];
      gEl.innerHTML = `<option value="">Género</option>` + uniqueGenres.map((g) => `<option>${g}</option>`).join('');

      const applyFilters = (q = "") => {
        const g = String(gEl?.value || '').toLowerCase().trim();
        const y = String(yEl?.value || '').trim();

        filteredData = data.filter((x) => {
          const hayTexto =
            !q ||
            [x.title, x.subtitle, x.description, ...(x.genres || [])]
              .filter(Boolean)
              .some((f) => String(f).toLowerCase().includes(q));
          const hayGenero = !g || (x.genres || []).some((gg) => String(gg).toLowerCase() === g);
          const hayAnio = !y || x.year === y;
          return hayTexto && hayGenero && hayAnio;
        });

        currentPage = 1;
        renderPage();
      };

      gEl?.addEventListener('change', () => applyFilters());
      yEl?.addEventListener('change', () => applyFilters());

      // 🔹 Escuchar buscador global del navbar
      window.addEventListener("globalSearch", (e) => {
        const q = e.detail.query;
        applyFilters(q);
      });

      // 🔹 Controles de paginación
      document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderPage();
          scrollToTop();
        }
      });

      document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < totalPages()) {
          currentPage++;
          renderPage();
          scrollToTop();
        }
      });

      // Render inicial
      renderPage();

      // === Logout ===
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        sessionStorage.removeItem('peliculasData');
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
    },
  };
}
