import { Navbar, initNavbarSearch } from './navbar.js';
import { renderCards } from './shared/renderCards.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { resolveImagePath } from './shared/resolve-image-path.js';
import { Footer } from './footer.js';

export function MangaView() {
  const html = `
    ${Navbar()}
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 class="h3 mb-0"><i class="bi bi-journal-bookmark"></i> Manga</h1>

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
    ${Footer()}
  `;

  return {
    html,
    async bind() {
      // Inicializar navegación y sesión
      initNavbarSessionWatcher();
      updateNavbarSessionUI();
      initNavbarSearch();

      // Import dinámico del modelo
      const { ContentModel } = await import('../models/contentModel.js');
      let dataRaw = await ContentModel.listManga();

      // Normalización de datos
      const normalize = (arr) =>
        (arr || []).map((x) => {
          const genres = Array.isArray(x.genero)
            ? x.genero
            : (x.genero ? String(x.genero).split(',').map(s => s.trim()) : []);
          const year = x.año ?? x.year ?? '';
          const tomos = x.tomos ? `${x.tomos} tomo${x.tomos > 1 ? 's' : ''}` : '';
          const editorial = x.editorial ?? '';
          // autor • año • tomos • editorial
          const metaParts = [x.autor ?? x.author, year, tomos, editorial].filter(Boolean);
          const meta = metaParts.join(' • ');

          return {
            id: x.id ?? x.slug ?? null,
            title: x.titulo ?? x.title ?? 'Sin título',
            img: resolveImagePath(x.imagen ?? x.img ?? 'placeholder.jpg'),
            tag: genres[0] ?? 'Manga',
            genres,
            subtitle: meta,
            year: year ? String(year) : '',
            description: x.descripcion ?? x.description ?? '',
          };
        });

      let data = normalize(dataRaw);

      // Poblar géneros únicos en el filtro
      const gEl = document.getElementById('genre');
      const uniqueGenres = [...new Set(data.flatMap((d) => d.genres || []).filter(Boolean))];
      gEl.innerHTML = `<option value="">Género</option>` + uniqueGenres.map((g) => `<option>${g}</option>`).join('');

      // Función de renderizado de la grilla
      const draw = (arr) =>
        renderCards('#grid', arr, {
          showDescription: false,
          ctaText: 'Ver más',
          onCardClick: (item) => {
            sessionStorage.setItem("detalleItem", JSON.stringify(item));
            sessionStorage.setItem("detalleCategoria", "manga");
            location.hash = "#/detalle";
          },
        });

      draw(data);

      // Filtros de género, año y texto
      const yEl = document.getElementById('year');
      const applyFilters = (q = "") => {
        const g = String(gEl?.value || '').toLowerCase().trim();
        const y = String(yEl?.value || '').trim();

        const filtered = data.filter((x) => {
          const textoOk = !q ||
            [x.title, x.subtitle, ...(x.genres || [])]
              .some((f) => String(f).toLowerCase().includes(q));
          const generoOk = !g || (x.genres || []).some((gg) => String(gg).toLowerCase() === g);
          const yearOk = !y || x.year === y;

          return textoOk && generoOk && yearOk;
        });

        draw(filtered);
      };

      // Listeners de los filtros
      gEl?.addEventListener('change', () => applyFilters());
      yEl?.addEventListener('change', () => applyFilters());

      // Escucha del buscador global (navbar)
      window.addEventListener("globalSearch", (e) => {
        applyFilters(e.detail.query);
      });

      // Logout desde el botón del navbar
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
    },
  };
}
