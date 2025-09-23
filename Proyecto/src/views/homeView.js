import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { renderRail } from './shared/renderRail.js';
import { resolveImagePath } from './shared/resolveImagePath.js';

export function HomeView() {
  const html = `
    ${Navbar()}

    <!-- HERO / CAROUSEL -->
    <div class="container mt-3">
      <div id="hero" class="carousel slide rounded overflow-hidden shadow-sm" data-bs-ride="carousel">
        <div class="carousel-inner" id="hero-slides"></div>
        <button class="carousel-control-prev" type="button" data-bs-target="#hero" data-bs-slide="prev">
          <span class="carousel-control-prev-icon"></span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#hero" data-bs-slide="next">
          <span class="carousel-control-next-icon"></span>
        </button>
      </div>
    </div>

    <!-- QUICK NAV -->
    <div class="container my-3">
      <div class="d-flex gap-2 flex-wrap">
        <a href="#/peliculas" class="btn btn-outline-light btn-sm"><i class="bi bi-camera-reels"></i> Películas</a>
        <a href="#/series" class="btn btn-outline-light btn-sm"><i class="bi bi-tv"></i> Series</a>
        <a href="#/anime" class="btn btn-outline-light btn-sm"><i class="bi bi-emoji-smile"></i> Anime</a>
        <a href="#/musica" class="btn btn-outline-light btn-sm"><i class="bi bi-music-note-beamed"></i> Música</a>
      </div>
    </div>

    <!-- RAILS -->
    <section class="container my-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h2 class="h5 mb-0">Destacado hoy</h2>
        <a href="#/peliculas" class="btn btn-link btn-sm">Ver todo</a>
      </div>
      <div id="rail-destacados"></div>
    </section>

    <section class="container my-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h2 class="h5 mb-0">Top películas</h2>
        <a href="#/peliculas" class="btn btn-link btn-sm">Ver todo</a>
      </div>
      <div id="rail-peliculas"></div>
    </section>

    <section class="container my-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h2 class="h5 mb-0">Series populares</h2>
        <a href="#/series" class="btn btn-link btn-sm">Ver todo</a>
      </div>
      <div id="rail-series"></div>
    </section>

    <section class="container my-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h2 class="h5 mb-0">Anime que no te puedes perder</h2>
        <a href="#/anime" class="btn btn-link btn-sm">Ver todo</a>
      </div>
      <div id="rail-anime"></div>
    </section>

    <section class="container my-4 mb-5">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h2 class="h5 mb-0">Lanzamientos musicales</h2>
        <a href="#/musica" class="btn btn-link btn-sm">Ver todo</a>
      </div>
      <div id="rail-musica"></div>
    </section>
  `;

  return {
    html,
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      // ====== DATA ======
      const { ContentModel } = await import('../models/contentModel.js');
      const [pelisRaw, seriesRaw, animeRaw, musicaRaw] = await Promise.all([
        ContentModel.listPeliculas(),
        ContentModel.listSeries(),
        ContentModel.listAnime(),
        ContentModel.listMusica(),
      ]);

      // Normalizadores (adaptados a tus campos en español)
      const normPeli = (x) => ({
        id: x.id ?? null,
        title: x.titulo ?? x.title ?? 'Sin título',
        img: resolveImagePath(x.imagen ?? x.img ?? 'inception.jpg'),
        tag: Array.isArray(x.genero) ? x.genero[0] : (x.genero ?? x.genre ?? 'Película'),
        year: String(x.año ?? x.year ?? ''),
        description: x.descripcion ?? x.description ?? '',
        kind: 'peliculas',
      });

      const normSerie = (x) => ({
        id: x.id ?? null,
        title: x.titulo ?? x.title ?? 'Sin título',
        img: resolveImagePath(x.imagen ?? x.img ?? 'stranger-things.jpg'),
        tag: Array.isArray(x.genero) ? x.genero[0] : (x.genero ?? x.genre ?? 'Serie'),
        year: String(x.año ?? x.year ?? ''),
        description: x.descripcion ?? x.description ?? '',
        kind: 'series',
      });

      const normAnime = (x) => ({
        id: x.id ?? null,
        title: x.titulo ?? x.title ?? x.name ?? 'Sin título',
        img: resolveImagePath(x.imagen ?? x.img ?? x.image ?? 'naruto.jpg'),
        tag: x.genero ?? x.genre ?? 'Anime',
        year: String(x.año ?? x.year ?? ''),
        description: x.descripcion ?? x.synopsis ?? x.description ?? '',
        kind: 'anime',
      });

      const normMusica = (x) => ({
        id: x.id ?? null,
        title: x.title ?? x.nombre ?? 'Sin título',
        img: resolveImagePath(x.imagen ?? x.img ?? x.image ?? 'avatar.jpg'),
        tag: x.genre ?? x.genero ?? (x.artist ? x.artist : 'Música'),
        year: String(x.year ?? x.año ?? ''),
        description: x.description ?? x.synopsis ?? '',
        kind: 'musica',
      });

      const pelis  = (pelisRaw  || []).map(normPeli);
      const series = (seriesRaw || []).map(normSerie);
      const anime  = (animeRaw  || []).map(normAnime);
      const musica = (musicaRaw || []).map(normMusica);

      // ====== HERO ======
      const picks = [...pelis.slice(0,3), ...series.slice(0,2)];
      const hero = document.getElementById('hero-slides');
      hero.innerHTML = picks.map((x, i) => `
        <div class="carousel-item ${i===0?'active':''}">
          <div class="ratio ratio-21x9 bg-dark">
            <img src="${x.img}" class="w-100 h-100 object-fit-cover" alt="${x.title}">
          </div>
          <div class="carousel-caption text-start d-none d-md-block bg-black bg-opacity-50 rounded p-3">
            <span class="badge text-bg-warning mb-2">${x.tag}</span>
            <h5 class="mb-1">${x.title}</h5>
            <p class="small text-truncate-2">${x.description || ''}</p>
            <a class="btn btn-primary btn-sm" href="#/${x.kind}">Ver más</a>
          </div>
        </div>
      `).join('');

      // ====== RAILS ======
      const onCard = (item) => alert(`Próximamente detalle de: ${item.title}`);

      renderRail('#rail-destacados', [...pelis, ...series].slice(0, 12), { onItemClick: onCard });
      renderRail('#rail-peliculas', pelis.slice(0, 12), { onItemClick: onCard });
      renderRail('#rail-series',    series.slice(0, 12), { onItemClick: onCard });
      renderRail('#rail-anime',     anime.slice(0, 12), { onItemClick: onCard });
      renderRail('#rail-musica',    musica.slice(0, 12), { onItemClick: onCard });

      // Logout
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });

      // Búsqueda global (opcional)
      document.getElementById('siteSearch')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = e.currentTarget.querySelector('input').value.trim();
        if (q) sessionStorage.setItem('cx:q', q);
        location.hash = '#/peliculas';
      });
    },
  };
}
