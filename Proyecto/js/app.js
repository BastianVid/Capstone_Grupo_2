document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelector(".slides");
  const images = document.querySelectorAll(".slides img");
  const totalSlides = images.length;

  const prevBtn = document.querySelector(".prev");
  const nextBtn = document.querySelector(".next");
  const dotsContainer = document.querySelector(".dots");

  let index = 0;
  let interval;

  // Crear los dots dinámicamente
  images.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.classList.add("dot");
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => showSlide(i));
    dotsContainer.appendChild(dot);
  });
  const dots = document.querySelectorAll(".dot");

  // Mostrar slide específico
  function showSlide(i) {
    index = i;
    slides.style.transform = `translateX(-${index * 100}%)`;

    // Actualizar dots
    dots.forEach(dot => dot.classList.remove("active"));
    dots[index].classList.add("active");
  }

  // Mostrar siguiente
  function nextSlide() {
    index = (index + 1) % totalSlides;
    showSlide(index);
  }

  // Mostrar anterior
  function prevSlide() {
    index = (index - 1 + totalSlides) % totalSlides;
    showSlide(index);
  }

  // Auto play
  function startAutoPlay() {
    interval = setInterval(nextSlide, 4000);
  }

  function stopAutoPlay() {
    clearInterval(interval);
  }

  // Eventos botones
  nextBtn.addEventListener("click", () => {
    nextSlide();
    stopAutoPlay();
    startAutoPlay();
  });

  prevBtn.addEventListener("click", () => {
    prevSlide();
    stopAutoPlay();
    startAutoPlay();
  });

  // Iniciar
  startAutoPlay();
});
