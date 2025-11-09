// ============================== IMPORTS ==============================
import { Navbar, initNavbarSearch } from './shared/navbar.js';
import { Footer } from './shared/footer.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './shared/navbarSession.js';
import { renderRail } from './shared/renderRail.js';
import { resolveImagePath } from './shared/resolve-image-path.js';
import { applyImgFallback } from './shared/image-fallback.js';

// ============================== HOME VIEW ==============================
export function HomeView() {
  const html = `
    ${Navbar()}

    <!-- BLOQUE SUPERIOR -->
    <div class="container mt-3">
      <div class="row g-3 align-items-start">

        <!-- Izquierda -->
        <aside class="col-lg-4 col-xl-3">
          <div id="ad-superior" class="card bg-dark border-0 shadow-sm mb-3 text-center p-2 position-relative overflow-hidden" style="min-height:250px;">
            <img src="./src/assets/img/ad.jpg" class="ad-billboard fade-rotate" alt="Publicidad" style="max-height:250px;object-fit:cover;width:100%;">
          </div>

          <div class="card bg-dark border-0 shadow-sm upcoming-card">
            <div class="card-header bg-transparent border-0 d-flex align-items-center justify-content-between">
              <span class="fw-semibold">Próximamente</span>
              <a class="small" href="#/peliculas">Explorar tráilers</a>
            </div>
            <div id="upcoming-list" class="list-group list-group-flush scrollbar-dark"></div>
          </div>
        </aside>

        <!-- Derecha -->
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
        <a href="#/peliculas" class="cx-btn cx-btn-sm">
          Ver todo <i class="bi bi-arrow-right-short"></i>
        </a>
      </div>
      <div id="rail-destacados"></div>
    </section>

    <section class="container my-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h2 class="h5 mb-0">Top películas</h2>
        <a href="#/peliculas" class="cx-btn cx-btn-sm">
          Ver todo <i class="bi bi-arrow-right-short"></i>
        </a>
      </div>
      <div id="rail-peliculas"></div>
    </section>

    <section class="container my-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h2 class="h5 mb-0">Series populares</h2>
        <a href="#/series" class="cx-btn cx-btn-sm">
          Ver todo <i class="bi bi-arrow-right-short"></i>
        </a>
      </div>
      <div id="rail-series"></div>
    </section>

    <section class="container my-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h2 class="h5 mb-0">Anime que no te puedes perder</h2>
        <a href="#/anime" class="cx-btn cx-btn-sm">
          Ver todo <i class="bi bi-arrow-right-short"></i>
        </a>
      </div>
      <div id="rail-anime"></div>
    </section>

    <section class="container my-4 mb-5">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h2 class="h5 mb-0">Lo más escuchado</h2>
        <a href="#/musica" class="cx-btn cx-btn-sm">
          Ver todo <i class="bi bi-arrow-right-short"></i>
        </a>
      </div>
      <div id="rail-musica"></div>
    </section>

    <!-- PUBLICIDAD INFERIOR -->
    <section class="container my-5">
      <div class="row g-3">
        <div class="col-md-6">
          <div id="ad-bottom-1" class="card bg-dark border-0 shadow-sm text-center p-0 h-100 position-relative overflow-hidden" style="min-height:150px;"></div>
        </div>
        <div class="col-md-6">
          <div id="ad-bottom-2" class="card bg-dark border-0 shadow-sm text-center p-0 h-100 position-relative overflow-hidden" style="min-height:150px;"></div>
        </div>
      </div>
    </section>

    ${Footer()}
  `;

  return {
    html,
    async bind() {
      // === Navbar y sesión ===
      initNavbarSessionWatcher();
      updateNavbarSessionUI();
      initNavbarSearch();

      const { ContentModel } = await import('../models/contentModel.js');
      const [pelisRaw, seriesRaw, animeRaw, musicaRaw] = await Promise.all([
        ContentModel.listPeliculas(),
        ContentModel.listSeries(),
        ContentModel.listAnime(),
        ContentModel.listMusica(),
      ]);

      // === Normalización ===
      const norm = (x, kind, defImg, defTag) => ({
        id: x.id ?? null,
        title: x.titulo ?? x.title ?? 'Sin título',
        img: resolveImagePath(x.imagen ?? x.img ?? defImg),
        tag: Array.isArray(x.genero) ? x.genero[0] : (x.genero ?? x.genre ?? defTag),
        description: x.descripcion ?? x.description ?? '',
        rating: x.calificacionPromedio ?? x.rating ?? 0,
        kind,
      });

      const pelis = (pelisRaw || []).map(x => norm(x, 'peliculas', 'inception.jpg', 'Película'));
      const series = (seriesRaw || []).map(x => norm(x, 'series', 'stranger-things.jpg', 'Serie'));
      const anime = (animeRaw || []).map(x => norm(x, 'anime', 'naruto.jpg', 'Anime'));
      const musica = (musicaRaw || []).map(x => norm(x, 'musica', 'avatar.jpg', 'Música'));

      // === Top dinámico y seguro ===
      const getTopRated = (arr) => {
        const rated = arr.filter((x) => x.rating && x.rating > 0);
        if (rated.length > 0) return rated.sort((a, b) => b.rating - a.rating).slice(0, 10);
        // fallback: mostrar primeros registros si no hay calificados
        return arr.slice(0, 10);
      };

      const topPelis = getTopRated(pelis);
      const topSeries = getTopRated(series);
      const topAnime = getTopRated(anime);
      const topMusica = getTopRated(musica);

      // === Destacados aleatorios (si no hay rating, usa mezcla básica)
      const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
      const destacados = shuffle([
        ...topPelis.slice(0, 3),
        ...topSeries.slice(0, 3),
        ...topAnime.slice(0, 3),
        ...topMusica.slice(0, 3),
      ]).slice(0, 10);

      // === HERO ===
      const heroPicks = [...topPelis.slice(0, 2), ...topSeries.slice(0, 2)];
      const slides = heroPicks.map((s, i) => `
        <div class="carousel-item ${i === 0 ? 'active' : ''} h-100 position-relative">
          <img src="${resolveImagePath(s.img)}" alt="${s.title}" class="w-100 h-100 img-with-fallback" style="object-fit:cover;">
          <div class="position-absolute start-0 end-0 bottom-0 p-3" style="background:linear-gradient(to top, rgba(0,0,0,.65), rgba(0,0,0,0));">
            ${s.tag ? `<span class="badge text-bg-warning mb-2">${s.tag}</span>` : ''}
            <h5>${s.title}</h5>
            <p class="small mb-0 text-truncate-2">${s.description}</p>
          </div>
        </div>
      `).join('');
      document.getElementById('hero-slides').innerHTML = slides;
      applyImgFallback(document, 'img.img-with-fallback');

      // === Próximamente ===
      const upcomingFallback = [
        { titulo: 'Avengers', img: 'avengers.jpg', genero: ['Acción'] },
        { titulo: 'Stranger Things T5', img: 'stranger-things.jpg', genero: ['Ciencia Ficción'] },
        { titulo: 'Dragon Ball Z', img: 'dragon-ball-z.jpg', genero: ['Anime'] },
        { titulo: 'Chainsaw Man', img: 'chainsaw-man.jpg', genero: ['Shonen'] },
        { titulo: 'Bleach', img: 'bleach.jpg', genero: ['Shonen'] },
      ];
      document.getElementById('upcoming-list').innerHTML = upcomingFallback.map(x => `
        <a class="list-group-item list-group-item-action bg-transparent text-white d-flex gap-2 align-items-start">
          <img src="${resolveImagePath(x.img)}" style="width:70px;height:100px;object-fit:cover;">
          <div class="flex-grow-1">
            <div class="small fw-semibold text-truncate">${x.titulo}</div>
            <div class="small text-secondary">${x.genero[0]}</div>
          </div>
        </a>`).join('');

      // === Render Rails ===
      const onCard = (item) => {
        sessionStorage.setItem('detalleItem', JSON.stringify(item));
        sessionStorage.setItem('detalleCategoria', item.kind);
        location.hash = '#/detalle';
      };

      renderRail('#rail-destacados', destacados, { onItemClick: onCard });
      renderRail('#rail-peliculas', topPelis, { onItemClick: onCard });
      renderRail('#rail-series', topSeries, { onItemClick: onCard });
      renderRail('#rail-anime', topAnime, { onItemClick: onCard });
      renderRail('#rail-musica', topMusica, { onItemClick: onCard });

      // === Autoscroll ===
      const setupAutoScroll = (selector, step = 1, everyMs = 25) => {
        const el = document.querySelector(selector + ' > div');
        if (!el) return;
        let dir = 1, paused = false;
        const tick = () => {
          if (paused || el.scrollWidth <= el.clientWidth) return;
          el.scrollLeft += step * dir;
          if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) dir = -1;
          if (el.scrollLeft <= 0) dir = 1;
        };
        const t = setInterval(tick, everyMs);
        el.addEventListener('mouseenter', () => paused = true);
        el.addEventListener('mouseleave', () => paused = false);
        window.addEventListener('hashchange', () => clearInterval(t), { once: true });
      };

      ['#rail-destacados', '#rail-peliculas', '#rail-series', '#rail-anime', '#rail-musica']
        .forEach((sel) => setupAutoScroll(sel));

      // === Logout ===
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
    },
  };
}
