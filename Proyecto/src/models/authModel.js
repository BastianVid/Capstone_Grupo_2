// ============================== Auth Model ==============================
// Se encarga de autenticar usuarios con Firebase. No toca el DOM.

import { auth, googleProvider, currentUser } from '../lib/firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export const AuthModel = {
  // Retorna el usuario actual (o null si no hay sesión)
  getUser: () => currentUser,

  // Registro con email/contraseña y nombre opcional
  async register(email, pass, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    return cred.user;
  },

  // Login con email/contraseña
  async login(email, pass) {
    const { user } = await signInWithEmailAndPassword(auth, email, pass);
    return user;
  },

  // Login con Google
  async loginWithGoogle() {
    const { user } = await signInWithPopup(auth, googleProvider);
    return user;
  },

  // Logout
  async logout() {
    await signOut(auth);
  },
};
