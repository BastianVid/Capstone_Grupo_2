import { render, mount } from './render.js';
import { authGuard } from '../controllers/authController.js';

// Importa aquí las vistas que tengas creadas

import { HomeView } from '../views/homeView.js';
import { LoginView } from '../views/loginView.js';
import { RegistroView } from '../views/registroView.js';
import { PeliculasView } from '../views/peliculasView.js';
import { AnimeView } from '../views/animeView.js';
import { MusicaView } from '../views/musicaView.js';
import { SeriesView } from '../views/seriesView.js';

// (Opcional) Vista 404 si luego quieres una página de no-encontrado
const NotFoundView = () => ({
  html: `
    <div class="container py-5">
      <h1 class="h3 mb-2">404</h1>
      <p class="text-secondary">La página que buscas no existe.</p>
      <a class="btn btn-dark mt-3" href="#/">Volver al inicio</a>
    </div>
  `,
  bind(){},
  title: 'No encontrado • CulturaX',
});

// Tabla de rutas (hash-based)
const routes = {
  '/':          { view: HomeView,    secure: false,  title: 'Inicio • CulturaX' },
  '/series':    { view: SeriesView,  secure: false,  title: 'Series • CulturaX' },
  '/login':     { view: LoginView,   secure: false, title: 'Iniciar sesión • CulturaX' },
  '/registro':  { view: RegistroView,secure: false, title: 'Registro • CulturaX' },
  '/404':       { view: NotFoundView,secure: false, title: 'No encontrado • CulturaX' },
  '/peliculas': { view: PeliculasView,secure: false,  title: 'Películas • CulturaX' },
  '/anime':     { view: AnimeView,    secure: false,  title: 'Anime • CulturaX' },
  '/musica':    { view: MusicaView,   secure: false,  title: 'Música • CulturaX' },
};

// Normaliza el hash a un path conocido
function getPathFromHash() {
  const raw = (location.hash || '').trim();
  const path = raw.startsWith('#') ? raw.slice(1) : raw;
  return path || '/';
}

// Pinta la ruta actual
function resolve() {
  const path = getPathFromHash();
  const route = routes[path] || routes['/404'];

  // Protege rutas seguras
  if (route.secure && !authGuard()) {
    navigate('/login');
    return;
  }

  // Renderiza la vista
  const { html, bind, title } = route.view();
  render(html);
  mount(bind);

  // Título del documento
  document.title = title || route.title || 'CulturaX';

  // Marca el link activo del navbar (si existe)
  highlightActiveLink(path);
}

// Navegación programática
export function navigate(path) {
  if (!path.startsWith('/')) path = `/${path}`;
  if (`#${path}` !== location.hash) {
    location.hash = `#${path}`;
  } else {
    // Si navegas a la misma ruta, fuerza render
    resolve();
  }
}

// Marca activo el link actual del navbar
function highlightActiveLink(currentPath) {
  const links = document.querySelectorAll('.navbar a.nav-link');
  links.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const hrefPath = href.startsWith('#') ? href.slice(1) : href;
    a.classList.toggle('active', hrefPath === currentPath);
  });
}

// Inicializa listeners del router
export function initRouter() {
  window.addEventListener('hashchange', resolve, { passive: true });
  window.addEventListener('load', resolve, { passive: true });

  // Si el usuario entra sin hash, envíalo a "/"
  if (!location.hash) navigate('/');
}
