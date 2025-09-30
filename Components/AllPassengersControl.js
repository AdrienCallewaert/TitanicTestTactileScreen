document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("passenger-grid");
  const langSelect = document.getElementById("custom-select");
  const optionsList = document.getElementById("select-options");
  const selectedOption = langSelect.querySelector(".selected-option");
  const filterButtonsContainer = document.getElementById("filter-buttons");

  const pageTitleBefore = document.getElementById("pageTitleBefore");
  const pageTitleAfter = document.getElementById("pageTitleAfter");
  const searchInput = document.getElementById("search-box");
  const noResultsEl = document.getElementById("no-results");

  const isBeforePage = !!pageTitleBefore;
  const titleElement = isBeforePage ? pageTitleBefore : pageTitleAfter;
  const titleKey = isBeforePage ? "pageTitleBefore" : "pageTitleAfter";
  const detailPage = isBeforePage
    ? "PagePassengersSheetsBefore.html"
    : "PagePassengersSheetsAfter.html";

  const filterTranslations = {
    fr: { all: "Tous", staff: "Staff", "1st": "1re", "2nd": "2e", "3rd": "3e" },
    en: { all: "All",  staff: "Staff", "1st": "1st", "2nd": "2nd", "3rd": "3rd" },
    de: { all: "Alle", staff: "Personal", "1st": "1.", "2nd": "2.", "3rd": "3." },
    it: { all: "Tutti", staff: "Staff", "1st": "1ª", "2nd": "2ª", "3rd": "3ª" },
    pt: { all: "Todos", staff: "Tripulação", "1st": "1ª", "2nd": "2ª", "3rd": "3ª" },
    da: { all: "Alle", staff: "Besætning", "1st": "1.", "2nd": "2.", "3rd": "3." },
  };

  let data = {};
  let currentLang =
    optionsList.querySelector("li.selected")?.dataset.value || "en";
  let passengerArray = [];
  let currentFilter = "all";

  async function fetchPassengers() {
    try {
      const res = await fetch("Assets/Data/Passengers.json");
      if (!res.ok) throw new Error("Erreur lors du chargement des passagers.");
      return await res.json();
    } catch (err) {
      console.error(err);
      return {};
    }
  }

  function updateTitle() {
    const titleText = data[titleKey]?.text?.[currentLang];
    titleElement.textContent = titleText || "Liste des passagers";

    const placeholderText = data.searchBox?.text?.[currentLang];
    if (searchInput && placeholderText) {
      searchInput.placeholder = placeholderText;
    }
  }

