import { Navbar } from './navbar.js';
import { renderCards } from './shared/renderCards.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { resolveImagePath } from './shared/resolve-image-path.js';

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
      let raw = await ContentModel.listMusica();

      const normalize = (arr) =>
        (arr || []).map((x) => {
          const genres = Array.isArray(x.genero) ? x.genero : (x.genre ? [x.genre] : []);
          const year = x.año ?? x.year ?? '';
          const artist = x.director ?? x.artist ?? '';
          return {
            id: x.id ?? x.slug ?? null,
            title: x.titulo ?? x.title ?? x.nombre ?? 'Sin título',
            img: resolveImagePath(x.imagen ?? x.img ?? x.image ?? 'concierto.jpg'),
            tag: genres[0] ?? (artist || 'Música'),
            genres,
            subtitle: [artist, year].filter(Boolean).join(' • '),
            year: year ? String(year) : '',
            description: x.descripcion ?? x.description ?? '',
          };
        });

      let data = normalize(raw);

      // Poblar géneros
      const gEl = document.getElementById('genre');
      const uniqueGenres = [...new Set(data.flatMap((d) => d.genres || []).filter(Boolean))];
      gEl.innerHTML =
        `<option value="">Género</option>` +
        uniqueGenres.map((g) => `<option>${g}</option>`).join('');

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

      draw(data);

      // Filtros
      const yEl = document.getElementById('year');
      const applyFilters = (q = "") => {
        const g = String(gEl?.value || '').toLowerCase().trim();
        const y = String(yEl?.value || '').trim();

        const filtered = data.filter((x) => {
          const textoOk = !q ||
            [x.title, x.subtitle, x.description, ...(x.genres || [])]
              .some((f) => String(f).toLowerCase().includes(q));
          const generoOk = !g || (x.genres || []).some((gg) => String(gg).toLowerCase() === g);
          const yearOk = !y || x.year === y;

          return textoOk && generoOk && yearOk;
        });

        draw(filtered);
      };

      gEl?.addEventListener('change', () => applyFilters());
      yEl?.addEventListener('change', () => applyFilters());

      // 🔹 Buscar desde navbar
      window.addEventListener("globalSearch", (e) => {
        applyFilters(e.detail.query);
      });

      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
    },
  };
}
