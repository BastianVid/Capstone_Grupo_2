import { Navbar } from "./shared/navbar.js";
import { initNavbarSessionWatcher, updateNavbarSessionUI } from './shared/navbarSession.js';
import { isAdmin, isAdminFlexible } from "../controllers/authController.js";
import { auth } from "../lib/firebase.js";

export function AdminView() {
  const html = `
    ${Navbar()}
    <div class="container py-4">
      <h1 class="h3 mb-3"><i class="bi bi-speedometer2"></i> Panel de Administración</h1>
      <div id="adminContent" class="text-center text-secondary py-5">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <p>Verificando permisos...</p>
      </div>
    </div>
  `;

  return {
    html,
    async bind() {
      // Sincroniza estado de sesión en el navbar
      initNavbarSessionWatcher();
      updateNavbarSessionUI();
      const user = auth.currentUser;
      const container = document.getElementById("adminContent");

            let allowed = false;
      try {
        allowed = await (typeof isAdminFlexible === 'function' ? isAdminFlexible() : isAdmin());
      } catch {
        try { allowed = await isAdmin(); } catch { allowed = false; }
      }
      if (!allowed) {
        container.innerHTML = `
          <div class="alert alert-danger">
            <i class="bi bi-x-circle"></i> No tienes permiso para acceder a esta sección.
          </div>
        `;
        return;
      }

      // ✅ Si es admin, carga el panel
      container.innerHTML = `
        <div class="card bg-dark border-0 shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-3">Gestión de Contenido</h5>
            <div class="d-flex flex-wrap gap-3">
              <a href="#/admin/peliculas" class="btn btn-outline-primary"><i class="bi bi-film"></i> Películas</a>
              <a href="#/admin/series" class="btn btn-outline-primary"><i class="bi bi-collection-play"></i> Series</a>
              <a href="#/admin/anime" class="btn btn-outline-primary"><i class="bi bi-tv"></i> Anime</a>
              <a href="#/admin/musica" class="btn btn-outline-primary"><i class="bi bi-music-note-beamed"></i> Música</a>
              <a href="#/admin/libros" class="btn btn-outline-primary"><i class="bi bi-book"></i> Libros</a>
              <a href="#/admin/videojuegos" class="btn btn-outline-primary"><i class="bi bi-controller"></i> Videojuegos</a>
            </div>
          </div>
        </div>
      `;

      // Panel dinámico para CRUD
      const cardBody = container.querySelector('.card-body');
      const panel = document.createElement('div');
      panel.id = 'adminPanel';
      panel.className = 'mt-3';
      cardBody?.appendChild(panel);

      // Render de sección con CRUD mínimo
      async function renderSection(section) {
        const titleMap = { peliculas:'Películas', series:'Series', anime:'Anime', musica:'Música', libros:'Libros', videojuegos:'Videojuegos' };
        panel.innerHTML = `
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="m-0">Gestión de ${titleMap[section] || section}</h6>
            <div class="d-flex gap-2">
              <button id="btnRefresh" class="btn btn-sm btn-outline-light">Refrescar</button>
              <button id="btnAdd" class="btn btn-sm btn-primary"><i class="bi bi-plus-lg"></i> Agregar</button>
            </div>
          </div>
          <div id="crudAlert" class="alert d-none" role="alert"></div>
          <div class="table-responsive">
            <table class="table table-dark table-sm align-middle">
              <thead><tr><th style="width:40%">Título</th><th>ID</th><th style="width:160px">Acciones</th></tr></thead>
              <tbody id="itemsBody"><tr><td colspan="3" class="text-secondary">Cargando...</td></tr></tbody>
            </table>
          </div>
        `;

        const showMsg = (msg, type='info') => {
          const box = document.getElementById('crudAlert');
          if (!box) return;
          box.className = `alert alert-${type}`;
          box.textContent = msg;
          box.classList.remove('d-none');
          setTimeout(() => box.classList.add('d-none'), 3000);
        };

        const { ContentModel } = await import('../models/contentModel.js');

        async function load() {
          const data = await ContentModel.listCollection(section).catch(() => []);
          const body = document.getElementById('itemsBody');
          if (!data.length) {
            body.innerHTML = `<tr><td colspan="3" class="text-secondary">Sin elementos</td></tr>`;
            return;
          }
          body.innerHTML = data.map(it => `
            <tr>
              <td>${it.titulo || it.title || '(Sin título)'}</td>
              <td class="text-secondary small">${it.id}</td>
              <td>
                <button class="btn btn-sm btn-outline-light me-1" data-action="edit" data-id="${it.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" data-action="del" data-id="${it.id}"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          `).join('');
        }

        await load();

        panel.querySelector('#btnRefresh')?.addEventListener('click', load);
        panel.querySelector('#btnAdd')?.addEventListener('click', async () => {
          const titulo = prompt('Título del nuevo elemento:');
          if (!titulo) return;
          try { await ContentModel.addToCollection(section, { titulo }); await load(); showMsg('Elemento agregado', 'success'); }
          catch { showMsg('No se pudo agregar'); }
        });

        panel.querySelector('#itemsBody')?.addEventListener('click', async (e) => {
          const btn = e.target.closest('button');
          if (!btn) return;
          const id = btn.getAttribute('data-id');
          const action = btn.getAttribute('data-action');
          if (action === 'del') {
            if (!confirm('¿Eliminar elemento?')) return;
            try { await ContentModel.deleteFromCollection(section, id); await load(); showMsg('Eliminado', 'success'); } catch { showMsg('No se pudo eliminar'); }
          } else if (action === 'edit') {
            const nuevo = prompt('Nuevo título:');
            if (!nuevo) return;
            try { await ContentModel.updateInCollection(section, id, { titulo: nuevo }); await load(); showMsg('Actualizado', 'success'); } catch { showMsg('No se pudo actualizar'); }
          }
        });
      }

      // Delegación: clicks en enlaces /admin/* cargan sección sin cambiar ruta
      container.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#/admin/"]');
        if (!a) return;
        e.preventDefault();
        const parts = (a.getAttribute('href') || '').split('/');
        const section = parts[2] || 'peliculas';
        renderSection(section);
      });

      // Sección por defecto
      renderSection('peliculas');
    },
  };
}


