document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  let id = params.get("id");

  const nameEl = document.getElementById("name");
  const photoEl = document.getElementById("photo");
  const roleEl = document.getElementById("role");
  const descEl = document.getElementById("description");
  const postEl = document.getElementById("postIceberg");
  const statusEl = document.getElementById("survivant");
  const prevBtn = document.getElementById("prev-passenger");
  const nextBtn = document.getElementById("next-passenger");

  const langSelect = document.getElementById("custom-select");
  const optionsList = document.getElementById("select-options");
  const selectedOption = langSelect.querySelector(".selected-option");

  let lang =
    optionsList.querySelector("li.selected")?.dataset.value || "en";

  let indexList = [];

  async function loadIndex() {
    const res = await fetch("Assets/Data/split_passengers/index.json");
    indexList = await res.json();
  }

  async function loadPassenger(pid) {
    try {
      const res = await fetch(`Assets/Data/split_passengers/${pid}.json`);
      const json = await res.json();
      const p = json[pid] || json;
      renderPassenger(p);
    } catch {
      nameEl.textContent = "Passenger not found";
    }
  }

  function renderPassenger(p) {
    nameEl.textContent = p.name?.[lang] || p.name?.en || "[Unknown]";
    photoEl.src = p.image?.src || "";
    photoEl.alt = p.image?.alt || "";
    roleEl.textContent = p.role?.[lang] || p.role?.en || "";

    descEl.innerHTML =
      `<strong>${lang === "fr" ? "Biographie :" : "Biography:"}</strong> ` +
      (p.description?.[lang] || p.description?.en || "");

    if (postEl && p.postIceberg) {
      postEl.innerHTML =
        `<strong>${lang === "fr" ? "Après le naufrage :" : "After the shipwreck:"}</strong> ` +
        (p.postIceberg?.[lang] || p.postIceberg?.en || "");
    }

    const survived = p.survived ? "true" : "false";
    const statusMap = {
      fr: { true: "Survivant", false: "Décédé" },
      en: { true: "Survived", false: "Deceased" }
    };
    const text = statusMap[lang]?.[survived] || statusMap.en[survived];
    const age =
      p.age ? ` (${p.age} ${lang === "fr" ? "ans" : "years old"})` : "";
    statusEl.textContent = text + age;
  }

  function navigate(offset) {
    const idx = indexList.indexOf(id);
    if (idx === -1) return;
    let newIdx = idx + offset;
    if (newIdx < 0) newIdx = indexList.length - 1;
    if (newIdx >= indexList.length) newIdx = 0;
    id = indexList[newIdx];
    const newUrl = new URL(window.location);
    newUrl.searchParams.set("id", id);
    window.history.replaceState({}, "", newUrl);
    loadPassenger(id);
  }

  prevBtn?.addEventListener("click", () => navigate(-1));
  nextBtn?.addEventListener("click", () => navigate(1));

  langSelect.addEventListener("click", () =>
    optionsList.classList.toggle("open")
  );
  optionsList.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      lang = li.dataset.value;
      selectedOption.textContent = li.textContent;
      optionsList.classList.remove("open");
      optionsList.querySelectorAll("li").forEach((x) => x.classList.remove("selected"));
      li.classList.add("selected");
      loadPassenger(id);
    });
  });

  await loadIndex();
  if (!id && indexList.length) id = indexList[0];
  await loadPassenger(id);
});
