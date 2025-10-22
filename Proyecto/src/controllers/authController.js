import { AuthModel } from '../models/authModel.js';

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
    location.hash = '#/'; // redirige al home
  }
  return user;
}

// Registro de usuario
export async function register(email, pass, displayName) {
  const user = await AuthModel.register(email, pass, displayName);
  if (user) {
    try { sessionStorage.setItem('cx:verify-pending', '1'); } catch {}
    try { sessionStorage.setItem('cx:verify-email', email); } catch {}
    try { await AuthModel.logout(); } catch {}
    location.hash = '#/login'; // pedir verificacion e ir al login
  }
  return user;
}

// Login con Google
export async function loginGoogle() {
  try {
    const user = await AuthModel.loginWithGoogle();
    if (user) {
      location.hash = '#/'; // redirige al home
    }
    return user;
  } catch (err) {
    // Superficie códigos comunes para la UI
    // - auth/account-exists-with-different-credential
    // - auth/popup-closed-by-user, auth/cancelled-popup-request
    throw err;
  }
}

// (Facebook eliminado)

// Cerrar sesión
export async function logout() {
  await AuthModel.logout();
  location.hash = '#/login'; // redirige al login
}

// Restablecer contraseña por email
export async function resetPassword(email) {
  await AuthModel.resetPassword(email);
}
