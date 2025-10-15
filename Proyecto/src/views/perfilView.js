import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { auth } from '../lib/firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { db } from '../lib/firebase.js';
import { resolveImagePath } from './shared/resolve-image-path.js';

export function PerfilView() {
  const html = `
    ${Navbar()}
    <div class="container py-5">
      <div class="text-center mb-5">
        <div class="d-inline-block bg-secondary rounded-circle text-white d-flex align-items-center justify-content-center" style="width:100px;height:100px;font-size:32px;">
          <span id="userInitial">U</span>
        </div>
        <h3 id="userName" class="mt-3">Usuario</h3>
        <p id="userEmail" class="text-muted"></p>
      </div>

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

      // Categorías a revisar
      const categorias = ["peliculas", "series", "anime", "musica", "libros", "videojuegos"];

      // Función para traer reseñas del usuario
      async function getUserReviews(userId) {
        const reviews = [];

        for (const categoria of categorias) {
          try {
            const itemsSnap = await getDocs(collection(db, categoria));

            for (const itemDoc of itemsSnap.docs) {
              const resenasRef = collection(db, categoria, itemDoc.id, "resenas");
              const q = query(resenasRef, where("userId", "==", userId));
              const resenasSnap = await getDocs(q);

              resenasSnap.forEach(r => {
                reviews.push({
                  categoria,
                  obraId: itemDoc.id,
                  obraTitulo: itemDoc.data().titulo || itemDoc.data().title || "Sin título",
                  obraImg: resolveImagePath(itemDoc.data().imagen || itemDoc.data().img || ""),
                  estrellas: r.data().estrellas,
                  comentario: r.data().comentario,
                  fecha: r.data().fecha,
                });
              });
            }
          } catch (err) {
            console.error(`❌ Error al obtener reseñas de ${categoria}:`, err);
          }
        }

        return reviews;
      }

      // Mostrar reseñas
      async function renderUserReviews(user) {
        userReviewsEl.innerHTML = `<p class="text-muted">Cargando reseñas...</p>`;

        try {
          const reseñas = await getUserReviews(user.uid);

          if (!reseñas.length) {
            userReviewsEl.innerHTML = `<p class="text-muted">Aún no has hecho reseñas.</p>`;
            return;
          }

          userReviewsEl.innerHTML = reseñas
            .map(r => `
              <div class="border rounded p-3 mb-3 bg-dark text-light">
                <div class="d-flex align-items-center gap-3">
                  <img src="${r.obraImg}" alt="${r.obraTitulo}" class="rounded" style="width:80px;height:110px;object-fit:cover;">
                  <div>
                    <h5 class="mb-1">${r.obraTitulo}</h5>
                    <p class="mb-1 text-warning">${"★".repeat(r.estrellas)}${"☆".repeat(5 - r.estrellas)}</p>
                    <p class="mb-1">${r.comentario}</p>
                    <small class="text-secondary">${r.categoria}</small>
                  </div>
                </div>
              </div>
            `)
            .join("");
        } catch (error) {
          console.error("❌ Error al renderizar reseñas:", error);
          userReviewsEl.innerHTML = `<p class="text-danger">Error al cargar tus reseñas.</p>`;
        }
      }

      // Observador de sesión
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          window.location.hash = "#/login";
          return;
        }

        document.getElementById("userInitial").textContent = user.displayName
          ? user.displayName[0].toUpperCase()
          : "U";
        document.getElementById("userName").textContent = user.displayName || "Usuario";
        document.getElementById("userEmail").textContent = user.email;

        await renderUserReviews(user);
      });

      // Botón logout
      document.getElementById("logoutBtn")?.addEventListener("click", async () => {
        await signOut(auth);
        window.location.hash = "#/login";
      });
    },
  };
}
