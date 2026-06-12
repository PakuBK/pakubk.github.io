import { escapeHtml } from "./utility.js";

const spotifyWidget = document.getElementById("spotify-widget");

const formatPlayedAt = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Europe/Berlin",
    }).format(date);
};

export const renderLastListenedTrack = (payload) => {
    if (!spotifyWidget) {
        return;
    }

    const track = payload?.track;

    if (!track) {
        spotifyWidget.innerHTML = "<p>noch kein track verfügbar.</p>";
        return;
    }

    const title = escapeHtml(track.title || "(kein titel)");
    const artists = escapeHtml(
        Array.isArray(track.artists) ? track.artists.join(", ") : "",
    );
    const album = escapeHtml(track.album || "");
    const url = escapeHtml(track.url || "https://open.spotify.com/");
    const image = track.image
        ? `<img src="${escapeHtml(track.image)}" alt="" loading="lazy" />`
        : "";
    const playedAt = formatPlayedAt(track.played_at);

    spotifyWidget.innerHTML = `
        <article>
            ${image}
            <header>
                <h3><a href="${url}" target="_blank" rel="noreferrer">${title}</a></h3>
                ${artists ? `<p>${artists}</p>` : ""}
            </header>
            ${album ? `<p>album: ${album}</p>` : ""}
            ${playedAt ? `<footer><time datetime="${escapeHtml(track.played_at)}">${escapeHtml(playedAt)}</time></footer>` : ""}
        </article>
    `;
};

export const loadLastListenedTrack = async () => {
    if (!spotifyWidget) {
        return;
    }

    try {
        const response = await fetch(
            `./content/spotify.json?ts=${Date.now()}`,
            { cache: "no-store" },
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        renderLastListenedTrack(await response.json());
    } catch (error) {
        spotifyWidget.innerHTML =
            "<p>der letzte track konnte nicht geladen werden.</p>";
        console.error("Fehler beim Laden von spotify.json:", error);
    }
};
