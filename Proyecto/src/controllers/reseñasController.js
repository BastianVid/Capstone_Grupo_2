// ============================== IMPORTS ==============================
import {
  doc,
  getDoc,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db, auth } from "../lib/firebase.js";

// ============================== GUARDAR O ACTUALIZAR RESEÑA ==============================
/**
 * Guarda o actualiza una reseña en Firestore.
 * Si el usuario ya calificó antes, actualiza la reseña y recalcula el promedio.
 * Si es la primera vez, agrega una nueva reseña y suma un voto.
 */
export async function guardarReseña(categoria, itemId, estrellas, comentario) {
  const user = auth.currentUser;
  if (!user) {
    alert("⚠️ Debes iniciar sesión para dejar una reseña.");
    return;
  }

  const userId = user.uid;

  // ✅ Rutas corregidas (sin ñ)
  const itemRef = doc(db, categoria, itemId);
  const resenaRef = doc(itemRef, "resenas", userId);

  await runTransaction(db, async (tx) => {
    const itemSnap = await tx.get(itemRef);
    let totalVotos = 0;
    let promedio = 0;

    // Si el documento del ítem no existe, lo creamos
    if (!itemSnap.exists()) {
      tx.set(itemRef, {
        calificacionPromedio: estrellas,
        totalVotos: 1
      });

      tx.set(resenaRef, {
        userId,
        userEmail: user.email || null,
        estrellas,
        comentario,
        fecha: new Date().toISOString()
      });

      return;
    }

    // Datos actuales del ítem
    totalVotos = itemSnap.data().totalVotos || 0;
    promedio = itemSnap.data().calificacionPromedio || 0;

    const resenaSnap = await tx.get(resenaRef);

    if (resenaSnap.exists()) {
      // 🔁 Actualizar reseña existente
      const prevEstrellas = resenaSnap.data().estrellas;
      const nuevaSuma = promedio * totalVotos - prevEstrellas + estrellas;

      tx.update(itemRef, {
        calificacionPromedio: nuevaSuma / totalVotos
      });
    } else {
      // 🆕 Nueva reseña
      const nuevaSuma = promedio * totalVotos + estrellas;
      const nuevoTotal = totalVotos + 1;

      tx.update(itemRef, {
        calificacionPromedio: nuevaSuma / nuevoTotal,
        totalVotos: nuevoTotal
      });
    }

    // ✅ Guardar o actualizar la reseña
    tx.set(resenaRef, {
      userId,
      userEmail: user.email || null,
      estrellas,
      comentario,
      fecha: new Date().toISOString()
    });
  });
}

// ============================== OBTENER RESEÑA DE USUARIO ==============================
/**
 * Devuelve la reseña del usuario actual para un ítem específico (si existe)
 */
export async function obtenerReseñaUsuario(categoria, itemId) {
  const user = auth.currentUser;
  if (!user) return null;

  const userId = user.uid;
  // ✅ Ruta corregida (sin ñ)
  const resenaRef = doc(doc(db, categoria, itemId), "resenas", userId);
  const snap = await getDoc(resenaRef);
  return snap.exists() ? snap.data() : null;
}
