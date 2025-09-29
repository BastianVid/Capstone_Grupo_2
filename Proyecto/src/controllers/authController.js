import { AuthModel } from '../models/authModel.js';

// ✅ Revisa si hay usuario logueado
export const authGuard = () => !!AuthModel.getUser();

// ✅ Iniciar sesión con email/contraseña
export async function login(email, pass) {
  const user = await AuthModel.login(email, pass);
  if (user) {
    location.hash = '#/'; // redirige al home
  }
  return user;
}

// ✅ Registro de usuario
export async function register(email, pass, displayName) {
  const user = await AuthModel.register(email, pass, displayName);
  if (user) {
    location.hash = '#/'; // redirige al home
  }
  return user;
}

// ✅ Login con Google
export async function loginGoogle() {
  const user = await AuthModel.loginWithGoogle();
  if (user) {
    location.hash = '#/'; // redirige al home
  }
  return user;
}

// ✅ Cerrar sesión
export async function logout() {
  await AuthModel.logout();
  location.hash = '#/login'; // redirige al login
}
