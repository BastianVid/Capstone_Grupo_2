import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { ContentModel } from '../models/contentModel.js';
import { auth } from '../lib/firebase.js';

export function PerfilView() {
  const html = `
    ${Navbar()}
    <div class="container py-4">
      <h1 class="mb-4">Mi Perfil</h1>

      <div class="card mb-4">
        <div class="card-body d-flex align-items-center gap-3">
          <img id="userPhoto" class="rounded-circle" width="80" height="80" alt="Foto perfil">
          <div>
            <h4 id="userName">Usuario</h4>
            <p class="text-muted mb-0" id="userEmail">correo</p>
          </div>
        </div>
      </div>

      <h4 class="mb-3">Mis reseñas</h4>
      <div id="myReviews"></div>
    </div>
  `;

  return {
    html,
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      // --- Usuario actual ---
      const user = auth.currentUser;
      if (!user) {
        document.querySelector('.container').innerHTML = `
          <div class="py-5 text-center">
            <h2>⚠️ Debes iniciar sesión para ver tu perfil</h2>
          </div>
        `;
        return;
      }

      // Render info de usuario
      document.getElementById("userName").textContent = user.displayName || "Sin nombre";
      document.getElementById("userEmail").textContent = user.email;
      document.getElementById("userPhoto").src =
        user.photoURL || "https://via.placeholder.com/80x80?text=User";

      // --- Reseñas del usuario ---
      const reviews = await ContentModel.listReviewsByUser(user.email);
      const container = document.getElementById("myReviews");

      container.innerHTML = reviews.length
        ? reviews.map(r => `
            <div class="border rounded p-3 mb-2 d-flex align-items-center gap-3">
              <img src="${r.peliculaImg}" width="60" class="rounded shadow">
              <div>
                <strong>${r.peliculaTitulo}</strong> (${r.rating}⭐)<br>
                ${r.texto}
              </div>
            </div>
          `).join('')
        : `<p class="text-muted">Aún no has publicado reseñas.</p>`;
    }
  };
}
