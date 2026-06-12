import { escapeHtml } from "./utility.js";

export const newsContainer = document.getElementById("nachrichten-list");

export const renderNews = (entries) => {
  if (!newsContainer) {
    return;
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    newsContainer.innerHTML = "<p>noch keine nachrichten da.</p>";
    return;
  }

  const cards = entries
    .map((entry) => {
      const title = escapeHtml(entry.title ?? "(kein titel)");
      const date = escapeHtml(entry.date ?? "(kein datum)");
      const text = escapeHtml(entry.text ?? "");
      const mood = escapeHtml(entry.mood ?? "-");

      return `
        <article>
          <header>
            <h3>${title}</h3>
            <time>${date}</time>
          </header>
          <p>${text}</p>
          <footer>
            <p>mood: ${mood}</p>
          </footer>
        </article>
      `;
    })
    .join("");

  newsContainer.innerHTML = cards;
};

export const loadNews = async () => {
  if (!newsContainer) {
    return;
  }

  try {
    let payload;

    try {
      const jsonModule = await import(
        `../content/nachrichten.json?ts=${Date.now()}`,
        {
          with: { type: "json" },
        }
      );
      payload = jsonModule.default;
    } catch {
      const response = await fetch("../content/nachrichten.json", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      payload = await response.json();
    }

    renderNews(payload.nachrichten);
  } catch (error) {
    newsContainer.innerHTML =
      "<p>nachrichten konnten nicht geladen werden.</p>";
    console.error("Fehler beim Laden von nachrichten.json:", error);
  }
};
