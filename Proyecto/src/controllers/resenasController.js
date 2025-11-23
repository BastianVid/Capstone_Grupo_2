// ============================== IMPORTS ==============================
import {
  doc,
  getDoc,
  runTransaction,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { db, auth } from "../lib/firebase.js";
import { UserModel } from "../models/userModel.js";

// ============================== GUARDAR O ACTUALIZAR RESENA ==============================
export async function guardarResena(categoria, itemId, estrellas, comentario) {
  const user = auth.currentUser;
  if (!user) { alert("Debes iniciar sesion para dejar una resena."); return; }

  const userId = user.uid;
  const profile = await UserModel.ensureProfile(user).catch(() => null);
  const userName = profile?.username || user.displayName || (user.email ? user.email.split("@")[0] : "Usuario");
  const itemRef = doc(db, categoria, itemId);
  const resenaRef = doc(db, categoria, itemId, "resenas", userId);
  const globalRef = doc(db, "userResenas", `${userId}_${categoria}_${itemId}`);

  await runTransaction(db, async (tx) => {
    const itemSnap = await tx.get(itemRef);
    let totalVotos = 0;
    let promedio = 0;

    if (!itemSnap.exists()) {
      tx.set(itemRef, { calificacionPromedio: estrellas, totalVotos: 1 });
    } else {
      totalVotos = itemSnap.data().totalVotos || 0;
      promedio = itemSnap.data().calificacionPromedio || 0;

      const resenaSnap = await tx.get(resenaRef);
      if (resenaSnap.exists()) {
        const prevEstrellas = resenaSnap.data().estrellas;
        const nuevaSuma = promedio * totalVotos - prevEstrellas + estrellas;
        tx.update(itemRef, { calificacionPromedio: nuevaSuma / totalVotos });
      } else {
        const nuevaSuma = promedio * totalVotos + estrellas;
        const nuevoTotal = totalVotos + 1;
        tx.update(itemRef, { calificacionPromedio: nuevaSuma / nuevoTotal, totalVotos: nuevoTotal });
      }
    }

    // Guardar o actualizar resena del usuario
    tx.set(resenaRef, {
      userId,
      userName,
      userEmail: user.email || null,
      estrellas,
      comentario,
      fecha: new Date().toISOString(),
    });
  });

  // Registro global (para el perfil)
  try {
    const itemSnap = await getDoc(itemRef);
    const itemData = itemSnap.exists() ? itemSnap.data() : {};
    const obraTitulo = itemData.titulo || itemData.title || "Sin titulo";
    const obraImg = itemData.imagen || itemData.img || "";

    await setDoc(globalRef, {
      userId,
      userName,
      userEmail: user.email || null,
      categoria,
      obraId: itemId,
      obraTitulo,
      obraImg,
      estrellas,
      comentario,
      fecha: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error al registrar resena global:", error);
  }
}

// ============================== OBTENER RESENA DE USUARIO ==============================
export async function obtenerResenaUsuario(categoria, itemId) {
  const user = auth.currentUser;
  if (!user) return null;
  const resenaRef = doc(db, categoria, itemId, "resenas", user.uid);
  const snap = await getDoc(resenaRef);
  return snap.exists() ? snap.data() : null;
}

// ============================== ELIMINAR RESENA ==============================
export async function eliminarResena(categoria, itemId) {
  const user = auth.currentUser;
  if (!user) return;

  const resenaRef = doc(db, categoria, itemId, "resenas", user.uid);
  const globalRef = doc(db, "userResenas", `${user.uid}_${categoria}_${itemId}`);

  try {
    await deleteDoc(resenaRef);
    await deleteDoc(globalRef);

    // Recalcular promedio
    const resenasSnap = await getDocs(collection(db, categoria, itemId, "resenas"));
    let total = 0, suma = 0;
    resenasSnap.forEach((d) => { const data = d.data(); suma += data.estrellas; total++; });
    const nuevoPromedio = total ? suma / total : 0;
    await setDoc(doc(db, categoria, itemId), { calificacionPromedio: nuevoPromedio, totalVotos: total }, { merge: true });
  } catch (error) {
    console.error("Error al eliminar resena:", error);
  }
}
