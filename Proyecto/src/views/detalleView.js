import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { ContentModel } from '../models/contentModel.js';
import { auth } from '../lib/firebase.js'; // 👈 para validar login
import { signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js"; // 👈 importar signOut

export function DetalleView(item, categoria) {
  if (!item) {
    return {
      html: `<div class="container py-5"><h2>No se encontró la reseña</h2></div>`,
      bind() {}
    };
  }

  const html = `
    ${Navbar()}
    <div class="container py-4">
      <h1 class="mb-3">${item.titulo || item.title}</h1>
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
        <h4>Calificación</h4>
        <div id="rating" class="d-flex gap-2 fs-3">
          ${[1,2,3,4,5].map(i => `<i class="bi bi-star" data-value="${i}" style="cursor:pointer;"></i>`).join('')}
        </div>
        <small id="ratingMessage" class="text-muted"></small>
      </div>

      <hr>

      <!-- Comentarios -->
      <div class="my-4">
        <h4>Comentarios</h4>
        <div id="commentsList" class="mb-3"></div>
        <div class="input-group">
          <input id="commentInput" class="form-control" placeholder="Escribe un comentario...">
          <button id="addComment" class="btn btn-primary">Comentar</button>
        </div>
        <small id="errorMessage" class="text-danger"></small>
      </div>
    </div>
  `;

  return {
    html,
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      // --- Cerrar sesión ---
      const logoutBtn = document.getElementById("logoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          try {
            await signOut(auth);
            console.log("Sesión cerrada ✅");
            window.location.hash = "#/login"; // redirige al login
          } catch (error) {
            console.error("Error al cerrar sesión:", error);
          }
        });
      }

      // --- Variables para reseña ---
      let currentRating = 0;
      const stars = document.querySelectorAll("#rating i");
      const msg = document.getElementById("ratingMessage");
      const errorEl = document.getElementById("errorMessage");

      stars.forEach(star => {
        star.addEventListener("click", () => {
          const value = parseInt(star.getAttribute("data-value"));
          currentRating = value;
          msg.textContent = `Tu calificación: ${value} estrellas`;

          // Marcar visualmente
          stars.forEach(s => s.classList.replace("bi-star-fill", "bi-star"));
          for (let i = 0; i < value; i++) {
            stars[i].classList.replace("bi-star", "bi-star-fill");
          }
        });
      });

      // --- Comentarios ---
      const listEl = document.getElementById("commentsList");
      const inputEl = document.getElementById("commentInput");
      const addBtn = document.getElementById("addComment");

      // 🔹 Render desde Firebase
      const renderComments = async () => {
        const reviews = await ContentModel.listReviewsByPelicula(item.id);
        listEl.innerHTML = reviews.length
          ? reviews.map(r => `
              <div class="border rounded p-2 mb-2">
                <strong>${r.usuario}</strong> (${r.rating}⭐)<br>
                ${r.texto}
              </div>
            `).join('')
          : `<p class="text-muted">No hay comentarios aún</p>`;
      };

      // 🔹 Guardar comentario en Firebase
      addBtn.addEventListener("click", async () => {
        errorEl.textContent = "";
        const val = inputEl.value.trim();

        // 1. Validar login
        const user = auth.currentUser;
        if (!user) {
          errorEl.textContent = "⚠️ Debes iniciar sesión para comentar.";
          return;
        }

        // 2. Validar rating
        if (currentRating === 0) {
          errorEl.textContent = "⚠️ Debes calificar con estrellas antes de comentar.";
          return;
        }

        // 3. Validar comentario vacío
        if (!val) {
          errorEl.textContent = "⚠️ El comentario no puede estar vacío.";
          return;
        }

        // Usuario logueado → usamos displayName o email
        const usuario = user.displayName || user.email;

        await ContentModel.addReview({
          peliculaId: item.id,
          peliculaTitulo: item.titulo || item.title,
          peliculaImg: item.imagen || item.img,
          usuario,
          usuarioEmail: user.email, // 👈 nuevo campo
          texto: val,
          rating: currentRating
        });

        // 🔹 Reset inputs después de guardar
        inputEl.value = "";
        currentRating = 0;
        stars.forEach(s => s.classList.replace("bi-star-fill", "bi-star"));
        msg.textContent = "";

        await renderComments();
      });

      // 🔹 Inicializar comentarios
      renderComments();
    }
  };
}
