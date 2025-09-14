// ============================== IMPORTS ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ============================== CONFIG ==============================
const firebaseConfig = {
  apiKey: "AIzaSyDLQmuQftLwcaSZmedwVyja81LnNRYB1tg",
  authDomain: "culturax-54a1b.firebaseapp.com",
  projectId: "culturax-54a1b",
  storageBucket: "culturax-54a1b.firebasestorage.app",
  messagingSenderId: "994869052292",
  appId: "1:994869052292:web:02f993e57d3bc727e9d3d1"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ============================== REGISTRO ==============================
const registerForm = document.getElementById("register-form");
const registerMsg = document.getElementById("register-msg");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("register-email").value;
    const pass = document.getElementById("register-password").value;
    const pass2 = document.getElementById("password2").value;

    if (pass !== pass2) {
      registerMsg.textContent = "❌ Las contraseñas no coinciden";
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      registerMsg.textContent = "✅ Cuenta creada con éxito";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } catch (err) {
      registerMsg.textContent = "❌ Error: " + err.message;
    }
  });
}

// ============================== LOGIN ==============================
const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-msg");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-password").value;

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      loginMsg.textContent = "✅ Sesión iniciada con éxito";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (err) {
      loginMsg.textContent = "❌ Error: " + err.message;
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
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (err) {
      loginMsg.textContent = "❌ Error: " + err.message;
    }
  };
}

// ============================== LOGOUT ==============================
const logoutBtn = document.getElementById("logout");
if (logoutBtn) {
  logoutBtn.onclick = () => signOut(auth);
}

// ============================== ESTADO DE SESIÓN ==============================
const userP = document.getElementById("user");
onAuthStateChanged(auth, (user) => {
  if (user && userP) {
    userP.textContent = `Conectado: ${user.email || user.displayName}`;
    if (logoutBtn) logoutBtn.hidden = false;
  } else if (userP) {
    userP.textContent = "No conectado";
    if (logoutBtn) logoutBtn.hidden = true;
  }
});
