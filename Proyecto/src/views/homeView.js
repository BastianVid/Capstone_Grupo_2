import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher  } from './navbarSession.js';



export function HomeView() {
  const html = `
    ${Navbar()}
    <header class="cx-hero my-4 container">
      <h2>Bienvenido a CulturaX</h2>
      <p>Tu comunidad para descubrir, compartir y opinar sobre cultura.</p>
      <div class="d-flex gap-2 justify-content-center">
        <a class="btn btn-primary btn-sm" href="#/registro">Únete ahora</a>
        <a class="btn btn-outline-light btn-sm" href="#/login">Inicia sesión</a>
      </div>
    </header>
  `;
  return { html, bind() {
  initNavbarSessionWatcher();
  updateNavbarSessionUI();
  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    const { logout } = await import('../controllers/authController.js');
    logout();
  });
}};
}
