// ============================== IMPORTS ==============================
import {
  doc,
  getDoc,
  runTransaction,
  setDoc,
  collection
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { db, auth } from "../lib/firebase.js";

// ============================== GUARDAR O ACTUALIZAR RESEÑA ==============================
export async function guardarReseña(categoria, itemId, estrellas, comentario) {
  const user = auth.currentUser;
  if (!user) {
    alert("⚠️ Debes iniciar sesión para dejar una reseña.");
    return;
  }

  const userId = user.uid;
  const itemRef = doc(db, categoria, itemId);
  const resenaRef = doc(db, categoria, itemId, "resenas", userId);

  console.log("🟢 Guardando reseña en:", `${categoria}/${itemId}/resenas/${userId}`);

  await runTransaction(db, async (tx) => {
    const itemSnap = await tx.get(itemRef);
    let totalVotos = 0;
    let promedio = 0;

    if (!itemSnap.exists()) {
      tx.set(itemRef, {
        calificacionPromedio: estrellas,
        totalVotos: 1
      });
    } else {
      totalVotos = itemSnap.data().totalVotos || 0;
      promedio = itemSnap.data().calificacionPromedio || 0;

      const resenaSnap = await tx.get(resenaRef);

      if (resenaSnap.exists()) {
        const prevEstrellas = resenaSnap.data().estrellas;
        const nuevaSuma = promedio * totalVotos - prevEstrellas + estrellas;
        tx.update(itemRef, {
          calificacionPromedio: nuevaSuma / totalVotos
        });
      } else {
        const nuevaSuma = promedio * totalVotos + estrellas;
        const nuevoTotal = totalVotos + 1;
        tx.update(itemRef, {
          calificacionPromedio: nuevaSuma / nuevoTotal,
          totalVotos: nuevoTotal
        });
      }
    }

    // ✅ Guardar o actualizar la reseña principal
    tx.set(resenaRef, {
      userId,
      userEmail: user.email || null,
      estrellas,
      comentario,
      fecha: new Date().toISOString()
    });
  });

  // ============================== REGISTRO GLOBAL ==============================
  try {
    const itemSnap = await getDoc(itemRef);
    const itemData = itemSnap.exists() ? itemSnap.data() : {};

    const obraTitulo = itemData.titulo || itemData.title || "Sin título";
    const obraImg = itemData.imagen || itemData.img || "";

    const uniqueId = `${userId}_${categoria}_${itemId}`;
    const globalRef = doc(db, "userResenas", uniqueId);

    await setDoc(globalRef, {
      userId,
      categoria,
      obraId: itemId,
      obraTitulo,
      obraImg,
      estrellas,
      comentario,
      fecha: new Date().toISOString()
    });

    console.log("✅ Reseña registrada en /userResenas con ID:", uniqueId);
  } catch (error) {
    console.error("❌ Error al registrar reseña global:", error);
  }
}

// ============================== OBTENER RESEÑA DE USUARIO ==============================
export async function obtenerReseñaUsuario(categoria, itemId) {
  const user = auth.currentUser;
  if (!user) return null;

  const userId = user.uid;
  const resenaRef = doc(db, categoria, itemId, "resenas", userId);
  const snap = await getDoc(resenaRef);

  return snap.exists() ? snap.data() : null;
}
