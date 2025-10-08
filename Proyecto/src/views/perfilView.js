import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { ContentModel } from '../models/contentModel.js';
import { auth } from '../lib/firebase.js';
import { Footer } from './footer.js';

export function PerfilView() {
  const html = `
    ${Navbar()}

    <!-- Contenedor principal del perfil -->
    <main class="perfil-container">
      <!-- Encabezado del perfil -->
      <section class="perfil-hero">
        <div class="perfil-bg-overlay"></div>
        <div class="perfil-content">
          <img id="userPhoto" class="perfil-avatar border-gradient shadow-lg" alt="Foto perfil">
          <div>
            <h2 id="userName" class="perfil-nombre">Usuario</h2>
            <p id="userEmail" class="perfil-correo">correo</p>
          </div>
        </div>
      </section>

      <!-- Línea divisoria -->
      <div class="perfil-divider"></div>

      <!-- Sección de reseñas -->
      <section class="perfil-body container py-5">
        <h4 class="perfil-subtitulo mb-4">
          <i class="bi bi-star-fill text-warning"></i> Mis Reseñas
        </h4>
        <div id="myReviews" class="d-flex flex-column gap-4 animate-fade-in"></div>
      </section>
    </main>

    <!-- Footer fuera del bloque principal -->
    ${Footer()}
  `;

  return {
    html,
    async bind() {
      // 🔹 Inicializa la sesión y la UI
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      // 🔹 Usuario actual
      const user = auth.currentUser;
      if (!user) {
        document.querySelector(".perfil-container").innerHTML = `
          <div class="py-5 text-center text-light">
            <h2>⚠️ Debes iniciar sesión para ver tu perfil</h2>
          </div>
        `;
        return;
      }

      // 🔹 Información básica del usuario
      const userNameEl = document.getElementById("userName");
      const userEmailEl = document.getElementById("userEmail");
      const userPhotoEl = document.getElementById("userPhoto");

      userNameEl.textContent = user.displayName || "Sin nombre";
      userEmailEl.textContent = user.email;
      userPhotoEl.src = user.photoURL || "https://placehold.co/150x150?text=User";

      // 🔹 Carga de reseñas
      try {
        const reviews = await ContentModel.listReviewsByUser(user.email);
        const container = document.getElementById("myReviews");

        if (!reviews.length) {
          container.innerHTML = `<p class="text-muted text-center">Aún no has publicado reseñas.</p>`;
          return;
        }

        container.innerHTML = reviews.map(r => `
          <div class="card review-card glass-card p-3 border-0 shadow-sm">
            <div class="d-flex align-items-center gap-4">
              <img 
                src="${r.peliculaImg || 'https://placehold.co/80x120?text=Poster'}"
                alt="${r.peliculaTitulo}"
                class="review-thumb"
              >
              <div class="flex-grow-1">
                <h5 class="mb-1 text-light fw-semibold">
                  ${r.peliculaTitulo}
                  <span class="text-warning small ms-2">(${r.rating}⭐)</span>
                </h5>
                <p class="text-secondary small mb-2">
                  ${r.texto || 'Sin comentario'}
                </p>
                <small class="text-muted">
                  ${r.fecha?.seconds ? new Date(r.fecha.seconds * 1000).toLocaleDateString() : ''}
                </small>
              </div>
            </div>
          </div>
        `).join('');
      } catch (error) {
        console.error("❌ Error al cargar reseñas:", error);
        document.getElementById("myReviews").innerHTML =
          `<p class="text-danger text-center">Error al cargar tus reseñas.</p>`;
      }
    }
  };
}
