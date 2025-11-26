// ============================== IMPORTS ==============================
import { Navbar, initNavbarSearch } from "./shared/navbar.js";
import { Footer } from "./shared/footer.js";
import { ContentModel } from "../models/contentModel.js";
import { renderCards } from "./shared/renderCards.js";
import { resolveImagePath } from "./shared/resolve-image-path.js";
import { updateNavbarSessionUI, initNavbarSessionWatcher } from "./shared/navbarSession.js";

// ============================== PROXIMAMENTE VIEW ==============================
export function ProximamenteView() {
  const html = `
    ${Navbar()}
    <div class="container py-4" data-category-top="proximamente">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 class="h3 mb-0"><i class="bi bi-hourglass-split"></i> Próximamente</h1>
      </div>

      <div id="proxGrid"></div>
    </div>
    ${Footer()}
  `;

  return {
    html,
    async bind() {
      // === Navbar + sesión ===
      initNavbarSessionWatcher();
      updateNavbarSessionUI();
      initNavbarSearch();

      // Función para hacer scroll al inicio
      const categoryTop = document.querySelector('[data-category-top="proximamente"]');
      const scrollToTop = () =>
        categoryTop?.scrollIntoView({ behavior: "smooth", block: "start" });

      // === Obtener datos de Firestore ===
      const raw = await ContentModel.listProximamente();

      // Normalizar los datos
      const data = (raw || []).map(x => ({
        id: x.id,
        title: x.titulo ?? "Sin título",
        img: resolveImagePath(x.imagen ?? "placeholder.jpg"),
        tag: x.genero?.[0] ?? "Próximamente",
        genres: x.genero ?? [],
        subtitle: String(x.año ?? ""),
        description: x.descripcion ?? "",
      }));

      // === Renderizar tarjetas ===
      renderCards("#proxGrid", data, {
        showDescription: false,
        ctaText: "Ver más",
        onCardClick: (item) => {
          // Al hacer click, se guarda la información en sessionStorage
          sessionStorage.setItem("detalleItem", JSON.stringify(item));
          sessionStorage.setItem("detalleCategoria", "proximamente");
          // Redirigir a la vista de detalles
          location.hash = "#/detalle";
        },
      });

      // Hacer scroll al inicio del contenedor
      document.getElementById("proxGrid")?.scrollIntoView({ behavior: "smooth" });

      // === Logout ===
      document.getElementById("logoutBtn")?.addEventListener("click", async () => {
        const { logout } = await import("../controllers/authController.js");
        logout();
      });
    },
  };
}
