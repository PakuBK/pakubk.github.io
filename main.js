import { loadNews } from "./modules/nachrichten.js";
import { loadPosts } from "./modules/post.js";

const mobileQuery = window.matchMedia("(max-width: 767px)");
const mobilePanels = Array.from(
    document.querySelectorAll("[data-mobile-panel]"),
);
let openMobilePanel = "news";

const syncMobilePanels = () => {
    mobilePanels.forEach((panel) => {
        const toggle = panel.querySelector("[data-panel-toggle]");
        const content = document.getElementById(
            toggle?.getAttribute("aria-controls"),
        );

        if (!toggle || !content) {
            return;
        }

        const isOpen =
            !mobileQuery.matches ||
            panel.dataset.mobilePanel === openMobilePanel;

        toggle.disabled = !mobileQuery.matches;
        toggle.setAttribute("aria-expanded", String(isOpen));
        content.hidden = !isOpen;
    });
};

mobilePanels.forEach((panel) => {
    const toggle = panel.querySelector("[data-panel-toggle]");

    toggle?.addEventListener("click", () => {
        if (!mobileQuery.matches) {
            return;
        }

        openMobilePanel = panel.dataset.mobilePanel;
        syncMobilePanels();
    });
});

mobileQuery.addEventListener("change", syncMobilePanels);
syncMobilePanels();

loadNews();
loadPosts();
