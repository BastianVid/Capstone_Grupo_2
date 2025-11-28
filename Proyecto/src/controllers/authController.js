import { AuthModel } from '../models/authModel.js';
import { UserModel } from '../models/userModel.js';
import { db, auth } from "../lib/firebase.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { updateProfile, deleteUser } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// Revisa si hay usuario logueado
export const authGuard = () => !!AuthModel.getUser();

// Iniciar sesión con email/contraseña
export async function login(email, pass) {
  const user = await AuthModel.login(email, pass);
  if (user) {
    if (!user.emailVerified) {
      try { await AuthModel.sendVerificationEmail(user); } catch {}
      await AuthModel.logout();
      const err = new Error('Email no verificado');
      err.code = 'auth/email-not-verified';
      throw err;
    }
    try { await UserModel.ensureProfile(user); } catch {}
    location.hash = '#/';
  }
  return user;
}

// Registro de usuario (con username único)
export async function register(email, pass, nombre, username) {
  const displayName = username || nombre;
  let user = null;
  try {
    user = await AuthModel.register(email, pass, displayName);
    if (user) {
      const profile = await UserModel.ensureProfile(user, { username, nombre, email });
      if (profile?.username && user.displayName !== profile.username) {
        try { await updateProfile(user, { displayName: profile.username }); } catch {}
      }
      try { sessionStorage.setItem('cx:verify-pending', '1'); } catch {}
      try { sessionStorage.setItem('cx:verify-email', email); } catch {}
      try { await AuthModel.logout(); } catch {}
      location.hash = '#/login'; // pedir verificacion e ir al login
    }
    return user;
  } catch (err) {
    if (user && err?.code === 'USERNAME_TAKEN') {
      try { await deleteUser(user); } catch {}
    }
    throw err;
  }
}

// Login con Google
export async function loginGoogle() {
  try {
    const user = await AuthModel.loginWithGoogle();
    if (user) {
      const profile = await UserModel.ensureProfile(user, {
        username: user.displayName,
        nombre: user.displayName,
        email: user.email,
      });
      if (profile?.username && user.displayName !== profile.username) {
        try { await updateProfile(user, { displayName: profile.username }); } catch {}
      }
      location.hash = '#/';
    }
    return user;
  } catch (err) {
    // Superficie códigos comunes para la UI
    // - auth/account-exists-with-different-credential
    // - auth/popup-closed-by-user, auth/cancelled-popup-request
    throw err;
  }
}

// Cerrar sesión
export async function logout() {
  await AuthModel.logout();
  location.hash = '#/'; // redirige al login
}

// Restablecer contraseña por email
export async function resetPassword(email) {
  await AuthModel.resetPassword(email);
}

// Verificación de administrador 
export async function isAdmin() {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const ref = doc(db, "admins", user.uid);
    const snap = await getDoc(ref);
    return snap.exists(); // Si existe el documento, el usuario es admin
  } catch (error) {
    console.error("Error verificando admin:", error);
    return false;
  }
}

// Guard para rutas de administrador: devuelve { ok, redirect? }
export async function adminOnly() {
  const user = auth.currentUser;
  if (!user) {
    return { ok: false, redirect: '/login' };
  }
  try {
    const admin = await (typeof isAdminFlexible === "function" ? isAdminFlexible() : isAdmin());
    return admin ? { ok: true } : { ok: false, redirect: '/' };
  } catch (_) {
    return { ok: false, redirect: '/' };
  }
}

// Variante flexible: acepta doc con ID = uid o doc con campo email == user.email
export async function isAdminFlexible() {
  const user = auth.currentUser;
  if (!user) return false;
  try {
    const byId = await getDoc(doc(db, "admins", user.uid));
    if (byId.exists()) return true;
    if (user.email) {
      const qs = await getDocs(query(collection(db, "admins"), where("email", "==", user.email)));
      return !qs.empty;
    }
    return false;
  } catch (e) {
    console.error("Error verificando admin (flex):", e);
    return false;
  }
}
