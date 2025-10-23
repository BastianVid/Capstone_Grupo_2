import { render, mount } from './render.js';
import { authGuard } from '../controllers/authController.js';

// Importa las vistas
import { HomeView } from '../views/homeView.js';
import { LoginView } from '../views/loginView.js';
import { RegistroView } from '../views/registroView.js';
import { PeliculasView } from '../views/peliculasView.js';
import { AnimeView } from '../views/animeView.js';
import { MusicaView } from '../views/musicaView.js';
import { SeriesView } from '../views/seriesView.js';
import { VideojuegosView } from '../views/videojuegosView.js';
import { LibrosView } from '../views/librosView.js';
import { DetalleView } from '../views/detalleView.js';
import { PerfilView } from '../views/perfilView.js';
import { BuscarView } from '../views/buscarView.js'; 
import { MangaView } from '../views/mangaView.js';
import { DocumentalesView } from '../views/documentalesView.js';

// (Opcional) Vista 404
const NotFoundView = () => ({
  html: `
    <div class="container py-5">
      <h1 class="h3 mb-2">404</h1>
      <p class="text-secondary">La página que buscas no existe.</p>
      <a class="btn btn-dark mt-3" href="#/">Volver al inicio</a>
    </div>
  `,
  bind() {},
  title: 'No encontrado • CulturaX',
});

// Tabla de rutas (hash-based)
const routes = {
  '/':                { view: HomeView,         secure: false, title: 'Inicio • CulturaX' },
  '/peliculas':       { view: PeliculasView,    secure: false, title: 'Películas • CulturaX' },
  '/series':          { view: SeriesView,       secure: false, title: 'Series • CulturaX' },
  '/anime':           { view: AnimeView,        secure: false, title: 'Anime • CulturaX' },
  '/musica':          { view: MusicaView,       secure: false, title: 'Música • CulturaX' },
  '/videojuegos':     { view: VideojuegosView,  secure: false, title: 'Videojuegos • CulturaX' },
  '/libros':          { view: LibrosView,       secure: false, title: 'Libros • CulturaX' },
  '/login':           { view: LoginView,        secure: false, title: 'Iniciar sesión • CulturaX' },
  '/registro':        { view: RegistroView,     secure: false, title: 'Registro • CulturaX' },
  '/detalle':         { view: DetalleView,      secure: false, title: 'Detalle • CulturaX' },
  '/perfil':          { view: PerfilView,       secure: true,  title: 'Perfil • CulturaX' },
  '/buscar':          { view: BuscarView,       secure: false, title: 'Buscar • CulturaX' },
  '/manga':           { view: MangaView,        secure: false, title: 'Manga • CulturaX' },
  '/documentales':    { view: DocumentalesView, secure: false, title: 'Documentales • CulturaX' },
  '/404':             { view: NotFoundView,     secure: false, title: 'No encontrado • CulturaX' },
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
  let route = routes[path] || routes['/404'];

  // Si es la vista de detalle, le pasamos item y categoría
  if (path === '/detalle') {
    const item = JSON.parse(sessionStorage.getItem("detalleItem"));
    const categoria = sessionStorage.getItem("detalleCategoria");
    const { html, bind, title } = route.view(item, categoria);
    render(html);
    mount(bind);
    document.title = title || route.title || 'CulturaX';
    highlightActiveLink(path);
    return;
  }

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

  // Marca el link activo del navbar
  highlightActiveLink(path);
}

// Navegación programática
export function navigate(path) {
  if (!path.startsWith('/')) path = `/${path}`;
  if (`#${path}` !== location.hash) {
    location.hash = `#${path}`;
  } else {
    resolve(); // fuerza render si es la misma ruta
  }
}

// Marca activo el link actual del navbar
function highlightActiveLink(currentPath) {
  const links = document.querySelectorAll('.cx-header .nav .nav-link');
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

  if (!location.hash) navigate('/');
}
