document.addEventListener("DOMContentLoaded", async () => {
  const select = document.getElementById("custom-select");
  const options = document.getElementById("select-options");
  const selected = document.querySelector(".selected-option");

  const GALLERY_CACHE_KEY = "galleryTranslations";
  const GALLERY_CACHE_VERSION = "1";
  const GALLERY_CACHE_TTL = 1000 * 60 * 60 * 12; // 12 heures

  function getCacheStorageKey() {
    return `${GALLERY_CACHE_KEY}:${GALLERY_CACHE_VERSION}`;
  }

  function loadCachedTranslations() {
    try {
      const raw = localStorage.getItem(getCacheStorageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        !parsed?.data ||
        typeof parsed.timestamp !== "number" ||
        parsed.version !== GALLERY_CACHE_VERSION
      ) {
        return null;
      }
      if (Date.now() - parsed.timestamp > GALLERY_CACHE_TTL) {
        return null;
      }
      return parsed.data;
    } catch (error) {
      console.warn("⚠️ Cache gallery illisible", error);
      return null;
    }
  }

  function saveTranslationsToCache(data) {
    try {
      const payload = {
        version: GALLERY_CACHE_VERSION,
        timestamp: Date.now(),
        data
      };
      localStorage.setItem(getCacheStorageKey(), JSON.stringify(payload));
    } catch (error) {
      console.warn("⚠️ Impossible d'enregistrer le cache gallery", error);
    }
  }

  async function getTranslations() {
    const cached = loadCachedTranslations();
    if (cached) return cached;

    try {
      const res = await fetch("Assets/Data/Gallery.json", { cache: "no-store" });
      const data = await res.json();
      saveTranslationsToCache(data);
      return data;
    } catch (error) {
      console.error("Erreur de chargement du fichier de langue :", error);
      throw error;
    }
  }

  // === 🔧 Gestion des langues (helper commun) ===
  function getSavedLang() {
    return localStorage.getItem("lang") || (navigator.language || "en").slice(0, 2);
  }

  async function loadLanguage(lang = getSavedLang()) {
    try {
      const data = await getTranslations();

      // 🔁 Appliquer les traductions à tous les éléments avec data-i18n
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        const translation = data[key]?.text?.[lang];
        if (translation) el.textContent = translation;
      });

      // 🔖 Met à jour l’état du menu
      if (selected) selected.textContent = options.querySelector(`[data-value="${lang}"]`)?.textContent || "English";
      options.querySelectorAll("li").forEach((li) => li.classList.remove("selected"));
      const active = options.querySelector(`[data-value="${lang}"]`);
      if (active) active.classList.add("selected");

      localStorage.setItem("lang", lang);
    } catch (err) {
      console.error("Erreur de chargement du fichier de langue :", err);
    }
  }

  function wireLanguageSelector() {
    if (!select || !options) return;

    // 🧭 Ouvre / ferme le menu
    select.addEventListener("click", () => {
      options.classList.toggle("show");
    });

    // 🖱️ Sélection d’une langue
    options.querySelectorAll("li").forEach((li) => {
      li.addEventListener("click", () => {
        options.classList.remove("show");
        loadLanguage(li.dataset.value);
      });
    });

    // 🚪 Ferme le menu si clic à l’extérieur
    document.addEventListener("click", (e) => {
      if (!select.contains(e.target)) {
        options.classList.remove("show");
      }
    });
  }

  // === Initialisation ===
  wireLanguageSelector();
  loadLanguage(getSavedLang());
});
