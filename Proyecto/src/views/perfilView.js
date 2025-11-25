// ============================== IMPORTS ==============================
import { Navbar } from './shared/navbar.js';
import { Footer } from './shared/footer.js';
import { auth } from '../lib/firebase.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './shared/navbarSession.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { db } from '../lib/firebase.js';
import { resolveImagePath } from './shared/resolve-image-path.js';
import { renderCards } from './shared/renderCards.js';
import { UserModel } from '../models/userModel.js';
import { updateProfile } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

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
          <button id="btnChangeAvatar" class="btn btn-outline-light btn-sm mt-2 w-100">Cambiar foto</button>
          <input type="file" id="avatarInput" accept="image/*" class="d-none">
        </div>
        <div>
          <h1 id="perfilNombre" class="perfil-nombre-pro">Usuario</h1>
          <p id="perfilCorreo" class="perfil-email-pro">correo@ejemplo.com</p>
          <div class="perfil-username-group d-flex gap-2 align-items-center mt-2 flex-wrap">
            <span id="perfilUsernameLabel" class="fw-semibold"></span>
            <button id="btnEditUsername" class="btn btn-sm btn-outline-light">Editar</button>
            <div id="usernameEditWrap" class="d-flex gap-2 align-items-center flex-wrap d-none">
              <input type="text" id="perfilUsernameInput" class="form-control form-control-sm" placeholder="Nuevo username">
              <button id="btnSaveUsername" class="btn btn-sm btn-primary">Guardar</button>
              <button id="btnCancelUsername" class="btn btn-sm btn-outline-secondary">Cancelar</button>
            </div>
          </div>
          <small id="usernameStatus" class="text-secondary d-block mt-1"></small>
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
        <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-resenas">Mis reseñas</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-favoritos">Favoritos</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-actividad">Actividad</button></li>
      </ul>
      <div class="tab-content">
        <div class="tab-pane fade show active" id="tab-resenas">
          <div id="resenasGrid"></div>
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
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      const user = auth.currentUser;
      if (!user) {
        location.hash = "#/login";
        return;
      }

      const avatarEl = document.getElementById("perfilAvatar");
      const nombreEl = document.getElementById("perfilNombre");
      const correoEl = document.getElementById("perfilCorreo");
      const usernameLabel = document.getElementById("perfilUsernameLabel");
      const usernameInput = document.getElementById("perfilUsernameInput");
      const usernameStatus = document.getElementById("usernameStatus");
      const btnSaveUsername = document.getElementById("btnSaveUsername");
      const btnCancelUsername = document.getElementById("btnCancelUsername");
      const btnEditUsername = document.getElementById("btnEditUsername");
      const usernameEditWrap = document.getElementById("usernameEditWrap");
      const btnChangeAvatar = document.getElementById("btnChangeAvatar");
      const avatarInput = document.getElementById("avatarInput");

      const profile = await UserModel.ensureProfile(user).catch(() => null);
      nombreEl.textContent = profile?.username || profile?.nombre || user.displayName || "Usuario sin nombre";
      correoEl.textContent = user.email || "";
      avatarEl.src = profile?.photoURL || user.photoURL || "src/assets/img/profile-placeholder.jpg";
      usernameInput.value = profile?.username || user.displayName || "";
      usernameLabel.textContent = profile?.username ? `@${profile.username}` : '';

      // === ESTADÍSTICAS DEL USUARIO ===
      const resenasSnap = await getDocs(collection(db, "userResenas"));
      const propias = [];
      resenasSnap.forEach((d) => {
        const data = d.data();
        if (data.userId === user.uid) propias.push(data);
      });

      document.getElementById("statResenas").textContent = `${propias.length} publicadas`;
      document.getElementById("statFecha").textContent =
        new Date(user.metadata?.creationTime || Date.now()).toLocaleDateString("es-CL");

      // === RENDERIZAR RESEÑAS ===
      const mapped = propias.map((r) => ({
        title: r.obraTitulo,
        img: resolveImagePath(r.obraImg),
        tag: r.categoria,
        description: `${r.comentario}`,
        subtitle: `★ ${r.estrellas}/5`,
      }));

      renderCards("#resenasGrid", mapped, {
        ctaText: "Ver obra",
        onCardClick: async (item) => {
          const found = propias.find((x) => x.obraTitulo === item.title);
          if (!found) return;
          const { ContentModel } = await import("../models/contentModel.js");
          const fullItem = await ContentModel.getItem(found.categoria, found.obraId);
          const selected = fullItem
            ? { id: fullItem.id, ...fullItem }
            : { titulo: found.obraTitulo, imagen: found.obraImg, categoria: found.categoria };
          sessionStorage.setItem("detalleItem", JSON.stringify(selected));
          sessionStorage.setItem("detalleCategoria", found.categoria);
          location.hash = "#/detalle";
        },
      });

      // === CAMBIAR USERNAME ===
      btnSaveUsername?.addEventListener("click", async () => {
        const desired = usernameInput.value.trim();
        if (!desired) {
          usernameStatus.textContent = "Ingresa un username.";
          usernameStatus.className = "text-danger";
          return;
        }
        btnSaveUsername.disabled = true;
        usernameStatus.textContent = "Guardando...";
        usernameStatus.className = "text-secondary";
        try {
          const { profile: newProfile } = await UserModel.claimUsername(user.uid, desired, {
            email: user.email,
            nombre: user.displayName,
          });
          usernameStatus.textContent = "Username actualizado.";
          usernameStatus.className = "text-success";
          nombreEl.textContent = newProfile?.username || nombreEl.textContent;
          usernameLabel.textContent = newProfile?.username ? `@${newProfile.username}` : usernameLabel.textContent;
          await updateProfile(user, { displayName: newProfile?.username });
          updateNavbarSessionUI();
          usernameEditWrap.classList.add("d-none");
          btnEditUsername.classList.remove("d-none");
        } catch (err) {
          usernameStatus.textContent = err?.code === "USERNAME_TAKEN" ? "Ese username ya existe." : "No se pudo guardar.";
          usernameStatus.className = "text-danger";
        } finally {
          btnSaveUsername.disabled = false;
        }
      });

      btnEditUsername?.addEventListener("click", () => {
        usernameEditWrap.classList.remove("d-none");
        btnEditUsername.classList.add("d-none");
        usernameInput.focus();
      });

      btnCancelUsername?.addEventListener("click", () => {
        usernameEditWrap.classList.add("d-none");
        btnEditUsername.classList.remove("d-none");
        usernameStatus.textContent = "";
      });

      // === CAMBIAR AVATAR ===
      btnChangeAvatar?.addEventListener("click", () => avatarInput?.click());
      avatarInput?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        usernameStatus.textContent = "Subiendo foto...";
        usernameStatus.className = "text-secondary";
        btnChangeAvatar.disabled = true;
        try {
          const url = await UserModel.uploadAvatar(user.uid, file);
          avatarEl.src = url;
          await updateProfile(user, { photoURL: url });
          usernameStatus.textContent = "Foto actualizada.";
          usernameStatus.className = "text-success";
          updateNavbarSessionUI();
        } catch (err) {
          usernameStatus.textContent = "No se pudo subir la foto.";
          usernameStatus.className = "text-danger";
        } finally {
          btnChangeAvatar.disabled = false;
          if (avatarInput) avatarInput.value = "";
        }
      });

      // === LOGOUT ===
      document.getElementById("logoutBtn")?.addEventListener("click", async () => {
        const { logout } = await import("../controllers/authController.js");
        await logout();
      });
    },
  };
}

