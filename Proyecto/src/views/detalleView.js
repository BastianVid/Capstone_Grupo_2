// ============================== IMPORTS ==============================
import { Navbar, initNavbarSearch } from './shared/navbar.js';
import { Footer } from './shared/footer.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './shared/navbarSession.js';
import { auth, db } from '../lib/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { guardarResena, obtenerResenaUsuario, eliminarResena, toggleLikeResena } from '../controllers/resenasController.js';
import { resolveImagePath } from './shared/resolve-image-path.js';
import { navigate } from '../core/router.js';

const STREAMING_ICON_BASE_PATH = 'src/assets/icons/streaming';

const STREAMING_PLATFORM_ICONS = {
  netflix: { label: 'Netflix', file: 'netflix.svg' },
  primevideo: { label: 'Prime Video', file: 'primevideo.svg' },
  hbomax: { label: 'HBO Max', file: 'hbomax.svg' },
  disneyplus: { label: 'Disney+', file: 'disneyplus.svg' },
  starplus: { label: 'Star+', file: 'starplus.svg' },
  starz: { label: 'Starz', file: 'starz.svg' },
  paramountplus: { label: 'Paramount+', file: 'paramountplus.svg' },
  appletv: { label: 'Apple TV+', file: 'appletv.svg' },
  crunchyroll: { label: 'Crunchyroll', file: 'crunchyroll.svg' },
  hulu: { label: 'Hulu', file: 'hulu.svg' },
  youtube: { label: 'YouTube', file: 'youtube.svg' },
};

const STREAMING_PLATFORM_MATCHERS = [
  { key: 'netflix', patterns: ['netflix'] },
  { key: 'primevideo', patterns: ['primevideo', 'amazonprime'], tokens: ['prime'] },
  { key: 'hbomax', patterns: ['hbomax', 'hbogo', 'max'], tokens: ['hbo', 'max'] },
  { key: 'disneyplus', patterns: ['disneyplus'], tokens: ['disney'] },
  { key: 'starplus', patterns: ['starplus'] },
  { key: 'starz', patterns: ['starz'] },
  { key: 'paramountplus', patterns: ['paramountplus'], tokens: ['paramount'] },
  { key: 'appletv', patterns: ['appletv', 'appletvplus'] },
  { key: 'crunchyroll', patterns: ['crunchyroll'] },
  { key: 'hulu', patterns: ['hulu'] },
  { key: 'youtube', patterns: ['youtube'] },
];

function normalizePlatformValue(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/&/g, ' and ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ' ');
}

function createPlatformMatchData(value = '') {
  const normalized = normalizePlatformValue(value);
  return {
    collapsed: normalized.replace(/[^a-z0-9]/g, ''),
    tokens: normalized.split(/[^a-z0-9]+/).filter(Boolean),
  };
}

function parseStreamingPlatform(value = '') {
  const data = createPlatformMatchData(value);
  if (!data.collapsed) return { key: null, collapsed: '' };

  for (const matcher of STREAMING_PLATFORM_MATCHERS) {
    const hasPattern = matcher.patterns?.some((pattern) =>
      data.collapsed.includes(pattern)
    );
    const hasToken = matcher.tokens?.some((token) =>
      data.tokens.includes(token)
    );

    if (hasPattern || hasToken) {
      return { key: matcher.key, collapsed: data.collapsed };
    }
  }

  return { key: null, collapsed: data.collapsed };
}

function buildStreamingInitials(label = '') {
  const boundaryLetters = label.match(/\b[0-9A-Za-z]/g) || [];
  const fallbackLetters = boundaryLetters.length
    ? boundaryLetters
    : label.match(/[0-9A-Za-z]/g) || [];

  const text = fallbackLetters.slice(0, 3).join('');
  return text ? text.toUpperCase() : '?';
}

