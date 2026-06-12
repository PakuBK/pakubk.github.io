const IMAGE_EXTENSIONS = /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i;

export const loadImages = async (folderPath) => {
    const normalizedPath = String(folderPath || "").replace(/\/+$/, "");

    if (!normalizedPath) {
        throw new Error("loadImages requires a folder path.");
    }

    const directoryResponse = await fetch(`${normalizedPath}/`);

    if (!directoryResponse.ok) {
        throw new Error(
            `Could not read directory listing at ${normalizedPath} (HTTP ${directoryResponse.status}).`,
        );
    }

    const html = await directoryResponse.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const imageUrls = [...doc.querySelectorAll("a[href]")]
        .map((anchor) => anchor.getAttribute("href") || "")
        .filter((href) => IMAGE_EXTENSIONS.test(href))
        .map(
            (href) =>
                new URL(href, `${window.location.origin}${normalizedPath}/`)
                    .href,
        );

    const imageLoadPromises = imageUrls.map(
        (src) =>
            new Promise((resolve, reject) => {
                const img = new Image();
                img.decoding = "async";
                img.src = src;
                img.onload = () => resolve(img);
                img.onerror = () =>
                    reject(new Error(`Failed to load image: ${src}`));
            }),
    );

    return Promise.all(imageLoadPromises);
};
