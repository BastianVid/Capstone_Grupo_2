// ============================== IMPORTS ==============================
import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './navbarSession.js';
import { auth, db } from '../lib/firebase.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { guardarReseña, obtenerReseñaUsuario, eliminarReseña } from '../controllers/reseñasController.js';
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ============================== UTILIDAD: Resolver ruta de imagen ==============================
function resolveImagePath(input = "") {
  if (!input) return "src/assets/img/default.jpg";
  if (input.startsWith("http")) return input;
  const clean = String(input).split(/[?#]/)[0];
  const file = clean.split("/").pop();
  const withExt = /\.(jpg|jpeg|png|gif|webp)$/i.test(file) ? file : `${file}.jpg`;
  return `src/assets/img/${withExt}`;
}

// ============================== DETALLE VIEW ==============================
export function DetalleView(item, categoria) {
  if (!item) {
    const storedItem = sessionStorage.getItem("detalleItem");
    const storedCategoria = sessionStorage.getItem("detalleCategoria");
    if (storedItem) {
      item = JSON.parse(storedItem);
      categoria = storedCategoria || categoria;
    }
  }

  if (!item || !categoria) {
    return {
      html: `<div class="container py-5"><h2>No se encontró la obra seleccionada.</h2></div>`,
      bind() {}
    };
  }

  const html = `
    ${Navbar()}
    <style>
      #rating i { color:#ccc; transition:color .2s }
      #rating i.active, #rating i.hovered { color:#ffc107 }
      .review-own { background:rgba(255,255,255,.05); border:1px solid #ffc107 }
    </style>

    <div class="container py-4" id="detalleContainer">
      <h1 id="detalleTitulo" class="mb-1">Cargando...</h1>
      <p id="promedioGeneral" class="text-warning fs-5 mb-3"></p>

      <div class="row">
        <div class="col-md-4">
          <img id="detalleImg" src="src/assets/img/default.jpg" alt="Obra" class="img-fluid rounded shadow">
        </div>
        <div class="col-md-8">
          <p id="detalleSubtitle" class="text-muted"></p>
          <p><strong>Género:</strong> <span id="detalleGenero"></span></p>
          <p id="detalleDescripcion"></p>
        </div>
      </div>

      <hr>

      <!-- Sección de reseña personal -->
      <div id="reseñaSection" class="my-4">
        <h4>Tu Calificación</h4>
        <div id="rating" class="d-flex gap-2 fs-3 mb-2">
          ${[1,2,3,4,5].map(i => `<i class="bi bi-star" data-value="${i}" style="cursor:pointer;"></i>`).join('')}
        </div>
        <textarea id="commentInput" class="form-control mb-2" placeholder="Escribe un comentario..."></textarea>
        <div class="d-flex gap-2 flex-wrap">
          <button id="addComment" class="btn btn-dark">Guardar reseña</button>
          <button id="deleteComment" class="btn btn-outline-danger d-none">Eliminar reseña</button>
        </div>
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

      document.getElementById("logoutBtn")?.addEventListener("click", async () => {
        await signOut(auth);
        location.hash = "#/login";
      });

      // ============================== CARGAR DETALLE DE OBRA ==============================
      if (!item.titulo && !item.title) {
        try {
          const docRef = doc(db, categoria, item.id);
          const snap = await getDoc(docRef);
          if (snap.exists()) item = { id: snap.id, ...snap.data() };
        } catch (e) {
          console.error("No se pudo cargar el item desde Firestore:", e);
        }
      }

      const imgEl   = document.getElementById("detalleImg");
      const titEl   = document.getElementById("detalleTitulo");
      const subEl   = document.getElementById("detalleSubtitle");
      const genEl   = document.getElementById("detalleGenero");
      const descEl  = document.getElementById("detalleDescripcion");

      titEl.textContent  = item.titulo || item.title || "Sin título";
      subEl.textContent  = item.subtitle || "";
      genEl.textContent  = Array.isArray(item.genero) ? item.genero.join(", ") : (item.genero || item.genres || "");
      descEl.textContent = item.descripcion || item.description || "";
      imgEl.src = resolveImagePath(item.img || item.imagen);
      imgEl.onerror = () => (imgEl.src = "src/assets/img/default.jpg");

      // ============================== VARIABLES ==============================
      const stars = document.querySelectorAll("#rating i");
      const msg = document.getElementById("ratingMessage");
      const errorEl = document.getElementById("errorMessage");
      const comentarioEl = document.getElementById("commentInput");
      const addBtn = document.getElementById("addComment");
      const delBtn = document.getElementById("deleteComment");
      const commentsList = document.getElementById("commentsList");
      const promedioGeneralEl = document.getElementById("promedioGeneral");
      let currentRating = 0;

      // ============================== PINTAR ESTRELLAS ==============================
      const pintarEstrellas = (v) => {
        stars.forEach((s, i) => {
          s.classList.remove("bi-star-fill", "active");
          s.classList.add(i < v ? "bi-star-fill" : "bi-star");
          if (i < v) s.classList.add("active");
        });
      };

      stars.forEach((star, idx) => {
        star.addEventListener("mouseenter", () => {
          stars.forEach((s, i) => s.classList.toggle("hovered", i <= idx));
        });
        star.addEventListener("mouseleave", () => {
          stars.forEach(s => s.classList.remove("hovered"));
        });
        star.addEventListener("click", () => {
          currentRating = parseInt(star.dataset.value);
          pintarEstrellas(currentRating);
          msg.textContent = `Tu calificación: ${currentRating} estrellas`;
        });
      });

      // ============================== PROMEDIO GENERAL ==============================
      const renderPromedioGeneral = async () => {
        try {
          const itemRef = doc(db, categoria, item.id);
          const snap = await getDoc(itemRef);
          if (!snap.exists()) { promedioGeneralEl.textContent = "⭐ Sin calificaciones aún"; return; }

          const data = snap.data();
          const promedio = data.calificacionPromedio || 0;
          const votos = data.totalVotos || 0;

          if (!votos) {
            promedioGeneralEl.textContent = "⭐ Sin calificaciones aún";
          } else {
            const est = Math.round(promedio);
            promedioGeneralEl.innerHTML = `
              <span class="text-warning">${"★".repeat(est)}${"☆".repeat(5-est)}</span>
              <span class="text-light fw-semibold ms-2">${promedio.toFixed(1)} / 5</span>
              <span class="text-secondary">(${votos} votos)</span>
            `;
          }
        } catch (e) {
          console.error("Error promedio:", e);
        }
      };

      // ============================== RENDER RESEÑAS ==============================
      const renderReseñas = async (user) => {
        try {
          const ref = collection(db, categoria, item.id, "resenas");
          const snap = await getDocs(ref);
          if (snap.empty) { commentsList.innerHTML = `<p class="text-muted">No hay reseñas aún.</p>`; return; }

          let html = "";
          snap.forEach(d => {
            const r = d.data();
            const own = user && r.userId === user.uid;
            html += `
              <div class="border rounded p-3 mb-3 ${own ? "review-own" : ""}">
                <strong>${r.userEmail || "Usuario anónimo"} ${own ? "(Tu reseña)" : ""}</strong>
                <p class="mb-1 text-warning">${"★".repeat(r.estrellas)}${"☆".repeat(5 - r.estrellas)}</p>
                <p class="mb-0">${r.comentario}</p>
              </div>`;
          });
          commentsList.innerHTML = html;
        } catch (e) {
          console.error("Error reseñas:", e);
          commentsList.innerHTML = `<p class="text-danger">Error al cargar reseñas.</p>`;
        }
      };

      // ============================== SESIÓN DE USUARIO ==============================
      onAuthStateChanged(auth, async (user) => {
        await renderPromedioGeneral();
        await renderReseñas(user);

        if (user) {
          const r = await obtenerReseñaUsuario(categoria, item.id);
          if (r) {
            currentRating = r.estrellas;
            comentarioEl.value = r.comentario;
            pintarEstrellas(currentRating);
            msg.textContent = "Ya habías calificado esta obra. Puedes editar o eliminar tu reseña.";
            delBtn.classList.remove("d-none");
          }
        } else {
          msg.textContent = "Inicia sesión para dejar una reseña.";
        }

        // ============================== GUARDAR RESEÑA ==============================
        addBtn.addEventListener("click", async () => {
          errorEl.textContent = "";
          const comentario = comentarioEl.value.trim();
          if (!user) { errorEl.textContent = "⚠️ Debes iniciar sesión para comentar."; return; }
          if (!currentRating) { errorEl.textContent = "⚠️ Debes calificar con estrellas."; return; }
          if (!comentario) { errorEl.textContent = "⚠️ El comentario no puede estar vacío."; return; }

          await guardarReseña(categoria, item.id, currentRating, comentario);
          msg.textContent = "✅ Reseña guardada correctamente.";
          await renderReseñas(user);
          await renderPromedioGeneral();
          delBtn.classList.remove("d-none");
        });

        // ============================== ELIMINAR RESEÑA ACTUAL ==============================
        delBtn.addEventListener("click", async () => {
          if (confirm("¿Seguro que deseas eliminar tu reseña?")) {
            await eliminarReseña(categoria, item.id);
            comentarioEl.value = "";
            currentRating = 0;
            pintarEstrellas(0);
            msg.textContent = "🗑️ Reseña eliminada.";
            delBtn.classList.add("d-none");
            await renderReseñas(user);
            await renderPromedioGeneral();
          }
        });
      });
    }
  };
}
