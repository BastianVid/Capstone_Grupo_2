// ============================== IMPORTS ==============================
import { Navbar, initNavbarSearch } from './navbar.js';
import { Footer } from './footer.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { auth, db } from '../lib/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { guardarReseña, obtenerReseñaUsuario, eliminarReseña } from '../controllers/reseñasController.js';
import { resolveImagePath } from './shared/resolve-image-path.js';

// ============================== DETALLE VIEW ==============================
export function DetalleView(item, categoria) {
  // Recuperar desde sessionStorage si no llegó por router
  if (!item) {
    const storedItem = sessionStorage.getItem('detalleItem');
    const storedCategoria = sessionStorage.getItem('detalleCategoria');
    if (storedItem) {
      item = JSON.parse(storedItem);
      categoria = storedCategoria || categoria;
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
              <img id="detalleImg" src="src/assets/img/default.jpg" alt="Obra"
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

                  <!-- Campos adicionales dinámicos -->
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
      </div>
    </section>

    <!-- CONTENIDO -->
    <div class="container">
      <div class="row g-4">
        <div class="col-lg-8">
          <!-- Sinopsis -->
          <div class="cx-card p-4 mb-4">
            <h5 class="text-white mb-3">Sinopsis</h5>
            <p id="detalleDescripcion" class="mb-0 text-secondary"></p>
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
          <!-- Similares -->
          <div class="cx-card p-4 mb-4">
            <h5 class="text-white mb-3">Similares</h5>
            <div id="similaresRail" class="d-flex gap-3 flex-nowrap overflow-auto pb-2"></div>
          </div>

          <!-- Publicidad lateral -->
          <section class="my-4">
            <div id="ad-right-1" class="card bg-dark border-0 shadow-sm text-center p-0 mb-3 position-relative overflow-hidden" style="min-height:140px;"></div>
            <div id="ad-right-2" class="card bg-dark border-0 shadow-sm text-center p-0 mb-3 position-relative overflow-hidden" style="min-height:140px;"></div>
          </section>
        </div>
      </div>

      <!-- Publicidad inferior -->
      <section class="my-4">
        <div class="row g-3">
          <div class="col-md-6"><div id="ad-bottom-1" class="card bg-dark border-0 shadow-sm text-center p-0 position-relative overflow-hidden" style="min-height:150px;"></div></div>
          <div class="col-md-6"><div id="ad-bottom-2" class="card bg-dark border-0 shadow-sm text-center p-0 position-relative overflow-hidden" style="min-height:150px;"></div></div>
        </div>
      </section>
    </div>

    ${Footer()}
  `;

  return {
    html,
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();
      initNavbarSearch();

      // Logout
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        try {
          const { logout } = await import('../controllers/authController.js');
          await logout();
        } catch (e) {
          console.warn('Error al cerrar sesión:', e);
        }
      });

      // 🔧 Si faltan campos, los recargamos desde Firestore
      if (!item["año"] || !item.genero) {
        const snap = await getDoc(doc(db, categoria, item.id));
        if (snap.exists()) item = { id: snap.id, ...snap.data() };
      }

      // Referencias DOM
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

      // Asignar datos
      titEl.textContent = item.titulo || item.title || 'Sin título';
      dirEl.textContent = item.director || 'Desconocido';
      durEl.textContent = item.duracion || 'N/A';
      anioEl.textContent = item["año"] || item.year || 'N/A';
      genEl.textContent = Array.isArray(item.genero) ? item.genero.join(', ') : (item.genero || '');
      descEl.textContent = item.descripcion || item.description || '';
      imgEl.src = resolveImagePath(item.img || item.imagen);
      heroBg.style.backgroundImage = `url('${imgEl.src}')`;

      // 🎬 Tráiler
      if (item.trailer) {
        const embedURL = item.trailer.replace("watch?v=", "embed/");
        trailerEl.src = `${embedURL}?autoplay=0&mute=0&controls=1&rel=0&modestbranding=1`;
      }

      // Campos condicionales
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

      // ============================== SIMILARES ==============================
      const renderSimilares = async () => {
        try {
          const rail = document.getElementById('similaresRail');
          rail.innerHTML = `<p class="text-secondary small">Buscando obras similares...</p>`;

          const franquicia = item.franquicia?.toLowerCase()?.trim();
          if (!franquicia) {
            rail.innerHTML = `<p class="text-secondary small">No hay franquicia definida para esta obra.</p>`;
            return;
          }

          const { ContentModel } = await import('../models/contentModel.js');
          const [
            peliculas, series, anime, musica, videojuegos, libros, manga, documentales
          ] = await Promise.all([
            ContentModel.listPeliculas().catch(() => []),
            ContentModel.listSeries().catch(() => []),
            ContentModel.listAnime().catch(() => []),
            ContentModel.listMusica().catch(() => []),
            ContentModel.listVideojuegos().catch(() => []),
            ContentModel.listLibros().catch(() => []),
            ContentModel.listManga().catch(() => []),
            ContentModel.listDocumentales().catch(() => [])
          ]);

          const allData = [
            ...peliculas.map(d => ({ ...d, categoria: "peliculas" })),
            ...series.map(d => ({ ...d, categoria: "series" })),
            ...anime.map(d => ({ ...d, categoria: "anime" })),
            ...musica.map(d => ({ ...d, categoria: "musica" })),
            ...videojuegos.map(d => ({ ...d, categoria: "videojuegos" })),
            ...libros.map(d => ({ ...d, categoria: "libros" })),
            ...manga.map(d => ({ ...d, categoria: "manga" })),
            ...documentales.map(d => ({ ...d, categoria: "documentales" })),
          ];

          const similares = allData.filter(d =>
            d.franquicia?.toLowerCase()?.trim() === franquicia && d.id !== item.id
          );

          if (!similares.length) {
            rail.innerHTML = `<p class="text-secondary small">No se encontraron obras relacionadas en la misma franquicia.</p>`;
            return;
          }

          rail.innerHTML = similares.slice(0, 10).map(s => `
            <div class="sim-card bg-dark rounded overflow-hidden shadow-sm border border-secondary border-opacity-25" 
                 data-id="${s.id}" data-categoria="${s.categoria}" 
                 style="min-width:140px; cursor:pointer;">
              <img src="${resolveImagePath(s.imagen || s.img)}" 
                   alt="${s.titulo || s.title}" 
                   class="w-100" 
                   style="height:200px; object-fit:cover;">
              <div class="p-2">
                <div class="sim-title small text-white fw-semibold">${s.titulo || s.title}</div>
                <div class="text-secondary small">${s.categoria}</div>
              </div>
            </div>
          `).join('');

          // 🔹 Click dinámico → redirección
          rail.querySelectorAll('.sim-card').forEach(card => {
            card.addEventListener('click', () => {
              const id = card.dataset.id;
              const cat = card.dataset.categoria;
              const itemData = similares.find(x => x.id === id);
              if (itemData) {
                sessionStorage.setItem('detalleItem', JSON.stringify(itemData));
                sessionStorage.setItem('detalleCategoria', cat);
                location.hash = '#/detalle';
              }
            });
          });

        } catch (e) {
          console.error('Error cargando similares:', e);
          document.getElementById('similaresRail').innerHTML = `<p class="text-danger small">Error al cargar obras similares.</p>`;
        }
      };
      await renderSimilares();

      // ============================== PROMEDIO Y RESEÑAS ==============================
      const renderPromedio = async () => {
        const snap = await getDoc(doc(db, categoria, item.id));
        if (!snap.exists()) {
          promedioGeneralEl.textContent = '★ Sin calificaciones aún';
          return;
        }
        const data = snap.data();
        const p = data.calificacionPromedio || 0;
        const v = data.totalVotos || 0;
        if (!v) {
          promedioGeneralEl.textContent = '★ Sin calificaciones aún';
          return;
        }
        const est = Math.round(p);
        promedioGeneralEl.innerHTML = `
          <span class="text-warning">${'★'.repeat(est)}${'☆'.repeat(5 - est)}</span>
          <span class="text-light fw-semibold ms-2">${p.toFixed(1)} / 5</span>
          <span class="text-secondary">(${v} votos)</span>`;
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
        const snap = await getDocs(collection(db, categoria, item.id, 'resenas'));
        if (snap.empty) {
          commentsList.innerHTML = `<p class="text-muted">No hay reseñas aún.</p>`;
          return;
        }
        let html = '';
        let count = 0;
        snap.forEach(d => {
          if (count >= 5) return;
          const r = d.data();
          const own = user && r.userId === user.uid;
          html += `
            <div class="border-bottom border-secondary pb-2 mb-2 ${own ? 'review-own' : ''}">
              <strong>${r.userEmail || 'Usuario anónimo'} ${own ? ' (Tu reseña)' : ''}</strong>
              <p class="mb-1 text-warning small">${'★'.repeat(r.estrellas)}${'☆'.repeat(5 - r.estrellas)}</p>
              <p class="mb-0 small">${r.comentario}</p>
            </div>`;
          count++;
        });
        commentsList.innerHTML = html;
      };

      // ============================== AUTENTICACIÓN ==============================
      onAuthStateChanged(auth, async user => {
        await renderPromedio();
        await renderResenas(user);

        if (user) {
          const r = await obtenerReseñaUsuario(categoria, item.id);
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

        // Guardar reseña
        addBtn.addEventListener('click', async () => {
          errorEl.textContent = '';
          const comentario = comentarioEl.value.trim();
          if (!user) { errorEl.textContent = '⚠️ Debes iniciar sesión.'; return; }
          if (!currentRating) { errorEl.textContent = '⚠️ Debes calificar con estrellas.'; return; }
          if (!comentario) { errorEl.textContent = '⚠️ El comentario no puede estar vacío.'; return; }

          await guardarReseña(categoria, item.id, currentRating, comentario);
          msg.textContent = '✅ Reseña guardada.';
          delBtn.classList.remove('d-none');
          await renderResenas(user);
          await renderPromedio();
        });

        // Eliminar reseña
        delBtn.addEventListener('click', async () => {
          if (!user) return;
          if (confirm('¿Eliminar tu reseña?')) {
            await eliminarReseña(categoria, item.id);
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
