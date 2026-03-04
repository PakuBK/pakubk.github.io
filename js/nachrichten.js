const nachrichtenContainer = document.getElementById("nachrichten-list");

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderNachrichten = (entries) => {
  if (!nachrichtenContainer) {
    return;
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    nachrichtenContainer.innerHTML = "<p>noch keine nachrichten da.</p>";
    return;
  }

  const cards = entries
    .map((entry) => {
      const title = escapeHtml(entry.title ?? "(kein titel)");
      const date = escapeHtml(entry.date ?? "(kein datum)");
      const text = escapeHtml(entry.text ?? "");
      const mood = escapeHtml(entry.mood ?? "-");

      return `
        <table class="min-w-[300px] shadow-primary">
          <thead>
            <tr>
              <th align="left" class="px-2 w-[300px]">${title}</th>
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

  nachrichtenContainer.innerHTML = cards;
};

const loadNachrichten = async () => {
  if (!nachrichtenContainer) {
    return;
  }

  try {
    const response = await fetch("./nachrichten.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    renderNachrichten(payload.nachrichten);
  } catch (error) {
    nachrichtenContainer.innerHTML =
      "<p>nachrichten konnten nicht geladen werden.</p>";
    console.error("Fehler beim Laden von nachrichten.json:", error);
  }
};

loadNachrichten();
