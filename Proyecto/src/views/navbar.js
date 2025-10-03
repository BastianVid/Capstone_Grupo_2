// src/views/navbar.js
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
          <li class="nav-item"><a href="#/peliculas" class="nav-link text-white-50 px-2">Películas</a></li>
          <li class="nav-item"><a href="#/series"    class="nav-link text-white-50 px-2">Series</a></li>
          <li class="nav-item"><a href="#/anime"     class="nav-link text-white-50 px-2">Anime</a></li>
          <li class="nav-item"><a href="#/musica"    class="nav-link text-white-50 px-2">Música</a></li>
          <li class="nav-item"><a href="#/videojuegos" class="nav-link text-white-50 px-2">Videojuegos</a></li>
          <li class="nav-item"><a href="#/libros"      class="nav-link text-white-50 px-2">Libros</a></li>
        </ul>

        <!-- Search -->
        <form id="siteSearch" class="ms-auto me-2 d-none d-md-flex" role="search" style="min-width:360px;">
          <input id="siteSearchInput" class="form-control form-control-sm" placeholder="Buscar títulos, géneros, artistas" />
        </form>

        <!-- Session -->
        <div id="navSessionBox" class="d-flex align-items-center gap-2">
          <!-- Botón (no autenticado) -->
          <a id="loginSignupBtn" href="#/login" class="btn btn-primary btn-sm">Login / Sign up</a>

          <!-- Menú usuario (autenticado) -->
          <div id="userMenu" class="dropdown d-none">
            <button class="btn btn-outline-light btn-sm dropdown-toggle d-flex align-items-center gap-2"
                    type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-person-circle"></i>
              <span id="navUserName">Mi cuenta</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><h6 class="dropdown-header" id="navUserEmail"></h6></li>
              <li><a class="dropdown-item" href="#/">Inicio</a></li>
              <li><a class="dropdown-item" href="#/perfil">Mi perfil</a></li> 
              <li><hr class="dropdown-divider"></li>
              <li><button id="logoutBtn" class="dropdown-item">Cerrar sesión</button></li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  </header>
  `;
}

/**
 * 🔹 Inicializa el buscador global en el navbar
 * - Cada letra escrita en el input dispara un evento "globalSearch"
 * - Las vistas pueden escuchar este evento y filtrar en tiempo real
 */
export function initNavbarSearch() {
  const input = document.getElementById("siteSearchInput");
  if (!input) return;

  input.addEventListener("input", (e) => {
    const query = e.target.value.trim().toLowerCase();
    window.dispatchEvent(new CustomEvent("globalSearch", { detail: { query } }));
  });
}
