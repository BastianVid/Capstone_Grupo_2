// ============================== IMPORTS ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { 
  getFirestore, collection, addDoc, getDocs, getDoc, query, where, doc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================== CONFIG ==============================
const firebaseConfig = {
  apiKey: "AIzaSyDLQmuQftLwcaSZmedwVyja81LnNRYB1tg",
  authDomain: "culturax-54a1b.firebaseapp.com",
  projectId: "culturax-54a1b",
  storageBucket: "culturax-54a1b.firebasestorage.app",
  messagingSenderId: "994869052292",
  appId: "1:994869052292:web:02f993e57d3bc727e9d3d1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

// ============================== HELPERS ==============================
function marcarError(input) { input.classList.add("input-error"); }
function limpiarError(input) { input.classList.remove("input-error"); }

// ============================== REGISTRO ==============================
const registerForm = document.getElementById("register-form");
const registerMsg = document.getElementById("register-msg");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("register-email");
    const pass = document.getElementById("register-password");
    const pass2 = document.getElementById("password2");
    const usuario = document.getElementById("usuario")?.value?.trim();

    [email, pass, pass2].forEach(limpiarError);

    const strongPass = /^(?=.*[A-Z])(?=.*\d)(?=.*\.)[A-Za-z\d.]{8,}$/;

    if (pass.value !== pass2.value) {
      registerMsg.textContent = "❌ Las contraseñas no coinciden";
      marcarError(pass); marcarError(pass2);
      return;
    }

    if (!strongPass.test(pass.value)) {
      registerMsg.textContent = "⚠️ La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un punto (.)";
      marcarError(pass);
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.value, pass.value);
      if (usuario) {
        await updateProfile(cred.user, { displayName: usuario });
        await auth.currentUser.reload();
      }
      registerMsg.textContent = "✅ Cuenta creada con éxito";
      setTimeout(() => { window.location.href = "login.html"; }, 1500);
    } catch (err) {
      registerMsg.textContent = "❌ Error: " + err.message;
      marcarError(email);
    }
  });
}

// ============================== LOGIN ==============================
const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-msg");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email");
    const pass = document.getElementById("login-password");

    [email, pass].forEach(limpiarError);

    try {
      await signInWithEmailAndPassword(auth, email.value, pass.value);
      loginMsg.textContent = "✅ Sesión iniciada con éxito";
      setTimeout(() => { window.location.href = "index.html"; }, 1500);
    } catch (err) {
      loginMsg.textContent = "❌ Error: " + err.message;
      marcarError(email); marcarError(pass);
    }
  });
}

// ============================== LOGIN CON GOOGLE ==============================
const googleBtn = document.getElementById("google-login");
if (googleBtn) {
  googleBtn.onclick = async () => {
    try {
      await signInWithPopup(auth, provider);
      loginMsg.textContent = "✅ Sesión iniciada con Google";
      setTimeout(() => { window.location.href = "index.html"; }, 1500);
    } catch (err) {
      loginMsg.textContent = "❌ Error: " + err.message;
    }
  };
}

// ============================== LOGOUT ==============================
document.querySelectorAll("#logout").forEach((btn) => {
  btn.onclick = () => {
    localStorage.removeItem("usuario");
    signOut(auth);
  };
});

// ============================== ESTADO DE SESIÓN ==============================
const userBoxes   = document.querySelectorAll(".userbox");
const userSpans   = document.querySelectorAll("#user");
const logoutBtns  = document.querySelectorAll("#logout");
const loginBtns   = document.querySelectorAll("#login-btn");
const registerBtns= document.querySelectorAll("#register-btn");

const cachedUser = localStorage.getItem("usuario");
if (cachedUser) {
  userSpans.forEach(u => u.textContent = `Hola ${cachedUser}`);
  logoutBtns.forEach(b => b.style.display = "inline-block");
  loginBtns.forEach(b => b.style.display = "none");
  registerBtns.forEach(b => b.style.display = "none");
  userBoxes.forEach(b => b.style.visibility = "visible");
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    const nombre = user.displayName || user.email;
    localStorage.setItem("usuario", nombre);

    userSpans.forEach(u => u.textContent = `Hola ${nombre}`);
    logoutBtns.forEach(b => b.style.display = "inline-block");
    loginBtns.forEach(b => b.style.display = "none");
    registerBtns.forEach(b => b.style.display = "none");
  } else {
    localStorage.removeItem("usuario");

    userSpans.forEach(u => u.textContent = "No conectado");
    logoutBtns.forEach(b => b.style.display = "none");
    loginBtns.forEach(b => b.style.display = "inline-block");
    registerBtns.forEach(b => b.style.display = "inline-block");
  }

  userBoxes.forEach(b => b.style.visibility = "visible");
});

// ============================== FIRESTORE FUNCIONES ==============================
export async function obtenerPeliculas() {
  const snapshot = await getDocs(collection(db, "peliculas"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function obtenerPelicula(id) {
  const ref = doc(db, "peliculas", id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function obtenerItem(tipo, id) {
  const ref = doc(db, tipo, id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function guardarReseña(peliculaId, usuario, texto, rating) {
  return await addDoc(collection(db, "reseñas"), {
    pelicula: peliculaId,
    usuario,
    texto,
    rating: parseInt(rating),
    fecha: new Date()
  });
}

export async function obtenerReseñas(peliculaId) {
  try {
    const q = query(collection(db, "reseñas"), where("pelicula", "==", peliculaId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("❌ Error al obtener reseñas:", err.message);
    return [];
  }
}
