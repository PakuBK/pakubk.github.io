import { escapeHtml } from "./utility.js";

export const postContainer = document.getElementById("post-container");

export const renderPosts = (entries) => {
  if (!postContainer) {
    return;
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    postContainer.innerHTML = "<p>noch keine inhalte da.</p>";
    return;
  }

  const cards = entries
    .map((entry) => {
      const title = escapeHtml(entry.title ?? "(kein titel)");
      const content = escapeHtml(entry.content ?? "");
      const url = escapeHtml(entry.url ?? "#");
      const hasImage =
        typeof entry.img_url === "string" && entry.img_url.trim() !== "";
      const imgMarkup = hasImage
        ? `<img width="100" height="100" src="${escapeHtml(entry.img_url)}" alt="${title}" class="m-2" />`
        : "";

      return `
        <article class="post-card shadow-primary border border-black bg-slate-100/50">
          <h4 class="p-2 text-xl">${title}</h4>
          ${imgMarkup}
          <p class="px-2 pb-2">${content}</p>
          <a
            class="post-card-link bg-slate-200 border-t border-black text-center"
            href="${url}"
          >
            link
          </a>
        </article>
      `;
    })
    .join("");

  postContainer.innerHTML = cards;
};

export const loadPosts = async () => {
  if (!postContainer) {
    return;
  }

  try {
    let payload;

    try {
      const jsonModule = await import(
        `../content/posts.json?ts=${Date.now()}`,
        {
          with: { type: "json" },
        }
      );
      payload = jsonModule.default;
    } catch {
      const response = await fetch("../content/posts.json", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      payload = await response.json();
    }

    renderPosts(payload.posts);
  } catch (error) {
    postContainer.innerHTML = "<p>inhalte konnten nicht geladen werden.</p>";
    console.error("Fehler beim Laden von posts.json:", error);
  }
};
