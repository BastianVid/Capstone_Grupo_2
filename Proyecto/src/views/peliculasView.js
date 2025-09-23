import { Navbar } from './navbar.js';
import { renderCards } from './shared/renderCards.js';
import { updateNavbarSessionUI } from './navbarSession.js';

export function PeliculasView() {
  const html = `
    ${Navbar()}
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 class="h3 mb-0"><i class="bi bi-camera-reels"></i> Películas</h1>

        <div class="d-flex gap-2 align-items-center">
          <div class="input-group w-auto">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input id="q" class="form-control" placeholder="Buscar por título, director, género o año...">
          </div>
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
  `;

  return {
    html,
    async bind() {
      updateNavbarSessionUI();

      const { ContentModel } = await import('../models/contentModel.js');
      let data = await ContentModel.listPeliculas();

      // 🔁 Adaptación a tu esquema:
      // año, descripcion, director, duracion, genero(array), imagen, titulo, id(opcional)
      const normalize = (arr) =>
        (arr || []).map((x) => {
          const genres = Array.isArray(x.genero) ? x.genero : (x.genre ? [x.genre] : []);
          const year = x.año ?? x.year ?? '';
          const director = x.director ?? '';
          return {
            // usa el id del doc si existe; si también guardas "id" en el doc, respétalo
            id: x.id ?? x.slug ?? x.docId ?? x.documentId ?? x.__id ?? x?.__name ?? x?.$id ?? x?.docid,
            title: x.titulo ?? x.title ?? 'Sin título',
            img: x.imagen ?? x.img ?? 'img/inception.jpg',   // mantiene tu ruta "img/..." (no cambiamos la DB)
            tag: genres[0] ?? 'Película',
            genres,                                          // para filtrar por varios géneros
            subtitle: [director, year].filter(Boolean).join(' • '), // muestra Director • Año
            year: year ? String(year) : '',
            description: x.descripcion ?? x.description ?? '',
          };
        });

      data = normalize(data);

      // Opcional: si en ContentModel no estabas incluyendo doc.id, recupéralo desde snapshot en el futuro.
      // (Por ahora usamos lo que venga; si id es null no rompe nada.)

      // Rellena el select de géneros dinámicamente según tus datos
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
            // import { navigate } from '../core/router.js'; navigate(`/peliculas/${item.id}`);
            alert(`Próximamente reseña de: ${item.title}`);
          },
        });

      draw(data);

      // Filtros: texto (título, director, descripción, géneros), género (array) y año
      const qEl = document.getElementById('q');
      const yEl = document.getElementById('year');

      const applyFilters = () => {
        const q = String(qEl?.value || '').toLowerCase().trim();
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

      qEl?.addEventListener('input', applyFilters);
      gEl?.addEventListener('change', applyFilters);
      yEl?.addEventListener('change', applyFilters);

      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
    },
  };
}
