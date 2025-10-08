document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.querySelector("#gallery");

  // === ✅ SÉCURITÉ : ajoute .grid-sizer si manquant ===
  if (!grid.querySelector(".grid-sizer")) {
    const sizer = document.createElement("div");
    sizer.classList.add("grid-sizer");
    grid.prepend(sizer);
  }

  // === 🔄 CHARGEMENT DU JSON D’IMAGES + TRADUCTIONS ===
  let imagesData, translationsData;
  try {
    const [resImages, resTranslations] = await Promise.all([
      fetch("Assets/Data/GalleryImagesConstruction.json", { cache: "no-store" }),
      fetch("Assets/Data/GalleryImagesConstructionLang.json", { cache: "no-store" })
    ]);
    imagesData = await resImages.json();
    translationsData = await resTranslations.json();
  } catch (err) {
    console.error("❌ Erreur de chargement des fichiers JSON :", err);
    return;
  }

  // === 🌍 MULTILINGUE : fonction langue courante ===
  function getSavedLang() {
    return localStorage.getItem("lang") || (navigator.language || "en").slice(0, 2);
  }

  // === 🖼️ CRÉATION DE LA GALERIE ===
  const fragment = document.createDocumentFragment();
  Object.entries(imagesData).forEach(([category, images]) => {
    images.forEach((src) => {
      const div = document.createElement("div");
      div.classList.add("grid-item", category.toLowerCase());
      const img = document.createElement("img");
      img.src = src;
      img.alt = category;
      img.loading = "lazy";
      div.appendChild(img);
      fragment.appendChild(div);
    });
  });
  grid.appendChild(fragment);

  // === ⚙️ INITIALISATION ISOTOPE ===
  let iso;
  let pendingFilter = "*";
  let isReady = false;

  imagesLoaded(grid, () => {
    iso = new Isotope(grid, {
      itemSelector: ".grid-item",
      percentPosition: true,
      masonry: { columnWidth: ".grid-sizer", gutter: 10 },
      transitionDuration: "0.4s",
    });

    // 🪄 Animation d’apparition fluide
    grid.querySelectorAll(".grid-item").forEach((item, i) => {
      setTimeout(() => item.classList.add("visible"), 25 * i);
    });

    // Application du filtre initial
    imagesLoaded(grid, () => {
      iso.arrange({ filter: pendingFilter });
      iso.layout();
      window.scrollTo({ top: 0, behavior: "smooth" });
      isReady = true;
    });
  });

  // === 🎚️ FILTRAGE ===
  const buttons = document.querySelectorAll(".filter-button");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");

      const filterValue = button.getAttribute("data-filter");
      if (!isReady) {
        pendingFilter = filterValue;
        return;
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
      grid.classList.add("no-animation");
      iso.arrange({ filter: filterValue });

      imagesLoaded(grid, () => {
        iso.layout();
        grid.classList.remove("no-animation");
      });
    });
  });

  // === 💡 LIGHTBOX ===
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const closeBtn = lightbox.querySelector(".close");

  grid.addEventListener("click", (e) => {
    const img = e.target.closest("img");
    if (!img) return;
    lightboxImg.src = img.src;
    lightbox.classList.add("show");
    document.body.style.overflow = "hidden";
  });

  const closeLightbox = () => {
    lightbox.classList.remove("show");
    document.body.style.overflow = "";
  };
  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // === 🌍 MULTILINGUE UNIFIÉ (textes généraux + filtres) ===
  async function loadLanguage(lang = getSavedLang()) {
    try {
      const res = await fetch("Assets/Data/Gallery.json", { cache: "no-store" });
      const data = await res.json();

      // Applique les traductions générales (titres, etc.)
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        const normalizedKey =
          key in data
            ? key
            : key?.toLowerCase?.();
        const text = data[normalizedKey]?.text?.[lang];
        if (text) {
          el.textContent = text;
        }
      });

      // Traduit les boutons de filtre (corrigé et tolérant)
      document.querySelectorAll(".filter-button").forEach((btn) => {
        const cat = btn.getAttribute("data-filter").replace(".", "").toLowerCase();

        // Liste des variantes possibles pour retrouver la bonne clé
        const possibleKeys = [
          cat,
          cat.toLowerCase(),
          cat.charAt(0).toUpperCase() + cat.slice(1),
          `title${cat.charAt(0).toUpperCase() + cat.slice(1)}`
        ];

        let text;
        for (const key of possibleKeys) {
          text =
            translationsData[key]?.text?.[lang] ||
            data[key]?.text?.[lang];
          if (text) break;
        }
        btn.textContent = text || btn.textContent;
      });

      // Met à jour le sélecteur de langue
      const selected = document.querySelector(".selected-option");
      const options = document.querySelectorAll("#select-options li");
      options.forEach((li) => li.classList.remove("selected"));
      const active = document.querySelector(`#select-options li[data-value="${lang}"]`);
      if (active) {
        active.classList.add("selected");
        if (selected) selected.textContent = active.textContent;
      }

      localStorage.setItem("lang", lang);
    } catch (err) {
      console.error("Erreur lors du chargement des traductions :", err);
    }
  }

  // === 🧭 MENU DE LANGUE ===
  function wireLanguageSelector() {
    const select = document.getElementById("custom-select");
    const options = document.getElementById("select-options");
    if (!select || !options) return;

    select.addEventListener("click", () => options.classList.toggle("show"));
    options.querySelectorAll("li").forEach((li) => {
      li.addEventListener("click", () => {
        options.classList.remove("show");
        loadLanguage(li.dataset.value);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
    document.addEventListener("click", (e) => {
      if (!select.contains(e.target)) options.classList.remove("show");
    });
  }

  // === 🚀 INITIALISATION ===
  wireLanguageSelector();
  loadLanguage(getSavedLang());
});
