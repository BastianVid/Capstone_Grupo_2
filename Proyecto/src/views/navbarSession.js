// /src/views/navbarSession.js
import { currentUser } from '../lib/firebase.js';

export function updateNavbarSessionUI() {
  const user = currentUser;
  const span = document.getElementById('userSpan');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!span || !loginBtn || !registerBtn || !logoutBtn) return;

  if (user) {
    span.textContent = user.displayName || user.email || 'Usuario';
    span.classList.remove('d-none');
    logoutBtn.classList.remove('d-none');
    loginBtn.classList.add('d-none');
    registerBtn.classList.add('d-none');
  } else {
    span.classList.add('d-none');
    logoutBtn.classList.add('d-none');
    loginBtn.classList.remove('d-none');
    registerBtn.classList.remove('d-none');
  }
}
