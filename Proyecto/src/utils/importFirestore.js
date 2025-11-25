import { db } from "../lib/firebase.js";
import { collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

export async function importJSONToCollection(nombreColeccion, archivo) {
  try {
    const texto = await archivo.text();
    const data = JSON.parse(texto);
    const colRef = collection(db, nombreColeccion);

    for (const item of data) {
      const { id, ...fields } = item;
      await setDoc(doc(colRef, id), fields, { merge: true });
      console.log(`📤 Subido: ${nombreColeccion}/${id}`);
    }

    alert(`✅ Importación completada (${data.length} documentos actualizados).`);
  } catch (error) {
    console.error("❌ Error al importar:", error);
    alert("Error al importar los datos.");
  }
}
