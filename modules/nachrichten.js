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
        <table class="min-w-[250px] shadow-primary">
          <thead>
            <tr>
              <th align="left" class="px-2">${title}</th>
              <th align="center" class="text-dimmed text-nowrap bg-slate-200">${date}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td align="left" colspan="2" class="px-2 py-1">${text}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td align="center" colspan="2" class="px-2 bg-slate-200">mood: ${mood}</td>
            </tr>
          </tfoot>
        </table>
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
