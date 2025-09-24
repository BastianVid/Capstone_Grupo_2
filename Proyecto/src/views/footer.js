// src/views/footer.js
export function Footer() {
  const year = new Date().getFullYear();
  return `
  <footer class="cx-footer mt-5">
    <div class="container py-4 py-md-5">
      <div class="row g-4">
        <!-- Marca / about / redes -->
        <div class="col-12 col-lg-4">
          <div class="d-flex align-items-center gap-2 mb-2">
            <i class="bi bi-film fs-4 text-primary"></i>
            <span class="fw-semibold text-white">CulturaX</span>
          </div>
          <p class="text-secondary small mb-3">
            Descubre películas, series, anime y música con un diseño limpio y rápido.
          </p>
          <div class="d-flex gap-3">
            <a class="cx-footer-link" href="#" aria-label="GitHub"><i class="bi bi-github fs-5"></i></a>
            <a class="cx-footer-link" href="#" aria-label="Instagram"><i class="bi bi-instagram fs-5"></i></a>
            <a class="cx-footer-link" href="#" aria-label="YouTube"><i class="bi bi-youtube fs-5"></i></a>
            <a class="cx-footer-link" href="#" aria-label="X/Twitter"><i class="bi bi-twitter-x fs-5"></i></a>
          </div>
        </div>

        <!-- Explorar -->
        <div class="col-6 col-lg-2">
          <h6 class="text-white-50 text-uppercase small mb-3">Explorar</h6>
          <ul class="list-unstyled small m-0">
            <li><a class="cx-footer-link" href="#/peliculas">Películas</a></li>
            <li><a class="cx-footer-link" href="#/series">Series</a></li>
            <li><a class="cx-footer-link" href="#/anime">Anime</a></li>
            <li><a class="cx-footer-link" href="#/musica">Música</a></li>
          </ul>
        </div>

        <!-- Recursos -->
        <div class="col-6 col-lg-2">
          <h6 class="text-white-50 text-uppercase small mb-3">Recursos</h6>
          <ul class="list-unstyled small m-0">
            <li><a class="cx-footer-link" href="#/terminos">Términos</a></li>
            <li><a class="cx-footer-link" href="#/privacidad">Privacidad</a></li>
            <li><a class="cx-footer-link" href="#/contacto">Contacto</a></li>
            <li><a class="cx-footer-link" href="#/accesibilidad">Accesibilidad</a></li>
          </ul>
        </div>

        <!-- Apoyo -->
        <div class="col-12 col-lg-4">
          <h6 class="text-white-50 text-uppercase small mb-3">Apoya al creador</h6>
          <p class="text-secondary small mb-3">
            Si te gusta el proyecto, puedes apoyarlo para seguir mejorándolo.
          </p>
          <a href="#/apoya" class="btn btn-primary btn-sm">Apoyar</a>
        </div>
      </div>

      <hr class="border-secondary-subtle my-4">

      <div class="d-flex flex-column flex-md-row justify-content-between gap-2 small text-secondary">
        <div>© ${year} CulturaX. Todos los derechos reservados.</div>
        <div class="d-flex align-items-center gap-3">
          <a class="cx-footer-link" href="#/privacidad">Privacidad</a>
          <span class="opacity-50">•</span>
          <a class="cx-footer-link" href="#/terminos">Términos</a>
        </div>
      </div>
    </div>
  </footer>`;
}
