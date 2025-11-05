// src/views/documentalesView.js
import { Navbar, initNavbarSearch } from './navbar.js';
import { renderCards } from './shared/renderCards.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { resolveImagePath } from './shared/resolve-image-path.js';
import { Footer } from './footer.js';

export function DocumentalesView() {
  const html = `
    ${Navbar()}
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 class="h3 mb-0"><i class="bi bi-film"></i> Documentales</h1>

        <div class="d-flex gap-2 align-items-center">
          <select id="genre" class="form-select form-select-sm w-auto">
            <option value="">Género</option>
          </select>
          <select id="year" class="form-select form-select-sm w-auto">
            <option value="">Año</option>
            ${Array.from({ length: 60 }, (_, i) => new Date().getFullYear() - i)
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
      // === Inicialización de sesión y buscador ===
      initNavbarSessionWatcher();
      updateNavbarSessionUI();
      initNavbarSearch();

      // === Cargar datos con caching para reducir lecturas ===
      let data;
      const cached = sessionStorage.getItem('documentalesData');

      if (cached) {
        data = JSON.parse(cached);
      } else {
        const { ContentModel } = await import('../models/contentModel.js');
        const rawData = await ContentModel.listDocumentales();

        const normalize = (arr) =>
          (arr || []).map((x) => {
            const genres = Array.isArray(x.genero)
              ? x.genero
              : (x.genero ? String(x.genero).split(',').map(s => s.trim()) : []);
            const year = x.año ?? x.year ?? '';
            const director = x.director ?? 'Desconocido';
            const duracion = x.duracion ? `${x.duracion} min` : '';
            const plataforma = x.plataforma ?? '';
            const meta = [director, year, duracion, plataforma].filter(Boolean).join(' • ');

            return {
              id: x.id ?? x.slug ?? null,
              title: x.titulo ?? x.title ?? 'Sin título',
              img: resolveImagePath(x.imagen ?? x.img ?? 'placeholder.jpg'),
              tag: genres[0] ?? 'Documental',
              genres,
              subtitle: meta,
              year: year ? String(year) : '',
              description: x.descripcion ?? x.description ?? '',
            };
          });

        data = normalize(rawData);
        sessionStorage.setItem('documentalesData', JSON.stringify(data));
      }

      // === Paginación ===
      let currentPage = 1;
      const itemsPerPage = 20;
      let filteredData = [...data];
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
          ctaText: 'Ver más',
          onCardClick: (item) => {
            sessionStorage.setItem("detalleItem", JSON.stringify(item));
            sessionStorage.setItem("detalleCategoria", "documentales");
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
          const textoOk =
            !q ||
            [x.title, x.subtitle, ...(x.genres || [])]
              .some((f) => String(f).toLowerCase().includes(q));

          const generoOk = !g || (x.genres || []).some((gg) => String(gg).toLowerCase() === g);
          const yearOk = !y || x.year === y;

          return textoOk && generoOk && yearOk;
        });

        currentPage = 1;
        renderPage();
      };

      gEl?.addEventListener('change', () => applyFilters());
      yEl?.addEventListener('change', () => applyFilters());

      // 🔹 Buscar desde navbar
      window.addEventListener("globalSearch", (e) => {
        const q = e.detail.query;
        applyFilters(q);
      });

      // 🔹 Controles de paginación
      document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderPage();
        }
      });

      document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < totalPages()) {
          currentPage++;
          renderPage();
        }
      });

      // Render inicial
      renderPage();

      // === Logout ===
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        sessionStorage.removeItem('documentalesData');
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
    },
  };
}
