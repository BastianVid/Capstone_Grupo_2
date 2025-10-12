import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { auth, db } from '../lib/firebase.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { guardarReseña, obtenerReseñaUsuario } from '../controllers/reseñasController.js';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

export function DetalleView(item, categoria) {
  if (!item) {
    return {
      html: `<div class="container py-5"><h2>No se encontró la reseña</h2></div>`,
      bind() {}
    };
  }

  const html = `
    ${Navbar()}
    <style>
      #rating i {
        color: #ccc;
        transition: color 0.2s ease;
      }
      #rating i.active,
      #rating i.hovered {
        color: #ffc107;
      }
    </style>

    <div class="container py-4">
      <h1 class="mb-1">${item.titulo || item.title}</h1>
      <p id="promedioGeneral" class="text-warning fs-5 mb-3"></p>

      <div class="row">
        <div class="col-md-4">
          <img src="${item.imagen || item.img}" alt="${item.titulo || item.title}" class="img-fluid rounded shadow">
        </div>
        <div class="col-md-8">
          <p class="text-muted">${item.subtitle || ''}</p>
          <p><strong>Género:</strong> ${(item.genero || item.genres || []).join(', ')}</p>
          <p>${item.descripcion || item.description || ''}</p>
        </div>
      </div>

      <hr>

      <div class="my-4">
        <h4>Tu Calificación</h4>
        <div id="rating" class="d-flex gap-2 fs-3 mb-2">
          ${[1,2,3,4,5].map(i => `<i class="bi bi-star" data-value="${i}" style="cursor:pointer;"></i>`).join('')}
        </div>
        <textarea id="commentInput" class="form-control mb-2" placeholder="Escribe un comentario..."></textarea>
        <button id="addComment" class="btn btn-dark">Guardar reseña</button>
        <small id="errorMessage" class="text-danger d-block mt-2"></small>
        <small id="ratingMessage" class="text-muted"></small>
      </div>

      <hr>

      <div class="my-4">
        <h4>Reseñas de usuarios</h4>
        <div id="commentsList" class="mb-3 text-start"></div>
      </div>
    </div>
  `;

  return {
    html,
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      // Botón cerrar sesión
      const logoutBtn = document.getElementById("logoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          try {
            await signOut(auth);
            window.location.hash = "#/login";
          } catch (error) {
            console.error("Error al cerrar sesión:", error);
          }
        });
      }

      // Elementos UI
      const stars = document.querySelectorAll("#rating i");
      const msg = document.getElementById("ratingMessage");
      const errorEl = document.getElementById("errorMessage");
      const comentarioEl = document.getElementById("commentInput");
      const addBtn = document.getElementById("addComment");
      const commentsList = document.getElementById("commentsList");
      const promedioGeneralEl = document.getElementById("promedioGeneral");

      let currentRating = 0;

      // ---- Estrellas visuales ----
      const pintarEstrellas = (value) => {
        stars.forEach((s, i) => {
          s.classList.remove("bi-star-fill", "active");
          s.classList.add(i < value ? "bi-star-fill" : "bi-star");
          if (i < value) s.classList.add("active");
        });
      };

      stars.forEach((star, index) => {
        star.addEventListener("mouseenter", () => {
          stars.forEach((s, i) => s.classList.toggle("hovered", i <= index));
        });
        star.addEventListener("mouseleave", () => {
          stars.forEach(s => s.classList.remove("hovered"));
        });
        star.addEventListener("click", () => {
          currentRating = parseInt(star.getAttribute("data-value"));
          pintarEstrellas(currentRating);
          msg.textContent = `Tu calificación: ${currentRating} estrellas`;
        });
      });

      // ---- Render promedio general ----
      const renderPromedioGeneral = async () => {
        try {
          const itemRef = doc(db, `${categoria}/${item.id}`);
          const snap = await getDoc(itemRef);

          if (!snap.exists()) {
            promedioGeneralEl.textContent = "⭐ Sin calificaciones aún";
            return;
          }

          const data = snap.data();
          const promedio = data.calificacionPromedio || 0;
          const votos = data.totalVotos || 0;

          if (votos === 0) {
            promedioGeneralEl.innerHTML = `⭐ Sin calificaciones aún`;
          } else {
            const estrellas = Math.round(promedio);
            const estrellasHTML = "★".repeat(estrellas) + "☆".repeat(5 - estrellas);
            promedioGeneralEl.innerHTML = `
              <span class="text-warning">${estrellasHTML}</span>
              <span class="text-dark fw-semibold ms-2">${promedio.toFixed(1)} / 5</span>
              <span class="text-muted">(${votos} votos)</span>
            `;
          }
        } catch (e) {
          console.error("Error al mostrar promedio:", e);
        }
      };

      // ---- Render reseñas (todas) ----
      const renderReseñas = async (user) => {
        try {
          console.log("🔥 DEBUG DetalleView");
          console.log("categoria:", categoria);
          console.log("item:", item);
          console.log("item.id:", item.id);
          console.log("ruta esperada:", `${categoria}/${item.id}/reseñas`);

          const reseñasRef = collection(doc(db, categoria, item.id), "reseñas");
          const snapshot = await getDocs(reseñasRef);

          console.log(`🔍 ${snapshot.size} reseñas encontradas en ${categoria}/${item.id}`);

          if (snapshot.empty) {
            commentsList.innerHTML = `<p class="text-muted">No hay reseñas aún.</p>`;
            return;
          }

          let userReviewHTML = "";
          let otherReviewsHTML = "";

          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const isUserReview = user && data.userId === user.uid;

            const reseñaHTML = `
              <div class="border rounded p-2 mb-2 ${isUserReview ? 'bg-light border-2 border-dark' : ''}">
                <strong>${data.userEmail || "Usuario anónimo"} ${isUserReview ? '(Tu reseña)' : ''}</strong>
                <p class="mb-1 text-warning">${"★".repeat(data.estrellas)}${"☆".repeat(5 - data.estrellas)}</p>
                <p class="mb-0">${data.comentario}</p>
              </div>
            `;

            if (isUserReview) userReviewHTML = reseñaHTML;
            else otherReviewsHTML += reseñaHTML;
          });

          commentsList.innerHTML =
            (userReviewHTML || "") +
            (otherReviewsHTML || `<p class="text-muted">No hay reseñas aún.</p>`);
        } catch (e) {
          console.error("Error al obtener reseñas:", e);
          commentsList.innerHTML = `<p class="text-danger">Error al cargar reseñas.</p>`;
        }
      };

      // ---- Control de sesión ----
      onAuthStateChanged(auth, async (user) => {
        console.log("👤 Usuario actual:", user ? user.email : "No logueado");

        await renderPromedioGeneral();
        await renderReseñas(user);

        // Si hay login, precargar reseña propia
        if (user) {
          const reseña = await obtenerReseñaUsuario(categoria, item.id);
          if (reseña) {
            currentRating = reseña.estrellas;
            comentarioEl.value = reseña.comentario;
            pintarEstrellas(currentRating);
            msg.textContent = "Ya habías calificado esta obra. Puedes editar tu reseña.";
          }
        } else {
          msg.textContent = "Inicia sesión para dejar una reseña.";
        }

        // Guardar reseña
        addBtn.addEventListener("click", async () => {
          errorEl.textContent = "";
          const comentario = comentarioEl.value.trim();

          if (!user) {
            errorEl.textContent = "⚠️ Debes iniciar sesión para comentar.";
            return;
          }
          if (currentRating === 0) {
            errorEl.textContent = "⚠️ Debes calificar con estrellas antes de comentar.";
            return;
          }
          if (!comentario) {
            errorEl.textContent = "⚠️ El comentario no puede estar vacío.";
            return;
          }

          await guardarReseña(categoria, item.id, currentRating, comentario);
          msg.textContent = "✅ Reseña guardada correctamente.";

          await renderReseñas(user);
          await renderPromedioGeneral();
        });
      });
    }
  };
}
