// ============================== IMPORTS ==============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  updateProfile
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

// ============================== HELPERS ==============================
function marcarError(input) {
  input.classList.add("input-error");
}

function limpiarError(input) {
  input.classList.remove("input-error");
}

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

    let hayError = false;

    // reset de estilos
    [email, pass, pass2].forEach(limpiarError);

    const strongPass = /^(?=.*[A-Z])(?=.*\d)(?=.*\.)[A-Za-z\d.]{8,}$/;

    if (pass.value !== pass2.value) {
      registerMsg.textContent = "❌ Las contraseñas no coinciden";
      marcarError(pass);
      marcarError(pass2);
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
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
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

    // reset de estilos
    [email, pass].forEach(limpiarError);

    try {
      await signInWithEmailAndPassword(auth, email.value, pass.value);
      loginMsg.textContent = "✅ Sesión iniciada con éxito";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } catch (err) {
      loginMsg.textContent = "❌ Error: " + err.message;
      marcarError(email);
      marcarError(pass);
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
    userP.textContent = `Hola ${user.displayName || user.email}`;
    if (logoutBtn) logoutBtn.hidden = false;
  } else if (userP) {
    userP.textContent = "No conectado";
    if (logoutBtn) logoutBtn.hidden = true;
  }
});
