// ============================== IMPORTS ==============================
import { Navbar } from './shared/navbar.js';
import { Footer } from './shared/footer.js';
import { initNavbarSessionWatcher, updateNavbarSessionUI } from './shared/navbarSession.js';
import { auth, db } from '../lib/firebase.js';
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { resolveImagePath } from './shared/resolve-image-path.js';

const CATEGORY_LABELS = {
  peliculas: 'Películas',
  series: 'Series',
  anime: 'Anime',
  musica: 'Música',
  libros: 'Libros',
  videojuegos: 'Videojuegos',
  manga: 'Manga',
  documentales: 'Documentales',
};

const buildStarsMarkup = (value = 0) => {
  const rounded = Math.round(value);
  const full = '★'.repeat(rounded);
  const empty = '☆'.repeat(Math.max(0, 5 - rounded));
  return `<span class="text-warning">${full}${empty}</span> <span class="text-secondary small ms-1">${Number(value).toFixed(1)} / 5</span>`;
};

const formatDate = (iso) => {
  if (!iso) return 'Sin fecha';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ============================== VISTA ==============================
export function CalificacionesView() {
  const html = `
    ${Navbar()}

    <section class="calificaciones-hero text-white">
      <div class="container py-5">
        <p class="text-uppercase text-secondary small mb-2">Tu actividad</p>
        <h1 class="display-6 fw-semibold mb-2">Mis calificaciones</h1>
        <p class="text-secondary mb-0">Consulta todas las obras que has evaluado y vuelve rápidamente a cada detalle.</p>
      </div>
    </section>

    <section class="container py-4">
      <div class="cx-card p-4 mb-4">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label small text-uppercase text-secondary mb-1">Categoría</label>
            <select id="ratingsCategory" class="form-select form-select-sm">
              <option value="">Todas las categorías</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label small text-uppercase text-secondary mb-1">Buscar</label>
            <input type="search" id="ratingsSearch" class="form-control form-control-sm" placeholder="Título o comentario">
          </div>
          <div class="col-md-4 d-flex align-items-end justify-content-end">
            <div id="ratingsSummary" class="text-secondary small text-end w-100">0 calificaciones registradas</div>
          </div>
        </div>
      </div>

      <div id="ratingsError" class="alert alert-danger d-none" role="alert"></div>

      <div id="ratingsLoader" class="text-center text-secondary py-5">
        <div class="spinner-border text-light mb-3" role="status"></div>
        <p class="small mb-0">Cargando tus calificaciones...</p>
      </div>

      <div id="ratingsList" class="calificaciones-list d-none"></div>
    </section>

    ${Footer()}
  `;

  return {
    html,
    title: 'Mis calificaciones – CulturaX',
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      const user = auth.currentUser;
      if (!user) return;

      const categorySelect = document.getElementById('ratingsCategory');
      const searchInput = document.getElementById('ratingsSearch');
      const summaryEl = document.getElementById('ratingsSummary');
      const listEl = document.getElementById('ratingsList');
      const loaderEl = document.getElementById('ratingsLoader');
      const errorEl = document.getElementById('ratingsError');

      let ratings = [];
      let filtered = [];

      const updateSummary = () => {
        const total = ratings.length;
        const shown = filtered.length;
        const avg = total
          ? (ratings.reduce((sum, r) => sum + (Number(r.estrellas) || 0), 0) / total).toFixed(1)
          : '0.0';
        summaryEl.textContent = `${shown} de ${total} calificaciones · Promedio personal ${avg}/5`;
      };

      const renderList = () => {
        if (!listEl) return;
        if (!filtered.length) {
          listEl.innerHTML = `
            <div class="text-center text-secondary py-5">
              <i class="bi bi-star fs-1 mb-2 d-block"></i>
              <p class="mb-0">Aún no has registrado calificaciones para los filtros seleccionados.</p>
            </div>`;
        } else {
          listEl.innerHTML = filtered
            .map((item) => {
              const catLabel = CATEGORY_LABELS[item.categoria] || item.categoria;
              const comment = item.comentario?.trim() || 'Sin comentario.';
              const poster = resolveImagePath(item.obraImg || 'placeholder.jpg');
              return `
                <article class="calificacion-card">
                  <div class="calificacion-cover">
                    <img src="${poster}" alt="${item.obraTitulo}">
                  </div>
                  <div class="flex-grow-1">
                    <div class="d-flex flex-wrap gap-2 align-items-start justify-content-between mb-1">
                      <div>
                        <h5 class="mb-1 text-white">${item.obraTitulo || 'Sin título'}</h5>
                        <div class="calificacion-stars">${buildStarsMarkup(item.estrellas)}</div>
                      </div>
                      <span class="badge text-bg-dark text-capitalize">${catLabel || 'General'}</span>
                    </div>
                    <p class="text-secondary mb-2 small">${comment}</p>
                    <div class="text-secondary small">Calificado el ${formatDate(item.fecha)}</div>
                  </div>
                  <div class="ms-3 d-flex flex-column justify-content-between align-items-end">
                    <button class="btn btn-outline-light btn-sm" data-view-detail data-cat="${item.categoria}" data-id="${item.obraId}">
                      Ver detalle
                    </button>
                  </div>
                </article>
              `;
            })
            .join('');

          listEl.querySelectorAll('[data-view-detail]').forEach((btn) => {
            btn.addEventListener('click', async () => {
              const categoria = btn.dataset.cat;
              const obraId = btn.dataset.id;
              const selected = ratings.find(
                (r) => r.categoria === categoria && r.obraId === obraId
              );
              if (!selected) return;

              let detalle = null;
              try {
                const { ContentModel } = await import('../models/contentModel.js');
                detalle = await ContentModel.getItem(categoria, obraId);
              } catch (err) {
                console.error('Error obteniendo item para detalle:', err);
              }

              const fallback = {
                id: obraId,
                titulo: selected.obraTitulo,
                imagen: selected.obraImg,
                categoria: selected.categoria,
              };

              sessionStorage.setItem(
                'detalleItem',
                JSON.stringify(detalle || fallback)
              );
              sessionStorage.setItem('detalleCategoria', selected.categoria);
              location.hash = '#/detalle';
            });
          });
        }
        updateSummary();
      };

      const applyFilters = () => {
        const term = searchInput.value.trim().toLowerCase();
        const cat = categorySelect.value;
        filtered = ratings.filter((item) => {
          const matchesCat = !cat || item.categoria === cat;
          const matchesTerm =
            !term ||
            [item.obraTitulo, item.comentario]
              .filter(Boolean)
              .some((field) => field.toLowerCase().includes(term));
          return matchesCat && matchesTerm;
        });
        renderList();
      };

      try {
        const colRef = collection(db, 'userResenas');
        const q = query(colRef, where('userId', '==', user.uid));
        const snap = await getDocs(q);
        ratings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ratings.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
      } catch (err) {
        console.error('Error cargando calificaciones:', err);
        errorEl.classList.remove('d-none');
        errorEl.textContent = 'No pudimos cargar tus calificaciones. Inténtalo nuevamente en unos minutos.';
        ratings = [];
      } finally {
        loaderEl.classList.add('d-none');
        listEl.classList.remove('d-none');
      }

      const uniqueCategories = [...new Set(ratings.map((r) => r.categoria).filter(Boolean))];
      if (uniqueCategories.length) {
        categorySelect.innerHTML =
          `<option value="">Todas las categorías</option>` +
          uniqueCategories
            .sort()
            .map((cat) => `<option value="${cat}">${CATEGORY_LABELS[cat] || cat}</option>`)
            .join('');
      }

      filtered = [...ratings];
      renderList();

      categorySelect.addEventListener('change', applyFilters);
      searchInput.addEventListener('input', () => {
        applyFilters();
      });

      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        await logout();
      });
    },
  };
}
