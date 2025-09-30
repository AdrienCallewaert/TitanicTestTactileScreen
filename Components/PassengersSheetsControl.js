document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("passenger-grid");
  const langSelect = document.getElementById("custom-select");
  const optionsList = document.getElementById("select-options");
  const selectedOption = langSelect.querySelector(".selected-option");
  const params = new URLSearchParams(window.location.search);
  let id = params.get("id");

  const nameEl = document.getElementById("name");
  const photoEl = document.getElementById("photo");
  const roleEl = document.getElementById("role");
  const descEl = document.getElementById("description");
  const age = document.getElementById("age");

  const postIceberg = document.getElementById("postIceberg");
  const statusEl = document.getElementById("survivant");
  const prevBtn = document.getElementById("prev-passenger");
  const nextBtn = document.getElementById("next-passenger");

  let currentLang =
    optionsList.querySelector("li.selected")?.dataset.value || "en";
  let data;
  let keys = [];

const survivalText = {
    fr: {
      true: "Survivant au naufrage",
      false: "Décédé dans le naufrage",
    },
    en: {
      true: "Survived the shipwreck",
      false: "Perished in the shipwreck",
    },
    de: {
      true: "Überlebte das Schiffsunglück",
      false: "Gestorben beim Schiffsunglück",
    },
    da: {
      true: "Overlevede forliset",
      false: "Ombordkommet ved forliset",
    },
    it: {
      true: "Sopravvissuto al naufragio",
      false: "Deceduto nel naufragio",
    },
    pt: {
      true: "Sobreviveu ao naufrágio",
      false: "Perdeu a vida no naufrágio",
    },
  };


  const bioLabel = {
    fr: "Biographie : ",
    en: "Biography : ",
    de: "Biografie: ",
    da: "Biografi: ",
    it: "Biografia: ",
    pt: "Biografia : "
  };

  const postIcebergLabel = {
    fr: "Après le naufrage : ",
    en: "After the shipwreck : ",
    de: "Nach dem Schiffbruch : ",
    da: "Efter skibbruddet : ",
    it: "Dopo il naufragio : ",
    pt: "Após o naufrágio : ",
  };

  const tradAge = {
    fr: "ans",
    en: "years old",
    de: "Jahre alt",
    da: "år gammel",
    it: "anni",
    pt: "anos de idade",
  };

  async function loadData() {
    try {
      const res = await fetch("Assets/Data/Passengers.json");
      if (!res.ok)
        throw new Error("Erreur lors du chargement des données passager.");
      data = await res.json();
      keys = Object.keys(data).filter(
        (key) =>
          !key.startsWith("pageTitle") &&
          key !== "noResultsMessages" &&
          key !== "searchBox"
      );

      if (!data[id]) throw new Error("Passager non trouvé.");
      updateContent();
    } catch (err) {
      console.error(err);
      nameEl.textContent = "Erreur : passager introuvable.";
    }
  }

  //maj textes selon langues
  function updateContent() {
    const passenger = data[id];
    if (!passenger) return;

    nameEl.textContent = passenger.name?.[currentLang] || "[Nom inconnu]";
    photoEl.src = passenger.image?.src?.replace(/\\/g, "/") || "";
    photoEl.alt = passenger.image?.alt || "";
    roleEl.textContent = passenger.role?.[currentLang] || "";
    descEl.innerHTML =
      `<strong>${bioLabel[currentLang] || bioLabel["fr"]}</strong>` +
      (passenger.description?.[currentLang] || "");

    if (postIceberg) {
      postIceberg.innerHTML =
        `<strong>${
          postIcebergLabel[currentLang] || postIcebergLabel["fr"]
        }</strong>` + (passenger.postIceberg?.[currentLang] || "");
    }

    const survivedKey = passenger.survived ? "true" : "false";
    const ageText =
      passenger.age && tradAge[currentLang]
        ? ` (${passenger.age} ${tradAge[currentLang]})`
        : "";
    statusEl.textContent =
      (survivalText[currentLang]?.[survivedKey] ||
        survivalText["fr"][survivedKey]) + ageText;
  }

  //navigation entre les passagers
  function navigateTo(offset) {
    const currentIndex = keys.indexOf(id);
    if (currentIndex === -1) return;

    let newIndex = currentIndex + offset;
    if (newIndex < 0) newIndex = keys.length - 1;
    if (newIndex >= keys.length) newIndex = 0;

    id = keys[newIndex];
    updateContent();

    // Maj de l'URL sans recharger la page
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("id", id);
    window.history.replaceState({}, "", newUrl);
  }

  // choix langue
  langSelect.addEventListener("click", () => {
    optionsList.classList.toggle("open");
  });
  optionsList.querySelectorAll("li").forEach((option) => {
    option.addEventListener("click", () => {
      selectedOption.textContent = option.textContent;
      currentLang = option.dataset.value;
      optionsList
        .querySelectorAll("li")
        .forEach((li) => li.classList.remove("selected"));
      option.classList.add("selected");
      optionsList.classList.remove("open");
      updateContent();
    });
  });

  //appel fonction de déplacement entre les passagers quand appui sur flèches
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => navigateTo(-1));
    nextBtn.addEventListener("click", () => navigateTo(1));
  }

  await loadData();
});
