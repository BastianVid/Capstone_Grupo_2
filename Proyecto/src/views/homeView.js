// ============================== IMPORTS ==============================
import { Navbar, initNavbarSearch } from './navbar.js';
import { Footer } from './footer.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { renderRail } from './shared/renderRail.js';
import { resolveImagePath } from './shared/resolve-image-path.js';
import { applyImgFallback } from './shared/image-fallback.js';

// ============================== HOME VIEW ==============================
export function HomeView() {
  const html = `
    ${Navbar()}

    <!-- BLOQUE SUPERIOR: Sidebar (izq) + Carrusel (der) -->
    <div class="container mt-3">
      <div class="row g-3 align-items-start">

        <!-- Izquierda: Publicidad + Próximamente -->
        <aside class="col-lg-4 col-xl-3">
          <div id="ad-superior" class="card bg-dark border-0 shadow-sm mb-3 text-center p-2 position-relative overflow-hidden" style="min-height:250px;">
            <img src="./src/assets/img/ad.jpg" class="ad-billboard fade-rotate" alt="Publicidad" style="max-height:250px;object-fit:cover;width:100%;">
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

    <!-- PUBLICIDAD INFERIOR DOBLE ROTATIVA -->
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
      // Navbar (sesión + buscador)
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

      // --- Normalización ---
      const norm = (x, kind, defImg, defTag) => ({
        id: x.id ?? null,
        title: x.titulo ?? x.title ?? 'Sin título',
        img: resolveImagePath(x.imagen ?? x.img ?? defImg),
        tag: Array.isArray(x.genero) ? x.genero[0] : (x.genero ?? x.genre ?? defTag),
        description: x.descripcion ?? x.description ?? '',
        kind,
      });
      const pelis  = (pelisRaw  || []).map(x => norm(x, 'peliculas', 'inception.jpg', 'Película'));
      const series = (seriesRaw || []).map(x => norm(x, 'series', 'stranger-things.jpg', 'Serie'));
      const anime  = (animeRaw  || []).map(x => norm(x, 'anime', 'naruto.jpg', 'Anime'));
      const musica = (musicaRaw || []).map(x => norm(x, 'musica', 'avatar.jpg', 'Música'));

      // --- HERO ---
      const picks = [...pelis.slice(0, 3), ...series.slice(0, 2)];
      const defaults = [
        { img: 'avengers.jpg',  title: 'Avengers: Endgame', tag: 'Acción',          description: 'Los héroes del universo se unen...' },
        { img: 'inception.jpg', title: 'Inception',         tag: 'Ciencia Ficción', description: 'Sueños dentro de sueños.' },
        { img: 'avatar.jpg',    title: 'Avatar',            tag: 'Ciencia Ficción', description: 'Aventura épica en Pandora.' },
      ];
      const slides = (picks.length ? picks : defaults).map((s, i) => `
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

      // --- PRÓXIMAMENTE ---
      const fallbackUpcoming = [
        { titulo: 'Avengers',           img: 'avengers.jpg',        genero: ['Acción'] },
        { titulo: 'Stranger Things T5', img: 'stranger-things.jpg', genero: ['Ciencia Ficción'] },
        { titulo: 'Dragon Ball Z',      img: 'dragon-ball-z.jpg',   genero: ['Anime'] },
        { titulo: 'Chainsaw Man',       img: 'chainsaw-man.jpg',    genero: ['Shonen'] },
        { titulo: 'Bleach',             img: 'bleach.jpg',          genero: ['Shonen'] },
      ];
      const upcoming = fallbackUpcoming.map(x => ({
        title: x.titulo,
        img: resolveImagePath(x.img),
        tag: x.genero[0],
      }));
      const uhost = document.getElementById('upcoming-list');
      uhost.innerHTML = upcoming.map(u => `
        <a class="list-group-item list-group-item-action bg-transparent text-white d-flex gap-2 align-items-start">
          <img src="${u.img}" class="upcoming-thumb img-with-fallback" alt="${u.title}" style="width:70px;height:100px;object-fit:cover;">
          <div class="flex-grow-1">
            <div class="small fw-semibold text-truncate">${u.title}</div>
            <div class="small text-secondary">${u.tag}</div>
          </div>
        </a>
      `).join('');

      // --- PUBLICIDAD ROTATIVA ---
      try {
        const res = await fetch('./src/data/publicidad.json');
        const ads = await res.json();

        const rotateAds = (elementId, list, interval = 8000, maxHeight = '150px') => {
          const el = document.getElementById(elementId);
          if (!el || !list?.length) return;
          let index = 0;
          const changeAd = () => {
            const ad = list[index];
            const img = document.createElement('img');
            img.src = ad.img;
            img.alt = ad.alt;
            img.className = 'img-fluid rounded fade-rotate mx-auto d-block';
            img.style = `max-height:${maxHeight};object-fit:cover;width:100%;`;
            el.innerHTML = `<a href="${ad.url}" target="_blank"></a>`;
            el.querySelector('a').appendChild(img);
            index = (index + 1) % list.length;
          };
          changeAd();
          setInterval(changeAd, interval);
        };

        rotateAds('ad-superior', ads.superior, 8000, '250px');
        rotateAds('ad-bottom-1', ads.inferior, 8000, '150px');
        rotateAds('ad-bottom-2', ads.inferior.slice().reverse(), 10000, '150px');
      } catch (err) {
        console.warn('Error cargando publicidad:', err);
      }

      // --- RAILS ---
      const onCard = (item) => {
        sessionStorage.setItem('detalleItem', JSON.stringify(item));
        sessionStorage.setItem('detalleCategoria', item.kind);
        location.hash = '#/detalle';
      };
      renderRail('#rail-destacados', [...pelis, ...series].slice(0, 12), { onItemClick: onCard });
      renderRail('#rail-peliculas',  pelis.slice(0, 12),  { onItemClick: onCard });
      renderRail('#rail-series',     series.slice(0, 12), { onItemClick: onCard });
      renderRail('#rail-anime',      anime.slice(0, 12),  { onItemClick: onCard });
      renderRail('#rail-musica',     musica.slice(0, 12), { onItemClick: onCard });

      // === Ajustes visuales y autoscroll ===
      const style = document.createElement("style");
      style.innerHTML = `
        [id^="rail-"] > div {
          display: flex !important;
          gap: 1rem !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: rgba(160,160,160,0.4) transparent;
          padding-bottom: 6px;
        }
        [id^="rail-"] > div::-webkit-scrollbar {
          height: 6px;
        }
        [id^="rail-"] > div::-webkit-scrollbar-thumb {
          background: rgba(160,160,160,0.4);
          border-radius: 4px;
        }
        [id^="rail-"] > div::-webkit-scrollbar-thumb:hover {
          background: rgba(200,200,200,0.6);
        }
        [id^="rail-"] > div::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
        }

        /* Botón Ver todo moderno */
        a.btn.btn-link.btn-sm {
          color: #8cc7ff !important;
          text-decoration: none !important;
          border: 1px solid rgba(140,200,255,0.5);
          border-radius: 20px;
          padding: 2px 12px;
          transition: all .25s ease;
        }
        a.btn.btn-link.btn-sm:hover {
          background-color: rgba(140,200,255,0.2);
          color: #fff !important;
          transform: scale(1.03);
        }
      `;
      document.head.appendChild(style);

      // Autoscroll funcional
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

      setupAutoScroll('#rail-destacados');
      setupAutoScroll('#rail-peliculas');
      setupAutoScroll('#rail-series');
      setupAutoScroll('#rail-anime');
      setupAutoScroll('#rail-musica');

      // Logout
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
    },
  };
}
