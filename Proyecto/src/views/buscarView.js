// src/views/buscarView.js
import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { renderCards } from './shared/renderCards.js';
import { resolveImagePath } from './shared/resolve-image-path.js';

export function BuscarView() {
  const html = `
    ${Navbar()}

    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 class="h3 mb-0"><i class="bi bi-search"></i> Resultados de búsqueda</h1>
      </div>

      <div class="mb-3 text-secondary small" id="searchMeta"></div>
      <div id="resultsHost"></div>
    </div>
  `;

  return {
    html,
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      const qInitial = (sessionStorage.getItem('cx:q') || '').trim().toLowerCase();
      const metaEl   = document.getElementById('searchMeta');
      const host     = document.getElementById('resultsHost');

      const { ContentModel } = await import('../models/contentModel.js');

      const [
        pelisRaw, seriesRaw, animeRaw, musicaRaw, librosRaw, juegosRaw
      ] = await Promise.all([
        ContentModel.listPeliculas(),
        ContentModel.listSeries(),
        ContentModel.listAnime(),
        ContentModel.listMusica(),
        ContentModel.listLibros(),
        ContentModel.listVideojuegos(),
      ]);

      const norm = (x, fallbackImg) => {
        const genres = Array.isArray(x.genero)
          ? x.genero
          : (x.genre ? [x.genre] : (x.genero ? String(x.genero).split(',').map(s=>s.trim()) : []));
        const year = x.año ?? x.year ?? '';
        const title = x.titulo ?? x.title ?? x.name ?? x.nombre ?? 'Sin título';
        const desc  = x.descripcion ?? x.description ?? x.synopsis ?? '';
        const imgCandidate = x.imagen ?? x.img ?? x.image ?? fallbackImg;
        const img = resolveImagePath(imgCandidate);
        const subtitle = [
          x.director ?? x.autor ?? x.artist ?? x.plataforma ?? '',
          year || ''
        ].filter(Boolean).join(' • ');
        return {
          id: x.id ?? x.slug ?? x.docId ?? null,
          title, img,
          tag: genres[0] ?? '',
          genres,
          subtitle,
          year: year ? String(year) : '',
          description: desc,
        };
      };

      const data = {
        peliculas:   (pelisRaw  || []).map(x => norm(x, 'inception.jpg')),
        series:      (seriesRaw || []).map(x => norm(x, 'stranger-things.jpg')),
        anime:       (animeRaw  || []).map(x => norm(x, 'naruto.jpg')),
        musica:      (musicaRaw || []).map(x => norm(x, 'avatar.jpg')),
        libros:      (librosRaw || []).map(x => norm(x, 'placeholder.jpg')),
        videojuegos: (juegosRaw || []).map(x => norm(x, 'placeholder.jpg')),
      };

      const catLabel = {
        peliculas: 'Películas',
        series: 'Series',
        anime: 'Anime',
        musica: 'Música',
        libros: 'Libros',
        videojuegos: 'Videojuegos',
      };

      const makeSection = (catKey) => `
        <section class="mb-5" data-cat="${catKey}">
          <h5 class="mb-2">${catLabel[catKey]}</h5>
          <div id="grid-${catKey}"></div>
        </section>
      `;

      const mountSection = (selector, arr, categoria) => {
        renderCards(selector, arr, {
          showDescription: false,
          ctaText: 'Ver más',
          onCardClick: (item) => {
            sessionStorage.setItem("detalleItem", JSON.stringify(item));
            sessionStorage.setItem("detalleCategoria", categoria);
            location.hash = "#/detalle";
          },
        });
      };

      const draw = (query) => {
        const q = (query || '').toLowerCase().trim();
        metaEl.textContent = q
          ? `Mostrando resultados para “${q}”`
          : 'Escribe para buscar en todo el catálogo';

        const filterFn = (x) =>
          !q || [x.title, x.subtitle, x.description, ...(x.genres || [])]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(q));

        const sets = {
          peliculas:   data.peliculas.filter(filterFn),
          series:      data.series.filter(filterFn),
          anime:       data.anime.filter(filterFn),
          musica:      data.musica.filter(filterFn),
          libros:      data.libros.filter(filterFn),
          videojuegos: data.videojuegos.filter(filterFn),
        };

        const entries = Object.entries(sets).filter(([, arr]) => arr.length > 0);
        host.innerHTML = '';

        if (entries.length === 0) {
          host.innerHTML = `
            <div class="text-center text-secondary py-5">
              <i class="bi bi-emoji-frown fs-1 d-block mb-2"></i>
              <p class="mb-1">No se encontraron resultados.</p>
              <small class="text-secondary">Intenta con otra palabra o revisa la ortografía.</small>
            </div>
          `;
          return;
        }

        host.innerHTML = entries.map(([key]) => makeSection(key)).join('');
        entries.forEach(([key, arr]) => mountSection(`#grid-${key}`, arr, key));
      };

      // Render inicial
      draw(qInitial);

      // 🔸 Escucha solo las búsquedas globales (navbar)
      window.addEventListener("globalSearch", (e) => {
        const q = (e.detail?.query || '').trim();
        sessionStorage.setItem('cx:q', q);
        draw(q);
      });

      // Logout
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
    },
  };
}
