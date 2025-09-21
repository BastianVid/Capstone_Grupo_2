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

  startAutoPlay();
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
