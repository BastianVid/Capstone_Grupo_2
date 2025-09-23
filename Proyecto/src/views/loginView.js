import { Navbar } from './navbar.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher  } from './navbarSession.js';

export function LoginView() {
  const html = `
    ${Navbar()}
    <div class="container py-5" style="max-width:420px">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <h1 class="h4 text-center mb-4"><i class="bi bi-person-circle"></i> Iniciar sesión</h1>

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
          </form>

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
      // UI del navbar según sesión
      initNavbarSessionWatcher(); 
      updateNavbarSessionUI();

      // Logout (por si se entra ya logueado)
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });

      // Manejo del formulario
      const form = document.getElementById('loginForm');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
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
            'auth/invalid-credential': 'Correo o contraseña incorrectos.',
            'auth/invalid-email': 'El correo no es válido.',
            'auth/user-disabled': 'Este usuario está deshabilitado.',
            'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde.',
          };
          alert('❌ Error al iniciar sesión: ' + (map[err?.code] ?? err?.message ?? err));
        }
      });
    },
  };
}
