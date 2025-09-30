document.addEventListener("DOMContentLoaded", async () => {
  const langSelect = document.getElementById("custom-select");
  const selectedOption = langSelect.querySelector(".selected-option");
  const optionsList = document.getElementById("select-options");
  const constructionTitle = document.getElementById("constructionTitle");
  const launchingTitle = document.getElementById("launchingTitle");
  const pageTitle = document.getElementById("pageTitle");

  let data;
  let lang = optionsList.querySelector(".selected").dataset.value;

  async function fetchGalleryData() {
    try {
      const res = await fetch("Assets/Data/Gallery.json");
      if (!res.ok) throw new Error("Fichier JSON introuvable.");
      return await res.json();
    } catch (e) {
      alert("Erreur de chargement des données.");
      console.error(e);
      return;
    }
  }

  //maj texte selon langue
  function updateTextContent() {
    if (!data) return;

    pageTitle.textContent = data.pageTitle?.text?.[lang] || "Galerie";
    constructionTitle.textContent =
      data.constructionTitle?.text?.[lang] || "Construction";
    launchingTitle.textContent =
      data.launchingTitle?.text?.[lang] || "Lancement";
  }

  data = await fetchGalleryData();
  updateTextContent();

  // Choix langue
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

      updateTextContent();
    });
  });

  // Fermer si on clique à l'extérieur
  document.addEventListener("click", (e) => {
    if (!langSelect.contains(e.target) && !optionsList.contains(e.target)) {
      optionsList.style.display = "none";
    }
  });
});
