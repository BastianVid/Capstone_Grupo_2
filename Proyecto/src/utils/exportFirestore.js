import { db } from "../lib/firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

export async function exportCollectionToJSON(nombreColeccion) {
  try {
    const colRef = collection(db, nombreColeccion);
    const snapshot = await getDocs(colRef);
    const data = [];

    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nombreColeccion}_export.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log(`✅ Exportación completa: ${data.length} documentos de ${nombreColeccion}`);
  } catch (error) {
    console.error("❌ Error al exportar:", error);
  }
}
