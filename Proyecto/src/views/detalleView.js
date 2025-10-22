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
    <style>
      #rating i { color:#aaa; transition:color .2s, transform .15s }
      #rating i.active, #rating i.hovered { color:#ffc107 }
      #rating i:hover { transform:translateY(-1px) }
      .review-own { background:rgba(255,255,255,.05); border:1px solid #ffc107 }

      .detalle-hero { position:relative; border-radius:12px; overflow:hidden; box-shadow:0 12px 36px rgba(0,0,0,.4); margin-bottom:1.25rem; }
      #detalleHeroBg { position:absolute; inset:0; background-size:cover; background-position:center; filter:blur(18px) brightness(.45); transform:scale(1.1); }
      .detalle-hero .overlay { position:relative; z-index:2; background:linear-gradient(to top, rgba(0,0,0,.85), rgba(0,0,0,.3)); }

      .cx-card { background:#12151f; border:1px solid rgba(255,255,255,.08); border-radius:12px; box-shadow:0 10px 28px rgba(0,0,0,.35); }

      #commentsList { max-height:320px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.15) transparent; }
      #commentsList::-webkit-scrollbar { width:6px; }
      #commentsList::-webkit-scrollbar-thumb { background:rgba(255,255,255,.15); border-radius:6px; }

      .integration-rail, #similaresRail { overflow-x:auto; }
      .integration-rail .int-card, #similaresRail .sim-card { min-width:180px; max-width:180px; background:#0f1320; border:1px solid rgba(255,255,255,.08); border-radius:12px; }
      .integration-rail img, #similaresRail img { width:100%; height:240px; object-fit:cover; border-top-left-radius:12px; border-top-right-radius:12px; }
      .integration-rail .int-title, #similaresRail .sim-title { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      #similaresRail .sim-card { transition: transform .2s; }
      #similaresRail .sim-card:hover { transform: translateY(-3px); }
      .fade-rotate { animation: fadeRotate 1s ease; }
      @keyframes fadeRotate { from { opacity:0; transform:rotateY(90deg); } to { opacity:1; transform:rotateY(0); } }
    </style>

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
                <p class="mb-1"><strong>Director:</strong> <span id="detalleDirector">Desconocido</span></p>
                <p class="mb-1"><strong>Duración:</strong> <span id="detalleDuracion">N/A</span> min</p>
                <p class="mb-1"><strong>Año:</strong> <span id="detalleAnio">N/A</span></p>
                <p class="mb-1"><strong>Género:</strong> <span id="detalleGenero" class="text-warning"></span></p>

                <p id="promedioGeneral" class="mb-0 text-warning small mt-2"></p>
              </div>
            </div>

            <!-- Derecha: trailer -->
            <div class="col-md-5">
              <div class="ratio ratio-16x9 rounded overflow-hidden shadow-lg border border-secondary border-opacity-25">
                <iframe class="trailer"
                  src="https://www.youtube.com/embed/5PSNL1qE6VY?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1"
                  title="Trailer"
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
            <div id="ad-right-2" class="card bg-dark border-0 shadow-sm text-center p-0 position-relative overflow-hidden" style="min-height:140px;"></div>
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

      // Logout desde el navbar (dropdown)
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        try {
          const { logout } = await import('../controllers/authController.js');
          await logout();
        } catch (e) {
          console.warn('Error al cerrar sesión:', e);
        }
      });

      // 🔧 Corrección: volver a cargar datos si faltan campos clave
      if (!item.director || !item.duracion || !item["año"] || !item.genero) {
        const snap = await getDoc(doc(db, categoria, item.id));
        if (snap.exists()) item = { id: snap.id, ...snap.data() };
      }

      const imgEl   = document.getElementById('detalleImg');
      const titEl   = document.getElementById('detalleTitulo');
      const dirEl   = document.getElementById('detalleDirector');
      const durEl   = document.getElementById('detalleDuracion');
      const anioEl  = document.getElementById('detalleAnio');
      const genEl   = document.getElementById('detalleGenero');
      const descEl  = document.getElementById('detalleDescripcion');
      const heroBg  = document.getElementById('detalleHeroBg');
      const promedioGeneralEl = document.getElementById('promedioGeneral');

      titEl.textContent  = item.titulo || item.title || 'Sin título';
      dirEl.textContent  = item.director || 'Desconocido';
      durEl.textContent  = item.duracion || 'N/A';
      anioEl.textContent = item["año"] || item.year || 'N/A';
      genEl.textContent  = Array.isArray(item.genero) ? item.genero.join(', ') : (item.genero || '');
      descEl.textContent = item.descripcion || item.description || '';
      imgEl.src = resolveImagePath(item.img || item.imagen);
      heroBg.style.backgroundImage = `url('${imgEl.src}')`;

      // ============================== SIMILARES ==============================
      const renderSimilares = async () => {
        try {
          const rail = document.getElementById('similaresRail');
          rail.innerHTML = `<p class="text-secondary small">Buscando obras similares...</p>`;
          const generosItem = Array.isArray(item.genero) ? item.genero.map(g => String(g).toLowerCase().trim()) : [];
          if (!generosItem.length) {
            rail.innerHTML = `<p class="text-secondary small">No hay géneros definidos.</p>`;
            return;
          }
          const snap = await getDocs(collection(db, categoria));
          const similares = [];
          snap.forEach(d => {
            const data = d.data();
            const generosData = Array.isArray(data.genero) ? data.genero.map(g => String(g).toLowerCase().trim()) : [];
            if (generosData.some(g => generosItem.includes(g)) && d.id !== item.id)
              similares.push({ id: d.id, ...data });
          });
          if (!similares.length) {
            rail.innerHTML = `<p class="text-secondary small">No se encontraron obras similares.</p>`;
            return;
          }
          rail.innerHTML = similares.slice(0, 10).map(s => `
            <div class="sim-card">
              <a href="#/detalle" class="text-decoration-none text-white"
                 onclick="sessionStorage.setItem('detalleItem', JSON.stringify(${JSON.stringify(s)})); sessionStorage.setItem('detalleCategoria', '${categoria}')">
                <img src="${resolveImagePath(s.imagen || s.img)}" alt="${s.titulo || s.title}">
                <div class="sim-title">${s.titulo || s.title}</div>
              </a>
            </div>
          `).join('');
        } catch (e) { console.error('Error cargando similares:', e); }
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
              <strong>${r.userEmail || 'Usuario anónimo'} ${own ? '(Tu reseña)' : ''}</strong>
              <p class="mb-1 text-warning small">${'★'.repeat(r.estrellas)}${'☆'.repeat(5 - r.estrellas)}</p>
              <p class="mb-0 small">${r.comentario}</p>
            </div>`;
          count++;
        });
        commentsList.innerHTML = html;
      };

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
