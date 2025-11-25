// Footer component used across views
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
            Descubre pel&iacute;culas, series, anime y m&uacute;sica con un dise&ntilde;o limpio y r&aacute;pido.
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
            <li><a href="#/peliculas" class="text-decoration-none text-light">Pel&iacute;culas</a></li>
            <li><a href="#/series" class="text-decoration-none text-light">Series</a></li>
            <li><a href="#/anime" class="text-decoration-none text-light">Anime</a></li>
            <li><a href="#/musica" class="text-decoration-none text-light">M&uacute;sica</a></li>
          </ul>
        </div>

        <div class="col-md-2 mb-3">
          <h6 class="fw-semibold">RECURSOS</h6>
          <ul class="list-unstyled small">
            <li><a href="#" class="text-decoration-none text-light">T&eacute;rminos</a></li>
            <li><a href="#" class="text-decoration-none text-light">Privacidad</a></li>
            <li><a href="#" class="text-decoration-none text-light">Contacto</a></li>
            <li><a href="#" class="text-decoration-none text-light">Accesibilidad</a></li>
          </ul>
        </div>

        <div class="col-md-4 mb-3">
          <h6 class="fw-semibold">APOYA AL CREADOR</h6>
          <p class="text-secondary small mb-2">Si te gusta el proyecto, puedes apoyarlo para seguir mejor&aacute;ndolo.</p>
          <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#supportModal">Apoyar</button>
        </div>

      </div>

      <div class="border-top border-secondary mt-3 pt-3 small text-secondary d-flex justify-content-between">
        <span>&copy; 2025 CulturaX. Todos los derechos reservados.</span>
        <span><a href="#" class="text-secondary text-decoration-none">Privacidad</a> &middot; <a href="#" class="text-secondary text-decoration-none">T&eacute;rminos</a></span>
      </div>
    </div>

    <!-- MODAL DE APOYO -->
    <div class="modal fade" id="supportModal" tabindex="-1" aria-labelledby="supportModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-dark text-light border border-secondary rounded-4 shadow-lg">
          <div class="modal-header border-0">
            <h5 class="modal-title fw-bold" id="supportModalLabel">&#9749; Inv&iacute;tame un caf&eacute;</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body text-center">
            <p class="text-secondary">
              Si disfrutas de CulturaX, puedes apoyar su desarrollo con una donaci&oacute;n segura por PayPal.
              Cada aporte ayuda a mantener el proyecto vivo y en evoluci&oacute;n.
            </p>
            <p class="text-secondary small mb-3">Selecciona un monto y pagar&aacute;s a ricardogonzff@gmail.com.</p>
            <div class="d-flex flex-wrap justify-content-center gap-2 mt-2">
              <a class="btn btn-warning fw-semibold" data-paypal-amount="5" role="button" href="https://www.paypal.com/donate?business=ricardogonzff%40gmail.com&currency_code=USD&amount=5" target="_blank" rel="noopener">US$5</a>
              <a class="btn btn-outline-light fw-semibold" data-paypal-amount="10" role="button" href="https://www.paypal.com/donate?business=ricardogonzff%40gmail.com&currency_code=USD&amount=10" target="_blank" rel="noopener">US$10</a>
              <a class="btn btn-outline-light fw-semibold" data-paypal-amount="20" role="button" href="https://www.paypal.com/donate?business=ricardogonzff%40gmail.com&currency_code=USD&amount=20" target="_blank" rel="noopener">US$20</a>
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

// Control de botones de donaci&oacute;n
export function initFooter() {
  const paypalButtons = document.querySelectorAll("[data-paypal-amount]");
  const paypalAccount = "ricardogonzff@gmail.com";

  const buildPayPalLink = (amount) =>
    `https://www.paypal.com/donate?business=${encodeURIComponent(paypalAccount)}&currency_code=USD&amount=${encodeURIComponent(amount)}`;

  paypalButtons.forEach((button) => {
    const amount = button.getAttribute("data-paypal-amount");
    if (!amount) return;
    const link = buildPayPalLink(amount);
    button.setAttribute("href", link);
    button.setAttribute("target", "_blank");
    button.setAttribute("rel", "noopener");
  });
}
