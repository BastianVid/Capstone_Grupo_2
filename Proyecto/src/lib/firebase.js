// ============================== IMPORTS (CDN ESM) ==============================
// Todos los módulos usan la MISMA versión de Firebase (10.14.0)
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";

// ============================== CONFIG ==============================
const firebaseConfig = {
  apiKey: "AIzaSyDLQmuQftLwcaSZmedwVyja81LnNRYB1tg",
  authDomain: "culturax-54a1b.firebaseapp.com",
  projectId: "culturax-54a1b",
  storageBucket: "culturax-54a1b.firebasestorage.app",
  messagingSenderId: "994869052292",
  appId: "1:994869052292:web:02f993e57d3bc727e9d3d1"
};

// ============================== INIT (singleton) ==============================
// Evita re-inicializar Firebase si ya hay una instancia activa
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Instancias principales
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const storage = getStorage(app);

// ============================== GOOGLE PROVIDER ==============================
export const googleProvider = new GoogleAuthProvider();

// (Facebook deshabilitado)

// ============================== ESTADO GLOBAL ==============================
export let currentUser = null;
onAuthStateChanged(auth, (u) => {
  currentUser = u;
  if (u) {
    console.log(`👤 Usuario autenticado: ${u.email}`);
  } else {
    console.log("🚪 Usuario desconectado");
  }
});

// ============================== NOTA ==============================
// Este archivo solo inicializa Firebase y expone instancias compartidas.
// - NO maneja formularios ni el DOM.
// - La UI y lógica de negocio se manejan en las Views y Controllers.
// ================================================================
