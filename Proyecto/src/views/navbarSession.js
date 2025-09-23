import { auth } from '../lib/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let subscribed = false;

export function updateNavbarSessionUI() {
  const user = auth.currentUser;

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

/** Llama esto una vez por vista (tras render) para mantener el navbar sincronizado */
export function initNavbarSessionWatcher() {
  if (subscribed) return;
  subscribed = true;
  onAuthStateChanged(auth, () => updateNavbarSessionUI());
}
