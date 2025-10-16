// ============================== IMPORTS ==============================
import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { auth, db } from '../lib/firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { resolveImagePath } from './shared/resolve-image-path.js';
import { eliminarReseña } from '../controllers/reseñasController.js';

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
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      const userReviewsEl = document.getElementById("userReviews");

      // ============================== FUNCIÓN: Renderizar reseñas ==============================
      async function renderUserReviews(user) {
        userReviewsEl.innerHTML = `<p class="text-muted">Cargando reseñas...</p>`;

        try {
          // 🔍 Obtener reseñas de la colección global /userResenas
          const q = query(collection(db, "userResenas"), where("userId", "==", user.uid));
          const snap = await getDocs(q);

          if (snap.empty) {
            userReviewsEl.innerHTML = `<p class="text-muted">Aún no has hecho reseñas.</p>`;
            return;
          }

          const reseñas = snap.docs.map(d => ({ id: d.id, ...d.data() }));

          // ✅ Renderizar tarjetas
          userReviewsEl.innerHTML = reseñas
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map(r => `
              <div class="border rounded p-3 mb-3 bg-dark text-light">
                <div class="d-flex align-items-center gap-3">
                  <img src="${resolveImagePath(r.obraImg || '')}" 
                       alt="${r.obraTitulo || 'Obra'}" 
                       class="rounded" 
                       style="width:80px;height:110px;object-fit:cover;">
                  <div class="flex-grow-1">
                    <h5 class="mb-1">${r.obraTitulo || 'Sin título'}</h5>
                    <p class="mb-1 text-warning">${"★".repeat(r.estrellas)}${"☆".repeat(5 - r.estrellas)}</p>
                    <p class="mb-1">${r.comentario || ''}</p>
                    <small class="text-secondary">${r.categoria}</small>
                    <br>
                    <div class="d-flex gap-2 mt-2">
                      <button class="btn btn-outline-light btn-sm verObraBtn" 
                              data-categoria="${r.categoria}" 
                              data-id="${r.obraId}">
                        Ver obra
                      </button>
                      <button class="btn btn-outline-danger btn-sm eliminarResenaBtn" 
                              data-categoria="${r.categoria}" 
                              data-id="${r.obraId}">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `)
            .join("");

          // ============================== EVENTOS: Ver obra ==============================
          document.querySelectorAll(".verObraBtn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
              const categoria = e.target.dataset.categoria;
              const id = e.target.dataset.id;

              try {
                const ref = doc(db, categoria, id);
                const snap = await getDoc(ref);

                if (!snap.exists()) {
                  alert("❌ No se encontró la obra en la base de datos.");
                  return;
                }

                const data = snap.data();

                // 🧠 Guardamos el objeto completo para DetalleView
                sessionStorage.setItem("detalleCategoria", categoria);
                sessionStorage.setItem("detalleItem", JSON.stringify({
                  id,
                  titulo: data.titulo || data.title || "Sin título",
                  img: data.imagen || data.img || "",
                  genero: data.genero || data.genres || [],
                  descripcion: data.descripcion || data.description || "",
                  subtitle: data.director || data.autor || ""
                }));

                // 🔀 Redirigir al DetalleView
                location.hash = "#/detalle";
              } catch (error) {
                console.error("❌ Error al cargar la obra seleccionada:", error);
                alert("Error al intentar abrir la obra.");
              }
            });
          });

          // ============================== EVENTOS: Eliminar reseña ==============================
          document.querySelectorAll(".eliminarResenaBtn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
              const categoria = e.target.dataset.categoria;
              const id = e.target.dataset.id;

              if (!confirm("¿Seguro que deseas eliminar esta reseña?")) return;

              try {
                await eliminarReseña(categoria, id);
                // 🔥 Eliminar también de la colección /userResenas
                const globalRef = doc(db, "userResenas", `${user.uid}_${categoria}_${id}`);
                await deleteDoc(globalRef);

                alert("🗑️ Reseña eliminada correctamente.");
                await renderUserReviews(user); // Refrescar vista
              } catch (error) {
                console.error("❌ Error al eliminar reseña:", error);
                alert("Error al eliminar reseña.");
              }
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
