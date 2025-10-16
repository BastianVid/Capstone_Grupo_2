import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher  } from './navbarSession.js';

export function RegistroView() {
  const html = `
    ${Navbar()}
    <div class="container py-5" style="max-width:520px">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <h1 class="h4 text-center mb-4"><i class="bi bi-person-plus"></i> Crear cuenta</h1>

          <div id="alertBox" class="alert d-none" role="alert"></div>

          <form id="regForm" novalidate>
            <div class="mb-3">
              <label for="nombre" class="form-label">Nombre completo</label>
              <input type="text" id="nombre" name="nombre" class="form-control" placeholder="Tu nombre completo" required>
              <div class="invalid-feedback">Ingresa tu nombre.</div>
            </div>

            <div class="mb-3">
              <label for="usuario" class="form-label">Nombre de usuario</label>
              <input type="text" id="usuario" name="usuario" class="form-control" placeholder="Tu usuario" required>
              <div class="invalid-feedback">Ingresa un nombre de usuario.</div>
            </div>

            <div class="mb-3">
              <label for="email" class="form-label">Correo electrónico</label>
              <input type="email" id="email" name="email" class="form-control" placeholder="tu@email.com" required>
              <div class="invalid-feedback">Ingresa un email válido.</div>
            </div>

            <div class="mb-3">
              <label for="password" class="form-label">Contraseña</label>
              <input type="password" id="password" name="password" class="form-control" placeholder="********" required minlength="8">
              <div class="form-text">
                Debe tener mínimo 8 caracteres, una mayúscula, un número y un punto (.)
              </div>
              <div class="invalid-feedback">Contraseña inválida.</div>
            </div>

            <div class="mb-3">
              <label for="password2" class="form-label">Repetir contraseña</label>
              <input type="password" id="password2" name="password2" class="form-control" placeholder="********" required minlength="8">
              <div class="invalid-feedback">Las contraseñas deben coincidir.</div>
            </div>

            <button type="submit" class="btn btn-dark w-100">Registrarse</button>
          </form>

          <p class="text-center mt-3 mb-0">
            ¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a>
          </p>
        </div>
      </div>
    </div>
  `;

  return {
    html,
    bind() {
      // Actualiza estado del navbar según la sesión
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      const form = document.getElementById('regForm');
      const alertBox = document.getElementById('alertBox');
      const strongPass = /^(?=.*[A-Z])(?=.*\d)(?=.*\.)[A-Za-z\d.]{8,}$/;

      function showAlert(msg, type = 'danger') {
        alertBox.className = `alert alert-${type}`;
        alertBox.textContent = msg;
        alertBox.classList.remove('d-none');
      }
      function hideAlert() {
        alertBox.classList.add('d-none');
      }

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();

        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }

        const nombre   = document.getElementById('nombre').value.trim();
        const usuario  = document.getElementById('usuario').value.trim();
        const email    = document.getElementById('email').value.trim();
        const pass     = document.getElementById('password').value;
        const pass2    = document.getElementById('password2').value;

        if (pass !== pass2) {
          showAlert('❌ Las contraseñas no coinciden');
          document.getElementById('password2').classList.add('is-invalid');
          return;
        }
        if (!strongPass.test(pass)) {
          showAlert('⚠️ La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un punto (.)');
          document.getElementById('password').classList.add('is-invalid');
          return;
        }

        const displayName = usuario || nombre;

        const { register } = await import('../controllers/authController.js');
        try {
          await register(email, pass, displayName);
          // redirige a '#/' desde el controller
        } catch (err) {
          showAlert('❌ Error al registrar: ' + (err?.message || err));
        }
      });

      // Logout (por si ya está logueado)
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });

      // 👇 cambio: buscador envía a /buscar (antes /peliculas)
      document.getElementById('siteSearch')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = e.currentTarget.querySelector('input').value.trim();
        if (q) sessionStorage.setItem('cx:q', q);
        location.hash = '#/buscar';
      });
    },
  };
}
