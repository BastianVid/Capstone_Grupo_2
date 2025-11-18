// ============================== Content Model ==============================
// Maneja el acceso a datos en Firestore (series, películas, anime, música, libros, etc.)

import { db } from "../lib/firebase.js";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ============================== NORMALIZACIÓN ==============================
function normalizeItem(item) {
  return {
    ...item,
    plataformaStreaming: Array.isArray(item.plataformaStreaming)
      ? item.plataformaStreaming
      : [],

    genero: Array.isArray(item.genero)
      ? item.genero
      : [],

    descripcion: item.descripcion || "",
    titulo: item.titulo || "",
    imagen: item.imagen || "",
  };
}

// ============================== FUNCIONES BASE ==============================

// 🔹 Leer una colección completa (ej: "peliculas", "anime", "series")
async function readCollection(name) {
  try {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map((d) => normalizeItem({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error(`❌ Error al leer colección "${name}":`, err);
    return [];
  }
}

// 🔹 Leer un documento por ID
async function readItem(name, id) {
  try {
    const ref = doc(db, name, id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return null;

    return normalizeItem({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error(`❌ Error al leer ${name}/${id}:`, err);
    return null;
  }
}

// ============================== FUNCIONES ESPECÍFICAS ==============================

// 🔹 Listar reseñas de un ítem (según el nuevo esquema /categoria/item/resenas)
async function listResenas(categoria, itemId) {
  try {
    const colRef = collection(db, categoria, itemId, "resenas");
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error(`❌ Error al listar reseñas de ${categoria}/${itemId}:`, err);
    return [];
  }
}

// 🔹 Listar reseñas por usuario (opcional)
async function listResenasByUser(uid) {
  const categorias = ["peliculas", "series", "anime", "musica", "libros"];
  const results = [];

  for (const cat of categorias) {
    const catSnap = await getDocs(collection(db, cat));
    for (const docItem of catSnap.docs) {
      const resenasRef = collection(db, cat, docItem.id, "resenas");
      const q = query(resenasRef, where("userId", "==", uid));
      const snap = await getDocs(q);
      snap.forEach((d) =>
        results.push({ categoria: cat, id: docItem.id, ...d.data() })
      );
    }
  }

  return results;
}

// ============================== EXPORT ==============================
export const ContentModel = {
  // Colecciones principales
  listSeries:         () => readCollection("series"),
  listPeliculas:      () => readCollection("peliculas"),
  listAnime:          () => readCollection("anime"),
  listMusica:         () => readCollection("musica"),
  listLibros:         () => readCollection("libros"),
  listVideojuegos:    () => readCollection("videojuegos"),
  listManga:          () => readCollection("manga"),
  listDocumentales:   () => readCollection("documentales"),

  // Genéricas para admin
  listCollection:       (name) => readCollection(name),
  addToCollection:      async (name, data) => {
    const ref = await addDoc(collection(db, name), data);
    return ref.id;
  },
  setInCollection:      (name, id, data) => setDoc(doc(db, name, id), data),
  updateInCollection:   (name, id, data) => updateDoc(doc(db, name, id), data),
  deleteFromCollection: (name, id) => deleteDoc(doc(db, name, id)),

  // Items individuales
  getPelicula: (id) => readItem("peliculas", id),
  getItem:     (tipo, id) => readItem(tipo, id),

  // Reseñas (nueva estructura)
  listResenas,
  listResenasByUser,
};
