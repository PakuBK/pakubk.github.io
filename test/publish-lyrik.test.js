"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { publishLyricalWork } = require("../scripts/publish-lyrik.js");

function temporaryLyrikFile(value = { works: [] }) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "publish-lyrik-"));
    const filePath = path.join(directory, "lyrik.json");
    fs.writeFileSync(filePath, JSON.stringify(value));
    return filePath;
}

function issueBody(title = "Zwischenräume", text = "erste zeile\n\nzweite zeile") {
    return `### Title

${title}

### Text

${text}
`;
}

test("prepends a lyrical work and preserves its line breaks", () => {
    const filePath = temporaryLyrikFile({
        works: [{ title: "older" }],
    });

    publishLyricalWork(
        filePath,
        { title: "[lyrik] ignored", body: issueBody() },
        new Date("2026-06-12T10:00:00.000Z"),
    );

    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    assert.deepEqual(payload.works[0], {
        title: "Zwischenräume",
        date: "12 Juni, 2026",
        text: "erste zeile\n\nzweite zeile",
    });
    assert.equal(payload.works[1].title, "older");
});

test("preserves Unicode and normalizes Windows line endings", () => {
    const filePath = temporaryLyrikFile();

    publishLyricalWork(
        filePath,
        {
            title: "[lyrik] ignored",
            body: issueBody("für später", "★ eins\r\nzwei"),
        },
        new Date("2026-06-12T10:00:00.000Z"),
    );

    const work = JSON.parse(fs.readFileSync(filePath, "utf8")).works[0];
    assert.equal(work.title, "für später");
    assert.equal(work.text, "★ eins\nzwei");
});

test("preserves markdown-like headings inside the lyrical text", () => {
    const filePath = temporaryLyrikFile();

    publishLyricalWork(
        filePath,
        {
            title: "[lyrik] ignored",
            body: issueBody(
                "überschrift",
                "anfang\n\n### innen\n\nende",
            ),
        },
        new Date("2026-06-12T10:00:00.000Z"),
    );

    const work = JSON.parse(fs.readFileSync(filePath, "utf8")).works[0];
    assert.equal(work.text, "anfang\n\n### innen\n\nende");
});

test("publishes GitHub's plain issue form output using the issue title", () => {
    const filePath = temporaryLyrikFile();

    publishLyricalWork(
        filePath,
        {
            title: "vermissen, vergessen, vergeben",
            body: `erste zeile

zweite zeile

### Publish

- [x] Publish this issue as a lyrical artwork.`,
        },
        new Date("2026-06-12T10:00:00.000Z"),
    );

    const work = JSON.parse(fs.readFileSync(filePath, "utf8")).works[0];
    assert.equal(work.title, "vermissen, vergessen, vergeben");
    assert.equal(work.text, "erste zeile\n\nzweite zeile");
});

test("rejects missing text without changing the file", () => {
    const filePath = temporaryLyrikFile();
    const before = fs.readFileSync(filePath, "utf8");

    assert.throws(
        () =>
            publishLyricalWork(
                filePath,
                {
                    title: "hello",
                    body: "### Title\n\nhello\n\n### Text\n\n_No response_",
                },
            ),
        /Text.*required/,
    );
    assert.equal(fs.readFileSync(filePath, "utf8"), before);
});
