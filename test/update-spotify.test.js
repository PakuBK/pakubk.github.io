"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
    normalizeRecentlyPlayed,
    selectCover,
    writeTrack,
} = require("../scripts/update-spotify.js");

test("selects a 300px Spotify cover when available", () => {
    const images = [
        { width: 640, url: "https://example.com/large.jpg" },
        { width: 300, url: "https://example.com/medium.jpg" },
        { width: 64, url: "https://example.com/small.jpg" },
    ];

    assert.equal(selectCover(images), "https://example.com/medium.jpg");
});

test("normalizes the public recently played track fields", () => {
    const track = normalizeRecentlyPlayed({
        played_at: "2026-06-12T10:15:00.000Z",
        track: {
            name: "A Song",
            artists: [{ name: "Artist One" }, { name: "Artist Two" }],
            album: {
                name: "An Album",
                images: [{ width: 300, url: "https://example.com/cover.jpg" }],
            },
            external_urls: {
                spotify: "https://open.spotify.com/track/example",
            },
        },
    });

    assert.deepEqual(track, {
        title: "A Song",
        artists: ["Artist One", "Artist Two"],
        album: "An Album",
        image: "https://example.com/cover.jpg",
        url: "https://open.spotify.com/track/example",
        played_at: "2026-06-12T10:15:00.000Z",
    });
});

test("writes only public widget data", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "spotify-"));
    const filePath = path.join(directory, "spotify.json");
    const track = { title: "A Song" };

    writeTrack(filePath, track, new Date("2026-06-12T10:20:00.000Z"));

    assert.deepEqual(JSON.parse(fs.readFileSync(filePath, "utf8")), {
        track,
        updated_at: "2026-06-12T10:20:00.000Z",
    });
});
