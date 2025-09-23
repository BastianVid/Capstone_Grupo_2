/**
 * Navbar Bootstrap reutilizable.
 * Se incluye en cada vista con: ${Navbar()}
 */
export function Navbar() {
  return `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <!-- Logo / Brand -->
        <a class="navbar-brand fw-bold" href="#/">CulturaX</a>

        <!-- Botón para responsive -->
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
          aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Links -->
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link" href="#/">Inicio</a></li>
            <li class="nav-item"><a class="nav-link" href="#/peliculas">Películas</a></li>
            <li class="nav-item"><a class="nav-link" href="#/anime">Anime</a></li>
            <li class="nav-item"><a class="nav-link" href="#/musica">Música</a></li>
            <li class="nav-item"><a class="nav-link" href="#/series">Series</a></li>
          </ul>

          <!-- User box -->
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
