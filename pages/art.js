import { loadImages } from "../modules/loader.js";

const ART_MANIFEST_URL = "../content/art.json";

const renderArt = async () => {
    const artContainer = document.getElementById("art-container");

    if (!artContainer) {
        return;
    }

    try {
        const response = await fetch(ART_MANIFEST_URL, {
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(
                `Could not load art manifest (HTTP ${response.status}).`,
            );
        }

        const payload = await response.json();
        const loadedImages = await loadImages(payload.images);

        artContainer.innerHTML = "";

        loadedImages.forEach((loadedImage, index) => {
            const img = document.createElement("img");
            img.src = loadedImage.src;
            img.alt = `art-${index + 1}`;
            img.loading = "lazy";
            img.className =
                "max-w-50 max-h-50 object-cover border border-black bg-red-500";
            artContainer.append(img);
        });
    } catch (error) {
        console.error(error);
        artContainer.innerHTML =
            '<p class="p-4 text-red-700">Could not load art images.</p>';
    }
};

renderArt();
