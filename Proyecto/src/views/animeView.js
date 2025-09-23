import { Navbar } from './navbar.js';
import { renderCards } from './shared/renderCards.js';
import { updateNavbarSessionUI, initNavbarSessionWatcher  } from './navbarSession.js';

export function AnimeView() {
  const html = `
    ${Navbar()}
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 class="h3 mb-0"><i class="bi bi-emoji-smile"></i> Anime</h1>
        <div class="input-group w-auto">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input id="q" class="form-control" placeholder="Buscar anime...">
        </div>
      </div>

      <div id="grid"></div>
    </div>
  `;

  return {
    html,
    async bind() {
      // Actualiza el estado del navbar según la sesión
      initNavbarSessionWatcher();
      updateNavbarSessionUI();

      // Carga datos desde Firestore (colección "anime")
      const { ContentModel } = await import('../models/contentModel.js');
      let data = await ContentModel.listAnime();

      // Normaliza por si tus campos tienen otros nombres en Firestore
      const normalize = (arr) =>
        (arr || []).map((x) => ({
          id: x.id,
          title: x.title ?? x.name ?? 'Sin título',
          img: x.img ?? x.image ?? './src/assets/img/naruto.jpg',
          tag: x.tag ?? x.genre ?? 'Anime',
          subtitle: x.studio ?? x.year ?? '',
          description: x.description ?? x.synopsis ?? '',
        }));

      data = normalize(data);

      // Dibuja grilla
      const draw = (arr) =>
        renderCards('#grid', arr, {
          showDescription: true,
          ctaText: 'Leer reseña',
          onCardClick: (item) => {
            // TODO: cuando implementes detalle (#/anime/:id) navega allí:
            // import { navigate } from '../core/router.js'; navigate(`/anime/${item.id}`);
            alert(`Próximamente reseña de: ${item.title}`);
          },
        });

      draw(data);

      // Filtro básico por título
      const q = document.getElementById('q');
      q?.addEventListener('input', (e) => {
        const v = String(e.target.value || '').toLowerCase().trim();
        draw(data.filter((x) => x.title.toLowerCase().includes(v)));
      });

      // Logout en navbar
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });

      document.getElementById('siteSearch')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = e.currentTarget.querySelector('input').value.trim();
      if (q) sessionStorage.setItem('cx:q', q);
      location.hash = '#/peliculas';
      });

    },
  };
}
