// ============================== IMPORTS ==============================
import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { auth, db } from '../lib/firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { resolveImagePath } from './shared/resolve-image-path.js';
import { eliminarReseña } from '../controllers/reseñasController.js';

// ============================== PERFIL VIEW ==============================
export function PerfilView() {
  const html = `
    ${Navbar()}

    <section class="perfil-container py-5 text-light">
      <div class="perfil-hero">
        <div class="perfil-content container">
          <img src="src/assets/img/default-avatar.png" alt="Avatar" id="userAvatar" class="perfil-avatar border-gradient">
          <div class="perfil-userinfo">
            <p class="perfil-line mb-1">
              <i class="bi bi-person-fill text-accent"></i>
              <span id="userName">Usuario</span>
            </p>
            <p class="perfil-line mb-1">
              <i class="bi bi-envelope-fill text-accent"></i>
              <span id="userEmail">correo@ejemplo.com</span>
            </p>
            <p class="perfil-line mb-0">
              <i class="bi bi-calendar-event text-accent"></i>
              Registrado: <span id="userCreated">—</span>
            </p>
          </div>
        </div>
      </div>

      <div class="container mt-5">
        <div class="perfil-divider"></div>
        <div class="d-flex align-items-center mb-3 perfil-subtitulo">
          <i class="bi bi-star-fill text-accent"></i>
          <span>Mis Reseñas</span>
        </div>
        <div id="userReviews" class="text-start"></div>
      </div>
    </section>
  `;

  return {
    html,
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      const userReviewsEl = document.getElementById('userReviews');
      const avatarEl = document.getElementById('userAvatar');

      async function renderUserReviews(user) {
        userReviewsEl.innerHTML = `
          <div class="text-center py-4 text-secondary">
            <div class="spinner-border text-info mb-2" role="status"></div>
            <p>Cargando reseñas...</p>
          </div>`;

        try {
          const q = query(collection(db, 'userResenas'), where('userId', '==', user.uid));
          const snap = await getDocs(q);

          if (snap.empty) {
            userReviewsEl.innerHTML = `
              <div class="text-center py-5 text-muted">
                <i class="bi bi-journal-x fs-1 mb-3"></i>
                <p class="fs-5">Aún no has hecho reseñas.</p>
                <p class="text-secondary">Explora el catálogo y deja tu primera opinión.</p>
              </div>`;
            return;
          }

          const reseñas = snap.docs.map(d => ({ id: d.id, ...d.data() }));

          userReviewsEl.innerHTML = reseñas
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map(r => `
              <div class="review-card animate-fade-in mb-3 p-3 d-flex align-items-start gap-3">
                <img src="${resolveImagePath(r.obraImg || '')}"
                     alt="${r.obraTitulo || 'Obra'}"
                     class="review-thumb shadow-sm">
                <div class="flex-grow-1">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 class="mb-1 fw-semibold text-light">${r.obraTitulo || 'Sin título'}</h5>
                      <p class="mb-1 text-warning small">
                        ${'★'.repeat(r.estrellas)}${'☆'.repeat(5 - r.estrellas)}
                      </p>
                    </div>
                    <span class="badge bg-info bg-opacity-25 text-info text-uppercase">${r.categoria}</span>
                  </div>
                  <p class="mb-2 text-muted fst-italic">${r.comentario || 'Sin comentario'}</p>

                  <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-info verObraBtn"
                            data-categoria="${r.categoria}"
                            data-id="${r.obraId}">
                      <i class="bi bi-eye"></i> Ver obra
                    </button>
                    <button class="btn btn-sm btn-outline-danger eliminarResenaBtn"
                            data-categoria="${r.categoria}"
                            data-id="${r.obraId}">
                      <i class="bi bi-trash"></i> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            `)
            .join('');

          // Ver obra
          document.querySelectorAll('.verObraBtn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const el = e.currentTarget;
              const categoria = el.dataset.categoria;
              const id = el.dataset.id;
              try {
                const ref = doc(db, categoria, id);
                const snap = await getDoc(ref);
                if (!snap.exists()) {
                  alert('No se encontró la obra en la base de datos.');
                  return;
                }
                const data = snap.data();
                sessionStorage.setItem('detalleCategoria', categoria);
                sessionStorage.setItem('detalleItem', JSON.stringify({
                  id,
                  titulo: data.titulo || data.title || 'Sin título',
                  img: data.imagen || data.img || '',
                  genero: data.genero || data.genres || [],
                  descripcion: data.descripcion || data.description || '',
                  subtitle: data.director || data.autor || ''
                }));
                location.hash = '#/detalle';
              } catch (err) {
                console.error('Error al abrir la obra:', err);
                alert('Error al intentar abrir la obra.');
              }
            });
          });

          // Eliminar reseña
          document.querySelectorAll('.eliminarResenaBtn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const el = e.currentTarget;
              const categoria = el.dataset.categoria;
              const id = el.dataset.id;
              if (!confirm('¿Seguro que deseas eliminar esta reseña?')) return;
              try {
                await eliminarReseña(categoria, id);
                alert('Reseña eliminada correctamente.');
                await renderUserReviews(user);
              } catch (err) {
                console.error('Error al eliminar reseña:', err);
                alert('Error al eliminar reseña.');
              }
            });
          });
        } catch (error) {
          console.error('Error al cargar reseñas:', error);
          userReviewsEl.innerHTML = `<p class="text-danger text-center">Error al cargar tus reseñas.</p>`;
        }
      }

      // Sesión
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          window.location.hash = '#/login';
          return;
        }
        document.getElementById('userName').textContent = user.displayName || 'Usuario';
        document.getElementById('userEmail').textContent = user.email || '';
        document.getElementById('userCreated').textContent =
          new Date(user.metadata.creationTime).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
        if (user.photoURL) avatarEl.src = user.photoURL;

        await renderUserReviews(user);
      });

      // Logout
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await signOut(auth);
        window.location.hash = '#/login';
      });
    },
  };
}

