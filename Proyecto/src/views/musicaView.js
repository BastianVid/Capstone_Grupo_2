// src/views/musicaView.js
import { Navbar, initNavbarSearch } from './shared/navbar.js';
import { renderCards } from './shared/renderCards.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './shared/navbarSession.js';
import { resolveImagePath } from './shared/resolve-image-path.js';
import { Footer } from './shared/footer.js';

export function MusicaView() {
  const html = `
    ${Navbar()}
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 class="h3 mb-0"><i class="bi bi-music-note-beamed"></i> Música</h1>

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
      // === Inicialización ===
      initNavbarSessionWatcher();
      updateNavbarSessionUI();
      initNavbarSearch();

      // === Cargar datos con caché ===
      let data;
      const cached = sessionStorage.getItem('musicaData');

      if (cached) {
        data = JSON.parse(cached);
      } else {
        const { ContentModel } = await import('../models/contentModel.js');
        const rawData = await ContentModel.listMusica();

        const normalize = (arr) =>
          (arr || []).map((x) => {
            const genres = Array.isArray(x.genero)
              ? x.genero
              : (x.genre ? [x.genre] : []);
            const year = x.año ?? x.year ?? '';
            const artist = x.director ?? x.artist ?? '';
            const totalCanciones = x.totalCanciones ?? x.total_canciones ?? null;

            // Subtítulo: artista • año • canciones
            const subtitleParts = [artist, year];
            if (totalCanciones) subtitleParts.push(`${totalCanciones} canciones`);

            return {
              id: x.id ?? x.slug ?? null,
              title: x.titulo ?? x.title ?? x.nombre ?? 'Sin título',
              img: resolveImagePath(x.imagen ?? x.img ?? x.image ?? 'concierto.jpg'),
              tag: genres[0] ?? (artist || 'Música'),
              genres,
              subtitle: subtitleParts.filter(Boolean).join(' • '),
              year: year ? String(year) : '',
              description:
                x.descripcion ??
                x.description ??
                (totalCanciones ? `Este álbum contiene ${totalCanciones} canciones.` : ''),
            };
          });

        data = normalize(rawData);
        sessionStorage.setItem('musicaData', JSON.stringify(data));
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
          showDescription: true,
          ctaText: 'Leer reseña',
          onCardClick: (item) => {
            sessionStorage.setItem("detalleItem", JSON.stringify(item));
            sessionStorage.setItem("detalleCategoria", "musica");
            location.hash = "#/detalle";
          },
        });

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
          const textoOk = !q ||
            [x.title, x.subtitle, x.description, ...(x.genres || [])]
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

      // 🔹 Paginación
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
        sessionStorage.removeItem('musicaData');
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
    },
  };
}
