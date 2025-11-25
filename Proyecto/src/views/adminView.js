import { Navbar } from "./shared/navbar.js";
import { initNavbarSessionWatcher, updateNavbarSessionUI } from './shared/navbarSession.js';
import { Footer, initFooter } from "./shared/footer.js";
import { isAdmin, isAdminFlexible } from "../controllers/authController.js";
const DEFAULT_CATEGORY = 'peliculas';
const CATEGORY_CONFIG = {
  peliculas: {
    key: 'peliculas',
    collection: 'peliculas',
    label: 'Pel&iacute;culas',
    icon: 'bi-film',
    accent: '#f97316',
    description: 'Administra estrenos, cl&aacute;sicos y franquicias del cat&aacute;logo.',
    fields: [
      { key: 'titulo', label: 'T&iacute;tulo', type: 'text', required: true, placeholder: 'Dune: Parte 2' },
      { key: 'descripcion', label: 'Descripci&oacute;n / sinopsis', type: 'textarea', rows: 4, placeholder: 'Breve resumen del argumento' },
      { key: 'a\u00f1o', label: 'A&ntilde;o', type: 'number', min: 1900, max: 2100 },
      { key: 'director', label: 'Director', type: 'text', placeholder: 'Denis Villeneuve' },
      { key: 'duracion', label: 'Duraci&oacute;n (min)', type: 'number', min: 0, step: 1 },
      { key: 'franquicia', label: 'Franquicia / saga', type: 'text', placeholder: 'Marvel Cinematic Universe' },
      { key: 'orden', label: 'Orden dentro de la saga', type: 'number', min: 0, step: 1 },
      { key: 'genero', label: 'G&eacute;neros', type: 'tags', placeholder: 'Accion, Ciencia ficcion, Drama' },
      { key: 'imagen', label: 'Imagen (archivo o URL)', type: 'text', placeholder: 'ant-man.jpg' },
      { key: 'trailer', label: 'Trailer (URL de YouTube)', type: 'text', placeholder: 'https://youtu.be/...' },
    ],
  },
  series: {
    key: 'series',
    collection: 'series',
    label: 'Series',
    icon: 'bi-collection-play',
    accent: '#c084fc',
    description: 'Controla temporadas, plataformas y estrenos televisivos.',
    fields: [
      { key: 'titulo', label: 'T&iacute;tulo', type: 'text', required: true, placeholder: 'House of the Dragon' },
      { key: 'descripcion', label: 'Descripci&oacute;n', type: 'textarea', rows: 4, placeholder: 'Premisa general de la serie' },
      { key: 'a\u00f1o', label: 'A&ntilde;o de estreno', type: 'number', min: 1960, max: 2100 },
      { key: 'director', label: 'Showrunner / director', type: 'text', placeholder: 'Ryan Condal' },
      { key: 'temporadas', label: 'Temporadas', type: 'number', min: 1, step: 1 },
      { key: 'duracion', label: 'Duraci&oacute;n promedio (min)', type: 'number', min: 0, step: 1 },
      { key: 'plataforma', label: 'Plataforma', type: 'text', placeholder: 'Netflix, Max, Prime Video' },
      { key: 'genero', label: 'G&eacute;neros', type: 'tags', placeholder: 'Drama, Thriller, Ciencia ficcion' },
      { key: 'imagen', label: 'Imagen', type: 'text', placeholder: 'stranger-things.jpg' },
      { key: 'trailer', label: 'Trailer', type: 'text', placeholder: 'https://youtu.be/...' },
    ],
  },
  anime: {
    key: 'anime',
    collection: 'anime',
    label: 'Anime',
    icon: 'bi-tv',
    accent: '#22d3ee',
    description: 'Mant&eacute;n actualizado el listado de producciones animadas.',
    fields: [
      { key: 'titulo', label: 'T&iacute;tulo', type: 'text', required: true, placeholder: 'Attack on Titan' },
      { key: 'descripcion', label: 'Descripci&oacute;n', type: 'textarea', rows: 4, placeholder: 'Resumen del anime' },
      { key: 'a\u00f1o', label: 'A&ntilde;o', type: 'number', min: 1960, max: 2100 },
      { key: 'director', label: 'Director', type: 'text', placeholder: 'Tetsuro Araki' },
      { key: 'estudio', label: 'Estudio / productora', type: 'text', placeholder: 'MAPPA' },
      { key: 'duracion', label: 'Duraci&oacute;n (min)', type: 'number', min: 0, step: 1 },
      { key: 'genero', label: 'G&eacute;neros', type: 'tags', placeholder: 'Shonen, Accion' },
      { key: 'imagen', label: 'Imagen', type: 'text', placeholder: 'attack-on-titan.jpg' },
      { key: 'trailer', label: 'Trailer', type: 'text', placeholder: 'https://youtu.be/...' },
    ],
  },
  musica: {
    key: 'musica',
    collection: 'musica',
    label: 'M&uacute;sica',
    icon: 'bi-music-note-beamed',
    accent: '#34d399',
    description: 'Gestiona discos esenciales y lanzamientos musicales.',
    fields: [
      { key: 'titulo', label: 'T&iacute;tulo del &aacute;lbum', type: 'text', required: true, placeholder: '1989 (Taylor\'s Version)' },
      { key: 'descripcion', label: 'Descripci&oacute;n', type: 'textarea', rows: 4, placeholder: 'Contexto y sonido del disco' },
      { key: 'director', label: 'Artista / banda', type: 'text', placeholder: 'Taylor Swift' },
      { key: 'a\u00f1o', label: 'A&ntilde;o', type: 'number', min: 1900, max: 2100 },
      { key: 'duracion', label: 'Duraci&oacute;n (min)', type: 'number', min: 0, step: 1 },
      { key: 'totalCanciones', label: 'Total de canciones', type: 'number', min: 1, step: 1 },
      { key: 'genero', label: 'G&eacute;neros', type: 'tags', placeholder: 'Pop, Indie, Rock' },
      { key: 'imagen', label: 'Imagen', type: 'text', placeholder: '1989.jpg' },
      { key: 'trailer', label: 'Video destacado', type: 'text', placeholder: 'https://youtu.be/...' },
    ],
  },
  libros: {
    key: 'libros',
    collection: 'libros',
    label: 'Libros',
    icon: 'bi-book',
    accent: '#60a5fa',
    description: 'Curadur&iacute;a de narrativa, ensayo y novelas gr&aacute;ficas.',
    fields: [
      { key: 'titulo', label: 'T&iacute;tulo', type: 'text', required: true, placeholder: 'Cien a&ntilde;os de soledad' },
      { key: 'descripcion', label: 'Descripci&oacute;n', type: 'textarea', rows: 4, placeholder: 'Resumen de la trama o aportes' },
      { key: 'autor', label: 'Autor', type: 'text', placeholder: 'Gabriel Garc&iacute;a M&aacute;rquez' },
      { key: 'a\u00f1o', label: 'A&ntilde;o de publicaci&oacute;n', type: 'number', min: 1400, max: 2100 },
      { key: 'editorial', label: 'Editorial', type: 'text', placeholder: 'Sudamericana' },
      { key: 'genero', label: 'G&eacute;neros', type: 'tags', placeholder: 'Realismo m&aacute;gico, Drama' },
      { key: 'paginas', label: 'P&aacute;ginas', type: 'number', min: 1, step: 1 },
      { key: 'imagen', label: 'Imagen', type: 'text', placeholder: 'cien-anos-soledad.jpg' },
      { key: 'trailer', label: 'Recurso multimedia (opcional)', type: 'text', placeholder: 'https://youtu.be/...' },
    ],
  },
  videojuegos: {
    key: 'videojuegos',
    collection: 'videojuegos',
    label: 'Videojuegos',
    icon: 'bi-controller',
    accent: '#fb7185',
    description: 'Administra lanzamientos, franquicias y plataformas.',
    fields: [
      { key: 'titulo', label: 'T&iacute;tulo', type: 'text', required: true, placeholder: 'The Last of Us Part I' },
      { key: 'descripcion', label: 'Descripci&oacute;n', type: 'textarea', rows: 4, placeholder: 'Resumen del juego' },
      { key: 'a\u00f1o', label: 'A&ntilde;o de lanzamiento', type: 'number', min: 1970, max: 2100 },
      { key: 'franquicia', label: 'Franquicia / saga', type: 'text', placeholder: 'Spider-Man Saga' },
      { key: 'orden', label: 'Orden dentro de la saga', type: 'number', min: 0, step: 1 },
      { key: 'plataforma', label: 'Plataformas', type: 'text', placeholder: 'PS5, Xbox Series, PC' },
      { key: 'genero', label: 'G&eacute;neros', type: 'tags', placeholder: 'Accion, Aventura, RPG' },
      { key: 'imagen', label: 'Imagen', type: 'text', placeholder: 'amazing-spider-man.jpg' },
      { key: 'trailer', label: 'Trailer / gameplay', type: 'text', placeholder: 'https://youtu.be/...' },
    ],
  },
  resenas: {
    key: 'resenas',
    collection: 'userResenas',
    label: 'Rese&ntilde;as',
    icon: 'bi-chat-square-text',
    accent: '#f472b6',
    description: 'Modera los comentarios y calificaciones enviados por la comunidad.',
    fields: [
      { key: 'categoria', label: 'Categor&iacute;a', type: 'text', required: true, placeholder: 'peliculas' },
      { key: 'obraId', label: 'ID de la obra', type: 'text', required: true, placeholder: 'ant-man' },
      { key: 'obraTitulo', label: 'T&iacute;tulo de la obra', type: 'text', required: true, placeholder: 'Ant-Man: El Hombre Hormiga' },
      { key: 'obraImg', label: 'Imagen de la obra', type: 'text', placeholder: 'antman.jpg' },
      { key: 'userId', label: 'ID del usuario', type: 'text', required: true, placeholder: '6c9CUuU38x...' },
      { key: 'estrellas', label: 'Estrellas (1-5)', type: 'number', min: 1, max: 5, step: 1, required: true },
      { key: 'comentario', label: 'Comentario', type: 'textarea', rows: 4, placeholder: 'Escribe la opinion del usuario' },
      { key: 'fecha', label: 'Fecha (ISO 8601)', type: 'text', placeholder: '2025-11-09T03:36:12.552Z' },
    ],
  },
};
const CATEGORY_KEYS = Object.keys(CATEGORY_CONFIG);
const PLACEHOLDER_CARD = `
  <div class="cx-admin-card text-center py-5 text-secondary">
    <div class="spinner-border text-primary mb-3" role="status"></div>
    <p class="mb-0">Cargando informaci&oacute;n...</p>
  </div>
`;
function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function slugify(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
function formatCount(value = 0) {
  const num = Number(value) || 0;
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(num);
}
function getYear(item = {}) {
  const raw = item['a\u00f1o'] ?? item.anio ?? item.year ?? null;
  return Number.isFinite(raw) ? String(raw) : '';
}
function truncate(text = '', limit = 110) {
  const clean = String(text || '').trim();
  if (!clean) return '';
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, limit - 3).trim()}...`;
}
function valueToString(value) {
  if (value === null || typeof value === 'undefined') return '';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}
function normalizeKey(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}
function renderField(field, value) {
  const helper = field.helper ? `<small class="text-secondary">${field.helper}</small>` : '';
  const readOnlyAttrs = field.readOnly ? 'readonly disabled' : '';
  const note = field.readOnly
    ? '<small class="text-secondary">Valor automático, no editable.</small>'
    : helper;
  if (field.type === 'textarea') {
    return `
      <div class="cx-field">
        <label class="form-label">${field.label}</label>
        <textarea
          class="form-control form-control-sm"
          rows="${field.rows || 3}"
          data-field="${field.key}"
          ${readOnlyAttrs}
          ${field.required ? 'required' : ''}
          placeholder="${field.placeholder ? escapeHtml(field.placeholder) : ''}"
        >${escapeHtml(valueToString(value))}</textarea>
        ${note || ''}
      </div>
    `;
  }
  if (field.type === 'number') {
    return `
      <div class="cx-field">
        <label class="form-label">${field.label}</label>
        <input
          type="number"
          class="form-control form-control-sm"
          data-field="${field.key}"
          value="${escapeHtml(valueToString(value))}"
          ${readOnlyAttrs}
          ${field.required ? 'required' : ''}
          ${typeof field.min !== 'undefined' ? `min="${field.min}"` : ''}
          ${typeof field.max !== 'undefined' ? `max="${field.max}"` : ''}
          ${field.step ? `step="${field.step}"` : ''}
          placeholder="${field.placeholder ? escapeHtml(field.placeholder) : ''}"
        />
        ${note || ''}
      </div>
    `;
  }
  if (field.type === 'tags') {
    return `
      <div class="cx-field">
        <label class="form-label">${field.label}</label>
        <div class="chip-preview mb-2"></div>
        <input
          type="text"
          class="form-control form-control-sm js-chip-input"
          data-field="${field.key}"
          value="${escapeHtml(valueToString(value))}"
          ${readOnlyAttrs}
          placeholder="${field.placeholder ? escapeHtml(field.placeholder) : 'Accion, Drama'}"
        />
        ${note || '<small class="text-secondary">Escribe varios valores separados por comas.</small>'}
      </div>
    `;
  }
  return `
    <div class="cx-field">
      <label class="form-label">${field.label}</label>
      <input
        type="${field.type || 'text'}"
        class="form-control form-control-sm"
        data-field="${field.key}"
        value="${escapeHtml(valueToString(value))}"
        ${readOnlyAttrs}
        ${field.required ? 'required' : ''}
        placeholder="${field.placeholder ? escapeHtml(field.placeholder) : ''}"
      />
      ${note || ''}
    </div>
  `;
}
function enhanceChipInputs(scope) {
  scope.querySelectorAll('.js-chip-input').forEach((input) => {
    const preview = input.closest('.cx-field')?.querySelector('.chip-preview');
    if (!preview) return;
    const paint = () => {
      const chips = input.value
        .split(',')
        .map((chunk) => chunk.trim())
        .filter(Boolean);
      preview.innerHTML = chips.length
        ? chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join('')
        : '<span class="text-secondary small">Sin etiquetas</span>';
    };
    input.addEventListener('input', paint);
    paint();
  });
}
function initSlugHelper(scope) {
  const docInput = scope.querySelector('#docIdInput');
  if (!docInput) return;
  const titleInput = scope.querySelector('[data-field="titulo"]');
  let manual = false;
  docInput.addEventListener('input', () => {
    manual = true;
    docInput.value = slugify(docInput.value);
  });
  if (titleInput) {
    titleInput.addEventListener('input', () => {
      if (manual) return;
      docInput.value = slugify(titleInput.value);
    });
  }
}
function collectPayload(meta, form) {
  const data = {};
  meta.fields.forEach((field) => {
    if (field.readOnly) {
      return;
    }
    const el = form.querySelector(`[data-field="${field.key}"]`);
    if (!el) return;
    if (field.type === 'tags') {
      data[field.key] = el.value
        .split(',')
        .map((chunk) => chunk.trim())
        .filter(Boolean);
      return;
    }
    if (field.type === 'number') {
      const raw = el.value.trim();
      if (!raw) {
        data[field.key] = null;
        return;
      }
      const num = Number(raw);
      data[field.key] = Number.isNaN(num) ? null : num;
      return;
    }
    const value = el.value.trim();
    data[field.key] = value || null;
  });
  return data;
}
function renderForm(meta, editingData) {
  const idBlock = editingData
    ? `
      <div class="cx-pill mb-3">
        <i class="bi bi-tag me-2"></i>
        <span>${escapeHtml(editingData.id || '(sin id)')}</span>
      </div>
    `
    : `
      <div class="cx-field">
        <label class="form-label">Identificador (se usa en la URL)</label>
        <input
          type="text"
          class="form-control form-control-sm"
          id="docIdInput"
          placeholder="ej. ant-man"
          pattern="^[a-z0-9-]+$"
          required
        />
        <small class="text-secondary">Solo min&uacute;sculas, n&uacute;meros y guiones medios.</small>
      </div>
    `;
  const fields = meta.fields.map((field) => renderField(field, editingData ? editingData[field.key] : null)).join('');
  return `${idBlock}${fields}`;
}
function renderListItems(items, editingId, meta) {
  if (!items.length) {
    return `
      <div class="cx-empty text-center text-secondary py-5">
        A&uacute;n no hay registros en esta colecci&oacute;n.
      </div>
    `;
  }
  return items
    .map((item) => {
      const active = item.id === editingId ? 'is-active' : '';
      const isReviews = meta?.key === 'resenas';
      const title =
        item.titulo ||
        item.title ||
        (isReviews ? item.obraTitulo : '') ||
        'Registro sin t&iacute;tulo';
      const extractUid = () => {
        if (item.userId) return item.userId;
        if (typeof item.id === 'string' && item.id.includes('_')) {
          const [uid] = item.id.split('_');
          return uid;
        }
        return '';
      };
      const uid = extractUid();
      const username = item.adminUsername || item.userName;
      const userLabel =
        username ||
        item.userEmail ||
        (uid ? `UID: ${uid.slice(0, 4)}...${uid.slice(-4)}` : 'Usuario sin datos');
      const lead = isReviews
        ? [`&#11088; ${item.estrellas ?? 0}/5`, userLabel, item.categoria].filter(Boolean).join(' &middot; ')
        : [
            item.director,
            item.autor,
            item.estudio,
            item.editorial,
            item.plataforma,
            item.franquicia,
          ].find((value) => Boolean(value)) || '';
      const reviewDate = item.fecha ? new Date(item.fecha) : null;
      const dateLabel = reviewDate && !Number.isNaN(reviewDate.valueOf())
        ? reviewDate.toLocaleDateString()
        : '';
      const metaLine = isReviews
        ? [userLabel, item.obraId || item.id, dateLabel].filter(Boolean).join(' &middot; ')
        : [item.id, lead, getYear(item)].filter(Boolean).join(' &middot; ');
      const description = isReviews
        ? truncate(item.comentario || '', 160)
        : truncate(item.descripcion || item.description || '', 120);
      const tags = isReviews
        ? [item.obraTitulo, item.categoria].filter(Boolean)
        : Array.isArray(item.genero)
        ? item.genero.slice(0, 3)
        : item.genero
        ? String(item.genero)
            .split(',')
            .map((chunk) => chunk.trim())
            .filter(Boolean)
            .slice(0, 3)
        : [];
      return `
        <article class="cx-admin-row ${active}" data-id="${escapeHtml(item.id || '')}">
          <div>
            <p class="cx-admin-row__title mb-1">${escapeHtml(title)}</p>
            <p class="cx-admin-row__meta mb-2">${metaLine ? escapeHtml(metaLine) : '&nbsp;'}</p>
            ${description ? `<p class="cx-admin-row__desc mb-2">${escapeHtml(description)}</p>` : ''}
            ${
              tags.length
                ? `<div class="cx-admin-row__tags">${tags
                    .map((tag) => `<span class="chip chip--mini">${escapeHtml(tag)}</span>`)
                    .join('')}</div>`
                : ''
            }
          </div>
          <div class="cx-admin-row__actions">
            <button type="button" class="btn btn-sm btn-outline-light" data-item-action="edit" data-id="${escapeHtml(item.id || '')}">
              <i class="bi bi-pencil"></i>
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger" data-item-action="delete" data-id="${escapeHtml(item.id || '')}" data-title="${escapeHtml(title)}">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}
export function AdminView() {
  const html = `
    ${Navbar()}
    <section class="cx-admin-hero text-white text-center py-5 mb-4">
      <div class="container">
        <p class="text-uppercase text-white-50 letter-spacing mb-2">Centro de control</p>
        <h1 class="display-6 fw-semibold mb-3">Dashboard de administraci&oacute;n</h1>
        <p class="lead text-white-50 mb-0">
          Gestiona cat&aacute;logos, cuida los detalles y mant&eacute;n viva la curadur&iacute;a de CulturaX.
        </p>
      </div>
    </section>
    <div id="adminContent" class="container pb-5">
      ${PLACEHOLDER_CARD}
    </div>
    <div class="cx-admin-footer mt-5">
      ${Footer()}
    </div>
    <style>
      .cx-admin-hero {
        background: radial-gradient(circle at top, rgba(99,102,241,0.35), transparent 55%), #08090f;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      .cx-admin-card {
        background: rgba(12,16,24,0.92);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 1.25rem;
        padding: 1.75rem;
        box-shadow: 0 20px 45px rgba(0,0,0,0.35);
      }
      .cx-admin-layout {
        position: relative;
      }
      .cx-category {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.2rem;
        border-radius: 1rem;
        border: 1px solid transparent;
        background: rgba(255,255,255,0.02);
        color: #f8fafc;
        transition: all 0.2s ease;
      }
      .cx-category.is-active {
        border-color: rgba(255,255,255,0.2);
        background: rgba(255,255,255,0.05);
      }
      .cx-category__icon {
        width: 42px;
        height: 42px;
        border-radius: 0.75rem;
        background: rgba(255,255,255,0.08);
        display: grid;
        place-items: center;
        font-size: 1.25rem;
      }
      .cx-admin-panel {
        background: rgba(11,13,21,0.95);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 1.5rem;
        padding: 2rem;
        backdrop-filter: blur(18px);
        --cx-accent: #f97316;
      }
      .cx-admin-panel__head {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 2rem;
      }
      @media (min-width: 768px) {
        .cx-admin-panel__head {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
      }
      .cx-admin-panel .col-xl-6 {
        display: flex;
      }
      .cx-admin-panel .col-xl-6 > .cx-admin-card {
        flex: 1 1 auto;
      }
      .cx-admin-card--column {
        display: flex;
        flex-direction: column;
        height: clamp(420px, calc(100vh - 300px), 820px);
      }
      .cx-admin-card--column > * + * {
        margin-top: 1rem;
      }
      .cx-admin-list {
        flex: 1 1 auto;
        min-height: 0;
        max-height: 1200px; /* ~4 tarjetas visibles */
        overflow-y: auto;
        padding-right: 0.5rem;
      }
      @media (max-width: 991px) {
        .cx-admin-card--column {
          height: auto;
        }
        .cx-admin-list {
          max-height: 420px;
        }
      }
      .cx-admin-row {
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        justify-content: space-between;
        padding: 1.1rem 1.2rem;
        border-radius: 1rem;
        border: 1px solid rgba(255,255,255,0.04);
        background: rgba(255,255,255,0.02);
        margin-bottom: 0.85rem;
        transition: border-color 0.2s ease, transform 0.15s ease;
      }
      .cx-admin-row.is-active {
        border-color: var(--cx-accent);
        transform: translateX(6px);
      }
      .cx-admin-row__title {
        font-weight: 600;
        color: #f8fafc;
      }
      .cx-admin-row__meta {
        font-size: 0.85rem;
        color: #94a3b8;
      }
      .cx-admin-row__desc {
        font-size: 0.9rem;
        color: #cbd5f5;
      }
      .cx-admin-row__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .cx-admin-row__actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 96px;
      }
      .cx-field {
        margin-bottom: 1rem;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.15rem 0.65rem;
        border-radius: 999px;
        font-size: 0.75rem;
        background: rgba(255,255,255,0.08);
        color: #e2e8f0;
      }
      .chip--mini {
        font-size: 0.7rem;
        padding: 0.1rem 0.55rem;
      }
      .cx-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.85rem;
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
        color: #e2e8f0;
        font-size: 0.85rem;
      }
      .cx-empty {
        border: 1px dashed rgba(255,255,255,0.12);
        border-radius: 1rem;
      }
      .cx-admin-toast {
        position: fixed;
        right: 1.5rem;
        bottom: 1.5rem;
        padding: 0.85rem 1.25rem;
        border-radius: 0.85rem;
        background: rgba(34,197,94,0.9);
        color: #fff;
        box-shadow: 0 10px 25px rgba(0,0,0,0.25);
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.25s ease;
        z-index: 1100;
      }
      .cx-admin-toast.show {
        opacity: 1;
        transform: translateY(0);
      }
      .cx-admin-toast.success { background: rgba(34,197,94,0.92); }
      .cx-admin-toast.warning { background: rgba(249,115,22,0.92); }
      .cx-admin-toast.danger { background: rgba(239,68,68,0.92); }
      .cx-admin-toast.info { background: rgba(59,130,246,0.92); }
      .cx-admin-footer footer,
      .cx-admin-footer footer * {
        text-align: left !important;
      }
      .cx-modal {
        position: fixed;
        inset: 0;
        background: rgba(3,6,23,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
        z-index: 1200;
      }
      .cx-modal.show {
        opacity: 1;
        pointer-events: auto;
      }
      .cx-modal__dialog {
        width: min(460px, 95vw);
        background: rgba(13,18,30,0.95);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 1.2rem;
        padding: 1.5rem;
        box-shadow: 0 35px 80px rgba(0,0,0,0.45);
        transform: translateY(20px);
        transition: transform 0.2s ease;
      }
      .cx-modal.show .cx-modal__dialog {
        transform: translateY(0);
      }
      .cx-modal__title {
        font-weight: 600;
        color: #e2e8f0;
        margin-bottom: 0.5rem;
      }
      .cx-modal__body {
        color: #94a3b8;
        font-size: 0.95rem;
        margin-bottom: 1.25rem;
      }
      .cx-modal__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
    </style>
  `;
  return {
    html,
    async bind() {
      initNavbarSessionWatcher();
      updateNavbarSessionUI();
      const ensureLogoutHandler = () => {
        const logoutBtn = document.getElementById('logoutBtn');
        if (!logoutBtn) return;
        logoutBtn.addEventListener('click', async (event) => {
          event.preventDefault();
          const { logout } = await import('../controllers/authController.js');
          await logout();
        });
      };
      ensureLogoutHandler();
      initFooter();
      const container = document.getElementById('adminContent');
      if (!container) return;
      let allowed = false;
      try {
        allowed = await (typeof isAdminFlexible === 'function' ? isAdminFlexible() : isAdmin());
      } catch {
        try {
          allowed = await isAdmin();
        } catch {
          allowed = false;
        }
      }
      if (!allowed) {
        container.innerHTML = `
          <div class="cx-admin-card text-center text-danger-emphasis">
            <div class="mb-3"><i class="bi bi-shield-exclamation display-5"></i></div>
            <h3 class="h5 mb-2">Acceso restringido</h3>
            <p class="mb-0 text-secondary">Tu cuenta no tiene privilegios de administraci&oacute;n.</p>
          </div>
        `;
        return;
      }
      container.innerHTML = `
        <div class="row gx-4 gy-4 cx-admin-layout">
          <div class="col-12 col-xl-3">
            <div class="cx-admin-card sticky-xl-top">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <p class="text-uppercase text-secondary small mb-1">Colecciones</p>
                  <h5 class="mb-0 text-white">Curaci&oacute;n a medida</h5>
                </div>
                <button type="button" class="btn btn-sm btn-outline-light" id="adminQuickRefresh" title="Refrescar secci&oacute;n">
                  <i class="bi bi-arrow-clockwise"></i>
                </button>
              </div>
              <div id="categoryList" class="d-flex flex-column gap-2"></div>
            </div>
          </div>
          <div class="col-12 col-xl-9">
            <div id="adminWorkspace">${PLACEHOLDER_CARD}</div>
          </div>
        </div>
        <div id="adminToast" class="cx-admin-toast"></div>
      `;
      const state = {
        active: DEFAULT_CATEGORY,
        cache: {},
        query: {},
        editingId: null,
        userFilter: '',
        userProfiles: new Map(),
      };
      let toastTimer;
      let ContentModel;
      let XLSXLib;
      const categoryList = document.getElementById('categoryList');
      const workspace = document.getElementById('adminWorkspace');
      const quickRefresh = document.getElementById('adminQuickRefresh');
      const toastEl = document.getElementById('adminToast');
      const createModal = ({ title, confirmText = 'Aceptar', cancelText = 'Cancelar', showCancel = true }) => {
        const overlay = document.createElement('div');
        overlay.className = 'cx-modal';
        overlay.innerHTML = `
          <div class="cx-modal__dialog">
            <div class="cx-modal__title">${title}</div>
            <div class="cx-modal__body"></div>
            <div class="cx-modal__actions">
              ${showCancel ? `<button type="button" class="btn btn-outline-secondary btn-sm" data-modal="cancel">${cancelText}</button>` : ''}
              <button type="button" class="btn btn-primary btn-sm" data-modal="confirm">${confirmText}</button>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));
        const bodyEl = overlay.querySelector('.cx-modal__body');
        const confirmBtn = overlay.querySelector('[data-modal="confirm"]');
        const cancelBtn = overlay.querySelector('[data-modal="cancel"]') || null;
        const close = () => {
          overlay.classList.remove('show');
          setTimeout(() => overlay.remove(), 180);
        };
        return { overlay, bodyEl, confirmBtn, cancelBtn, close };
      };
      const showConfirm = ({ title = 'Confirmar', message = '¿Continuar con la acci&oacute;n?', confirmText = 'Aceptar', cancelText = 'Cancelar' }) =>
        new Promise((resolve) => {
          const modal = createModal({ title, confirmText, cancelText, showCancel: true });
          modal.bodyEl.innerHTML = `<p class="mb-0">${message}</p>`;
          const finish = (result) => {
            modal.close();
            resolve(result);
          };
          modal.confirmBtn.addEventListener('click', () => finish(true));
          modal.cancelBtn?.addEventListener('click', () => finish(false));
        });
      const notify = (message, tone = 'success') => {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.className = `cx-admin-toast show ${tone}`;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          toastEl.classList.remove('show');
        }, 3200);
      };
      const ensureModel = async () => {
        if (!ContentModel) {
          ({ ContentModel } = await import('../models/contentModel.js'));
        }
        return ContentModel;
      };
      const getMeta = (key = state.active) => CATEGORY_CONFIG[key];
      const getDataset = (key = state.active) => state.cache[key] || [];
      const getFilteredItems = () => {
        const data = getDataset();
        const q = (state.query[state.active] || '').trim().toLowerCase();
        const filtered = data.filter((item) => {
          if (state.active === 'resenas' && state.userFilter) {
            if (item.userId !== state.userFilter) return false;
          }

          if (!q) return true;
          const bucket = [
            item.titulo,
            item.title,
            item.obraTitulo,
            item.descripcion,
            item.description,
            item.director,
            item.autor,
            item.franquicia,
            item.plataforma,
            item.userName,
            item.adminUsername,
            item.userEmail,
            item.userId,
            item.id,
            ...(Array.isArray(item.genero) ? item.genero : []),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return bucket.includes(q);
        });
        return filtered;
      };
      const renderCategoryList = () => {
        if (!categoryList) return;
        categoryList.innerHTML = CATEGORY_KEYS.map((key) => {
          const meta = CATEGORY_CONFIG[key];
          const count = formatCount(getDataset(key).length);
          const active = state.active === key ? 'is-active' : '';
          return `
            <button type="button" class="cx-category ${active}" data-category="${key}">
              <div class="cx-category__icon">
                <i class="bi ${meta.icon}"></i>
              </div>
              <div class="text-start">
                <strong class="d-block">${meta.label}</strong>
                <small class="text-secondary">${count} registro(s)</small>
              </div>
              <i class="bi bi-chevron-right ms-auto text-secondary"></i>
            </button>
          `;
        }).join('');
      };
      const setLoadingState = (loading = true) => {
        if (!workspace) return;
        if (loading) {
          workspace.innerHTML = PLACEHOLDER_CARD;
        }
      };
      const sortRecords = (items = []) => {
        const normalizeTitle = (item) =>
          (item.titulo || item.title || item.obraTitulo || item.id || '').toLowerCase();
        return [...items].sort((a, b) =>
          normalizeTitle(a).localeCompare(normalizeTitle(b), 'es', { sensitivity: 'base' })
        );
      };
      const fetchCollection = async (key, { force = false } = {}) => {
        const meta = getMeta(key);
        if (!meta) return [];
        if (!force && state.cache[key]) return state.cache[key];
        const model = await ensureModel();
        let data = await model.listCollection(meta.collection);

        if (key === 'resenas') {
          // Enriquecer con username real desde /users
          let userProfiles = [];
          try {
            userProfiles = await model.listCollection('users');
          } catch (_) {
            userProfiles = [];
          }
          const userMap = new Map();
          userProfiles.forEach((u) => {
            if (!u || !u.id) return;
            const uname = u.username || u.usernameLower || u.nombre || u.email || '';
            userMap.set(u.id, uname);
          });
          state.userProfiles = userMap;
          data = data.map((d) => {
            const username = userMap.get(d.userId) || d.userName || d.userEmail || '';
            return { ...d, adminUsername: username };
          });
        }

        state.cache[key] = sortRecords(data || []);
        return state.cache[key];
      };
      const loadCategory = async (
        key = state.active,
        { silent = false, preserveSelection = false, skipRender = false, force = false } = {}
      ) => {
        const meta = getMeta(key);
        if (!meta) return;
        if (!silent) setLoadingState(true);
        try {
          await fetchCollection(key, { force });
          const shouldRenderWorkspace = !skipRender && key === state.active;
          if (shouldRenderWorkspace) {
            if (!preserveSelection) {
              state.editingId = null;
            } else if (state.editingId && !getDataset(key).some((item) => item.id === state.editingId)) {
              state.editingId = null;
            }
            renderCategoryList();
            renderWorkspace();
          } else {
            renderCategoryList();
          }
        } catch (error) {
          console.error('Error cargando colecci\u00f3n:', error);
          notify('No se pudo cargar la colecci&oacute;n', 'danger');
        }
      };
      const handleDelete = async (meta, id, title) => {
        const confirmDelete = await showConfirm({
          title: 'Eliminar registro',
          message: `\u00bfEliminar "<strong>${escapeHtml(title)}</strong>" de ${meta.label}? Esta acci&oacute;n no se puede deshacer.`,
          confirmText: 'Eliminar',
          cancelText: 'Cancelar',
        });
        if (!confirmDelete) return;
        try {
          const model = await ensureModel();
          await model.deleteFromCollection(meta.collection, id);
          notify('Registro eliminado correctamente', 'success');
          await loadCategory(state.active, { silent: true, preserveSelection: true, force: true });
        } catch (error) {
          console.error('Error eliminando registro:', error);
          notify('No se pudo eliminar el registro', 'danger');
        }
      };
      const handleSubmit = async (event, meta) => {
        event.preventDefault();
        const form = event.currentTarget;
        const submitBtn = form.querySelector('button[type="submit"]');
        const spinner = submitBtn?.querySelector('.spinner-border');
        const label = submitBtn?.querySelector('.label');
        const setBusy = (flag) => {
          if (!submitBtn) return;
          submitBtn.disabled = flag;
          if (spinner) spinner.classList.toggle('d-none', !flag);
          if (label) label.style.opacity = flag ? '0.6' : '1';
        };
        const payload = collectPayload(meta, form);
        let docId = state.editingId;
        if (!state.editingId) {
          const docInput = form.querySelector('#docIdInput');
          docId = slugify(docInput?.value || '');
          if (!docId) {
            notify('Ingresa un identificador v&aacute;lido.', 'warning');
            docInput?.focus();
            return;
          }
          if (getDataset().some((item) => item.id === docId)) {
            notify('Ya existe un registro con ese identificador.', 'warning');
            docInput?.focus();
            return;
          }
        }
        try {
          setBusy(true);
          const model = await ensureModel();
          if (state.editingId) {
            await model.updateInCollection(meta.collection, state.editingId, payload);
            notify('Registro actualizado', 'success');
          } else {
            payload.id = docId;
            await model.setInCollection(meta.collection, docId, payload);
            state.editingId = docId;
            notify('Registro creado', 'success');
          }
          await loadCategory(state.active, { silent: true, preserveSelection: true });
        } catch (error) {
          console.error('Error guardando registro:', error);
          notify('No se pudo guardar el registro', 'danger');
        } finally {
          setBusy(false);
        }
      };
      const handleImport = (meta) => {
        const fieldHints = meta.fields.map((field) => escapeHtml(field.key)).join(', ');
        const modal = createModal({
          title: `Importar ${meta.label}`,
          confirmText: 'Importar',
          cancelText: 'Cerrar',
          showCancel: true,
        });
        modal.confirmBtn.disabled = true;
        modal.bodyEl.innerHTML = `
          <div class="mb-3">
            <label class="form-label small text-secondary">Archivo (.xlsx o .xls)</label>
            <input type="file" class="form-control form-control-sm" accept=".xlsx,.xls" />
          </div>
          <p class="text-secondary small mb-2">
            Los encabezados deben coincidir con las llaves de los campos (ej. ${fieldHints}).
            Las columnas que no coincidan ser&aacute;n ignoradas.
          </p>
          <div class="border border-secondary border-opacity-25 rounded p-2 text-secondary small" data-import-preview>
            Selecciona un archivo para ver el resumen.
          </div>
        `;
        const statusEl = document.createElement('div');
        statusEl.className = 'text-secondary small mt-2';
        modal.bodyEl.appendChild(statusEl);
        let parsedRows = [];
        let fileName = '';
        const fileInput = modal.bodyEl.querySelector('input[type="file"]');
        const previewEl = modal.bodyEl.querySelector('[data-import-preview]');
        const parseRow = (row) => {
          const normalized = {};
          Object.entries(row || {}).forEach(([key, value]) => {
            const normKey = normalizeKey(key);
            if (!normKey) return;
            normalized[normKey] = value;
          });
          const record = {};
          meta.fields.forEach((field) => {
            const candidates = [normalizeKey(field.key), normalizeKey(field.label)];
            let found;
            for (const candidate of candidates) {
              if (Object.prototype.hasOwnProperty.call(normalized, candidate)) {
                found = normalized[candidate];
                break;
              }
            }
            if (typeof found === 'undefined' || found === null || found === '') return;
            if (field.type === 'number') {
              const num = Number(found);
              record[field.key] = Number.isFinite(num) ? num : null;
              return;
            }
            if (field.type === 'tags') {
              record[field.key] = String(found)
                .split(',')
                .map((chunk) => chunk.trim())
                .filter(Boolean);
              return;
            }
            record[field.key] = String(found).trim();
          });
          return Object.keys(record).length ? record : null;
        };
        const buildDocId = (record, index) => {
          const source =
            record.id ||
            record.titulo ||
            record.title ||
            record.obraTitulo ||
            `registro-${meta.collection}-${Date.now()}-${index}`;
          const slug = slugify(source);
          return slug || `registro-${index}-${Date.now()}`;
        };
        fileInput?.addEventListener('change', async (event) => {
          const file = event.target.files?.[0];
          parsedRows = [];
          statusEl.textContent = '';
          if (!file) {
            previewEl.textContent = 'No se seleccion&oacute; archivo.';
            modal.confirmBtn.disabled = true;
            return;
          }
          previewEl.textContent = 'Procesando archivo...';
          modal.confirmBtn.disabled = true;
          fileName = file.name;
          try {
            if (!XLSXLib) {
              XLSXLib = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
            }
            const data = await file.arrayBuffer();
            const workbook = XLSXLib.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSXLib.utils.sheet_to_json(sheet, { defval: '' });
            parsedRows = rows.map((row) => parseRow(row)).filter(Boolean);
            if (!parsedRows.length) {
              previewEl.textContent = 'No se encontraron filas v&aacute;lidas en la hoja.';
              return;
            }
            const sample = parsedRows
              .slice(0, 3)
              .map((row, idx) => `&bull; ${escapeHtml(row.titulo || row.title || row.obraTitulo || `Registro ${idx + 1}`)}`)
              .join('<br>');
            previewEl.innerHTML = `
              <strong>${parsedRows.length}</strong> registro(s) listos para importar desde <em>${escapeHtml(fileName)}</em>.
              <div class="mt-2 text-secondary small">${sample}</div>
            `;
            modal.confirmBtn.disabled = false;
          } catch (error) {
            console.error('Error leyendo Excel:', error);
            previewEl.textContent = 'No se pudo leer el archivo. Verifica que sea un .xlsx v&aacute;lido.';
          }
        });
        modal.cancelBtn?.addEventListener('click', () => modal.close());
        modal.confirmBtn.addEventListener('click', async () => {
          if (!parsedRows.length) return;
          modal.confirmBtn.disabled = true;
          const originalText = modal.confirmBtn.textContent;
          modal.confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Importando...';
          statusEl.textContent = '';
          try {
            const model = await ensureModel();
            let index = 0;
            for (const record of parsedRows) {
              const docId = buildDocId(record, index++);
              const payload = { ...record, id: docId };
              await model.setInCollection(meta.collection, docId, payload);
            }
            notify(`Importados ${parsedRows.length} registro(s)`, 'success');
            modal.close();
            await loadCategory(state.active, { silent: true, preserveSelection: true, force: true });
          } catch (error) {
            console.error('Error importando registros:', error);
            statusEl.textContent = 'Ocurri&oacute; un error durante la importaci&oacute;n. Revisa la consola para m&aacute;s detalles.';
            modal.confirmBtn.disabled = false;
            modal.confirmBtn.textContent = originalText;
          }
        });
      };
      const bindWorkspaceEvents = (meta) => {
        if (!workspace) return;
        workspace.style.setProperty('--cx-accent', meta.accent);
        workspace.querySelector('[data-action="refresh"]')?.addEventListener('click', () => {
          loadCategory(state.active, { silent: false, preserveSelection: true, force: true });
        });
                workspace.querySelectorAll('[data-action="import"]').forEach((btn) =>
          btn.addEventListener('click', () => handleImport(meta))
        );
        workspace.querySelectorAll('[data-action="new"]').forEach((btn) =>
          btn.addEventListener('click', () => {
            state.editingId = null;
            renderWorkspace();
          })
        );
        workspace.querySelectorAll('[data-action="clear"]').forEach((btn) =>
          btn.addEventListener('click', () => {
            state.editingId = null;
            renderWorkspace();
          })
        );
        const searchInput = workspace.querySelector('#adminSearch');
        if (searchInput) {
          searchInput.addEventListener('input', (event) => {
            state.query[state.active] = event.target.value;
            renderWorkspace();
          });
        }
        const userFilter = workspace.querySelector('#userFilter');
        if (userFilter) {
          userFilter.addEventListener('change', (event) => {
            state.userFilter = event.target.value;
            renderWorkspace();
          });
        }
        const list = workspace.querySelector('#adminList');
        if (list) {
          list.addEventListener('click', (event) => {
            const btn = event.target.closest('[data-item-action]');
            if (btn) {
              const action = btn.getAttribute('data-item-action');
              const id = btn.getAttribute('data-id');
              if (!id) return;
              if (action === 'edit') {
                state.editingId = id;
                renderWorkspace();
              } else if (action === 'delete') {
                const title = btn.getAttribute('data-title') || id;
                handleDelete(meta, id, title);
              }
              event.stopPropagation();
              return;
            }
            const row = event.target.closest('.cx-admin-row');
            if (row) {
              state.editingId = row.getAttribute('data-id');
              renderWorkspace();
            }
          });
        }
        const form = workspace.querySelector('#adminForm');
        if (form) {
          form.addEventListener('submit', (event) => handleSubmit(event, meta));
          enhanceChipInputs(form);
          initSlugHelper(form);
        }
      };
      const renderWorkspace = () => {
        if (!workspace) return;
        const meta = getMeta();
        if (!meta) return;
        if (meta.key !== 'resenas') {
          state.userFilter = '';
        }
        const items = getFilteredItems();
        const dataset = getDataset();
        const editingData = state.editingId ? dataset.find((item) => item.id === state.editingId) : null;
        const searchValue = state.query[state.active] || '';
        const userFilterOptions =
          meta.key === 'resenas'
            ? Array.from(state.userProfiles.entries())
                .map(([uid, uname]) => ({ uid, uname: uname || `UID: ${uid.slice(0, 6)}...` }))
                .sort((a, b) => a.uname.localeCompare(b.uname, 'es', { sensitivity: 'base' }))
            : [];
        workspace.style.setProperty('--cx-accent', meta.accent);
        workspace.innerHTML = `
          <div class="cx-admin-panel">
            <div class="cx-admin-panel__head">
              <div>
                <span class="badge text-bg-dark border border-opacity-50 mb-2">${meta.label}</span>
                <h3 class="text-white mb-1">${meta.description}</h3>
                <p class="text-secondary mb-0">${dataset.length ? `${formatCount(dataset.length)} registro(s)` : 'A&uacute;n no hay registros'}</p>
              </div>
              <div class="d-flex flex-column flex-sm-row gap-2">
                <button class="btn btn-outline-light btn-sm" data-action="refresh">
                  <i class="bi bi-arrow-repeat me-1"></i> Refrescar
                </button>
                <button class="btn btn-outline-secondary btn-sm" data-action="import">
                  <i class="bi bi-upload me-1"></i> Importar Excel
                </button>
                <button class="btn btn-primary btn-sm" data-action="new">
                  <i class="bi bi-plus-lg me-1"></i> Nuevo registro
                </button>
              </div>
            </div>
            <div class="row g-4 align-items-stretch">
              <div class="col-xl-6">
                <div class="cx-admin-card cx-admin-card--column h-100">
                  <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3">
                    <div>
                      <p class="text-secondary small mb-0">Colecci&oacute;n ${meta.collection}</p>
                      <h6 class="mb-0 text-white">${items.length} resultado(s)</h6>
                    </div>
                    <div class="w-100 w-sm-auto">
                      <div class="input-group input-group-sm">
                        <span class="input-group-text bg-dark border-dark text-secondary"><i class="bi bi-search"></i></span>
                        <input
                          id="adminSearch"
                          type="text"
                          class="form-control form-control-sm bg-dark text-white border-dark"
                          placeholder="Buscar t&iacute;tulo, id o g&eacute;nero"
                          value="${escapeHtml(searchValue)}"
                        />
                      </div>
                      ${
                        meta.key === 'resenas'
                          ? `
                          <div class="input-group input-group-sm mt-2">
                            <span class="input-group-text bg-dark border-dark text-secondary"><i class="bi bi-person"></i></span>
                            <select id="userFilter" class="form-select form-select-sm bg-dark border-dark text-white">
                              <option value="">Todos los usuarios</option>
                              ${userFilterOptions
                                .map((u) => `<option value="${escapeHtml(u.uid)}" ${state.userFilter === u.uid ? 'selected' : ''}>${escapeHtml(u.uname)}</option>`)
                                .join('')}
                            </select>
                          </div>
                          `
                          : ''
                      }
                    </div>
                  </div>
                  <div id="adminList" class="cx-admin-list scrollbar-dark">
                    ${renderListItems(items, state.editingId, meta)}
                  </div>
                </div>
              </div>
              <div class="col-xl-6">
                <div class="cx-admin-card cx-admin-card--column h-100">
                  <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <p class="text-secondary small mb-1">${state.editingId ? 'Editando registro' : 'Nuevo registro'}</p>
                      <h6 class="mb-0 text-white">
                        ${
                          state.editingId
                            ? escapeHtml(editingData?.titulo || editingData?.title || editingData?.id || 'Registro sin t&iacute;tulo')
                            : 'Completa el formulario'
                        }
                      </h6>
                    </div>
                    ${
                      state.editingId
                        ? `<button class="btn btn-link text-secondary p-0" data-action="clear"><i class="bi bi-x-circle me-1"></i>Limpiar</button>`
                        : ''
                    }
                  </div>
                  <form id="adminForm">
                    ${renderForm(meta, editingData)}
                    <div class="d-flex gap-2 mt-4">
                      ${
                        state.editingId
                          ? `<button type="button" class="btn btn-outline-secondary flex-grow-1" data-action="clear">Cancelar</button>`
                          : ''
                      }
                      <button type="submit" class="btn btn-primary flex-grow-1">
                        <span class="label">${state.editingId ? 'Guardar cambios' : 'Crear registro'}</span>
                        <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        `;
        bindWorkspaceEvents(meta);
      };
      categoryList?.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-category]');
        if (!btn) return;
        const key = btn.getAttribute('data-category');
        if (!key || !CATEGORY_CONFIG[key] || state.active === key) return;
        state.active = key;
        state.editingId = null;
        state.query[key] = state.query[key] || '';
        renderCategoryList();
        renderWorkspace();
        loadCategory(key, { silent: true });
      });
      quickRefresh?.addEventListener('click', () => {
        loadCategory(state.active, { silent: false, preserveSelection: true, force: true });
      });
      renderCategoryList();
      renderWorkspace();
      await loadCategory(DEFAULT_CATEGORY);
    },
  };
}
