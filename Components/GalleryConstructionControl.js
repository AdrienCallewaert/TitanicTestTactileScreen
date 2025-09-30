document.addEventListener("DOMContentLoaded", async () => {
  const langSelectWrapper = document.getElementById("custom-select");
  const selectedOption = langSelectWrapper.querySelector(".selected-option");
  const optionsList = document.getElementById("select-options");
  let lang = optionsList.querySelector(".selected").dataset.value;
  const portfolio = document.getElementById("portfolio");
  let data;
  let currentIndex = 0;

  async function fetchGalleryData() {
    try {
      const res = await fetch("Assets/Data/Gallery.json");
      if (!res.ok) throw new Error("Fichier JSON introuvable.");
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchImageData() {
    const res = await fetch("Assets/Data/GalleryImagesConstruction.json");
    return await res.json();
  }

  //maj texte selon langue
  function updateTextContent() {
    if (!data) return;

    document.getElementById("pageTitleConstruction").textContent =
      data.pageTitleConstruction?.text?.[lang] || "Construction Page";

    const ids = [
      "Harland",
      "InsideConstruction",
      "OutsideConstruction",
      "Hull",
      "Funnel",
      "Stern",
      "Propellers",
      "ElectricMotor",
      "SteamMotor",
      "Ventilation",
      "Windows",
      "Anchor",
      "Lifeboat",
      "Finish",
      "Layout",
      "StockingPlaces",
      "Other",
    ];

    ids.forEach((id) => {
      const el = document.getElementById(`title${id}`);
      if (el && data[`title${id}`]?.text?.[lang]) {
        el.textContent = data[`title${id}`].text[lang];
      }
    });
  }

  //affichage images
  function showImage(index) {
    const images = Array.from(
      document.querySelectorAll("#portfolio .tile img")
    );
    if (index < 0) index = images.length - 1;
    if (index >= images.length) index = 0;
    currentIndex = index;

    const lightbox = document.getElementById("lightbox");
    const lightboxImage = lightbox.querySelector(".lightbox-image");

    lightboxImage.src = images[currentIndex].src;
    lightboxImage.alt = images[currentIndex].alt;
    lightbox.classList.remove("hidden");
  }

  //affiche images selon filtre
  function showImageFromElement(imgElement) {
    const images = Array.from(
      document.querySelectorAll("#portfolio .tile img")
    );
    const index = images.indexOf(imgElement);
    if (index !== -1) showImage(index);
  }

  //chargement de toutes les images sur la page
  async function loadGalleryImages() {
    try {
      const imageData = await fetchImageData();
      const categories = Object.entries(imageData);
      const totalImages = categories.reduce(
        (sum, [_, paths]) => sum + paths.length,
        0
      );
      let loadedImages = 0;

      const updateLoader = () => {
        loadedImages++;
        const percent = Math.round((loadedImages / totalImages) * 100);
        document.getElementById("loader-bar").style.width = `${percent}%`;
        document.getElementById(
          "loader-text"
        ).textContent = `Chargement… ${percent}%`;

        if (loadedImages === totalImages) {
          setTimeout(() => {
            document.getElementById("loader").style.display = "none";
            $("#portfolio").mixItUp("filter", "all"); // DÉCLENCHER ICI une fois toutes les images chargées
          }, 500);
        }
      };

      const loadSingleImage = (category, path) => {
        return new Promise((resolve) => {
          const tile = document.createElement("div");
          tile.className = `tile scale-anm ${category}`;

          const img = new Image();
          img.src = path;
          img.alt = `${category} image`;

          img.onload = () => {
            tile.appendChild(img);
            portfolio.appendChild(tile);

            img.addEventListener("click", () => showImageFromElement(img));
            img.addEventListener("touchstart", () => showImageFromElement(img));

            updateLoader();
            resolve();
          };

          img.onerror = () => {
            console.warn("Image introuvable :", path);
            updateLoader();
            resolve();
          };
        });
      };

      // Chargement des images une par une
      for (const [category, imagePaths] of categories) {
        for (const path of imagePaths) {
          await loadSingleImage(category, path);
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des images :", error);
    }
  }

  // Affiche/cache le menu déroulant des langues
  langSelectWrapper.addEventListener("click", () => {
    optionsList.style.display =
      optionsList.style.display === "block" ? "none" : "block";
  });

  // Ferme si on clique ailleurs
  document.addEventListener("click", (e) => {
    if (
      !langSelectWrapper.contains(e.target) &&
      !optionsList.contains(e.target)
    ) {
      optionsList.style.display = "none";
    }
  });

  //choix langue
  optionsList.querySelectorAll("li").forEach((option) => {
    option.addEventListener("click", () => {
      selectedOption.textContent = option.textContent;
      lang = option.dataset.value;
      optionsList
        .querySelectorAll("li")
        .forEach((li) => li.classList.remove("selected"));
      option.classList.add("selected");
      optionsList.style.display = "none";
      updateTextContent();
    });
  });

  //filtres
  function initMixitup() {
    jQuery("#portfolio").mixItUp({
      selectors: {
        target: ".tile",
        filter: ".filter",
        sort: ".sort-btn",
      },
      animation: {
        animateResizeContainer: false,
        effects: "fade scale",
      },
    });
  }

  //lightbox de mise en avant d'une image
  function initLightbox() {
    const lightbox = document.getElementById("lightbox");
    const closeBtn = lightbox.querySelector(".close");
    const nextBtn = lightbox.querySelector(".next");
    const prevBtn = lightbox.querySelector(".prev");

    closeBtn.addEventListener("click", () => lightbox.classList.add("hidden"));
    nextBtn.addEventListener("click", () => showImage(currentIndex + 1));
    prevBtn.addEventListener("click", () => showImage(currentIndex - 1));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") lightbox.classList.add("hidden");
      if (e.key === "ArrowRight") showImage(currentIndex + 1);
      if (e.key === "ArrowLeft") showImage(currentIndex - 1);
    });
  }

  data = await fetchGalleryData();
  updateTextContent();

  await loadGalleryImages();
  initMixitup();
  initLightbox();
});
