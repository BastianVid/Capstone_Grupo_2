// ============================== SLIDER ==============================
document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelector(".slides");
  const images = document.querySelectorAll(".slides img");
  const totalSlides = images.length;

  const prevBtn = document.querySelector(".prev");
  const nextBtn = document.querySelector(".next");
  const dotsContainer = document.querySelector(".dots");

  let index = 0;
  let interval;

  if (slides && images.length > 0) {
    // Crear los dots dinámicamente
    images.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.classList.add("dot");
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => showSlide(i));
      dotsContainer.appendChild(dot);
    });
    const dots = document.querySelectorAll(".dot");

    function showSlide(i) {
      index = i;
      slides.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach(dot => dot.classList.remove("active"));
      dots[index].classList.add("active");
    }

    function nextSlide() {
      index = (index + 1) % totalSlides;
      showSlide(index);
    }

    function prevSlide() {
      index = (index - 1 + totalSlides) % totalSlides;
      showSlide(index);
    }

    function startAutoPlay() {
      interval = setInterval(nextSlide, 4000);
    }
    function stopAutoPlay() {
      clearInterval(interval);
    }

    nextBtn?.addEventListener("click", () => {
      nextSlide();
      stopAutoPlay();
      startAutoPlay();
    });

    prevBtn?.addEventListener("click", () => {
      prevSlide();
      stopAutoPlay();
      startAutoPlay();
    });

    startAutoPlay();
  }
});

// ============================== TOGGLE PASSWORD ==============================
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = btn.previousElementSibling; 
    if (input.type === "password") {
      input.type = "text";
      btn.textContent = "🔓"; 
    } else {
      input.type = "password";
      btn.textContent = "🔒"; 
    }
  });
});

// ============================== LISTAS DINÁMICAS ==============================
import { obtenerColeccion } from "./firebase.js";

document.addEventListener("DOMContentLoaded", async () => {
  const lista = document.getElementById("lista-items");
  const tipo = lista?.dataset.tipo; // 🔑 Detecta si el HTML tiene un data-tipo

  if (lista && tipo) {
    try {
      lista.innerHTML = "<p>Cargando...</p>";
      const items = await obtenerColeccion(tipo);
      lista.innerHTML = "";

      if (items.length === 0) {
        lista.innerHTML = "<p>No hay elementos disponibles.</p>";
        return;
      }

      items.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("item-card");

        card.innerHTML = `
          <img src="${item.imagen}" alt="${item.titulo}">
          <h3>${item.titulo}</h3>
          <p>${item.descripcion}</p>
          <a href="plantilla.html?tipo=${tipo}&id=${item.id}" class="btn">Leer reseña</a>
        `;

        lista.appendChild(card);
      });
    } catch (error) {
      console.error("❌ Error cargando colección:", error);
      lista.innerHTML = "<p>Error al cargar los datos.</p>";
    }
  }
});
