// ============================== IMPORTS ==============================
import { Navbar, initNavbarSearch } from './shared/navbar.js';
import { Footer } from './shared/footer.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './shared/navbarSession.js';
import { renderRail } from './shared/renderRail.js';
import { resolveImagePath } from './shared/resolve-image-path.js';
import { applyImgFallback } from './shared/image-fallback.js';
import { requestGeminiRecommendation, buildCatalogSummary, buildUserReviewSummary, buildCommunityReviewSummary, hasGeminiApiKey } from '../lib/gemini.js';
import { auth, currentUser as firebaseCurrentUser } from '../lib/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// ============================== HOME VIEW ==============================
export function HomeView() {
  const html = `
    ${Navbar()}

    <!-- BLOQUE SUPERIOR -->
    <div class="container mt-3">
      <div class="row g-3 align-items-start">

        <!-- Izquierda -->
        <aside class="col-lg-4 col-xl-3">
          <div id="ad-superior" class="card bg-dark border-0 shadow-sm mb-3 text-center p-2 position-relative overflow-hidden"></div>

          <div class="card bg-dark border-0 shadow-sm upcoming-card">
            <div class="card-header bg-transparent border-0 d-flex align-items-center justify-content-between">
              <span class="fw-semibold">Proximamente</span>
              <a class="small" href="#/proximamente">Explorar trailers</a>
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
        <h2 class="h5 mb-0">Top pelAculas</h2>
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
        <h2 class="h5 mb-0">Lo mAs escuchado</h2>
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
          <div id="ad-bottom-1" class="card bg-dark border-0 shadow-sm text-center p-0 h-100 position-relative overflow-hidden" style="height:150px;"></div>
        </div>
        <div class="col-md-6">
          <div id="ad-bottom-2" class="card bg-dark border-0 shadow-sm text-center p-0 h-100 position-relative overflow-hidden" style="height:150px;"></div>
        </div>
      </div>
    </section>

    ${Footer()}

    <div class="cx-ai-chat" id="cxAiChat" aria-live="polite">
      <div class="cx-ai-chat__panel" id="cxAiChatPanel" aria-hidden="true">
        <div class="cx-ai-chat__window" id="cxAiChatWindow" role="dialog" aria-modal="false" aria-labelledby="cxAiChatTitle">
          <div class="cx-ai-chat__header">
            <div>
              <p class="cx-ai-chat__title mb-0" id="cxAiChatTitle">CulturIAx</p>
              <small class="text-secondary">Sugerencias segun resenas</small>
            </div>
            <button type="button" class="btn btn-sm btn-outline-light border-0" id="cxAiChatClose" aria-label="Cerrar chat">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="cx-ai-chat__messages scrollbar-dark" id="cxAiChatMessages"></div>
          <div class="cx-ai-chat__suggestions" id="cxAiChatSuggestions"></div>

          <form class="cx-ai-chat__form" id="cxAiChatForm">
            <input type="text" class="form-control" id="cxAiChatInput" placeholder="Cuentame que quieres ver..." autocomplete="off" />
            <button class="cx-ai-chat__send" type="submit" aria-label="Enviar mensaje a CulturIAx">
              <i class="bi bi-send"></i>
            </button>
          </form>

          <div class="cx-ai-chat__status" id="cxAiChatStatus" hidden>
            <div class="spinner-border spinner-border-sm text-light" role="status"></div>
            <span>Buscando recomendaciones...</span>
          </div>
        </div>
      </div>

      <button type="button" class="cx-ai-chat__fab" id="cxAiChatToggle" aria-expanded="false" aria-controls="cxAiChatWindow">
        <i class="bi bi-stars"></i>
        <span>No sabes que ver?</span>
      </button>
    </div>
  `;

  return {
    html,
    async bind() {
      // === Navbar y sesion ===
      initNavbarSessionWatcher();
      updateNavbarSessionUI();
      initNavbarSearch();

      const { ContentModel } = await import('../models/contentModel.js');
      const [
        pelisRaw,
        seriesRaw,
        animeRaw,
        musicaRaw,
        librosRaw,
        documentalesRaw,
        videojuegosRaw,
        mangaRaw,
        proximamenteRaw,
        communityReviewsRaw,
      ] = await Promise.all([
        ContentModel.listPeliculas(),
        ContentModel.listSeries(),
        ContentModel.listAnime(),
        ContentModel.listMusica(),
        ContentModel.listLibros(),
        ContentModel.listDocumentales(),
        ContentModel.listVideojuegos(),
        ContentModel.listManga(),
        ContentModel.listProximamente(),
        ContentModel.listCommunityResenas(60),
      ]);


      // === Normalizacion ===
      const norm = (x, kind, defImg, defTag) => {
        const genres = Array.isArray(x.genero)
          ? x.genero.filter(Boolean)
          : x.genero
          ? [x.genero]
          : Array.isArray(x.genre)
          ? x.genre.filter(Boolean)
          : x.genre
          ? [x.genre]
          : [];

        return {
          id: x.id ?? null,
          title: x.titulo ?? x.title ?? 'Sin tAtulo',
          img: resolveImagePath(x.imagen ?? x.img ?? defImg),
          tag: genres[0] ?? x.genero ?? x.genre ?? defTag,
          genres,
          description: x.descripcion ?? x.description ?? '',
          rating: x.calificacionPromedio ?? x.rating ?? 0,
          kind,
        };
      };

      const pelis = (pelisRaw || []).map(x => norm(x, 'peliculas', 'inception.jpg', 'PelAcula'));
      const series = (seriesRaw || []).map(x => norm(x, 'series', 'stranger-things.jpg', 'Serie'));
      const anime = (animeRaw || []).map(x => norm(x, 'anime', 'naruto.jpg', 'Anime'));
      const musica = (musicaRaw || []).map(x => norm(x, 'musica', 'avatar.jpg', 'MAosica'));
      const libros = (librosRaw || []).map(x => norm(x, 'libros', 'avatar.jpg', 'Libro'));
      const documentales = (documentalesRaw || []).map(x => norm(x, 'documentales', 'avatar.jpg', 'Documental'));
      const videojuegos = (videojuegosRaw || []).map(x => norm(x, 'videojuegos', 'avatar.jpg', 'Videojuego'));
      const manga = (mangaRaw || []).map(x => norm(x, 'manga', 'naruto.jpg', 'Manga'));
        const proximamente = (proximamenteRaw || []).map(x =>
          norm(x, 'proximamente', 'default.jpg', 'Proximamente')
        );


      // === Top dinAmico y seguro ===
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
      const topLibros = getTopRated(libros);
      const topDocumentales = getTopRated(documentales);
      const topVideojuegos = getTopRated(videojuegos);
      const topManga = getTopRated(manga);

      const collectGenres = (...groups) =>
        groups
          .flat()
          .flatMap((item) =>
            Array.isArray(item.genres) ? item.genres : item.tag ? [item.tag] : []
          )
          .filter(Boolean);

      const trendingGenres = Array.from(
        new Set(collectGenres(pelis, series, anime, musica, libros, documentales, videojuegos, manga))
      ).slice(0, 3);

      const combinedTop = [
        ...topPelis.slice(0, 4),
        ...topSeries.slice(0, 4),
        ...topAnime.slice(0, 4),
        ...topMusica.slice(0, 3),
        ...topLibros.slice(0, 3),
        ...topDocumentales.slice(0, 3),
        ...topVideojuegos.slice(0, 3),
        ...topManga.slice(0, 3),
      ];
      const geminiCatalogSummary = buildCatalogSummary(combinedTop);
      const communityReviewSummary = buildCommunityReviewSummary(communityReviewsRaw);
      const fallbackUserReviewSummary = "El usuario no tiene resenas todavia. Sugiere contenido general popular de acuerdo al catalogo.";
      let userReviewEntries = [];
      let userReviewSummary = fallbackUserReviewSummary;
      let userReviewUid = null;

      const loadUserReviews = async (force = false) => {
        try {
          const activeUser = firebaseCurrentUser || auth.currentUser;
          const uid = activeUser?.uid;

          if (!uid) {
            userReviewEntries = [];
            userReviewSummary = fallbackUserReviewSummary;
            userReviewUid = null;
            return;
          }

          if (!force && uid === userReviewUid && userReviewEntries.length) return;

          userReviewEntries = await ContentModel.listUserResenasQuick(uid, 20);
          if (!userReviewEntries.length) {
            userReviewEntries = await ContentModel.listResenasByUser(uid, 20);
          }

          userReviewUid = uid;
          userReviewSummary = userReviewEntries.length
            ? buildUserReviewSummary(userReviewEntries)
            : fallbackUserReviewSummary;
        } catch (err) {
          console.error('[CulturIAx] No se pudieron leer resenas personales:', err);
          userReviewEntries = [];
          userReviewSummary = fallbackUserReviewSummary;
          userReviewUid = null;
        }
      };

      await loadUserReviews(true);

      const geminiKeyReady = hasGeminiApiKey();

      // === Destacados aleatorios (si no hay rating, usa mezcla bAsica)
      const shuffle = (arr = []) => arr
        .map((v) => ({ v, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ v }) => v);
      const destacados = shuffle([
        ...topPelis.slice(0, 3),
        ...topSeries.slice(0, 3),
        ...topAnime.slice(0, 3),
        ...topMusica.slice(0, 3),
      ]).slice(0, 10);

      // === HERO ===
      const heroCandidates = [
        ...topPelis,
        ...topSeries,
        ...topAnime,
        ...topMusica,
        ...topDocumentales,
      ];
      const heroPicks = shuffle(heroCandidates).slice(0, 6);
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
      const heroEl = document.getElementById('hero-slides');
      if (!heroEl) {
        console.error('[Home] No se encontro el contenedor del hero');
      } else {
        heroEl.innerHTML = slides;
        applyImgFallback(document, 'img.img-with-fallback');
      }

      // Igualar alto de la tarjeta "Proximamente" con el hero
      const syncHeroSidebarHeight = () => {
        const heroBox = document.querySelector('.cx-hero');
        const upcomingCardEl = document.querySelector('.upcoming-card');
        if (!heroBox || !upcomingCardEl) return;
        if (window.innerWidth < 992) {
          upcomingCardEl.style.height = '';
          return;
        }
        const adEl = document.getElementById('ad-superior');
        const adStyles = adEl ? window.getComputedStyle(adEl) : null;
        const adMargin =
          adStyles ? parseFloat(adStyles.marginTop || 0) + parseFloat(adStyles.marginBottom || 0) : 0;
        const adHeight = adEl ? adEl.offsetHeight + adMargin : 0;
        const target = heroBox.offsetHeight - adHeight;
        const minHeight = 320;
        upcomingCardEl.style.height = `${Math.max(target, minHeight)}px`;
      };
      window.addEventListener('resize', syncHeroSidebarHeight);

      // === Proximamente (desde Firestore) ===
      const upcomingItems = shuffle(proximamente).slice(0, 6);  // limita a 6 resultados
      const upcomingEl = document.getElementById('upcoming-list');
      if (upcomingEl) {
        upcomingEl.innerHTML =
          upcomingItems.length
            ? upcomingItems.map(x => `
                <a class="list-group-item list-group-item-action bg-transparent text-white d-flex gap-2 align-items-start"
                  data-id="${x.id}" data-kind="${x.kind}">
                  <img src="${resolveImagePath(x.img)}" style="width:70px;height:100px;object-fit:cover;">
                  <div class="flex-grow-1">
                    <div class="small fw-semibold text-truncate">${x.title}</div>
                    <div class="small text-secondary">${x.tag}</div>
                  </div>
                </a>
              `).join('')
            : `<div class="p-2 text-secondary small">Sin proximos estrenos</div>`;
      }

      
     // Activar clic en las tarjetas
      document.querySelectorAll('#upcoming-list a').forEach(el => {
        el.addEventListener('click', () => {
          sessionStorage.setItem('detalleItem', JSON.stringify({
            id: el.dataset.id
          }));
          sessionStorage.setItem('detalleCategoria', 'proximamente');
          location.hash = '#/detalle';
        });
      });




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

      // === CulturIAx (AI chat) ===
      let rerenderGeminiSuggestions = () => {};
      const initCulturIAx = () => {
        const root = document.getElementById('cxAiChat');
        const panelEl = document.getElementById('cxAiChatPanel');
        const dialogEl = document.getElementById('cxAiChatWindow');
        const toggleBtn = document.getElementById('cxAiChatToggle');
        const closeBtn = document.getElementById('cxAiChatClose');
        const formEl = document.getElementById('cxAiChatForm');
        const inputEl = document.getElementById('cxAiChatInput');
        const sendBtn = formEl?.querySelector('button[type="submit"]');
        const messagesEl = document.getElementById('cxAiChatMessages');
        const suggestionsEl = document.getElementById('cxAiChatSuggestions');
        const statusEl = document.getElementById('cxAiChatStatus');
        const statusText = statusEl?.querySelector('span');
        const history = [];
        let pending = false;

        if (!root || !panelEl || !dialogEl || !toggleBtn || !messagesEl) return;

        const isOpen = () => root.classList.contains('is-open');
        const openChat = () => {
          if (isOpen()) return;
          root.classList.add('is-open');
          panelEl.setAttribute('aria-hidden', 'false');
          toggleBtn.setAttribute('aria-expanded', 'true');
          if (inputEl) setTimeout(() => inputEl.focus(), 120);
        };
        const closeChat = () => {
          if (!isOpen()) return;
          const activeEl = document.activeElement;
          if (activeEl && dialogEl.contains(activeEl)) {
            activeEl.blur();
          }
          panelEl.setAttribute('aria-hidden', 'true');
          root.classList.remove('is-open');
          toggleBtn.setAttribute('aria-expanded', 'false');
          toggleBtn.focus();
        };

        toggleBtn.addEventListener('click', () => {
          if (isOpen()) {
            closeChat();
          } else {
            openChat();
          }
        });
        closeBtn?.addEventListener('click', closeChat);
        document.addEventListener('mousedown', (evt) => {
          if (isOpen() && !root.contains(evt.target)) closeChat();
        });
        document.addEventListener('keydown', (evt) => {
          if (evt.key === 'Escape' && isOpen()) {
            evt.preventDefault();
            closeChat();
          }
        });

        const sanitizeAiText = (value = '') => {
          let output = String(value || '');
          // Quitar negritas estilo Markdown y asteriscos duplicados
          output = output.replace(/\*\*(.*?)\*\*/g, '$1');
          output = output.replace(/__([^_]+)__/g, '$1');
          // Convertir viAetas con asterisco a puntos simples
          output = output.replace(/^\s*\*\s+/gm, 'a ');
          // Remover acumulaciones de asteriscos sueltos
          output = output.replace(/\*{2,}/g, '');
          return output.trim();
        };

        const appendMessage = (text, role = 'ai') => {
          if (!text) return;
          const safeText = role === 'user' ? text : sanitizeAiText(text);
          const wrapper = document.createElement('div');
          wrapper.className = `cx-ai-chat__message ${role === 'user' ? 'is-user' : 'is-ai'}`;
          const bubble = document.createElement('div');
          bubble.className = 'cx-ai-chat__bubble';

          if (role !== 'user') {
            const author = document.createElement('div');
            author.className = 'cx-ai-chat__author';
            author.innerHTML = '<i class="bi bi-stars"></i>CulturIAx';
            bubble.appendChild(author);
          }

          safeText.split(/\n{1,2}/).forEach((segment) => {
            if (!segment.trim()) return;
            const p = document.createElement('p');
            p.className = 'mb-1 text-break';
            p.textContent = segment.trim();
            bubble.appendChild(p);
          });

          wrapper.appendChild(bubble);
          messagesEl.appendChild(wrapper);
          messagesEl.scrollTop = messagesEl.scrollHeight;
        };

        const setPending = (state, customStatus) => {
          pending = state;
          if (statusEl) {
            statusEl.hidden = !state;
            if (customStatus && statusText) statusText.textContent = customStatus;
          }
          if (inputEl) inputEl.disabled = state;
          if (sendBtn) sendBtn.disabled = state;
        };

        messagesEl.innerHTML = '';
        const greeting = geminiKeyReady
          ? 'Hola, no sabes que ver? Soy CulturIAx y puedo proponerte peliculas y series con resenas destacadas de CulturaX. Cuentame que ganas tienes hoy.'
          : 'El asistente IA no esta disponible por ahora. Intenta de nuevo en unos minutos.';
        appendMessage(greeting, 'ai');

        const sendMessage = async (rawMessage) => {
          const message = rawMessage?.trim();
          if (!message || pending) return;
          appendMessage(message, 'user');

          if (!geminiKeyReady) {
            appendMessage('El asistente IA no esta disponible por ahora. Intenta mas tarde.', 'ai');
            return;
          }

          await loadUserReviews();
          setPending(true, 'Buscando recomendaciones...');
          try {
            const { text, submittedContent } = await requestGeminiRecommendation({
              userMessage: message,
              catalogSummary: geminiCatalogSummary,
              userReviewSummary,
              communityReviewSummary,
              history,
            });
            history.push(submittedContent);
            history.push({ role: 'model', parts: [{ text }] });
            appendMessage(text, 'ai');
          } catch (err) {
            const fallback =
              err.message === 'GEMINI_API_KEY_MISSING'
                ? 'El asistente IA no esta configurado en el servidor.'
                : 'No pude contactar al motor IA ahora mismo. Intentalo nuevamente en unos segundos.';
            appendMessage(fallback, 'ai');
            console.error('[CulturIAx]', err);
          } finally {
            setPending(false);
          }
        };

        formEl?.addEventListener('submit', (evt) => {
          evt.preventDefault();
          if (!inputEl) return;
          const value = inputEl.value.trim();
          if (!value) return;
          inputEl.value = '';
          sendMessage(value);
        });

        suggestionsEl?.addEventListener('click', (evt) => {
          const target = evt.target instanceof Element ? evt.target : null;
          const button = target?.closest('button[data-suggestion]');
          if (!button) return;
          sendMessage(button.dataset.suggestion);
        });

        const renderSuggestions = () => {
          if (!suggestionsEl) return;
        const baseSuggestion = userReviewEntries.length
          ? 'CulturIAx, revisa mis resenas y sugiere algo que encaje con ellas.'
          : trendingGenres[0]
          ? `CulturIAx, recomiendame algo de ${trendingGenres[0]} con buenas resenas.`
          : 'CulturIAx, sorprendeme con algo muy recomendado.';
          suggestionsEl.innerHTML = '';
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.suggestion = baseSuggestion;
          button.textContent = baseSuggestion;
          suggestionsEl.appendChild(button);
        };

        rerenderGeminiSuggestions = renderSuggestions;
        renderSuggestions();
      };

      initCulturIAx();
      onAuthStateChanged(auth, async () => {
        await loadUserReviews(true);
        rerenderGeminiSuggestions();
      });

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

      // === Publicidad ===
      try {
        const res = await fetch('src/data/publicidad.json');
        const ads = await res.json();

        const pick = (arr, n = 1) => {
          const c = [...arr];
          const out = [];
          while (c.length && out.length < n) {
            out.push(c.splice(Math.floor(Math.random() * c.length), 1)[0]);
          }
          return n === 1 ? out[0] : out;
        };

        const renderAd = (elId, ad) => {
          const el = document.getElementById(elId);
          if (!el || !ad) return;
          const href = ad.url || '#';
          const isExternal = href && !href.startsWith('#');
          el.innerHTML = `
            <a href="${href}" ${isExternal ? 'target="_blank" rel="noopener"' : ''} class="d-block w-100 h-100">
              <img src="${ad.img}" alt="${ad.alt}" />
            </a>`;
        };

        renderAd('ad-superior', pick(ads.superior));
        const [ad1, ad2] = pick(ads.inferior, 2);
        renderAd('ad-bottom-1', ad1);
        renderAd('ad-bottom-2', ad2);
        setTimeout(syncHeroSidebarHeight, 200);
      } catch {}

      // Ajustar altura inicial (en caso de no haber publicidad o en desktop)
      syncHeroSidebarHeight();

      // === Logout ===
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
    },
  };
}
