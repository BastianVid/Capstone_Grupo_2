// src/views/navbar.js
import { resolveImagePath } from './shared/resolve-image-path.js';
import { initNavbarSessionWatcher, updateNavbarSessionUI } from './navbarSession.js';

export function Navbar() {
  return `
  <header class="cx-header">
    <div class="container py-2">
      <div class="cx-header-frame d-flex align-items-center gap-3">

        <!-- Brand -->
        <a href="#/" class="navbar-brand fw-bold text-white d-flex align-items-center gap-2 m-0">
          <i class="bi bi-film"></i><span>CulturaX</span>
        </a>

        <!-- Nav -->
        <ul class="nav d-none d-md-flex">
          <li class="nav-item"><a href="#/peliculas"        class="nav-link text-white-50 px-2">Películas</a></li>
          <li class="nav-item"><a href="#/series"           class="nav-link text-white-50 px-2">Series</a></li>
          <li class="nav-item"><a href="#/anime"            class="nav-link text-white-50 px-2">Anime</a></li>
          <li class="nav-item"><a href="#/musica"           class="nav-link text-white-50 px-2">Música</a></li>
          <li class="nav-item"><a href="#/videojuegos"      class="nav-link text-white-50 px-2">Videojuegos</a></li>
          <li class="nav-item"><a href="#/libros"           class="nav-link text-white-50 px-2">Libros</a></li>
          <li class="nav-item"><a href="#/manga"            class="nav-link text-white-50 px-2">Mangas</a></li>
          <li class="nav-item"><a href="#/documentales"     class="nav-link text-white-50 px-2">Documentales</a></li>

        </ul>

        <!-- Search -->
        <form id="siteSearch" class="ms-auto me-2 d-none d-md-flex position-relative" role="search" style="min-width:360px;">
          <input id="siteSearchInput" class="form-control form-control-sm" placeholder="Buscar títulos, géneros, artistas" autocomplete="off"/>
          <div id="searchDropdown" class="bg-dark text-white position-absolute w-100 rounded shadow d-none" 
               style="top: 110%; left: 0; z-index: 1000; max-height: 400px; overflow-y: auto;"></div>
        </form>

        <!-- Session -->
        <div id="navSessionBox" class="d-flex align-items-center gap-2">
          <!-- Botón (no autenticado) -->
          <a id="loginSignupBtn" href="#/login" class="btn btn-primary btn-sm">Login / Sign up</a>

          <!-- Menú usuario (autenticado, versión mejorada) -->
          <div id="userMenu" class="dropdown d-none">
            <button class="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center gap-2"
                    type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-person-circle"></i>
              <span id="navUserName">Mi cuenta</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark shadow-lg">
              <li><h6 class="dropdown-header text-secondary small" id="navUserEmail"></h6></li>
              <li><a class="dropdown-item" href="#/perfil"><i class="bi bi-person me-2"></i>Tu perfil</a></li>
              <li><a class="dropdown-item" href="#/lista"><i class="bi bi-bookmark-heart me-2"></i>Mi lista</a></li>
              <li><a class="dropdown-item" href="#/calificaciones"><i class="bi bi-star me-2"></i>Mis calificaciones</a></li>
              <li><a class="dropdown-item" href="#/intereses"><i class="bi bi-lightbulb me-2"></i>Tus intereses</a></li>
              <li><a class="dropdown-item" href="#/configuracion"><i class="bi bi-gear me-2"></i>Configuración</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><button id="logoutBtn" class="dropdown-item text-danger"><i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión</button></li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  </header>
  `;
}

/**
 * 🔹 Inicializa el buscador global
 * - En Home → muestra lista desplegable con resultados
 * - En otras vistas → emite evento "globalSearch" (filtrado local)
 */
