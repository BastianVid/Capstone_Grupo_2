// ============================== IMPORTS ==============================
import { Navbar } from './shared/navbar.js';
import { Footer } from './shared/footer.js';
import { auth } from '../lib/firebase.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './shared/navbarSession.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { db } from '../lib/firebase.js';
import { resolveImagePath } from './shared/resolve-image-path.js';
import { renderCards } from './shared/renderCards.js';

// ============================== PERFIL VIEW ==============================
export function PerfilView() {
  const html = `
    ${Navbar()}

    <!-- HERO -->
    <section class="perfil-hero-pro">
      <div class="perfil-cover"></div>
      <div class="perfil-info container">
        <div class="perfil-avatar-wrap">
          <img id="perfilAvatar" src="src/assets/img/profile-placeholder.jpg" class="perfil-avatar-pro" alt="Avatar">
        </div>
        <div>
          <h1 id="perfilNombre" class="perfil-nombre-pro">Usuario</h1>
          <p id="perfilCorreo" class="perfil-email-pro">correo@ejemplo.com</p>
        </div>
      </div>
    </section>

    <!-- STATS -->
    <section class="perfil-stats container my-4">
      <div class="row g-3 text-center justify-content-center">
        <div class="col-6 col-md-4">
          <div class="stat-card">
            <i class="bi bi-chat-left-text"></i>
            <div>
              <h5>Reseñas</h5>
              <p id="statResenas">0 publicadas</p>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-4">
          <div class="stat-card">
            <i class="bi bi-calendar-check"></i>
            <div>
              <h5>Activo desde</h5>
              <p id="statFecha">---</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PANEL DE CONTENIDO -->
    <section class="container my-5">
      <ul class="nav nav-pills mb-3 justify-content-center" id="profileTabs">
        <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-reseñas">Mis reseñas</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-favoritos">Favoritos</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-actividad">Actividad</button></li>
      </ul>
      <div class="tab-content">
        <div class="tab-pane fade show active" id="tab-reseñas">
          <div id="reseñasGrid"></div>
        </div>
        <div class="tab-pane fade text-center text-secondary py-5" id="tab-favoritos">
          <p><i class="bi bi-heart fs-1 mb-2 d-block"></i> Próximamente podrás guardar tus obras favoritas.</p>
        </div>
        <div class="tab-pane fade text-center text-secondary py-5" id="tab-actividad">
          <p><i class="bi bi-clock-history fs-1 mb-2 d-block"></i> Sin actividad reciente.</p>
        </div>
      </div>
    </section>

    ${Footer()}
  `;

  return {
    html,
    async bind() {
      // === NAVBAR Y SESIÓN ===
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      const user = auth.currentUser;
      const avatarEl = document.getElementById("perfilAvatar");
      const nombreEl = document.getElementById("perfilNombre");
      const correoEl = document.getElementById("perfilCorreo");

      if (user) {
        nombreEl.textContent = user.displayName || "Usuario sin nombre";
        correoEl.textContent = user.email;
        avatarEl.src = user.photoURL || "src/assets/img/profile-placeholder.jpg";
      }

      // === ESTADÍSTICAS DEL USUARIO ===
      const resenasSnap = await getDocs(collection(db, "userResenas"));
      const propias = [];
      resenasSnap.forEach((d) => {
        const data = d.data();
        if (data.userId === user?.uid) propias.push(data);
      });

      document.getElementById("statResenas").textContent = `${propias.length} publicadas`;
      document.getElementById("statFecha").textContent =
        new Date(user?.metadata?.creationTime).toLocaleDateString("es-CL");

      // === RENDERIZAR RESEÑAS ===
      const mapped = propias.map((r) => ({
        title: r.obraTitulo,
        img: resolveImagePath(r.obraImg),
        tag: r.categoria,
        description: `“${r.comentario}”`,
        subtitle: `★ ${r.estrellas}/5`,
      }));

      renderCards("#reseñasGrid", mapped, {
        ctaText: "Ver obra",
        onCardClick: async (item) => {
          const found = propias.find((x) => x.obraTitulo === item.title);
          if (!found) return;

          // Importar el modelo y obtener la obra completa
          const { ContentModel } = await import("../models/contentModel.js");
          const fullItem = await ContentModel.getItem(found.categoria, found.obraId);

          // Si no existe el documento, usar datos mínimos
          const selected = fullItem
            ? { id: fullItem.id, ...fullItem }
            : { titulo: found.obraTitulo, imagen: found.obraImg, categoria: found.categoria };

          sessionStorage.setItem("detalleItem", JSON.stringify(selected));
          sessionStorage.setItem("detalleCategoria", found.categoria);
          location.hash = "#/detalle";
        },
      });

      // === LOGOUT ===
      document.getElementById("logoutBtn")?.addEventListener("click", async () => {
        const { logout } = await import("../controllers/authController.js");
        await logout();
      });
    },
  };
}
