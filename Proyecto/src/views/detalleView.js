import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { auth, db } from '../lib/firebase.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
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
      /* ⭐ Estilo visual para las estrellas */
      #rating i {
        color: #ccc;
        transition: color 0.2s ease;
      }
      #rating i.active,
      #rating i:hover,
      #rating i.hovered {
        color: #ffc107; /* amarillo dorado de Bootstrap */
      }
      #rating i:hover ~ i {
        color: #ccc; /* las que siguen al hover vuelven grises */
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

      <!-- Calificación -->
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

      <!-- Reseñas -->
      <div class="my-4">
        <h4>Reseñas de usuarios</h4>
        <div id="commentsList" class="mb-3"></div>
      </div>
    </div>
  `;

  return {
    html,
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      // --- Botón cerrar sesión ---
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

      // --- Variables de UI ---
      const stars = document.querySelectorAll("#rating i");
      const msg = document.getElementById("ratingMessage");
      const errorEl = document.getElementById("errorMessage");
      const comentarioEl = document.getElementById("commentInput");
      const addBtn = document.getElementById("addComment");
      const commentsList = document.getElementById("commentsList");
      const promedioGeneralEl = document.getElementById("promedioGeneral");

      let currentRating = 0;

      // --- Estrellas interactivas ---
      const pintarEstrellas = (value) => {
        stars.forEach((s, i) => {
          s.classList.remove("bi-star-fill", "active");
          s.classList.add(i < value ? "bi-star-fill" : "bi-star");
          if (i < value) s.classList.add("active");
        });
      };

      // Hover visual
      stars.forEach((star, index) => {
        star.addEventListener("mouseenter", () => {
          stars.forEach((s, i) => {
            s.classList.toggle("hovered", i <= index);
          });
        });
        star.addEventListener("mouseleave", () => {
          stars.forEach(s => s.classList.remove("hovered"));
        });
      });

      // Clic para fijar valor
      stars.forEach(star => {
        star.addEventListener("click", () => {
          currentRating = parseInt(star.getAttribute("data-value"));
          pintarEstrellas(currentRating);
          msg.textContent = `Tu calificación: ${currentRating} estrellas`;
        });
      });

      // --- Función: mostrar promedio general ---
      const renderPromedioGeneral = async () => {
        const itemRef = doc(db, `${categoria}/${item.id}`);
        const snap = await getDoc(itemRef);

        if (snap.exists()) {
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
        } else {
          promedioGeneralEl.textContent = "⭐ Sin calificaciones aún";
        }
      };

      // --- Precargar reseña del usuario ---
      const user = auth.currentUser;
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

      // --- Guardar reseña ---
      addBtn.addEventListener("click", async () => {
        errorEl.textContent = "";

        const comentario = comentarioEl.value.trim();
        const user = auth.currentUser;

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
        comentarioEl.value = "";
        await renderReseñas();
        await renderPromedioGeneral();
      });

      // --- Mostrar todas las reseñas ---
      const renderReseñas = async () => {
        const reseñasRef = collection(db, `${categoria}/${item.id}/reseñas`);
        const snapshot = await getDocs(reseñasRef);

        const user = auth.currentUser;
        let userReviewHTML = "";
        let otherReviewsHTML = "";

        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          const isUserReview = user && data.userId === user.uid;

          const reseñaHTML = `
            <div class="border rounded p-2 mb-2 ${isUserReview ? 'bg-light border-2 border-dark' : ''}">
              <strong>${data.userEmail || "Usuario anónimo"} ${isUserReview ? '(Tu reseña)' : ''}</strong> 
              (${data.estrellas}⭐)
              <p class="mb-0">${data.comentario}</p>
            </div>
          `;

          if (isUserReview) {
            userReviewHTML = reseñaHTML;
          } else {
            otherReviewsHTML += reseñaHTML;
          }
        });

        commentsList.innerHTML =
          userReviewHTML + (otherReviewsHTML || `<p class="text-muted">No hay reseñas aún.</p>`);
      };

      await renderPromedioGeneral();
      await renderReseñas();
    }
  };
}
