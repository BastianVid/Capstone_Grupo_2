// ============================== Content Model ==============================
// Maneja el acceso a datos en Firestore (series, películas, anime, música, reseñas)

import { db } from '../lib/firebase.js';
import {
  collection, addDoc, getDocs, getDoc, query, where, doc,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 🔹 Función genérica: lee cualquier colección (ej: "peliculas", "anime")
async function readCollection(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// 🔹 Función genérica: obtiene un documento por id
async function readItem(name, id) {
  const ref = doc(db, name, id);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() }) : null;
}

// 🔹 Reseñas
async function addReview({ peliculaId, usuario, texto, rating }) {
  return await addDoc(collection(db, 'reseñas'), {
    pelicula: peliculaId,
    usuario,
    texto,
    rating: parseInt(rating, 10),
    fecha: new Date(),
  });
}

async function listReviewsByPelicula(peliculaId) {
  const q = query(collection(db, 'reseñas'), where('pelicula', '==', peliculaId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ============================== EXPORT ==============================
export const ContentModel = {
  // Colecciones principales
  listSeries:       () => readCollection('series'),
  listPeliculas:    () => readCollection('peliculas'),
  listAnime:        () => readCollection('anime'),
  listMusica:       () => readCollection('musica'),

  // 🔹 NUEVO
  listVideojuegos:  () => readCollection('videojuegos'),
  listLibros:       () => readCollection('libros'),

  // Items individuales
  getPelicula: (id) => readItem('peliculas', id),
  getItem:     (tipo, id) => readItem(tipo, id),

  // Reseñas
  addReview,
  listReviewsByPelicula,
};
