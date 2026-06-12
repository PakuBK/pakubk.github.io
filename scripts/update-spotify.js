"use strict";

const fs = require("node:fs");
const path = require("node:path");

const SPOTIFY_FILE = path.join(
    __dirname,
    "..",
    "content",
    "spotify.json",
);

function requiredSecret(value, name) {
    const secret = String(value ?? "").trim();

    if (!secret) {
        throw new Error(`${name} is required.`);
    }

    return secret;
}

function selectCover(images) {
    if (!Array.isArray(images) || images.length === 0) {
        return null;
    }

    const preferred =
        images.find((image) => image?.width === 300) ??
        images.find((image) => image?.width <= 300) ??
        images.at(-1);

    return typeof preferred?.url === "string" ? preferred.url : null;
}

function normalizeRecentlyPlayed(item) {
    const track = item?.track;

    if (!track || typeof track.name !== "string") {
        throw new Error("Spotify did not return a valid recently played track.");
    }

    return {
        title: track.name,
        artists: Array.isArray(track.artists)
            ? track.artists
                  .map((artist) => artist?.name)
                  .filter((name) => typeof name === "string" && name)
            : [],
        album:
            typeof track.album?.name === "string" ? track.album.name : "",
        image: selectCover(track.album?.images),
        url:
            typeof track.external_urls?.spotify === "string"
                ? track.external_urls.spotify
                : "",
        played_at:
            typeof item.played_at === "string" ? item.played_at : null,
    };
}

async function spotifyRequest(url, options) {
    const response = await fetch(url, options);

    if (!response.ok) {
        const body = await response.text();
        throw new Error(
            `Spotify request failed (${response.status}): ${body.slice(0, 500)}`,
        );
    }

    return response.json();
}

async function refreshAccessToken({ clientId, clientSecret, refreshToken }) {
    const authorization = Buffer.from(
        `${clientId}:${clientSecret}`,
    ).toString("base64");

    const payload = await spotifyRequest(
        "https://accounts.spotify.com/api/token",
        {
            method: "POST",
            headers: {
                Authorization: `Basic ${authorization}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
        },
    );

    return requiredSecret(payload.access_token, "Spotify access token");
}

async function getLastListenedTrack(accessToken) {
    const payload = await spotifyRequest(
        "https://api.spotify.com/v1/me/player/recently-played?limit=1",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    );

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
        return null;
    }

    return normalizeRecentlyPlayed(payload.items[0]);
}

function writeTrack(filePath, track, now = new Date()) {
    const next = {
        track,
        updated_at: now.toISOString(),
    };

    fs.writeFileSync(filePath, `${JSON.stringify(next, null, 4)}\n`);
    return next;
}

function readTrackFile(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (error) {
        if (error.code === "ENOENT") {
            return null;
        }

        throw error;
    }
}

async function updateSpotifyFile({
    filePath = SPOTIFY_FILE,
    clientId,
    clientSecret,
    refreshToken,
}) {
    const accessToken = await refreshAccessToken({
        clientId: requiredSecret(clientId, "SPOTIFY_CLIENT_ID"),
        clientSecret: requiredSecret(clientSecret, "SPOTIFY_CLIENT_SECRET"),
        refreshToken: requiredSecret(refreshToken, "SPOTIFY_REFRESH_TOKEN"),
    });
    const track = await getLastListenedTrack(accessToken);
    const current = readTrackFile(filePath);

    if (JSON.stringify(current?.track ?? null) === JSON.stringify(track)) {
        return current;
    }

    return writeTrack(filePath, track);
}

async function runCli() {
    const result = await updateSpotifyFile({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
    });

    console.log(
        result.track
            ? `Updated last listened track: ${result.track.title}`
            : "No recently played track was returned.",
    );
}

if (require.main === module) {
    runCli().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = {
    getLastListenedTrack,
    normalizeRecentlyPlayed,
    readTrackFile,
    refreshAccessToken,
    selectCover,
    updateSpotifyFile,
    writeTrack,
};
