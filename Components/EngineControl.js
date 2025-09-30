const pageTitle = document.getElementById("pageTitle");
const carousel = document.getElementById("carousel");
const buttonContainer = document.getElementById("carousel-buttons");

let machines = [];
let data = {};
let currentIndex = 0;
let lang = document.querySelector(".selected").dataset.value;

async function fetchData() {
  const response = await fetch("Assets/Data/Engine.json");
  data = await response.json();
  machines = ["boiler", "engine", "fullEngine", "engineRoom"];
  buildCarousel();
}

//création carousel
function buildCarousel() {
  const previousIndex = currentIndex;

  carousel.innerHTML = "";
  buttonContainer.innerHTML = "";

  machines.forEach((key, index) => {
    const machine = data[key];

    const slide = document.createElement("div");
    slide.className = "slide";

    // ❌ On supprime le <h2> qui se superpose
    // const title = document.createElement("h2");
    // title.textContent = machine.title[lang];

    const img = document.createElement("img");
    img.src = machine.image;
    img.alt = machine.title[lang];
    img.title = machine.title[lang]; // ✅ affichage en tooltip

    // slide.appendChild(title); // supprimé
    slide.appendChild(img);
    carousel.appendChild(slide);

    const btn = document.createElement("button");
    btn.textContent = machine.title[lang];
    if (index === previousIndex) btn.classList.add("active");
    btn.addEventListener("click", () => {
      goToSlide(index);
    });
    buttonContainer.appendChild(btn);
  });

  pageTitle.textContent = data.pageTitle.text[lang];
  goToSlide(previousIndex, false);
}


//changement d'élément
function goToSlide(index, smooth = true) {
  carousel.scrollTo({
    left: index * window.innerWidth,
    behavior: smooth ? "smooth" : "auto",
  });
  currentIndex = index;
  updateButtons(index);
}

carousel.addEventListener("scroll", () => {
  const newIndex = Math.round(carousel.scrollLeft / window.innerWidth);
  if (newIndex !== currentIndex) {
    currentIndex = newIndex;
    updateButtons(currentIndex);
  }
});

//maj bouton éclairé
function updateButtons(activeIndex) {
  const buttons = document.querySelectorAll(".carousel-buttons button");
  buttons.forEach((btn, i) => {
    btn.classList.toggle("active", i === activeIndex);
  });
}

//choix langue
const langSelect = document.getElementById("custom-select");
const selectedOption = langSelect.querySelector(".selected-option");
const optionsList = document.getElementById("select-options");

langSelect.addEventListener("click", () => {
  optionsList.style.display =
    optionsList.style.display === "block" ? "none" : "block";
});

optionsList.querySelectorAll("li").forEach((option) => {
  option.addEventListener("click", () => {
    selectedOption.textContent = option.textContent;
    lang = option.dataset.value;

    optionsList
      .querySelectorAll("li")
      .forEach((li) => li.classList.remove("selected"));
    option.classList.add("selected");

    optionsList.style.display = "none";
    buildCarousel();
  });
});

document.addEventListener("click", (e) => {
  if (!langSelect.contains(e.target) && !optionsList.contains(e.target)) {
    optionsList.style.display = "none";
  }
});

// 👆 Ajout swipe tactile
let startX = 0;
let isSwiping = false;

carousel.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
  isSwiping = true;
});

carousel.addEventListener("touchmove", (e) => {
  if (!isSwiping) return;
  const deltaX = e.touches[0].clientX - startX;

  // Ne rien faire si le geste est trop petit
  if (Math.abs(deltaX) < 50) return;

  isSwiping = false;
  if (deltaX < 0 && currentIndex < machines.length - 1) {
    goToSlide(currentIndex + 1);
  } else if (deltaX > 0 && currentIndex > 0) {
    goToSlide(currentIndex - 1);
  }
});

fetchData();
