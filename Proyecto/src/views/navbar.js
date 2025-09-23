// Navbar moderno con búsqueda centrada y usuario a la derecha
export function Navbar() {
  return `
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
    <div class="container">
      <a class="navbar-brand d-flex align-items-center gap-2" href="#/">
        <i class="bi bi-film"></i><span class="fw-bold">CulturaX</span>
      </a>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#cxNav">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="cxNav">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item"><a class="nav-link" href="#/peliculas">Películas</a></li>
          <li class="nav-item"><a class="nav-link" href="#/series">Series</a></li>
          <li class="nav-item"><a class="nav-link" href="#/anime">Anime</a></li>
          <li class="nav-item"><a class="nav-link" href="#/musica">Música</a></li>
        </ul>

        <!-- Búsqueda global -->
        <form id="siteSearch" class="d-flex me-lg-3 mb-2 mb-lg-0" role="search">
          <input class="form-control" type="search" placeholder="Buscar títulos, géneros, artistas..." aria-label="Search" />
        </form>

        <!-- Usuario -->
        <div class="d-flex align-items-center gap-2">
          <span id="userSpan" class="text-white small d-none"></span>
          <a id="loginBtn" href="#/login" class="btn btn-outline-light btn-sm">Iniciar sesión</a>
          <a id="registerBtn" href="#/registro" class="btn btn-primary btn-sm">Registrarse</a>
          <button id="logoutBtn" class="btn btn-danger btn-sm d-none">Salir</button>
        </div>
      </div>
    </div>
  </nav>
  `;
}
