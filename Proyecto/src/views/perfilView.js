// ============================== IMPORTS ==============================
import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { auth, db } from '../lib/firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { resolveImagePath } from './shared/resolve-image-path.js';

// ============================== PERFIL VIEW ==============================
export function PerfilView() {
  const html = `
    ${Navbar()}
    <div class="container py-5">
      <!-- Cabecera del perfil -->
      <div class="text-center mb-5">
        <div 
          class="d-inline-block bg-secondary rounded-circle text-white d-flex align-items-center justify-content-center"
          style="width:100px;height:100px;font-size:32px;">
          <span id="userInitial">U</span>
        </div>
        <h3 id="userName" class="mt-3">Usuario</h3>
        <p id="userEmail" class="text-muted"></p>
      </div>

      <!-- Sección de reseñas -->
      <h4 class="mb-3"><i class="bi bi-star-fill text-warning"></i> Mis Reseñas</h4>
      <div id="userReviews" class="text-start"></div>
    </div>
  `;

  return {
    html,
    async bind() {
      // Inicialización de la sesión
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      const userReviewsEl = document.getElementById("userReviews");

      // ============================== FUNCIÓN: Renderizar reseñas ==============================
      async function renderUserReviews(user) {
        userReviewsEl.innerHTML = `<p class="text-muted">Cargando reseñas...</p>`;

        try {
          // 🔍 Consulta única optimizada: todas las reseñas del usuario desde /userResenas
          const q = query(collection(db, "userResenas"), where("userId", "==", user.uid));
          const snap = await getDocs(q);

          if (snap.empty) {
            userReviewsEl.innerHTML = `<p class="text-muted">Aún no has hecho reseñas.</p>`;
            return;
          }

          const reseñas = snap.docs.map(d => ({ id: d.id, ...d.data() }));

          // ✅ Renderizar tarjetas de reseñas
          userReviewsEl.innerHTML = reseñas
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map(r => `
              <div class="border rounded p-3 mb-3 bg-dark text-light">
                <div class="d-flex align-items-center gap-3">
                  <img src="${resolveImagePath(r.obraImg)}" 
                       alt="${r.obraTitulo}" 
                       class="rounded" 
                       style="width:80px;height:110px;object-fit:cover;">
                  <div>
                    <h5 class="mb-1">${r.obraTitulo}</h5>
                    <p class="mb-1 text-warning">${"★".repeat(r.estrellas)}${"☆".repeat(5 - r.estrellas)}</p>
                    <p class="mb-1">${r.comentario}</p>
                    <small class="text-secondary">${r.categoria}</small>
                    <br>
                    <button class="btn btn-outline-light btn-sm mt-2 verObraBtn" 
                            data-categoria="${r.categoria}" 
                            data-id="${r.obraId}">
                      Ver obra
                    </button>
                  </div>
                </div>
              </div>
            `)
            .join("");

          // 🔗 Listeners de navegación hacia el detalle
          document.querySelectorAll(".verObraBtn").forEach(btn => {
            btn.addEventListener("click", (e) => {
              const categoria = e.target.dataset.categoria;
              const id = e.target.dataset.id;

              // Guardamos el contexto en sessionStorage
              sessionStorage.setItem("detalleCategoria", categoria);
              sessionStorage.setItem("detalleItem", JSON.stringify({ id }));

              // Redirigir al detalle
              location.hash = "#/detalle";
            });
          });
        } catch (error) {
          console.error("❌ Error al cargar reseñas:", error);
          userReviewsEl.innerHTML = `<p class="text-danger">Error al cargar tus reseñas.</p>`;
        }
      }

      // ============================== CONTROL DE SESIÓN ==============================
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          window.location.hash = "#/login";
          return;
        }

        // Mostrar datos del usuario
        document.getElementById("userInitial").textContent = user.displayName
          ? user.displayName[0].toUpperCase()
          : "U";
        document.getElementById("userName").textContent = user.displayName || "Usuario";
        document.getElementById("userEmail").textContent = user.email;

        // Cargar reseñas
        await renderUserReviews(user);
      });

      // ============================== LOGOUT ==============================
      document.getElementById("logoutBtn")?.addEventListener("click", async () => {
        await signOut(auth);
        window.location.hash = "#/login";
      });
    },
  };
}