export function initNavbarSearch() {
  const input = document.getElementById("siteSearchInput");
  const dropdown = document.getElementById("searchDropdown");
  const form = document.getElementById("siteSearch");

  if (!input || !dropdown || !form) return;

  let cache = null;
  let building = false;

  async function buildCache() {
    if (cache || building) return;
    building = true;
    const { ContentModel } = await import('../models/contentModel.js');
    const [pelis,series,anime,musica,videojuegos,libros,manga,documentales] = await Promise.all([
      ContentModel.listPeliculas().catch(() => []),
      ContentModel.listSeries().catch(() => []),
      ContentModel.listAnime().catch(() => []),
      ContentModel.listMusica().catch(() => []),
      ContentModel.listVideojuegos?.().catch(() => []),
      ContentModel.listLibros?.().catch(() => []),
      ContentModel.listManga?.().catch(() => []),
      ContentModel.listDocumentales?.().catch(() => []),
    ]);


    const norm = (x, categoria, def) => ({
      ...x,
      categoria,
      _title: x.titulo || x.title || "Sin título",
      _img: resolveImagePath(x.imagen || x.img || def.img),
      _tag: Array.isArray(x.genero) ? x.genero[0] : (x.genero || x.genre || def.tag),
    });

    cache = [
      ...pelis.map(p => norm(p, "peliculas", { img: "inception.jpg", tag: "Película" })),
      ...series.map(p => norm(p, "series", { img: "stranger-things.jpg", tag: "Serie" })),
      ...anime.map(p => norm(p, "anime", { img: "naruto.jpg", tag: "Anime" })),
      ...musica.map(p => norm(p, "musica", { img: "beatles.jpg", tag: "Música" })),
      ...videojuegos.map(p => norm(p, "videojuegos", { img: "zelda.jpg", tag: "Videojuego" })),
      ...libros.map(p => norm(p, "libros", { img: "book.jpg", tag: "Libro" })),
      ...manga.map(p => norm(p, "manga", { img: "chainsaw-man.jpg", tag: "Manga" })),
      ...documentales.map(p => norm(p, "documentales", { img: "doc.jpg", tag: "Documental" })),
    ];

    building = false;
  }

  const hideDropdown = () => {
    dropdown.classList.add("d-none");
    dropdown.innerHTML = "";
  };

  const showDropdown = (html) => {
    dropdown.innerHTML = html;
    dropdown.classList.remove("d-none");
  };

  input.addEventListener("input", async (e) => {
    const query = e.target.value.trim().toLowerCase();

    // Si no hay texto, ocultar dropdown
    if (!query) return hideDropdown();

    // Si NO estás en home, filtra dentro de la vista actual
    if (location.hash !== "" && location.hash !== "#/") {
      window.dispatchEvent(new CustomEvent("globalSearch", { detail: { query } }));
      hideDropdown();
      return;
    }

    // Si estás en home → mostrar lista de resultados
    await buildCache();
    const results = cache.filter(x =>
      x._title.toLowerCase().includes(query) ||
      (x._tag && x._tag.toLowerCase().includes(query))
    ).slice(0, 8);

    if (!results.length) {
      return showDropdown(`<div class="p-2 text-center text-secondary small">Sin resultados</div>`);
    }

    showDropdown(results.map((r, i) => `
      <button type="button" class="w-100 text-start btn btn-dark border-0 border-bottom rounded-0 d-flex align-items-center gap-2 px-2 py-2 search-item" data-index="${i}">
        <img src="${r._img}" width="40" height="40" class="rounded" style="object-fit:cover;">
        <div>
          <div class="small fw-semibold">${r._title}</div>
          <div class="text-secondary small">${r._tag || ""}</div>
        </div>
      </button>
    `).join(""));

    dropdown.querySelectorAll(".search-item").forEach((btn, i) => {
      btn.addEventListener("click", () => {
        const item = results[i];
        sessionStorage.setItem("detalleItem", JSON.stringify(item));
        sessionStorage.setItem("detalleCategoria", item.categoria);
        location.hash = "#/detalle";
        hideDropdown();
      });
    });
  });

  // Cerrar el dropdown al hacer click fuera
  document.addEventListener("click", (e) => {
    if (!form.contains(e.target)) hideDropdown();
  });

  // Enter -> Si estás en home, no hacer nada especial
  form.addEventListener("submit", (e) => e.preventDefault());
}