function renderButtons() {
  filterButtonsContainer.innerHTML = "";

  const uniqueClasses = [...new Set(passengerArray.map((p) => p.class))].filter(Boolean);

  // Bouton "All"
  const allLabel = filterTranslations[currentLang]?.all || "All";
  const allBtn = createButton("all", allLabel);
  filterButtonsContainer.appendChild(allBtn);

  for (const cls of uniqueClasses) {
    const label = filterTranslations[currentLang]?.[cls] || cls;
    const btn = createButton(cls, label);
    filterButtonsContainer.appendChild(btn);
  }
}


  function createButton(value, label) {
    const btn = document.createElement("button");
    btn.className = "filter-button";
    btn.textContent = label;
    btn.dataset.value = value;

    if (value === currentFilter) btn.classList.add("active");

    btn.addEventListener("click", () => {
      currentFilter = value;

      document
        .querySelectorAll(".filter-button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      renderGrid();
    });

    return btn;
  }

  function renderGrid() {
    container.innerHTML = "";
    const searchTerm = searchInput.value.trim().toLowerCase();

    const filtered = passengerArray.filter((p) => {
      const matchClass = currentFilter === "all" || p.class === currentFilter;
      const matchName =
        !searchTerm ||
        p.name?.[currentLang]?.toLowerCase().includes(searchTerm);
      return matchClass && matchName;
    });

    if (filtered.length === 0) {
      noResultsEl.style.display = "block";
      noResultsEl.textContent =
        data.noResultsMessages?.text?.[currentLang] ||
        "Aucun passager ne correspond à votre recherche.";
    } else {
      noResultsEl.style.display = "none";

      for (const passenger of filtered) {
        const card = document.createElement("a");
        card.href = `${detailPage}?id=${passenger.id}`;
        card.className = "passenger-card";

        const img = document.createElement("img");
        img.src = passenger.image?.src?.replace(/\\/g, "/") || "";
        img.alt = passenger.image?.alt || "passenger image";
        img.loading = "lazy";

        const name = document.createElement("p");
        name.textContent = passenger.name?.[currentLang] || "[Nom inconnu]";

        card.appendChild(img);
        card.appendChild(name);
        container.appendChild(card);
      }
    }
  }

  // Ouvre/ferme le menu au clic
  langSelect.addEventListener("click", () => {
    optionsList.classList.toggle("open");
  });

  // Sélection d’une langue dans la liste
optionsList.querySelectorAll("li").forEach((option) => {
  option.addEventListener("click", () => {
    // Màj texte du menu + langue courante
    selectedOption.textContent = option.textContent;
    currentLang = option.dataset.value;

    optionsList.querySelectorAll("li").forEach((li) => li.classList.remove("selected"));
    option.classList.add("selected");
    optionsList.classList.remove("open");

    // 🔁 Recréer les boutons avec la bonne traduction
    renderButtons();

    // Maj du titre, de la grille, et du clavier si ouvert
    updateTitle();
    renderGrid();
    if (!virtualKeyboard.classList.contains("hidden")) {
      renderKeyboard(currentLang);
    }
  });
});


  // Ferme menu si clic en dehors
  document.addEventListener("click", (e) => {
    if (!langSelect.contains(e.target) && !optionsList.contains(e.target)) {
      optionsList.classList.remove("open");
    }
  });

  searchInput.addEventListener("input", () => {
    renderGrid();
  });

  // Chargement initial
  data = await fetchPassengers();
  passengerArray = Object.entries(data)
    .filter(
      ([key]) =>
        !key.startsWith("pageTitle") &&
        key !== "noResultsMessages" &&
        key !== "searchBox"
    )
    .map(([id, value]) => ({ id, ...value }));

  updateTitle();
  renderButtons();
  renderGrid();

  //clavier
  const keyboardLayouts = {
    fr: [
      ["a", "z", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["q", "s", "d", "f", "g", "h", "j", "k", "l", "m"],
      ["w", "x", "c", "v", "b", "n"],
    ],
    en: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["z", "x", "c", "v", "b", "n", "m"],
    ],
    de: [
      ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["y", "x", "c", "v", "b", "n", "m"],
    ],
    da: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "å"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l", "æ"],
      ["z", "x", "c", "v", "b", "n", "m", "ø"],
    ],
    it: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["z", "x", "c", "v", "b", "n", "m"],
    ],
  };

  const virtualKeyboard = document.getElementById("virtual-keyboard");
  const keyboardKeys = document.getElementById("keyboard-keys");
  const closeKeyboardBtn = document.getElementById("close-keyboard");

  function renderKeyboard(lang) {
    keyboardKeys.innerHTML = "";

    const layout = keyboardLayouts[lang] || keyboardLayouts.en;

    for (const row of layout) {
      for (const key of row) {
        const btn = document.createElement("button");
        btn.textContent = key;
        btn.addEventListener("click", () => insertAtCursor(key));
        keyboardKeys.appendChild(btn);
      }
      const br = document.createElement("div");
      br.style.gridColumn = "1 / -1"; // Saut de ligne
      keyboardKeys.appendChild(br);
    }
    const lastBr = keyboardKeys.querySelector("div:last-child");
    if (lastBr) keyboardKeys.removeChild(lastBr);
    const spaceBtn = document.createElement("button");
    spaceBtn.textContent = "␣";
    spaceBtn.addEventListener("click", () => insertAtCursor(" "));
    keyboardKeys.appendChild(spaceBtn);

    const backspaceBtn = document.createElement("button");
    backspaceBtn.textContent = "⌫";
    backspaceBtn.addEventListener("click", deleteLastChar);
    keyboardKeys.appendChild(backspaceBtn);

    virtualKeyboard.classList.remove("hidden");

    positionKeyboard();
  }
  function deleteLastChar() {
    const start = searchInput.selectionStart;
    const end = searchInput.selectionEnd;
    const text = searchInput.value;

    if (start === end && start > 0) {
      searchInput.value = text.slice(0, start - 1) + text.slice(end);
      searchInput.selectionStart = searchInput.selectionEnd = start - 1;
    } else if (start !== end) {
      searchInput.value = text.slice(0, start) + text.slice(end);
      searchInput.selectionStart = searchInput.selectionEnd = start;
    }

    searchInput.focus();
    searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // Positionnement clzvier
  function positionKeyboard() {
    const inputRect = searchBox.getBoundingClientRect();
    const top = inputRect.bottom + window.scrollY + 5;
    const left = inputRect.left + window.scrollX;

    virtualKeyboard.style.top = `${top}px`;
    virtualKeyboard.style.left = `${left}px`;
  }

  function insertAtCursor(char) {
    const input = document.getElementById("search-box");
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;

    input.value = text.slice(0, start) + char + text.slice(end);
    input.focus();
    input.selectionStart = input.selectionEnd = start + 1;

    // Lancer la recherche après chaque ajout
    const event = new Event("input", { bubbles: true });
    input.dispatchEvent(event);
  }

  closeKeyboardBtn.addEventListener("click", () => {
    virtualKeyboard.classList.add("hidden");
  });

  //SI SOUCI AVEC TACTILE, TESTER "touchstart" A LA PLACE DE "focus"
  searchInput.addEventListener("focus", () => {
    renderKeyboard(currentLang);
  });

  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  virtualKeyboard.addEventListener("mousedown", (e) => {
    isDragging = true;
    const rect = virtualKeyboard.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    e.preventDefault();
  });

  //déplacement clavier avec souris + tactile
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    let left = e.clientX - dragOffsetX;
    let top = e.clientY - dragOffsetY;

    const maxLeft = window.innerWidth - virtualKeyboard.offsetWidth;
    const maxTop = window.innerHeight - virtualKeyboard.offsetHeight;

    left = Math.min(Math.max(0, left), maxLeft);
    top = Math.min(Math.max(0, top), maxTop);

    virtualKeyboard.style.left = `${left}px`;
    virtualKeyboard.style.top = `${top}px`;
    virtualKeyboard.style.bottom = "auto";
    virtualKeyboard.style.transform = "none";
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
    }
  });
  virtualKeyboard.addEventListener("touchstart", (e) => {
    isDragging = true;
    const touch = e.touches[0];
    const rect = virtualKeyboard.getBoundingClientRect();
    dragOffsetX = touch.clientX - rect.left;
    dragOffsetY = touch.clientY - rect.top;
  });

  document.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];

    let left = touch.clientX - dragOffsetX;
    let top = touch.clientY - dragOffsetY;

    const maxLeft = window.innerWidth - virtualKeyboard.offsetWidth;
    const maxTop = window.innerHeight - virtualKeyboard.offsetHeight;

    left = Math.min(Math.max(0, left), maxLeft);
    top = Math.min(Math.max(0, top), maxTop);

    virtualKeyboard.style.left = `${left}px`;
    virtualKeyboard.style.top = `${top}px`;
    virtualKeyboard.style.bottom = "auto";
    virtualKeyboard.style.transform = "none";
  });

  document.addEventListener("touchend", () => {
    isDragging = false;
  });
});
