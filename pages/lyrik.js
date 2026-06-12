import { escapeHtml } from "../modules/utility.js";

const list = document.getElementById("lyrik-list");
const reader = document.getElementById("lyrik-reader");
const heading = document.getElementById("lyrik-heading");
const indexPanel = document.getElementById("lyrik-index");
const readingRoom = document.getElementById("lyrik-room");
const backButton = document.getElementById("lyrik-back");
const mobileQuery = window.matchMedia("(max-width: 767px)");

let mobileView = "list";
let activeButton = null;

const syncLayout = () => {
    if (!mobileQuery.matches) {
        indexPanel.hidden = false;
        readingRoom.hidden = false;
        backButton.hidden = true;
        return;
    }

    indexPanel.hidden = mobileView === "reader";
    readingRoom.hidden = mobileView === "list";
    backButton.hidden = mobileView !== "reader";
};

const renderWork = (work) => {
    heading.textContent = work.title || "(kein titel)";
    reader.innerHTML = `
        <header>
            <h3>${escapeHtml(work.title || "(kein titel)")}</h3>
            <time>${escapeHtml(work.date || "")}</time>
        </header>
        <pre>${escapeHtml(work.text || "")}</pre>
    `;
};

const selectWork = (work, button) => {
    activeButton?.removeAttribute("aria-current");
    activeButton = button;
    activeButton.setAttribute("aria-current", "true");
    renderWork(work);

    if (mobileQuery.matches) {
        mobileView = "reader";
        syncLayout();
        backButton.focus();
    }
};

const renderWorks = (works) => {
    if (!Array.isArray(works) || works.length === 0) {
        list.innerHTML = "<p>noch keine texte da.</p>";
        reader.innerHTML = "<p>hier entsteht platz für lyrische arbeiten.</p>";
        syncLayout();
        return;
    }

    list.innerHTML = "";

    works.forEach((work, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.lyrikIndex = String(index);
        button.innerHTML = `
            <strong>${escapeHtml(work.title || "(kein titel)")}</strong>
            <time>${escapeHtml(work.date || "")}</time>
        `;
        button.addEventListener("click", () => selectWork(work, button));
        list.append(button);

        if (index === 0) {
            activeButton = button;
            button.setAttribute("aria-current", "true");
            renderWork(work);
        }
    });

    syncLayout();
};

backButton.addEventListener("click", () => {
    mobileView = "list";
    syncLayout();
    activeButton?.focus();
});

mobileQuery.addEventListener("change", syncLayout);
syncLayout();

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
