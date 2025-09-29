// ============================== IMPORTS (CDN ESM) ==============================
// Si no usas bundler, estos imports desde CDN funcionan perfecto con <script type="module">
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);

// Proveedor de Google (para login con Google)
export const googleProvider = new GoogleAuthProvider();

// Estado global simple de usuario (solo lectura desde otros módulos)
export let currentUser = null;
onAuthStateChanged(auth, (u) => { currentUser = u; });

// Nota:
// Este archivo NO maneja formularios ni toca el DOM.
// Solo inicializa Firebase y expone instancias/estado.
// Forms y UI → Views/Controllers. Acceso a datos → Models.
