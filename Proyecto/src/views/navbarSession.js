// src/views/navbarSession.js
import { auth } from '../lib/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { isAdmin, isAdminFlexible } from "../controllers/authController.js"; // 👈 añadimos esto

let subscribed = false;

/**
 * Sincroniza el estado de sesión con el navbar actual
 */
export async function updateNavbarSessionUI() {
  const user = auth.currentUser;

  const loginBtn = document.getElementById('loginSignupBtn');
  const userMenu = document.getElementById('userMenu');
  const nameEl   = document.getElementById('navUserName');
  const emailEl  = document.getElementById('navUserEmail');
  const menuList = userMenu?.querySelector('.dropdown-menu');
  // No hagas early return por name/email; permite mostrar el botón Admin aunque falten
  if (!loginBtn || !userMenu) return;

  if (user) {
    const displayName =
      user.displayName ||
      (user.email ? user.email.split('@')[0] : null) ||
      'Mi cuenta';

    if (nameEl)  nameEl.textContent  = displayName;
    if (emailEl) emailEl.textContent = user.email || '';

    loginBtn?.classList.add('d-none');
    userMenu?.classList.remove('d-none');

    // Verificamos si el usuario es admin (flexible: por uid o por email)
    let admin = false;
    try {
      admin = await (typeof isAdminFlexible === 'function' ? isAdminFlexible() : isAdmin());
    } catch {
      try { admin = await isAdmin(); } catch { admin = false; }
    }

    // Mostrar/ocultar link Admin en el menú
    if (menuList) {
      const existing = menuList.querySelector('#adminLink');
      if (admin && !existing) {
        const li = document.createElement('li');
        li.innerHTML = `
          <a id="adminLink" class="dropdown-item" href="#/admin">
            <i class="bi bi-speedometer2"></i> Dashboard
          </a>
        `;
        const dividerLi = menuList.querySelector('.dropdown-divider')?.closest('li');
        if (dividerLi && dividerLi.parentElement === menuList) {
          menuList.insertBefore(li, dividerLi);
        } else {
          menuList.appendChild(li);
        }
      } else if (!admin && existing) {
        // Eliminar el li contenedor del enlace si existe
        const li = existing.closest('li');
        if (li && li.parentElement === menuList) li.remove();
        else existing.remove();
      }
    }

    // El acceso a Admin se muestra solo dentro del menú (no hay botón aparte)
  } else {
    // Estado no autenticado
    if (nameEl)  nameEl.textContent  = 'Mi cuenta';
    if (emailEl) emailEl.textContent = '';

    userMenu?.classList.add('d-none');
    loginBtn?.classList.remove('d-none');
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


