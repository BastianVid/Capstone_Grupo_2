// js/plantilla.js
import { auth, obtenerItem, obtenerReseñas, guardarReseña } from "./firebase.js";

const params = new URLSearchParams(window.location.search);
const tipo = params.get("tipo") || "peliculas"; // ✅ default
const id = params.get("id");

const infoDiv = document.getElementById("info-item");
const lista = document.getElementById("reseñas-lista");
const form = document.getElementById("reseña-form");

let item = null;

async function cargarItem() {
  if (!id) {
    infoDiv.innerHTML = "<p>Falta el parámetro 'id' en la URL.</p>";
    return;
  }

  item = await obtenerItem(tipo, id);
  if (!item) {
    infoDiv.innerHTML = "<p>No encontrado</p>";
    return;
  }

 infoDiv.innerHTML = `
  <h2>${item.titulo}</h2>
  <img src="${item.imagen}" alt="${item.titulo}">
  <p>${item.descripcion}</p>
`;


  cargarReseñas();
}

async function cargarReseñas() {
  lista.innerHTML = "Cargando...";
  const reseñas = await obtenerReseñas(id); 
  lista.innerHTML = reseñas.length
    ? reseñas.map(r => `
        <div class="reseña-card">
          <p><strong>${r.usuario}</strong> (${r.rating}⭐)</p>
          <p>${r.texto}</p>
        </div>
      `).join("")
    : "<p>No hay reseñas aún. ¡Sé el primero en opinar!</p>";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!auth.currentUser) {
    alert("Debes iniciar sesión para publicar reseñas");
    return;
  }
  const texto = document.getElementById("reseña-texto").value.trim();
  const rating = document.getElementById("reseña-rating").value;

  if (!texto) return;

  await guardarReseña(
    id, // 🔑 referencia a la peli/serie/anime/música por su doc ID
    auth.currentUser.displayName || auth.currentUser.email,
    texto,
    rating
  );

  form.reset();
  cargarReseñas();
});

cargarItem();
