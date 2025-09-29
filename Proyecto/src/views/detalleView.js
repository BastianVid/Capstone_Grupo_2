import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';

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
      <h1 class="mb-3">${item.title}</h1>
      <div class="row">
        <div class="col-md-4">
          <img src="${item.img}" alt="${item.title}" class="img-fluid rounded shadow">
        </div>
        <div class="col-md-8">
          <p class="text-muted">${item.subtitle || ''}</p>
          <p><strong>Género:</strong> ${(item.genres || []).join(', ')}</p>
          <p>${item.description}</p>
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
      </div>
    </div>
  `;

  return {
    html,
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      // --- Calificación ---
      const stars = document.querySelectorAll("#rating i");
      const msg = document.getElementById("ratingMessage");

      stars.forEach(star => {
        star.addEventListener("click", () => {
          const value = star.getAttribute("data-value");
          msg.textContent = `Tu calificación: ${value} estrellas`;

          // Marcar visualmente
          stars.forEach(s => s.classList.replace("bi-star-fill", "bi-star"));
          for (let i = 0; i < value; i++) {
            stars[i].classList.replace("bi-star", "bi-star-fill");
          }

          // Guardar calificación en localStorage (se puede cambiar a Firebase)
          const key = `rating:${categoria}:${item.id}`;
          localStorage.setItem(key, value);
        });
      });

      // --- Comentarios ---
      const listEl = document.getElementById("commentsList");
      const inputEl = document.getElementById("commentInput");
      const addBtn = document.getElementById("addComment");
      const commentsKey = `comments:${categoria}:${item.id}`;

      const renderComments = () => {
        const comments = JSON.parse(localStorage.getItem(commentsKey) || "[]");
        listEl.innerHTML = comments.length
          ? comments.map(c => `<div class="border rounded p-2 mb-2">${c}</div>`).join('')
          : `<p class="text-muted">No hay comentarios aún</p>`;
      };

      addBtn.addEventListener("click", () => {
        const val = inputEl.value.trim();
        if (!val) return;
        const comments = JSON.parse(localStorage.getItem(commentsKey) || "[]");
        comments.push(val);
        localStorage.setItem(commentsKey, JSON.stringify(comments));
        inputEl.value = "";
        renderComments();
      });

      renderComments();
    }
  };
}