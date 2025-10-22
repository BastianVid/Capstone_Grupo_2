// ============================== Auth Model ==============================
// Se encarga de autenticar usuarios con Firebase. No toca el DOM.

import { auth, googleProvider, currentUser } from '../lib/firebase.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

export const AuthModel = {
  // Retorna el usuario actual (o null si no hay sesión)
  getUser: () => currentUser,

  // Registro con email/contraseña y nombre opcional
  async register(email, pass, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    try { await sendEmailVerification(cred.user); } catch (e) {}
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

  // Send verification email to a logged-in user
  async sendVerificationEmail(user) {
    await sendEmailVerification(user);
  },

  // Reset password by email
  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  },

  // Get sign-in methods for an email (useful for duplicate/account linking UX)
  async getSignInMethods(email) {
    return fetchSignInMethodsForEmail(auth, email);
  },
};
