// src/views/shared/navbar.js
import { resolveImagePath } from './resolve-image-path.js';
import { initNavbarSessionWatcher, updateNavbarSessionUI } from './navbarSession.js';
import { navigate } from '../../core/router.js';

export function Navbar() {
  return `
  <header class="cx-header">
    <div class="container py-2">
      <div class="cx-header-frame d-flex align-items-center gap-3 flex-wrap w-100 justify-content-between">

        <div class="d-flex align-items-center gap-3 flex-wrap flex-grow-1">
          <!-- Brand -->
          <a href="#/" class="navbar-brand fw-bold text-white d-flex align-items-center gap-2 m-0">
            <i class="bi bi-film"></i><span>CulturaX</span>
          </a>

          <!-- Nav desktop -->
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
        </div>

        <!-- Nav mobile dropdown (always visible en móvil, separado) -->
        <div class="dropdown d-md-none ms-auto me-2">
          <button class="btn btn-outline-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            Categorías
          </button>
          <ul class="dropdown-menu dropdown-menu-dark shadow-sm">
            <li><a class="dropdown-item" href="#/peliculas">Películas</a></li>
            <li><a class="dropdown-item" href="#/series">Series</a></li>
            <li><a class="dropdown-item" href="#/anime">Anime</a></li>
            <li><a class="dropdown-item" href="#/musica">Música</a></li>
            <li><a class="dropdown-item" href="#/videojuegos">Videojuegos</a></li>
            <li><a class="dropdown-item" href="#/libros">Libros</a></li>
            <li><a class="dropdown-item" href="#/manga">Mangas</a></li>
            <li><a class="dropdown-item" href="#/documentales">Documentales</a></li>
          </ul>
        </div>

        <!-- Search desktop -->
        <form id="siteSearch" class="ms-auto me-2 d-none d-md-flex position-relative" role="search" style="min-width:360px;">
          <input id="siteSearchInput" class="form-control form-control-sm" placeholder="Buscar títulos, géneros, artistas" autocomplete="off"/>
          <div id="searchDropdown" class="bg-dark text-white position-absolute w-100 rounded shadow d-none" 
               style="top: 110%; left: 0; z-index: 1000; max-height: 400px; overflow-y: auto;"></div>
        </form>

        <!-- Search mobile -->
        <form id="siteSearchMobile" class="w-100 d-md-none mt-2 position-relative" role="search">
          <div class="input-group input-group-sm">
            <span class="input-group-text bg-dark text-white border-secondary">
              <i class="bi bi-search"></i>
            </span>
            <input id="siteSearchInputMobile" class="form-control form-control-sm" placeholder="Buscar títulos, géneros, artistas" autocomplete="off"/>
          </div>
          <div id="searchDropdownMobile" class="bg-dark text-white position-absolute w-100 rounded shadow d-none" 
               style="top: 110%; left: 0; z-index: 1000; max-height: 360px; overflow-y: auto;"></div>
        </form>

        <!-- Session -->
        <div id="navSessionBox" class="d-flex align-items-center gap-2 ms-auto">
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
              <li><a class="dropdown-item" href="#/calificaciones"><i class="bi bi-star me-2"></i>Mis calificaciones</a></li>
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
 * Busca global
 */
export function initNavbarSearch() {
  const configs = [
    {
      input: document.getElementById("siteSearchInput"),
      dropdown: document.getElementById("searchDropdown"),
      form: document.getElementById("siteSearch"),
    },
    {
      input: document.getElementById("siteSearchInputMobile"),
      dropdown: document.getElementById("searchDropdownMobile"),
      form: document.getElementById("siteSearchMobile"),
    },
  ].filter((cfg) => cfg.input && cfg.dropdown && cfg.form);

  if (!configs.length) return;

  let cache = null;
  let building = false;

  async function buildCache() {
    if (cache || building) return;
    building = true;
    const { ContentModel } = await import('../../models/contentModel.js');
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
    configs.forEach(({ dropdown }) => {
      dropdown.classList.add("d-none");
      dropdown.innerHTML = "";
    });
  };

  const showDropdown = (dropdown, html) => {
    dropdown.innerHTML = html;
    dropdown.classList.remove("d-none");
  };

  configs.forEach(({ input, dropdown, form }) => {
    input.addEventListener("input", async (e) => {
      const query = e.target.value.trim().toLowerCase();

      if (!query) return hideDropdown();

      const hash = location.hash || "";
      const allowDropdown =
        hash === "" ||
        hash === "#/" ||
        hash.startsWith("#/detalle");

      if (!allowDropdown) {
        window.dispatchEvent(new CustomEvent("globalSearch", { detail: { query } }));
        hideDropdown();
        return;
      }

      await buildCache();
      const results = cache.filter(x =>
        x._title.toLowerCase().includes(query) ||
        (x._tag && x._tag.toLowerCase().includes(query))
      ).slice(0, 8);

      if (!results.length) {
        return showDropdown(dropdown, `<div class="p-2 text-center text-secondary small">Sin resultados</div>`);
      }

      showDropdown(dropdown, results.map((r, i) => `
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
          const base = "#/detalle";
          const forced = `${base}?ts=${Date.now()}`;
          if (location.hash.split('?')[0] === base) {
            location.hash = forced; // fuerza hashchange aunque ya estés en detalle
          } else {
            location.hash = base;
          }
          hideDropdown();
        });
      });
    });

    form.addEventListener("submit", (e) => e.preventDefault());
  });

  document.addEventListener("click", (e) => {
    const inside = configs.some(({ form }) => form.contains(e.target));
    if (!inside) hideDropdown();
  });
}
