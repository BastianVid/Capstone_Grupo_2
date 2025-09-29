// Nodo raíz donde se renderizan las vistas
export const $app = document.getElementById('app');

// Pinta el HTML de la vista en #app
export function render(html) {
  if (!$app) throw new Error('No se encontró el elemento #app');
  $app.innerHTML = html;

  // Lleva la página al tope en cada navegación
  try {
    window.scrollTo({ top: 0, behavior: 'auto' });
  } catch {
    window.scrollTo(0, 0);
  }
}

// Ejecuta la función de "bind" de la vista para enganchar eventos
export function mount(bindFn) {
  if (typeof bindFn === 'function') {
    bindFn();
  }
}
