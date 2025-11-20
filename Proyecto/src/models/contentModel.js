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
async function listResenasByUser(uid, limitCount = 20) {
  if (!uid) return [];
  const categorias = [
    "peliculas",
    "series",
    "anime",
    "musica",
    "libros",
    "documentales",
    "videojuegos",
    "manga",
  ];
  const results = [];
  try {
    for (const cat of categorias) {
      const catSnap = await getDocs(collection(db, cat));
      for (const docItem of catSnap.docs) {
        const obraData = docItem.data() || {};
        const resenasRef = collection(db, cat, docItem.id, "resenas");
        const qUser = query(resenasRef, where("userId", "==", uid));
        const snap = await getDocs(qUser);
        snap.forEach((d) =>
          results.push({
            id: d.id,
            categoria: cat,
            obraId: docItem.id,
            obraTitulo: obraData.titulo ?? obraData.title ?? "Sin título",
            obraImg: obraData.imagen ?? obraData.img ?? "",
            ...d.data(),
          })
        );
      }
    }

    return results
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
      .slice(0, limitCount);
  } catch (err) {
    console.error("⚠️ Error al leer reseñas completas del usuario:", err);
    return [];
  }
}

async function listUserResenasQuick(uid, limitCount = 20) {
  if (!uid) return [];
  try {
    const colRef = collection(db, "userResenas");
    const snap = await getDocs(query(colRef, where("userId", "==", uid)));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
      .slice(0, limitCount);
  } catch (err) {
    console.error("⚠️ Error al listar reseñas del usuario desde userResenas:", err);
    return [];
  }
}

async function listCommunityResenas(limitCount = 40) {
  try {
    const snap = await getDocs(collection(db, "userResenas"));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
      .slice(0, limitCount);
  } catch (err) {
    console.error("⚠️ Error al listar reseñas globales:", err);
    return [];
  }
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
  listUserResenasQuick,
  listCommunityResenas,
};
