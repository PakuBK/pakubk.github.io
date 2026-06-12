"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
    addStatus,
    germanDate,
    updateWeeklySong,
} = require("../scripts/update-content.js");

function temporaryJson(value) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "site-content-"));
    const filePath = path.join(directory, "content.json");
    fs.writeFileSync(filePath, JSON.stringify(value));
    return filePath;
}

test("formats the status date in the Europe/Berlin timezone", () => {
    const date = new Date("2026-03-31T22:30:00.000Z");
    assert.equal(germanDate(date), "1 April, 2026");
});

test("prepends a trimmed status and preserves multiline Unicode text", () => {
    const filePath = temporaryJson({
        nachrichten: [{ title: "older" }],
    });

    addStatus(
        filePath,
        {
            title: '  Neue "Sache"  ',
            text: "  erste Zeile\nzweite Zeile ★  ",
            mood: "  (⌐■_■)  ",
        },
        new Date("2026-06-12T10:00:00.000Z"),
    );

    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    assert.deepEqual(payload.nachrichten[0], {
        title: 'Neue "Sache"',
        date: "12 Juni, 2026",
        text: "erste Zeile\nzweite Zeile ★",
        mood: "(⌐■_■)",
    });
    assert.equal(payload.nachrichten[1].title, "older");
});

test("uses a visible fallback when mood is empty", () => {
    const filePath = temporaryJson({ nachrichten: [] });
    addStatus(
        filePath,
        { title: "hello", text: "world", mood: " " },
        new Date("2026-06-12T10:00:00.000Z"),
    );

    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    assert.equal(payload.nachrichten[0].mood, "-");
});

test("rejects an empty required status field without changing the file", () => {
    const filePath = temporaryJson({ nachrichten: [] });
    const before = fs.readFileSync(filePath, "utf8");

    assert.throws(
        () => addStatus(filePath, { title: " ", text: "hello" }),
        /title is required/,
    );
    assert.equal(fs.readFileSync(filePath, "utf8"), before);
});

test("replaces exactly one weekly song and keeps the other posts", () => {
    const filePath = temporaryJson({
        posts: [
            { id: "other", title: "Other" },
            {
                id: "weekly-song",
                title: "old title",
                content: "old song",
                url: "https://example.com/old",
            },
        ],
    });

    updateWeeklySong(filePath, {
        song: "  New Song  ",
        artist: "  An Artist  ",
        url: "https://example.com/listen?q=1",
    });

    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    assert.equal(payload.posts[0].title, "Other");
    assert.deepEqual(payload.posts[1], {
        id: "weekly-song",
        title: "track der woche",
        content: "New Song - An Artist",
        url: "https://example.com/listen?q=1",
    });
});

test("rejects non-HTTPS song URLs without changing the file", () => {
    const filePath = temporaryJson({
        posts: [{ id: "weekly-song" }],
    });
    const before = fs.readFileSync(filePath, "utf8");

    assert.throws(
        () =>
            updateWeeklySong(filePath, {
                song: "Song",
                artist: "Artist",
                url: "http://example.com/song",
            }),
        /valid HTTPS URL/,
    );
    assert.equal(fs.readFileSync(filePath, "utf8"), before);
});

test("rejects missing or duplicate weekly song cards", () => {
    const input = {
        song: "Song",
        artist: "Artist",
        url: "https://example.com/song",
    };
    const missing = temporaryJson({ posts: [] });
    const duplicate = temporaryJson({
        posts: [{ id: "weekly-song" }, { id: "weekly-song" }],
    });

    assert.throws(() => updateWeeklySong(missing, input), /found 0/);
    assert.throws(() => updateWeeklySong(duplicate, input), /found 2/);
});
