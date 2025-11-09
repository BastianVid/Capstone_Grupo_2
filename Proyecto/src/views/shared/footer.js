// Moved to shared: footer component used across views
export function Footer() {
  return `
  <footer class="bg-dark text-light pt-4 border-top border-secondary">
    <div class="container">
      <div class="row">

        <div class="col-md-4 mb-3">
          <h5 class="fw-bold d-flex align-items-center gap-2">
            <i class="bi bi-film"></i> CulturaX
          </h5>
          <p class="text-secondary small">
            Descubre películas, series, anime y música con un diseño limpio y rápido.
          </p>
          <div class="d-flex gap-3 fs-5">
            <a href="#" class="text-light"><i class="bi bi-github"></i></a>
            <a href="#" class="text-light"><i class="bi bi-instagram"></i></a>
            <a href="#" class="text-light"><i class="bi bi-youtube"></i></a>
            <a href="#" class="text-light"><i class="bi bi-x"></i></a>
          </div>
        </div>

        <div class="col-md-2 mb-3">
          <h6 class="fw-semibold">EXPLORAR</h6>
          <ul class="list-unstyled small">
            <li><a href="#/peliculas" class="text-decoration-none text-light">Películas</a></li>
            <li><a href="#/series" class="text-decoration-none text-light">Series</a></li>
            <li><a href="#/anime" class="text-decoration-none text-light">Anime</a></li>
            <li><a href="#/musica" class="text-decoration-none text-light">Música</a></li>
          </ul>
        </div>

        <div class="col-md-2 mb-3">
          <h6 class="fw-semibold">RECURSOS</h6>
          <ul class="list-unstyled small">
            <li><a href="#" class="text-decoration-none text-light">Términos</a></li>
            <li><a href="#" class="text-decoration-none text-light">Privacidad</a></li>
            <li><a href="#" class="text-decoration-none text-light">Contacto</a></li>
            <li><a href="#" class="text-decoration-none text-light">Accesibilidad</a></li>
          </ul>
        </div>

        <div class="col-md-4 mb-3">
          <h6 class="fw-semibold">APOYA AL CREADOR</h6>
          <p class="text-secondary small mb-2">Si te gusta el proyecto, puedes apoyarlo para seguir mejorándolo.</p>
          <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#supportModal">Apoyar</button>
        </div>

      </div>

      <div class="border-top border-secondary mt-3 pt-3 small text-secondary d-flex justify-content-between">
        <span>© 2025 CulturaX. Todos los derechos reservados.</span>
        <span><a href="#" class="text-secondary text-decoration-none">Privacidad</a> • <a href="#" class="text-secondary text-decoration-none">Términos</a></span>
      </div>
    </div>

    <!-- MODAL DE APOYO -->
    <div class="modal fade" id="supportModal" tabindex="-1" aria-labelledby="supportModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-dark text-light border border-secondary rounded-4 shadow-lg">
          <div class="modal-header border-0">
            <h5 class="modal-title fw-bold" id="supportModalLabel">☕ Apoya al creador</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body text-center">
            <p class="text-secondary">
              Si disfrutas de CulturaX, puedes apoyar su desarrollo.  
              ¡Cada aporte ayuda a mantener el proyecto vivo y en evolución!
            </p>
            <div class="d-flex justify-content-center gap-3 mt-3">
              <button class="btn btn-warning fw-semibold" id="btnCoffee">
                ☕ Invítame un café
              </button>
              <button class="btn btn-outline-light" id="btnDonate">
                💛 Donar
              </button>
            </div>
          </div>
          <div class="modal-footer border-0 small text-secondary justify-content-center">
            <p class="m-0">Gracias por apoyar este proyecto independiente.</p>
          </div>
        </div>
      </div>
    </div>
  </footer>
  `;
}

/** Controlar botones desde JS */
export function initFooter() {
  const coffee = document.getElementById("btnCoffee");
  const donate = document.getElementById("btnDonate");

  if (coffee) {
    coffee.addEventListener("click", () => {
      // Aquí puedes poner tu link de BuyMeACoffee, MercadoPago, PayPal, etc.
      window.open("https://www.buymeacoffee.com/tucuenta", "_blank");
    });
  }

  if (donate) {
    donate.addEventListener("click", () => {
      // Otro link o acción personalizada
      window.open("https://paypal.me/tucuenta", "_blank");
    });
  }
}
