// Resuelve nombres y rutas a la carpeta real de imágenes del proyecto.
// Con Live Server es mejor usar rutas ABSOLUTAS desde la raíz.
const ASSETS_DIR = '/Proyecto/src/assets/img/';

function isAbsoluteUrl(str = '') {  
  return /^(https?:|data:)/i.test(str);
}

function hasKnownExt(str = '') {
  return /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(str);
}

// Normaliza una ruta cualquiera a "/src/assets/img/<archivo>"
function toAssetsPath(nameOrPath = '') {
  let s = String(nameOrPath).trim().replace(/\\/g, '/');

  // si viene ya con /src/assets/img/... lo dejamos así (pero normalizamos una sola / inicial)
  s = s.replace(/^\/+/, '/');
  if (s.startsWith('/src/assets/img/')) return s;

  // si viene con "src/assets/img/..." sin slash inicial -> hacemos root-absolute
  if (s.startsWith('src/assets/img/')) return `/${s}`;

  // si viene como "assets/img/..." -> lo llevamos a /src/assets/img/...
  s = s.replace(/^\/?assets\/img\//i, '');
  s = s.replace(/^\/?src\/assets\/img\//i, '');

  // si viene con subcarpetas (p.e. "img/foo.jpg") o "./algo.jpg" -> nos quedamos con el archivo
  const justFile = s.split('/').pop();

  const file = hasKnownExt(justFile) ? justFile : `${justFile}.jpg`;
  return `${ASSETS_DIR}${file}`;
}

/**
 * Reglas:
 * - http(s) o data: -> se devuelve tal cual
 * - Rutas relativas/mixtas -> se normalizan a /src/assets/img/<archivo>
 * - Solo nombre -> se asume .jpg dentro de /src/assets/img/
 * - Si no viene nada -> placeholder local
 */
export function resolveImagePath(input) {
  if (!input) return `${ASSETS_DIR}placeholder.jpg`;

  const s = String(input).trim();
  if (isAbsoluteUrl(s)) return s;

  return toAssetsPath(s);
}

export default resolveImagePath;
