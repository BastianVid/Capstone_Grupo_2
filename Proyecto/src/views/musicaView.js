import { Navbar } from './navbar.js';
import { renderCards } from './shared/renderCards.js';
import { updateNavbarSessionUI } from './navbarSession.js';

export function MusicaView() {
  const html = `
    ${Navbar()}
    <div class="container py-4">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 class="h3 mb-0"><i class="bi bi-music-note-beamed"></i> Música</h1>
        <div class="input-group w-auto">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input id="q" class="form-control" placeholder="Buscar canciones, álbumes o artistas...">
        </div>
      </div>

      <div id="grid"></div>
    </div>
  `;

  return {
    html,
    async bind() {
      // Actualiza estado del navbar según sesión
      updateNavbarSessionUI();

      // 1) Datos desde Firestore (colección "musica")
      const { ContentModel } = await import('../models/contentModel.js');
      let data = await ContentModel.listMusica();

      // 2) Normaliza campos
      const normalize = (arr) =>
        (arr || []).map((x) => ({
          id: x.id,
          title: x.title ?? x.name ?? 'Sin título',
          img: x.img ?? x.image ?? './src/assets/img/avatar.jpg',
          tag: x.genre ?? 'Música',
          subtitle: x.artist ? (x.album ? `${x.artist} • ${x.album}` : x.artist) : (x.year ?? ''),
          description: x.description ?? x.synopsis ?? '',
        }));
      data = normalize(data);

      // 3) Render cards
      const draw = (arr) =>
        renderCards('#grid', arr, {
          showDescription: true,
          ctaText: 'Ver detalle',
          onCardClick: (item) => {
            // import { navigate } from '../core/router.js'; navigate(`/musica/${item.id}`);
            alert(`Próximamente detalle de: ${item.title}`);
          },
        });
      draw(data);

      // 4) Búsqueda en vivo
      const q = document.getElementById('q');
      q?.addEventListener('input', (e) => {
        const v = String(e.target.value || '').toLowerCase().trim();
        draw(
          data.filter((x) =>
            [x.title, x.subtitle, x.tag]
              .filter(Boolean)
              .some((f) => String(f).toLowerCase().includes(v))
          )
        );
      });

      // 5) Logout
      document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        const { logout } = await import('../controllers/authController.js');
        logout();
      });
    },
  };
}
