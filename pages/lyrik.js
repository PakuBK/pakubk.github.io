import { escapeHtml } from "../modules/utility.js";

const list = document.getElementById("lyrik-list");
const reader = document.getElementById("lyrik-reader");
const heading = document.getElementById("lyrik-heading");

const renderWork = (work) => {
    heading.textContent = work.title || "(kein titel)";
    reader.innerHTML = `
        <div class="max-w-3xl mx-auto border border-black shadow-primary bg-slate-100/50">
            <header class="border-b border-black bg-slate-200 p-3">
                <h3 class="text-2xl">${escapeHtml(work.title || "(kein titel)")}</h3>
                <p class="text-dimmed">${escapeHtml(work.date || "")}</p>
            </header>
            <p class="p-5 whitespace-pre-wrap leading-relaxed">${escapeHtml(work.text || "")}</p>
        </div>
    `;
};

const renderWorks = (works) => {
    if (!Array.isArray(works) || works.length === 0) {
        list.innerHTML = "<p>noch keine texte da.</p>";
        reader.innerHTML = "<p>hier entsteht platz für lyrische arbeiten.</p>";
        return;
    }

    list.innerHTML = "";

    works.forEach((work, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className =
            "border border-black shadow-primary bg-slate-100 text-left p-3 hover:bg-slate-200";
        button.innerHTML = `
            <strong class="block text-lg">${escapeHtml(work.title || "(kein titel)")}</strong>
            <span class="text-dimmed">${escapeHtml(work.date || "")}</span>
        `;
        button.addEventListener("click", () => renderWork(work));
        list.append(button);

        if (index === 0) {
            renderWork(work);
        }
    });
};

const loadWorks = async () => {
    try {
        const response = await fetch("../content/lyrik.json", {
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error(`Could not load lyrical works (HTTP ${response.status}).`);
        }

        const payload = await response.json();
        renderWorks(payload.works);
    } catch (error) {
        console.error(error);
        list.innerHTML = "<p>texte konnten nicht geladen werden.</p>";
        reader.innerHTML = "<p>der leseraum ist gerade nicht erreichbar.</p>";
    }
};

loadWorks();
