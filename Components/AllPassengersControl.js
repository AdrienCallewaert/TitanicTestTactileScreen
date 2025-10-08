document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("passenger-grid");
  const searchInput = document.getElementById("search-box");
  const noResults = document.getElementById("no-results");
  const filterContainer = document.getElementById("filter-buttons");

  const langSelect = document.getElementById("custom-select");
  const optionsList = document.getElementById("select-options");
  const selectedOption = langSelect.querySelector(".selected-option");

  const isBeforePage = !!document.getElementById("pageTitleBefore");
  const detailPage = isBeforePage
    ? "PagePassengersSheetsBefore.html"
    : "PagePassengersSheetsAfter.html";

  const PASSENGER_CACHE_KEY = "allPassengersCache";
  const PASSENGER_CACHE_VERSION = "1";
  const PASSENGER_CACHE_TTL = 1000 * 60 * 60 * 12; // 12 heures
  const FETCH_BATCH_SIZE = 24;

  // --- ⬇️ FIX: langue initiale fiable (localStorage -> <html lang> -> navigator) ---
  function detectInitialLang() {
    const saved = localStorage.getItem("lang");
    if (saved) return saved;
    const htmlLang = (document.documentElement.lang || "").slice(0, 2);
    if (htmlLang) return htmlLang;
    return (navigator.language || "en").slice(0, 2);
  }
  let lang = detectInitialLang();

  let passengerList = [];
  let passengerData = [];
  const i18n = {};
  let currentFilter = "all";

  const filterText = {
    fr: { all: "Tous", Staff: "Équipage", "1st": "1re", "2nd": "2e", "3rd": "3e" },
    en: { all: "All", Staff: "Crew", "1st": "1st", "2nd": "2nd", "3rd": "3rd" },
    de: { all: "Alle", Staff: "Besatzung", "1st": "1.", "2nd": "2.", "3rd": "3." },
    da: { all: "Alle", Staff: "Besætning", "1st": "1.", "2nd": "2.", "3rd": "3." },
    it: { all: "Tutti", Staff: "Equipaggio", "1st": "1ª", "2nd": "2ª", "3rd": "3ª" },
    pt: { all: "Todos", Staff: "Tripulação", "1st": "1ª", "2nd": "2ª", "3rd": "3ª" },
    nl: { all: "Alle", Staff: "Bemanning", "1st": "1e", "2nd": "2e", "3rd": "3e" }
  };

  // --- ⬇️ util: met à jour l’UI du sélecteur pour refléter `lang` courante ---
  function syncLanguageSelector() {
    // retire l’ancienne sélection
    optionsList.querySelectorAll("li").forEach(li => li.classList.remove("selected"));
    // sélectionne la bonne entrée
    const match = optionsList.querySelector(`li[data-value="${lang}"]`);
    if (match) {
      match.classList.add("selected");
      selectedOption.textContent = match.textContent;
    } else {
      // fallback visuel
      selectedOption.textContent = lang.toUpperCase();
    }
  }

  function getCacheStorageKey() {
    return `${PASSENGER_CACHE_KEY}:${PASSENGER_CACHE_VERSION}`;
  }

  function loadCachedPassengers() {
    try {
      const raw = localStorage.getItem(getCacheStorageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.data) || !Array.isArray(parsed.ids)) {
        return null;
      }
      if (Date.now() - (parsed.timestamp || 0) > PASSENGER_CACHE_TTL) {
        return null;
      }
      if (parsed.ids.length !== passengerList.length) {
        return null;
      }
      for (let i = 0; i < parsed.ids.length; i += 1) {
        if (parsed.ids[i] !== passengerList[i]) {
          return null;
        }
      }
      return parsed.data;
    } catch (error) {
      console.warn("⚠️ Cache passagers illisible", error);
      return null;
    }
  }

  function savePassengersToCache(data) {
    try {
      const payload = {
        version: PASSENGER_CACHE_VERSION,
        timestamp: Date.now(),
        ids: [...passengerList],
        data
      };
      localStorage.setItem(getCacheStorageKey(), JSON.stringify(payload));
    } catch (error) {
      console.warn("⚠️ Impossible d'enregistrer le cache passagers", error);
    }
  }

  // ---------- Charge l'index ----------
  async function loadIndex() {
    try {
      const res = await fetch("Assets/Data/split_passengers/index.json", { cache: "no-store" });
      passengerList = await res.json();
    } catch (err) {
      console.error("❌ Impossible de charger index.json :", err);
    }
  }

  // ---------- Charge tous les passagers ----------
  async function loadAllPassengers() {
    const cached = loadCachedPassengers();
    if (cached) {
      passengerData = cached;
      return;
    }

    passengerData = [];

    for (let start = 0; start < passengerList.length; start += FETCH_BATCH_SIZE) {
      const slice = passengerList.slice(start, start + FETCH_BATCH_SIZE);
      const chunk = await Promise.all(
        slice.map(async (id) => {
          try {
            const res = await fetch(`Assets/Data/split_passengers/${id}.json`, { cache: "no-store" });
            const json = await res.json();
            const p = json[id] || json;
            return { id, ...p };
          } catch (error) {
            console.warn(`⚠️ Erreur pour ${id}`, error);
            return null;
          }
        })
      );
      passengerData.push(...chunk.filter(Boolean));
    }

    savePassengersToCache(passengerData);
  }

  // ---------- Charge les traductions (titres + placeholder + msg vide) ----------
  async function loadTranslations() {
    const coreFiles = [
      "searchBox.json",
      "noResultsMessages.json",
      isBeforePage ? "pageTitleBefore.json" : "pageTitleAfter.json"
    ];
    for (const fname of coreFiles) {
      try {
        const res = await fetch(`Assets/Data/split_passengers/${fname}`, { cache: "no-store" });
        const json = await res.json();
        const rootKey = Object.keys(json)[0];
        if (!rootKey) continue;
        const value = json[rootKey];
        i18n[rootKey] = value;
        i18n[rootKey.toLowerCase()] = value;
      } catch (e) {
        console.warn("⚠️ Traductions manquantes/illisibles :", fname, e);
      }
    }
  }

  function getTranslationText(key) {
    if (!key) return null;
    const normalized = typeof key === "string" ? key : String(key);
    const entry = i18n[normalized] || i18n[normalized.toLowerCase()];
    return entry?.text?.[lang] || null;
  }

  // ---------- Applique la langue sur le titre, placeholder, etc. ----------
  function applyLanguage() {
    document.documentElement.lang = lang;

    // Titre principal
    const titleKey = isBeforePage ? "pageTitleBefore" : "pageTitleAfter";
    const titleText = getTranslationText(titleKey);
    if (titleText) {
      document.title = titleText;
      document
        .querySelectorAll(`[data-i18n="${titleKey}"]`)
        .forEach((el) => {
          if (el.tagName === "TITLE") {
            el.textContent = titleText;
          } else {
            el.textContent = titleText;
          }
        });
    }

    // Placeholder de recherche
    const searchPlaceholder = getTranslationText("searchBox");
    if (searchPlaceholder) {
      searchInput.placeholder = searchPlaceholder;
      document
        .querySelectorAll('[data-i18n-placeholder="searchBox"]')
        .forEach((el) => {
          el.placeholder = searchPlaceholder;
        });
    }

    // Message "aucun résultat"
    const noResultsText = getTranslationText("noResultsMessages");
    if (noResultsText) {
      noResults.dataset.localized = "1";
      noResults.textContent = noResultsText;
    } else {
      delete noResults.dataset.localized;
    }
  }

  // ---------- Rendu des filtres ----------
  function renderFilters() {
    filterContainer.innerHTML = "";
    const btnAll = createButton("all", filterText[lang]?.all || "All");
    filterContainer.appendChild(btnAll);

    const classes = [...new Set(passengerData.map((p) => p.class))];
    for (const cls of classes) {
      const label = filterText[lang]?.[cls] || cls;
      filterContainer.appendChild(createButton(cls, label));
    }
  }

  function createButton(value, label) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.dataset.value = value;
    btn.className = "filter-button";
    if (value === currentFilter) btn.classList.add("active");
    btn.addEventListener("click", () => {
      currentFilter = value;
      document.querySelectorAll(".filter-button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderGrid();
    });
    return btn;
  }

  // ---------- Grille ----------
  function renderGrid() {
    container.innerHTML = "";
    const term = searchInput.value.trim().toLowerCase();

    const filtered = passengerData.filter((p) => {
      const matchClass = currentFilter === "all" || p.class === currentFilter;
      const nameLang = (p.name?.[lang] || p.name?.en || "").toLowerCase();
      return matchClass && (!term || nameLang.includes(term));
    });

    if (filtered.length === 0) {
      noResults.style.display = "block";
      if (!noResults.dataset.localized) {
        noResults.textContent = lang === "fr" ? "Aucun passager trouvé." : "No matching passenger.";
      }
      return;
    }

    noResults.style.display = "none";

    for (const p of filtered) {
      const card = document.createElement("a");
      card.href = `${detailPage}?id=${p.id}`;
      card.className = "passenger-card";

      const img = document.createElement("img");
      img.src = p.image?.src || "";
      img.alt = p.image?.alt || "";
      img.loading = "lazy";

      const name = document.createElement("p");
      name.textContent = p.name?.[lang] || p.name?.en || "[Unknown]";

      card.appendChild(img);
      card.appendChild(name);
      container.appendChild(card);
    }
  }

  // ---------- Écoutes ----------
  searchInput.addEventListener("input", renderGrid);

  langSelect.addEventListener("click", () => {
    optionsList.classList.toggle("open");
  });

  optionsList.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      lang = li.dataset.value;
      localStorage.setItem("lang", lang);         // <-- on persiste la langue
      syncLanguageSelector();
      optionsList.classList.remove("open");
      renderFilters();
      renderGrid();
      applyLanguage();
    });
  });

  document.addEventListener("click", (e) => {
    if (!langSelect.contains(e.target) && !optionsList.contains(e.target)) {
      optionsList.classList.remove("open");
    }
  });

  // ---------- Init ----------
  await loadTranslations();   // charge pageTitleBefore/After + searchBox + noResultsMessages
  await loadIndex();
  await loadAllPassengers();

  syncLanguageSelector();     // <-- met l’UI au bon état
  renderFilters();
  renderGrid();
  applyLanguage();            // <-- applique le titre + placeholder + message vide
});
