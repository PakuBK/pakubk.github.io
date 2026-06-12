export const loadImages = async (imagePaths) => {
    if (!Array.isArray(imagePaths)) {
        throw new Error("loadImages requires an array of image paths.");
    }

    const imageLoadPromises = imagePaths.map(
        (src) =>
            new Promise((resolve, reject) => {
                const img = new Image();
                img.decoding = "async";
                img.src = new URL(src, document.baseURI).href;
                img.onload = () => resolve(img);
                img.onerror = () =>
                    reject(new Error(`Failed to load image: ${img.src}`));
            }),
    );

    const results = await Promise.allSettled(imageLoadPromises);
    const loadedImages = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

    results
        .filter((result) => result.status === "rejected")
        .forEach((result) => console.error(result.reason));

    if (imagePaths.length > 0 && loadedImages.length === 0) {
        throw new Error("None of the configured art images could be loaded.");
    }

    return loadedImages;
};
