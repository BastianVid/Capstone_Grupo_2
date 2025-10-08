import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { ContentModel } from '../models/contentModel.js';
import { auth } from '../lib/firebase.js';
import { Footer } from './footer.js';

export function PerfilView() {
  const html = `
    ${Navbar()}

    <main class="perfil-container d-flex flex-column">
      <section class="perfil-hero position-relative text-center py-5">
        <div class="perfil-bg-overlay"></div>
        <div class="container position-relative z-1">
          <img id="userPhoto" class="perfil-avatar mb-3 shadow-lg border-gradient" alt="Foto perfil">
          <h2 id="userName" class="perfil-nombre">Usuario</h2>
          <p id="userEmail" class="perfil-correo mb-0">correo</p>
        </div>
      </section>

      <section class="perfil-body container py-5 flex-grow-1">
        <div class="perfil-reseñas">
          <h4 class="perfil-subtitulo mb-4">
            <i class="bi bi-star-fill me-2 text-warning"></i> Mis Reseñas
          </h4>
          <div id="myReviews" class="d-flex flex-column gap-4"></div>
        </div>
      </section>
    </main>

    ${Footer()}
  `;

  return {
    html,
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      const user = auth.currentUser;

      if (!user) {
        document.querySelector(".perfil-container").innerHTML = `
          <div class="py-5 text-center text-light">
            <h2>⚠️ Debes iniciar sesión para ver tu perfil</h2>
          </div>
        `;
        return;
      }

      document.getElementById("userName").textContent = user.displayName || "Sin nombre";
      document.getElementById("userEmail").textContent = user.email;
      document.getElementById("userPhoto").src =
        user.photoURL || "https://placehold.co/150x150?text=User";

      // Reseñas del usuario
      const reviews = await ContentModel.listReviewsByUser(user.email);
      const container = document.getElementById("myReviews");
      container.innerHTML = reviews.length
        ? reviews.map(r => `
            <div class="card review-card glass-card border-0 shadow-sm animate-fade-in">
              <div class="d-flex align-items-center gap-4 p-3">
                <img src="${r.peliculaImg || 'https://placehold.co/80x120?text=Poster'}" alt="${r.peliculaTitulo}" class="review-thumb shadow-sm">
                <div class="flex-grow-1">
                  <h5 class="mb-1 text-light fw-semibold">${r.peliculaTitulo}</h5>
                  <span class="text-warning small mb-2 d-inline-block">${r.rating} ⭐</span>
                  <p class="text-secondary small mb-2">${r.texto || 'Sin comentario'}</p>
                  <small class="text-muted">${r.fecha?.seconds ? new Date(r.fecha.seconds * 1000).toLocaleDateString() : ''}</small>
                </div>
              </div>
            </div>
          `).join('')
        : `<p class="text-muted text-center">Aún no has publicado reseñas.</p>`;
    }
  };
}