// ============================== DETALLE VIEW ==============================
export function DetalleView(item, categoria) {
  if (!item) {
    const storedItem = sessionStorage.getItem('detalleItem');
    const storedCategoria = sessionStorage.getItem('detalleCategoria');
    if (storedItem) {
      item = JSON.parse(storedItem);
      categoria = storedCategoria || categoria;
    }

  if (item.categoria) {
    delete item.categoria;
    }

  }

  if (!item || !categoria) {
    return {
      html: `<div class="container py-5"><h2>No se encontró la obra seleccionada.</h2></div>`,
      bind() {}
    };
  }

  const html = `
    ${Navbar()}

    <!-- HERO -->
    <section class="detalle-hero">
      <div id="detalleHeroBg"></div>
      <div class="overlay py-4">
        <div class="container">
          <div class="row g-4 align-items-center justify-content-between">
            <!-- Izquierda -->
            <div class="col-md-7 d-flex align-items-start gap-4">
              <img id="detalleImg" src="src/assets/img/profile-placeholder.jpg" alt="Obra"
                   class="rounded shadow-lg" style="width:200px;height:300px;object-fit:cover;">
              <div class="text-white">
                <h1 id="detalleTitulo" class="fw-bold mb-2">Cargando...</h1>

                <!-- Ficha técnica -->
                <div id="fichaTecnica">
                  <p class="mb-1"><strong>Director:</strong> <span id="detalleDirector">Desconocido</span></p>
                  <p class="mb-1"><strong>Duración:</strong> <span id="detalleDuracion">N/A</span> min</p>
                  <p class="mb-1 d-none" id="detalleCanciones"><strong>Total de canciones:</strong> <span></span></p>
                  <p class="mb-1"><strong>Año:</strong> <span id="detalleAnio">N/A</span></p>
                  <p class="mb-1"><strong>Género:</strong> <span id="detalleGenero" class="text-warning"></span></p>
                  <p class="mb-1 d-none" id="detalleTomos"><strong>Tomos:</strong> <span></span></p>
                  <p class="mb-1 d-none" id="detalleEditorial"><strong>Editorial:</strong> <span></span></p>
                  <p class="mb-1 d-none" id="detalleTemporadas"><strong>Temporadas:</strong> <span></span></p>
                </div>

                <p id="promedioGeneral" class="mb-0 text-warning small mt-2"></p>
              </div>
            </div>

            <!-- Derecha: trailer -->
            <div class="col-md-5">
              <div class="ratio ratio-16x9 rounded overflow-hidden shadow-lg border border-secondary border-opacity-25">
                <iframe id="detalleTrailer"
                  src=""
                  title="Tráiler"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowfullscreen>
                </iframe>
              </div>
            </div>
        </div>
      </div>
    </section>

    <!-- CONTENIDO -->
    <div class="container">
      <div class="row g-4">
        <div class="col-lg-8">
          <!-- Sinopsis y plataformas -->
          <div class="row g-3 mb-4 align-items-stretch">
            <div class="col-12 col-md-7">
              <div class="cx-card p-4 h-100">
                <h5 class="text-white mb-3">Sinopsis</h5>
                <p id="detalleDescripcion" class="mb-0 text-secondary"></p>
              </div>
            </div>
            <div class="col-12 col-md-5">
              <div id="detallePlataformasCard" class="cx-card p-4 h-100 d-flex flex-column">
                <div class="mb-3">
                  <h5 class="text-white mb-0">Disponible en</h5>
                </div>
                <div id="detallePlataformasIcons" class="streaming-icon-grid flex-grow-1"></div>
                <p id="detallePlataformasEmpty" class="text-secondary small mb-0">No hay plataformas registradas.</p>
              </div>
            </div>
          </div>

          <!-- Tu calificación -->
          <div id="reseñaSection" class="cx-card p-4 mb-4">
            <h4 class="text-white mb-3">Tu calificación</h4>
            <div id="rating" class="mb-2" style="font-size:1.4rem;">
              <i class="bi bi-star" data-value="1" role="button"></i>
              <i class="bi bi-star" data-value="2" role="button"></i>
              <i class="bi bi-star" data-value="3" role="button"></i>
              <i class="bi bi-star" data-value="4" role="button"></i>
              <i class="bi bi-star" data-value="5" role="button"></i>
            </div>
            <div id="ratingMessage" class="small text-secondary mb-2"></div>
            <input id="commentInput" type="text" class="form-control" placeholder="Escribe un comentario" />
            <div class="mt-2 d-flex gap-2">
              <button id="addComment" class="btn btn-primary">Guardar reseña</button>
              <button id="deleteComment" class="btn btn-outline-danger d-none">Eliminar reseña</button>
            </div>
            <div id="errorMessage" class="text-danger small mt-2"></div>
          </div>

          <!-- Reseñas -->
          <div class="cx-card p-4">
            <h4 class="text-white mb-3">Reseñas de usuarios</h4>
            <div id="commentsList"></div>
          </div>
        </div>

        <div class="col-lg-4">
          <!-- Integraciones -->
          <div class="cx-card p-4 mb-4">
            <h5 class="text-white mb-3">Integraciones</h5>
            <div id="integrationRail" class="integration-rail d-flex gap-3 flex-nowrap overflow-auto pb-2 scrollbar-dark"></div>
          </div>

          <!-- Similares -->
          <div class="cx-card p-4 mb-4">
            <h5 class="text-white mb-3">Similares</h5>
            <div id="similaresRail" class="d-flex gap-3 flex-nowrap overflow-auto pb-2 scrollbar-dark"></div>
          </div>

          <!-- Publicidad lateral -->
          <section class="my-4">
            <div id="ad-right-1" class="card bg-dark border-0 shadow-sm text-center p-2 mb-3 position-relative overflow-hidden"></div>
            <div id="ad-right-2" class="card bg-dark border-0 shadow-sm text-center p-2 mb-3 position-relative overflow-hidden"></div>
          </section>
        </div>
      </div>

      <!-- Publicidad inferior -->
      <section class="my-4">
        <div class="row g-3">
          <div class="col-md-6"><div id="ad-bottom-1" class="card bg-dark border-0 shadow-sm text-center p-2 position-relative overflow-hidden"></div></div>
          <div class="col-md-6"><div id="ad-bottom-2" class="card bg-dark border-0 shadow-sm text-center p-2 position-relative overflow-hidden"></div></div>
        </div>
      </section>
    </div>

    ${Footer()}
  `;

  return {
    html,
    async bind() {
    // =========================
    // SANITIZE UNIVERSAL
    // =========================
        const sanitize = (v) => {
        if (!v) return "";
        return v
          .toString()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();
      };



      initNavbarSessionWatcher();
      updateNavbarSessionUI();
      initNavbarSearch();

      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        await logout();
      });

      {
        const snap = await getDoc(doc(db, categoria, item.id));
        if (snap.exists()) {
          item = {
            ...item,          
            ...snap.data(),   
            id: snap.id
          };
        }
      }

      const imgEl = document.getElementById('detalleImg');
      const titEl = document.getElementById('detalleTitulo');
      const dirEl = document.getElementById('detalleDirector');
      const durEl = document.getElementById('detalleDuracion');
      const cancionesEl = document.getElementById('detalleCanciones');
      const anioEl = document.getElementById('detalleAnio');
      const genEl = document.getElementById('detalleGenero');
      const descEl = document.getElementById('detalleDescripcion');
      const heroBg = document.getElementById('detalleHeroBg');
      const promedioGeneralEl = document.getElementById('promedioGeneral');
      const tomosEl = document.getElementById('detalleTomos');
      const editorialEl = document.getElementById('detalleEditorial');
      const temporadasEl = document.getElementById('detalleTemporadas');
      const trailerEl = document.getElementById('detalleTrailer');
      const plataformasIconsEl = document.getElementById('detallePlataformasIcons');
      const plataformasEmptyEl = document.getElementById('detallePlataformasEmpty');

      const renderStreamingPlatforms = () => {
        if (!plataformasIconsEl || !plataformasEmptyEl) return;

        const lista = Array.isArray(item.plataformaStreaming)
          ? item.plataformaStreaming
          : [];

        const fragments = [];
        const seen = new Set();

        lista.forEach((rawName) => {
          const label = String(rawName || '').trim();
          if (!label) return;

          const { key, collapsed } = parseStreamingPlatform(label);
          const dedupeKey = key || collapsed || label.toLowerCase();
          if (seen.has(dedupeKey)) return;
          seen.add(dedupeKey);

          if (key && STREAMING_PLATFORM_ICONS[key]) {
            const meta = STREAMING_PLATFORM_ICONS[key];
            const iconPath = `${STREAMING_ICON_BASE_PATH}/${meta.file}`;
            fragments.push(`
              <span class="streaming-icon" title="${meta.label}">
                <img src="${iconPath}" alt="${meta.label}">
              </span>
            `);
          } else {
            fragments.push(`
              <span class="streaming-icon streaming-icon-fallback" title="${label}">
                <span>${buildStreamingInitials(label)}</span>
              </span>
            `);
          }
        });

        if (!fragments.length) {
          plataformasIconsEl.innerHTML = '';
          plataformasEmptyEl.classList.remove('d-none');
          return;
        }

        plataformasIconsEl.innerHTML = fragments.join('');
        plataformasEmptyEl.classList.add('d-none');
      };


      // ============================== ASIGNACIÓN DE DATOS ==============================
      titEl.textContent = item.titulo || 'Sin título';
      dirEl.textContent = item.director || 'Desconocido';
      durEl.textContent = item.duracion || 'N/A';
      anioEl.textContent = item["año"] || 'N/A';
      genEl.textContent = Array.isArray(item.genero) ? item.genero.join(', ') : (item.genero || '');
      descEl.textContent = item.descripcion || '';
      renderStreamingPlatforms();
      imgEl.src = resolveImagePath(item.imagen || item.img);
      heroBg.style.backgroundImage = `url('${imgEl.src}')`;

      if (item.trailer) {
        const embedURL = item.trailer.replace("watch?v=", "embed/");
        trailerEl.src = `${embedURL}?autoplay=0&mute=0&controls=1&rel=0&modestbranding=1`;
      }

      if (categoria === 'musica' && item.totalCanciones) {
        cancionesEl.classList.remove('d-none');
        cancionesEl.querySelector('span').textContent = `${item.totalCanciones} canciones`;
      }
      if (categoria === 'manga') {
        if (item.tomos) {
          tomosEl.classList.remove('d-none');
          tomosEl.querySelector('span').textContent = item.tomos;
        }
        if (item.editorial) {
          editorialEl.classList.remove('d-none');
          editorialEl.querySelector('span').textContent = item.editorial;
        }
      }
      if (categoria === 'series' && item.temporadas) {
        temporadasEl.classList.remove('d-none');
        temporadasEl.querySelector('span').textContent = item.temporadas;
      }
      // ======================= INTEGRACIONES ==========================
      const renderIntegraciones = async () => {
        const rail = document.getElementById("integrationRail");
        if (!rail) return;

        rail.innerHTML = `<p class="text-secondary small">Buscando integraciones...</p>`;

        try {
          const { ContentModel } = await import("../models/contentModel.js");

          const colecciones = [
            "peliculas",
            "series",
            "anime",
            "musica",
            "videojuegos",
            "libros",
            "manga",
            "documentales",
            "proximamente"
          ];

          const datasets = [];
          for (const c of colecciones) {
            const lista = await ContentModel.listCollection(c);
            lista.forEach(x => datasets.push({ ...x, categoria: c }));
          }

          const franquiciaActual = sanitize(item.franquicia);

          if (!franquiciaActual) {
            rail.innerHTML = `<p class="text-secondary small">No hay franquicia registrada.</p>`;
            return;
          }

         const integraciones = datasets.filter(x =>
            sanitize(x.franquicia) === franquiciaActual &&
            !(x.id === item.id && x.categoria === categoria)
          );


          if (!integraciones.length) {
            rail.innerHTML = `<p class="text-secondary small">No hay integraciones relacionadas.</p>`;
            return;
          }

          rail.innerHTML = integraciones
            .map(r => `
              <div class="int-card bg-dark rounded overflow-hidden shadow-sm border border-secondary border-opacity-25"
                  data-id="${r.id}" data-categoria="${r.categoria}"
                  style="min-width:180px; cursor:pointer;">
                <img src="${resolveImagePath(r.imagen || r.img)}"
                    alt="${r.titulo}" class="w-100" style="height:240px; object-fit:cover;">
                <div class="p-2">
                  <div class="small text-white fw-semibold">${r.titulo}</div>
                  <div class="text-secondary small text-capitalize">${r.categoria}</div>
                </div>
              </div>
            `)
            .join("");

          rail.querySelectorAll('.int-card').forEach(card => {
            card.addEventListener('click', () => {
              const id = card.dataset.id;
              const cat = card.dataset.categoria;

              const selected = integraciones.find(x => x.id === id);
              if (!selected) return;

              sessionStorage.setItem("detalleItem", JSON.stringify(selected));
              sessionStorage.setItem("detalleCategoria", cat);

              navigate("/detalle");
            });
          });

        } catch (err) {
          console.error("❌ Error integraciones:", err);
          rail.innerHTML = `<p class="text-danger small">Error al cargar integraciones.</p>`;
        }
      };
      await renderIntegraciones();
      // ============================== SIMILARES (por tema o género, excluyendo franquicia) ==============================
      const renderSimilares = async () => {
        const rail = document.getElementById('similaresRail');
        rail.innerHTML = `<p class="text-secondary small">Buscando obras similares...</p>`;

        try {
          const { ContentModel } = await import('../models/contentModel.js');
          const categoriaActual = (categoria || '').toLowerCase();
          const metodoPorCategoria = {
            peliculas: 'listPeliculas',
            series: 'listSeries',
            anime: 'listAnime',
            musica: 'listMusica',
            libros: 'listLibros',
            videojuegos: 'listVideojuegos',
            manga: 'listManga',
            documentales: 'listDocumentales'
          };

          const metodo = metodoPorCategoria[categoriaActual];
          let data = [];

          if (metodo && typeof ContentModel[metodo] === 'function') {
            data = await ContentModel[metodo]();
          } else {
            try {
              data = await ContentModel.listCollection(categoriaActual);
            } catch {
              data = [];
            }
          }

          const dataset = data.map(d => ({ ...d, categoria: categoriaActual }));

          const franquiciaActual = sanitize(item.franquicia);
          const generosActuales = (item.genero || []).map(g => g.toLowerCase());
          const descripcionActual = (item.descripcion || '').toLowerCase();
          const tituloActual = (item.titulo || '').toLowerCase();

          const keywords = [
            "acción", "aventura", "terror", "fantasía", "superhéroe", "superheroes",
            "romance", "drama", "ciencia ficción", "espacio", "futurista", "batalla",
            "carreras", "autos", "misterio", "investigación", "música", "magia", "comedia"
          ];

          const clavesDetectadas = keywords.filter(k =>
            tituloActual.includes(k) || descripcionActual.includes(k)
          );

          const similares = dataset.filter(d => {
            if (d.id === item.id) return false;
            const franquiciaObra = sanitize(d.franquicia);
            if (franquiciaActual && franquiciaObra && franquiciaActual === franquiciaObra) return false;

            const matchGenero = d.genero?.some(g => generosActuales.includes(g.toLowerCase()));
            const texto = `${d.titulo || ''} ${d.descripcion || ''}`.toLowerCase();
            const matchClave = clavesDetectadas.some(k => texto.includes(k));

            return matchGenero || matchClave;
          }).slice(0, 10);

          if (!similares.length) {
            rail.innerHTML = `<p class="text-secondary small">No se encontraron obras similares temáticamente.</p>`;
            return;
          }

          rail.innerHTML = similares
            .map(s => `
              <div class="sim-card bg-dark rounded overflow-hidden shadow-sm border border-secondary border-opacity-25"
                  data-id="${s.id}" data-categoria="${s.categoria}" 
                  style="min-width:140px; cursor:pointer;">
                <img src="${resolveImagePath(s.imagen || s.img)}" 
                    alt="${s.titulo}" class="w-100" style="height:200px; object-fit:cover;">
                <div class="p-2">
                  <div class="small text-white fw-semibold">${s.titulo}</div>
                  <div class="text-secondary small text-capitalize">${s.categoria}</div>
                </div>
              </div>
            `).join('');

          rail.querySelectorAll('.sim-card').forEach(card => {
            card.addEventListener('click', () => {
              const id = card.dataset.id;
              const cat = card.dataset.categoria;
              const selected = similares.find(x => x.id === id);
              if (!selected) return;
              sessionStorage.setItem('detalleItem', JSON.stringify(selected));
              sessionStorage.setItem('detalleCategoria', cat);
              navigate('/detalle');
            });
          });

        } catch (err) {
          console.error('Error cargando similares:', err);
          rail.innerHTML = `<p class="text-danger small">Error al cargar similares.</p>`;
        }
      };
      await renderSimilares();

      // ============================== PUBLICIDAD ==============================
      try {
        const res = await fetch('src/data/publicidad.json');
        const ads = await res.json();
        const rnd = (arr, n = 1) => {
          const pool = [...arr];
          const out = [];
          while (pool.length && out.length < n) out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
          return n === 1 ? out[0] : out;
        };
        const renderAd = (id, ad) => {
          const el = document.getElementById(id);
          if (!el || !ad) return;
          el.innerHTML = `<a href="${ad.url}" target="_blank" rel="noopener" class="d-block w-100 h-100"><img src="${ad.img}" alt="${ad.alt}" /></a>`;
        };
        const [rs1, rs2] = rnd(ads.laterales ?? ads.superior, 2);
        renderAd('ad-right-1', rs1);
        renderAd('ad-right-2', rs2);
        const [ib1, ib2] = rnd(ads.inferior, 2);
        renderAd('ad-bottom-1', ib1);
        renderAd('ad-bottom-2', ib2);
      } catch {}

      // ============================== PROMEDIO Y RESEÑAS ==============================
      const renderPromedio = async () => {
        const snap = await getDoc(doc(db, categoria, item.id));
        const data = snap.data() || {};
        const p = data.calificacionPromedio || 0;
        const v = data.totalVotos || 0;
        promedioGeneralEl.textContent = v
          ? `★ ${p.toFixed(1)} / 5 (${v} votos)`
          : '★ Sin calificaciones aún';
      };

      // ============================== RESEÑAS ==============================
      const stars = document.querySelectorAll('#rating i');
      const msg = document.getElementById('ratingMessage');
      const errorEl = document.getElementById('errorMessage');
      const comentarioEl = document.getElementById('commentInput');
      const addBtn = document.getElementById('addComment');
      const delBtn = document.getElementById('deleteComment');
      const commentsList = document.getElementById('commentsList');
      let currentRating = 0;
      const profileCache = new Map();

      const pintarEstrellas = v => {
        stars.forEach((s, i) => {
          s.classList.remove('bi-star-fill', 'active');
          s.classList.add(i < v ? 'bi-star-fill' : 'bi-star');
          if (i < v) s.classList.add('active');
        });
      };

      stars.forEach((star, idx) => {
        star.addEventListener('mouseenter', () => {
          stars.forEach((s, i) => s.classList.toggle('hovered', i <= idx));
        });
        star.addEventListener('mouseleave', () => {
          stars.forEach(s => s.classList.remove('hovered'));
        });
        star.addEventListener('click', () => {
          currentRating = parseInt(star.dataset.value);
          pintarEstrellas(currentRating);
          msg.textContent = `Tu calificación: ${currentRating} estrellas`;
        });
      });

      const renderResenas = async user => {
        const snap = await getDocs(collection(db, categoria, item.id, "resenas"));
        if (snap.empty) {
          commentsList.innerHTML = `<p class="text-muted">No hay resenas aun.</p>`;
          return;
        }

        const entries = snap.docs
          .map(d => ({ id: d.id, data: d.data() }))
          .sort((a, b) => new Date(b.data.fecha || 0) - new Date(a.data.fecha || 0))
          .slice(0, 5);

        const usernames = new Map();

        await Promise.all(entries.map(async ({ id }) => {
          if (profileCache.has(id)) {
            usernames.set(id, profileCache.get(id));
          } else {
            try {
              const profileSnap = await getDoc(doc(db, "users", id));
              const uname = profileSnap.exists()
                ? (profileSnap.data().username || profileSnap.data().usernameLower || null)
                : null;
              profileCache.set(id, uname);
              usernames.set(id, uname);
            } catch {
              usernames.set(id, null);
            }
          }
        }));

        const html = entries.map(({ id, data }) => {
          const own = user && data.userId === user.uid;
          const author = usernames.get(id) || data.userName || "Usuario";
          const likesCount = data.likesCount || 0;
          const liked = user && Array.isArray(data.likedBy) ? data.likedBy.includes(user.uid) : false;

          return `
            <div class="border-bottom border-secondary pb-2 mb-2 ${own ? 'review-own' : ''}">
              <div class="d-flex justify-content-between align-items-start gap-3">
                <div class="flex-grow-1">
                  <strong>${author}${own ? ' (Tu resena)' : ''}</strong>
                  <p class="mb-1 text-warning small">${"&#9733;".repeat(data.estrellas)}${"&#9734;".repeat(5 - data.estrellas)}</p>
                  <p class="mb-0 small">${data.comentario}</p>
                </div>
                <button class="btn btn-sm ${liked ? 'btn-primary' : 'btn-outline-primary'} btn-like-resena"
                        data-resena-id="${id}" aria-pressed="${liked}">
                  <i class="bi ${liked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'} like-icon"></i>
                  <span class="like-count">${likesCount}</span>
                </button>
              </div>
            </div>`;
        }).join("");

        commentsList.innerHTML = html;

        commentsList.querySelectorAll('.btn-like-resena').forEach(btn => {
          btn.addEventListener('click', async () => {
            errorEl.textContent = '';
            if (!auth.currentUser) {
              errorEl.textContent = 'Debes iniciar sesion para dar like.';
              return;
            }

            btn.disabled = true;
            const targetResenaUserId = btn.dataset.resenaId;

            try {
              const { likesCount, liked } = await toggleLikeResena(categoria, item.id, targetResenaUserId);
              const icon = btn.querySelector('.like-icon');
              const countEl = btn.querySelector('.like-count');
              if (countEl) countEl.textContent = likesCount;
              if (icon) icon.className = liked ? 'bi bi-hand-thumbs-up-fill like-icon' : 'bi bi-hand-thumbs-up like-icon';
              btn.classList.toggle('btn-primary', liked);
              btn.classList.toggle('btn-outline-primary', !liked);
              btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
            } catch (err) {
              console.error('toggleLikeResena failed', err);
              errorEl.textContent = 'No se pudo registrar tu like.';
            } finally {
              btn.disabled = false;
            }
          });
        });
      };

      // ============================== AUTENTICACIÓN ==============================
      onAuthStateChanged(auth, async user => {
        await renderPromedio();
        await renderResenas(user);

        if (user) {
          const r = await obtenerResenaUsuario(categoria, item.id);
          if (r) {
            currentRating = r.estrellas;
            comentarioEl.value = r.comentario;
            pintarEstrellas(currentRating);
            msg.textContent = 'Ya calificaste esta obra. Puedes editar o eliminar tu reseña.';
            delBtn.classList.remove('d-none');
          } else {
            msg.textContent = '';
            delBtn.classList.add('d-none');
          }
        } else {
          msg.textContent = 'Inicia sesión para dejar una reseña.';
          delBtn.classList.add('d-none');
        }

        // ============================== GUARDA RESEÑAS ==============================
        addBtn.addEventListener('click', async () => {
          errorEl.textContent = '';
          const comentario = comentarioEl.value.trim();
          if (!user) { errorEl.textContent = '⚠️ Debes iniciar sesión.'; return; }
          if (!currentRating) { errorEl.textContent = '⚠️ Debes calificar con estrellas.'; return; }
          if (!comentario) { errorEl.textContent = '⚠️ El comentario no puede estar vacío.'; return; }

          await guardarResena(categoria, item.id, currentRating, comentario);
          msg.textContent = '✅ Reseña guardada.';
          delBtn.classList.remove('d-none');
          await renderResenas(user);
          await renderPromedio();
        });

        // ============================== ELIMINA RESEÑAS ==============================
        delBtn.addEventListener('click', async () => {
          if (!user) return;
          if (confirm('¿Eliminar tu reseña?')) {
            await eliminarResena(categoria, item.id);
            comentarioEl.value = '';
            currentRating = 0;
            pintarEstrellas(0);
            msg.textContent = '🗑️ Reseña eliminada.';
            delBtn.classList.add('d-none');
            await renderResenas(user);
            await renderPromedio();
          }
        });
      });
    },
  };
}











