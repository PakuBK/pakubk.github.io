"use strict";

const fs = require("node:fs");
const path = require("node:path");

const STATUS_FILE = path.join(__dirname, "..", "content", "nachrichten.json");
const POSTS_FILE = path.join(__dirname, "..", "content", "posts.json");

function requiredText(value, name, maxLength) {
    const text = String(value ?? "").trim();

    if (!text) {
        throw new Error(`${name} is required.`);
    }

    if (text.length > maxLength) {
        throw new Error(`${name} must be ${maxLength} characters or fewer.`);
    }

    return text;
}

function optionalText(value, name, maxLength, fallback = "") {
    const text = String(value ?? "").trim();

    if (text.length > maxLength) {
        throw new Error(`${name} must be ${maxLength} characters or fewer.`);
    }

    return text || fallback;
}

function httpsUrl(value) {
    const text = requiredText(value, "url", 2048);
    let url;

    try {
        url = new URL(text);
    } catch {
        throw new Error("url must be a valid HTTPS URL.");
    }

    if (url.protocol !== "https:") {
        throw new Error("url must be a valid HTTPS URL.");
    }

    return url.toString();
}

function germanDate(date = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        throw new Error("A valid date is required.");
    }

    const parts = new Intl.DateTimeFormat("de-DE", {
        timeZone: "Europe/Berlin",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).formatToParts(date);
    const values = Object.fromEntries(
        parts
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value]),
    );

    return `${values.day} ${values.month}, ${values.year}`;
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 4)}\n`);
    fs.renameSync(temporaryPath, filePath);
}

function addStatus(filePath, input, now = new Date()) {
    const payload = readJson(filePath);

    if (!Array.isArray(payload.nachrichten)) {
        throw new Error('Status file must contain a "nachrichten" array.');
    }

    const entry = {
        title: requiredText(input.title, "title", 120),
        date: germanDate(now),
        text: requiredText(input.text, "text", 2000),
        mood: optionalText(input.mood, "mood", 100, "-"),
    };

    payload.nachrichten.unshift(entry);
    writeJson(filePath, payload);
    return entry;
}

function updateWeeklySong(filePath, input) {
    const payload = readJson(filePath);

    if (!Array.isArray(payload.posts)) {
        throw new Error('Posts file must contain a "posts" array.');
    }

    const matches = payload.posts.filter((post) => post.id === "weekly-song");

    if (matches.length !== 1) {
        throw new Error(
            `Expected exactly one weekly-song post, found ${matches.length}.`,
        );
    }

    const song = requiredText(input.song, "song", 200);
    const artist = requiredText(input.artist, "artist", 200);
    const post = matches[0];
    post.title = "track der woche";
    post.content = `${song} - ${artist}`;
    post.url = httpsUrl(input.url);

    writeJson(filePath, payload);
    return post;
}

function runCli() {
    const command = process.argv[2];

    if (command === "add-status") {
        const entry = addStatus(STATUS_FILE, {
            title: process.env.STATUS_TITLE,
            text: process.env.STATUS_TEXT,
            mood: process.env.STATUS_MOOD,
        });
        console.log(`Added status: ${entry.title}`);
        return;
    }

    if (command === "update-weekly-song") {
        const post = updateWeeklySong(POSTS_FILE, {
            song: process.env.SONG_TITLE,
            artist: process.env.SONG_ARTIST,
            url: process.env.SONG_URL,
        });
        console.log(`Updated weekly song: ${post.content}`);
        return;
    }

    throw new Error(
        "Usage: node scripts/update-content.js add-status|update-weekly-song",
    );
}

if (require.main === module) {
    try {
        runCli();
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}

module.exports = {
    addStatus,
    germanDate,
    updateWeeklySong,
};
