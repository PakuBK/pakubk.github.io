"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
    attachmentUrl,
    detectImageExtension,
    issueField,
    publishArtwork,
    slugify,
} = require("../scripts/publish-art.js");

const PNG_BYTES = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

function workspace() {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "publish-art-"));
    const imageDirectory = path.join(directory, "imgs");
    const manifestFile = path.join(directory, "art.json");
    fs.mkdirSync(imageDirectory);
    fs.writeFileSync(manifestFile, '{"images":["../imgs/old.png"]}');
    return { imageDirectory, manifestFile };
}

function issueBody(name = "Nächtlicher Zug") {
    return `### Artwork name

${name}

### Artwork file

![art](https://github.com/user-attachments/assets/abc-123)
`;
}

test("extracts issue form fields and attachment URLs", () => {
    const body = issueBody();
    assert.equal(issueField(body, "Artwork name"), "Nächtlicher Zug");
    assert.equal(
        attachmentUrl(issueField(body, "Artwork file")),
        "https://github.com/user-attachments/assets/abc-123",
    );
});

test("creates readable ASCII slugs", () => {
    assert.equal(slugify(" Nächtlicher Zug! "), "nachtlicher-zug");
    assert.equal(slugify("★"), "artwork");
});

test("detects supported image formats from bytes", () => {
    assert.equal(detectImageExtension(PNG_BYTES), "png");
    assert.equal(
        detectImageExtension(Buffer.from([0xff, 0xd8, 0xff, 0x00])),
        "jpg",
    );
    assert.equal(detectImageExtension(Buffer.from("GIF89a")), "gif");
    assert.equal(
        detectImageExtension(Buffer.from("RIFF0000WEBP")),
        "webp",
    );
    assert.throws(
        () => detectImageExtension(Buffer.from("not an image")),
        /not a supported image/,
    );
});

test("publishes an uploaded image and prepends the manifest entry", async () => {
    const { imageDirectory, manifestFile } = workspace();
    const fetchImplementation = async () =>
        new Response(PNG_BYTES, {
            status: 200,
            headers: { "content-length": String(PNG_BYTES.length) },
        });

    const filename = await publishArtwork({
        issueBody: issueBody(),
        issueNumber: 42,
        imageDirectory,
        manifestFile,
        fetchImplementation,
    });

    assert.equal(filename, "42-nachtlicher-zug.png");
    assert.deepEqual(
        fs.readFileSync(path.join(imageDirectory, filename)),
        PNG_BYTES,
    );
    assert.deepEqual(
        JSON.parse(fs.readFileSync(manifestFile, "utf8")).images,
        ["../imgs/42-nachtlicher-zug.png", "../imgs/old.png"],
    );
});

test("rejects external URLs before downloading", async () => {
    const { imageDirectory, manifestFile } = workspace();
    const body = issueBody().replace(
        "https://github.com/user-attachments/assets/abc-123",
        "https://example.com/image.png",
    );
    let fetched = false;

    await assert.rejects(
        publishArtwork({
            issueBody: body,
            issueNumber: 42,
            imageDirectory,
            manifestFile,
            fetchImplementation: async () => {
                fetched = true;
            },
        }),
        /GitHub issue attachment/,
    );
    assert.equal(fetched, false);
});

test("rejects oversized uploads without writing an image", async () => {
    const { imageDirectory, manifestFile } = workspace();

    await assert.rejects(
        publishArtwork({
            issueBody: issueBody(),
            issueNumber: 42,
            imageDirectory,
            manifestFile,
            fetchImplementation: async () =>
                new Response(PNG_BYTES, {
                    status: 200,
                    headers: {
                        "content-length": String(11 * 1024 * 1024),
                    },
                }),
        }),
        /10 MB/,
    );
    assert.deepEqual(fs.readdirSync(imageDirectory), []);
});
