//Automatisation création des json d'images pour les gallery (merci le chat)

const fs = require("fs");
const path = require("path");

const baseDir = path.join(__dirname, "../Assets/images/Gallery/Lancement/");
const outputPath = path.join(
  __dirname,
  "../Assets/Data/GalleryImagesLancement.json"
);

function isImageFile(fileName) {
  return /\.(webp)$/i.test(fileName);
}

function generateGalleryJSON() {
  console.log("📂 Dossier de base :", baseDir);

  if (!fs.existsSync(baseDir)) {
    console.error("❌ Le dossier source n'existe pas !");
    return;
  }

  const result = {};
  const folders = fs.readdirSync(baseDir, { withFileTypes: true });

  if (folders.length === 0) {
    console.warn("⚠️ Aucun sous-dossier trouvé.");
    return;
  }

  folders.forEach((dirent) => {
    if (dirent.isDirectory()) {
      const category = dirent.name;
      const categoryPath = path.join(baseDir, category);
      console.log("📁 Lecture du dossier :", categoryPath);

      const files = fs.readdirSync(categoryPath);
      const images = files
        .filter(isImageFile)
        .map((file) =>
          path
            .join("Assets/images/Gallery/Construction", category, file)
            .replace(/\\/g, "/")
        );
      if (images.length === 0) {
        console.warn(`⚠️ Aucun fichier image trouvé dans ${category}`);
      }

      result[category.toLowerCase()] = images;
    }
  });

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf8");
  console.log("✅ Fichier GalleryImages.json généré avec succès !");
}

generateGalleryJSON();
