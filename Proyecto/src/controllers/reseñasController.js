// ============================== IMPORTS ==============================
import {
  doc,
  getDoc,
  runTransaction,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs
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
  const globalRef = doc(db, "userResenas", `${userId}_${categoria}_${itemId}`);

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

    // ✅ Guardar o actualizar reseña
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

    console.log("✅ Reseña registrada en /userResenas con ID:", globalRef.id);
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

// ============================== ELIMINAR RESEÑA (completa) ==============================
export async function eliminarReseña(categoria, itemId) {
  const user = auth.currentUser;
  if (!user) return;

  const userId = user.uid;
  const resenaRef = doc(db, categoria, itemId, "resenas", userId);
  const globalRef = doc(db, "userResenas", `${userId}_${categoria}_${itemId}`);

  try {
    // 🔥 Eliminar de subcolección de la obra
    await deleteDoc(resenaRef);
    console.log("🗑️ Eliminada reseña de la obra:", resenaRef.path);

    // 🔥 Eliminar del registro global del usuario
    await deleteDoc(globalRef);
    console.log("🗑️ Eliminada reseña global:", globalRef.path);

    // 🔁 Recalcular el promedio
    const resenasSnap = await getDocs(collection(db, categoria, itemId, "resenas"));
    let total = 0, suma = 0;
    resenasSnap.forEach((docSnap) => {
      const data = docSnap.data();
      suma += data.estrellas;
      total++;
    });

    const nuevoPromedio = total ? suma / total : 0;
    await setDoc(doc(db, categoria, itemId), {
      calificacionPromedio: nuevoPromedio,
      totalVotos: total
    }, { merge: true });

    console.log("🔄 Promedio actualizado correctamente.");
  } catch (error) {
    console.error("❌ Error al eliminar reseña:", error);
  }
}
