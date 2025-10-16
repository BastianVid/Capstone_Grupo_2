import { Navbar } from './navbar.js';
import { Footer } from './footer.js';  
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { renderRail } from './shared/renderRail.js';
import { resolveImagePath } from './shared/resolve-image-path.js';
import { applyImgFallback } from './shared/image-fallback.js';

export function HomeView() {
  const html = `
    ${Navbar()}

    <!-- BLOQUE SUPERIOR: Sidebar (izq) + Carrusel (der) -->
    <div class="container mt-3">
      <div class="row g-3 align-items-start"><!-- no estirar alturas -->

        <!-- Izquierda: Publicidad + Próximamente -->
        <aside class="col-lg-4 col-xl-3">
          <div class="card bg-dark border-0 shadow-sm mb-3">
            <img src="./src/assets/img/ad.jpg" class="ad-billboard" alt="Publicidad">
          </div>

          <div class="card bg-dark border-0 shadow-sm upcoming-card">
            <div class="card-header bg-transparent border-0 d-flex align-items-center justify-content-between">
              <span class="fw-semibold">Próximamente</span>
              <a class="small" href="#/peliculas">Explorar tráilers</a>
            </div>
            <div id="upcoming-list" class="list-group list-group-flush"></div>
          </div>
        </aside>

        <!-- Derecha: Carrusel -->
        <div class="col-lg-8 col-xl-9">
          <div id="hero" class="carousel slide cx-hero position-relative shadow-sm" data-bs-ride="carousel" data-bs-interval="5000">
            <div class="carousel-inner h-100" id="hero-slides"></div>
            <button class="carousel-control-prev" type="button" data-bs-target="#hero" data-bs-slide="prev">
              <span class="carousel-control-prev-icon"></span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#hero" data-bs-slide="next">
              <span class="carousel-control-next-icon"></span>
            </button>
          </div>
        </div>

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

    ${Footer()} 
  `;

  return {
    html,
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      const { ContentModel } = await import('../models/contentModel.js');
      const [pelisRaw, seriesRaw, animeRaw, musicaRaw] = await Promise.all([
        ContentModel.listPeliculas(),
        ContentModel.listSeries(),
        ContentModel.listAnime(),
        ContentModel.listMusica(),
      ]);

      // Normalizadores
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

      // ===== HERO =====
      const picks = [...pelis.slice(0, 3), ...series.slice(0, 2)];
      const defaults = [
        { img: 'avengers.jpg',  title: 'Avengers: Endgame', tag: 'Acción',          description: 'Los héroes del universo se unen...' },
        { img: 'inception.jpg', title: 'Inception',         tag: 'Ciencia Ficción', description: 'Sueños dentro de sueños.' },
        { img: 'avatar.jpg',    title: 'Avatar',            tag: 'Ciencia Ficción', description: 'Aventura épica en Pandora.' },
      ];

      const slides = (picks.length ? picks : defaults).map(s => ({
        src: resolveImagePath(s.img || s.imagen || s.image),
        title: s.title ?? s.titulo ?? 'Sin título',
        tag: s.tag ?? (Array.isArray(s.genero) ? s.genero[0] : s.genero) ?? '',
        description: s.description ?? s.descripcion ?? '',
      }));

      const hero = document.getElementById('hero-slides');
      hero.innerHTML = slides.map((s, i) => `
        <div class="carousel-item ${i === 0 ? 'active' : ''} h-100 position-relative">
          <img
            src="${s.src}"
            alt="${s.title}"
            class="w-100 h-100 img-with-fallback"
            data-fallback data-w="1200" data-h="620" data-ph="CulturaX"
            style="object-fit:cover;display:block">
          <div class="position-absolute start-0 end-0 bottom-0 p-3"
               style="background:linear-gradient(to top, rgba(0,0,0,.65), rgba(0,0,0,0));">
            ${s.tag ? `<span class="badge text-bg-warning mb-2">${s.tag}</span>` : ''}
            <h5 class="mb-1">${s.title}</h5>
            <p class="small mb-0 text-truncate-2">${s.description}</p>
          </div>
        </div>
      `).join('');

      // Aplica fallback en el carrusel
      applyImgFallback(hero, 'img.img-with-fallback');

      // ===== PRÓXIMAMENTE =====
      const hoy = new Date();
      const upcomingRaw = (pelisRaw || []).filter(x =>
        x?.estreno === true ||
        (x?.fecha_estreno && !Number.isNaN(Date.parse(x.fecha_estreno)) && new Date(x.fecha_estreno) > hoy)
      );
      const fallbackUpcoming = [
        { titulo: 'Avengers',           img: 'avengers.jpg',        genero: ['Acción'] },
        { titulo: 'Stranger Things T5', img: 'stranger-things.jpg', genero: ['Ciencia Ficción'] },
        { titulo: 'Dragon Ball Z',      img: 'dragon-ball-z.jpg',   genero: ['Anime'] },
        { titulo: 'Chainsaw Man',       img: 'chainsaw-man.jpg',    genero: ['Shonen'] },
        { titulo: 'Bleach',             img: 'bleach.jpg',          genero: ['Shonen'] },
      ];

      const upcoming = (upcomingRaw.length ? upcomingRaw : fallbackUpcoming)
        .slice(0, 6)
        .map(x => ({
          title: x.titulo ?? x.title ?? 'Sin título',
          img: resolveImagePath(x.imagen ?? x.img ?? x.image),
          tag: Array.isArray(x.genero) ? x.genero[0] : (x.genero ?? x.genre ?? ''),
        }));

      const uhost = document.getElementById('upcoming-list');
      uhost.innerHTML = upcoming.map((u) => `
        <a class="list-group-item list-group-item-action bg-transparent text-white d-flex gap-2 align-items-start">
          <img src="${u.img}" class="upcoming-thumb img-with-fallback"
               data-fallback data-w="112" data-h="168" data-ph="CulturaX"
               alt="${u.title}">
          <div class="flex-grow-1">
            <div class="small fw-semibold text-truncate">${u.title}</div>
            <div class="small text-secondary">${u.tag || ''}</div>
          </div>
          <div class="text-secondary small"><i class="bi bi-play-circle"></i></div>
        </a>
      `).join('');

      // Aplica fallback en “Próximamente”
      applyImgFallback(uhost, 'img.img-with-fallback');

      // ===== RAILS =====
      const onCard = (item) => alert(`Próximamente detalle de: ${item.title}`);
      renderRail('#rail-destacados', [...pelis, ...series].slice(0, 12), { onItemClick: onCard });
      renderRail('#rail-peliculas',  pelis.slice(0, 12),  { onItemClick: onCard });
      renderRail('#rail-series',     series.slice(0, 12), { onItemClick: onCard });
      renderRail('#rail-anime',      anime.slice(0, 12),  { onItemClick: onCard });
      renderRail('#rail-musica',     musica.slice(0, 12), { onItemClick: onCard });

      // Por si tu renderRail aún no aplica fallback internamente:
      applyImgFallback(document, '.rail-card img');

      // Navbar: redirección del buscador -> ahora a /buscar
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
      document.getElementById('siteSearch')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = e.currentTarget.querySelector('input').value.trim();
        if (q) sessionStorage.setItem('cx:q', q);
        location.hash = '#/buscar'; // 👈 ANTES era '#/peliculas'
      });
    },
  };
}
