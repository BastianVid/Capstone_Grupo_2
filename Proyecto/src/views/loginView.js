import { Navbar } from './shared/navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher } from './shared/navbarSession.js';

export function LoginView() {
  const html = `
    ${Navbar()}
    <div class="container py-5" style="max-width:420px">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <h1 class="h4 text-center mb-4"><i class="bi bi-person-circle"></i> Iniciar sesión</h1>

          <div id="alertBox" class="alert d-none" role="alert"></div>

          <form id="loginForm" novalidate>
            <div class="mb-3">
              <label for="login-email" class="form-label">Correo electrónico</label>
              <input type="email" id="login-email" name="email" class="form-control" placeholder="tu@email.com" required>
              <div class="invalid-feedback">Ingresa un email válido.</div>
            </div>

            <div class="mb-3">
              <label for="login-password" class="form-label">Contraseña</label>
              <input type="password" id="login-password" name="password" class="form-control" placeholder="********" required>
              <div class="invalid-feedback">La contraseña es obligatoria.</div>
            </div>

            <button type="submit" class="btn btn-dark w-100">Ingresar</button>
            <div class="mt-2 text-end">
              <button id="btnResetPass" type="button" class="btn btn-link p-0">¿Olvidaste tu contraseña?</button>
            </div>
          </form>

          <div class="text-center my-3 text-secondary">o continuar con</div>
          <div>
            <button id="btnGoogle" type="button" class="btn btn-outline-danger w-100">
              <i class="bi bi-google"></i> Google
            </button>
          </div>

          <p class="text-center mt-3 mb-0">
            ¿No tienes cuenta? <a href="#/registro">Regístrate</a>
          </p>
        </div>
      </div>
    </div>
  `;

  return {
    html,
    bind() {
      // Estado del navbar
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      const alertBox = document.getElementById('alertBox');
      function showAlert(msg, type = 'danger') {
        if (!alertBox) return;
        alertBox.className = `alert alert-${type}`;
        alertBox.textContent = msg;
        alertBox.classList.remove('d-none');
      }
      function hideAlert() { alertBox?.classList.add('d-none'); }

      // Mensaje post-registro: verificación enviada
      try {
        const pending = sessionStorage.getItem('cx:verify-pending');
        if (pending) {
          showAlert('Te enviamos un correo de verificación. Revisa tu bandeja y confirma para poder iniciar sesión.', 'info');
          sessionStorage.removeItem('cx:verify-pending');
          sessionStorage.removeItem('cx:verify-email');
        }
      } catch {}

      // Logout (por si se entra ya logueado)
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });

      // Buscador de navbar
      document.getElementById('siteSearch')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = e.currentTarget.querySelector('input').value.trim();
        if (q) sessionStorage.setItem('cx:q', q);
        location.hash = '#/peliculas';
      });

      // Manejo del formulario de login
      const form = document.getElementById('loginForm');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }

        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-password').value;

        const { login } = await import('../controllers/authController.js');
        try {
          await login(email, pass);
        } catch (err) {
          const map = {
            'auth/email-not-verified': 'Tu email no está verificado. Te reenviamos el correo. Revisa tu bandeja y vuelve a intentar.',
            'auth/invalid-credential': 'Correo o contraseña incorrectos.',
            'auth/invalid-email': 'El correo no es válido.',
            'auth/user-disabled': 'Este usuario está deshabilitado.',
            'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
          };
          showAlert('Error al iniciar sesión: ' + (map[err?.code] ?? err?.message ?? err));
        }
      });

      // Login con Google
      document.getElementById('btnGoogle')?.addEventListener('click', async () => {
        hideAlert();
        try {
          const { loginGoogle } = await import('../controllers/authController.js');
          await loginGoogle();
        } catch (err) {
          const map = {
            'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo. Inicia sesión con email/contraseña y luego vincula Google.',
            'auth/popup-closed-by-user': 'Cerraste la ventana de Google.',
            'auth/cancelled-popup-request': 'Se canceló la ventana anterior de Google.',
          };
          showAlert('Error con Google: ' + (map[err?.code] ?? err?.message ?? err));
        }
      });

      // Reset de contraseña
      document.getElementById('btnResetPass')?.addEventListener('click', async () => {
        hideAlert();
        const email = document.getElementById('login-email').value.trim();
        if (!email) {
          showAlert('Ingresa tu email en el formulario para enviarte el enlace de restablecimiento.', 'info');
          return;
        }
        try {
          const { resetPassword } = await import('../controllers/authController.js');
          await resetPassword(email);
          showAlert('Te enviamos un enlace para restablecer tu contraseña.', 'success');
        } catch (err) {
          const map = {
            'auth/invalid-email': 'El correo no es válido.',
            'auth/user-not-found': 'No existe un usuario con ese correo.',
          };
          showAlert('No se pudo enviar el correo: ' + (map[err?.code] ?? err?.message ?? err));
        }
      });
    },
  };
}
