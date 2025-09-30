document.addEventListener("DOMContentLoaded", async () => {
  const select = document.getElementById("zoom-select");
  const langSelectWrapper = document.getElementById("custom-select");
  const selectedOption = langSelectWrapper.querySelector(".selected-option");
  const optionsList = document.getElementById("select-options");
  let lang = optionsList.querySelector(".selected").dataset.value;
  const image = document.getElementById("zoom-image");
  const textContainer = document.getElementById("text-container");
  const pageTitle = document.getElementById("pageTitle");
  const choixLabel = document.getElementById("choixSelection");
  const captionGrid = document.getElementById("caption-grid");

  let data;
  try {
    const res = await fetch("Assets/Data/Deck.json");
    if (!res.ok) throw new Error("Fichier JSON introuvable.");
    data = await res.json();
  } catch (e) {
    alert("Erreur de chargement des données.");
    console.error(e);
    return;
  }

  function updateDisplay() {
    const selected = select.value;
    // Réinitialiser le zoom et la position de l’image
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    image.style.transform = `scale(1) translate(0px, 0px)`;

    pageTitle.textContent =
      data.pageTitle?.text?.[lang] || "(Titre indisponible)";
    choixLabel.textContent =
      data.choixSelection?.text?.[lang] || "(Choix indisponible)";

    if (!selected || !data[selected]) {
      image.style.display = "none";
      textContainer.textContent = "";
      return;
    }

    const selectedData = data[selected];
    image.src = selectedData.image;
    image.alt = selected;
    image.style.display = "block";
    textContainer.textContent = selectedData.text?.[lang] || "";
  }

  function updateCaptions() {
    const captionGrid = document.getElementById("caption-grid");
    // Nettoyer l'affichage actuel
    captionGrid.innerHTML = "";

    // Récupérer et trier les captions
    const captionKeys = Object.keys(data)
      .filter((key) => key.startsWith("caption"))
      .sort((a, b) => {
        const numA = parseInt(a.replace("caption", ""));
        const numB = parseInt(b.replace("caption", ""));
        return numA - numB;
      });

    const columns = 4;
    const rows = Math.ceil(captionKeys.length / columns);
    const captionMatrix = Array.from({ length: columns }, (_, colIndex) => {
      return captionKeys.slice(colIndex * rows, (colIndex + 1) * rows);
    });

    // Remplir la grille verticalement
    for (let i = 0; i < rows; i++) {
      for (let col = 0; col < columns; col++) {
        const key = captionMatrix[col][i];
        if (key && data[key]) {
          const label = data[key].text?.[lang] || "(Traduction manquante)";
          const item = document.createElement("div");
          item.className = "caption-item";
          item.textContent = label;
          captionGrid.appendChild(item);
        }
      }
    }
  }

  // Zoom avec molette
  let currentScale = 1;
  const maxScale = 4;
  const minScale = 1;
  const zoomStep = 0.1;

  const zoomWrapper = document.getElementById("zoom-wrapper");

  zoomWrapper.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const delta = Math.sign(event.deltaY);
      if (delta < 0 && currentScale < maxScale) {
        currentScale += zoomStep;
      } else if (delta > 0 && currentScale > minScale) {
        currentScale -= zoomStep;
      }
      image.style.transform = `scale(${currentScale})`;
      image.style.transformOrigin = "center center";
    },
    { passive: false }
  );

  document.getElementById("zoom-in").addEventListener("click", () => {
    if (currentScale < maxScale) {
      currentScale += zoomStep;
      applyTransform();
    }
  });

  document.getElementById("zoom-out").addEventListener("click", () => {
    if (currentScale > minScale) {
      currentScale -= zoomStep;
      applyTransform();
    }
  });

  document.getElementById("zoom-reset").addEventListener("click", () => {
    currentScale = 1;
    image.style.transform = `scale(1)`;
  });

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let translateX = 0;
  let translateY = 0;

  function applyTransform() {
    const wrapperRect = zoomWrapper.getBoundingClientRect();

    const scaledWidth = image.offsetWidth * currentScale;
    const scaledHeight = image.offsetHeight * currentScale;

    const maxX = Math.max(
      0,
      (scaledWidth - wrapperRect.width) / 2 / currentScale
    );
    const maxY = Math.max(
      0,
      (scaledHeight - wrapperRect.height) / 2 / currentScale
    );

    // Limite le déplacement
    translateX = Math.min(Math.max(translateX, -maxX), maxX);
    translateY = Math.min(Math.max(translateY, -maxY), maxY);

    image.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
  }

  //déplacement de l'image à la souris
  const startDrag = (x, y) => {
    isDragging = true;
    startX = x - translateX;
    startY = y - translateY;
    zoomWrapper.classList.add("dragging");
  };

  const drag = (x, y) => {
    if (!isDragging) return;
    translateX = x - startX;
    translateY = y - startY;
    applyTransform();
  };

  const endDrag = () => {
    isDragging = false;
    zoomWrapper.classList.remove("dragging");
  };

  zoomWrapper.addEventListener("mousedown", (e) =>
    startDrag(e.clientX, e.clientY)
  );
  window.addEventListener("mousemove", (e) => drag(e.clientX, e.clientY));
  window.addEventListener("mouseup", endDrag);

  // Au tactile
  zoomWrapper.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  });
  zoomWrapper.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) {
      drag(e.touches[0].clientX, e.touches[0].clientY);
    }
  });
  zoomWrapper.addEventListener("touchend", endDrag);
  zoomWrapper.addEventListener("touchcancel", endDrag);

  //infobulle
  document.getElementById("info-button").addEventListener("click", () => {
    textContainer.style.display =
      textContainer.style.display === "none" ||
      textContainer.style.display === ""
        ? "block"
        : "none";
  });

  //zoom tactile
  let initialPinchDistance = null;
  let initialScale = currentScale;

  function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  zoomWrapper.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      initialPinchDistance = getDistance(e.touches);
      initialScale = currentScale;
      isDragging = false; // désactiver le pan pendant le zoom
    }
  });

  zoomWrapper.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      const currentDistance = getDistance(e.touches);
      const scaleFactor = currentDistance / initialPinchDistance;
      currentScale = Math.min(
        Math.max(initialScale * scaleFactor, minScale),
        maxScale
      );
      applyTransform();
    }
  });

  select.addEventListener("change", updateDisplay);
  langSelectWrapper.addEventListener("click", () => {
    optionsList.style.display =
      optionsList.style.display === "block" ? "none" : "block";
  });

  // Ferme la liste si on clique ailleurs
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

      updateDisplay();
      updateCaptions();
    });
  });

  updateDisplay();
  updateCaptions();
});
