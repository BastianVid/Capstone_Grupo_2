// src/views/navbarSession.js
import { auth } from '../lib/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

let subscribed = false;

/**
 * Sincroniza el estado de sesión con el navbar actual
 */
export function updateNavbarSessionUI() {
  const user = auth.currentUser;

  const loginBtn = document.getElementById('loginSignupBtn');
  const userMenu = document.getElementById('userMenu');
  const nameEl   = document.getElementById('navUserName');
  const emailEl  = document.getElementById('navUserEmail');

  if (!loginBtn || !userMenu || !nameEl || !emailEl) return;

  if (user) {
    const displayName =
      user.displayName ||
      (user.email ? user.email.split('@')[0] : null) ||
      'Mi cuenta';

    nameEl.textContent  = displayName;
    emailEl.textContent = user.email || '';

    loginBtn.classList.add('d-none');
    userMenu.classList.remove('d-none');
  } else {
    // Estado no autenticado
    nameEl.textContent  = 'Mi cuenta';
    emailEl.textContent = '';

    userMenu.classList.add('d-none');
    loginBtn.classList.remove('d-none');
  }
}

/** Llama esto una vez por vista tras renderizar el navbar */
export function initNavbarSessionWatcher() {
  if (subscribed) return;
  subscribed = true;
  onAuthStateChanged(auth, updateNavbarSessionUI);

  // 🔹 Listener global del buscador del Navbar
  document.addEventListener("submit", (e) => {
    if (e.target.id === "siteSearch") {
      e.preventDefault();
      const query = document.getElementById("siteSearchInput").value.trim().toLowerCase();
      window.dispatchEvent(new CustomEvent("globalSearch", { detail: { query } }));
    }
  });
}