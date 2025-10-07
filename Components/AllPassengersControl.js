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
    pt: { all: "Todos", Staff: "Tripulação", "1st": "1ª", "2nd": "2ª", "3rd": "3ª" }
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
    passengerData = [];
    for (const id of passengerList) {
      try {
        const res = await fetch(`Assets/Data/split_passengers/${id}.json`, { cache: "no-store" });
        const json = await res.json();
        const p = json[id] || json;
        passengerData.push({ id, ...p });
      } catch {
        console.warn(`⚠️ Erreur pour ${id}`);
      }
    }
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

  // ---------- Applique la langue sur le titre, placeholder, etc. ----------
  function applyLanguage() {
    // Titre principal
    const titleKey = isBeforePage ? "pageTitleBefore" : "pageTitleAfter";
    const titleObj = i18n[titleKey] || i18n[titleKey.toLowerCase()];
    if (titleObj?.text?.[lang]) {
      const txt = titleObj.text[lang];
      document.title = txt; // onglet
      const h1El = document.querySelector(`[data-i18n="${titleKey}"]`);
      if (h1El) h1El.textContent = txt; // H1
    }

    // Placeholder de recherche
    const sbObj = i18n.searchBox || i18n.searchbox;
    if (sbObj?.text?.[lang]) searchInput.placeholder = sbObj.text[lang];

    // Message "aucun résultat"
    const nrObj = i18n.noResultsMessages || i18n.noresultsmessages;
    if (nrObj?.text?.[lang]) {
      noResults.dataset.localized = "1";
      noResults.textContent = nrObj.text[lang];
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
