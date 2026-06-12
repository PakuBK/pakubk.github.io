"use strict";

const fs = require("node:fs");
const path = require("node:path");

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ART_MANIFEST_FILE = path.join(
    __dirname,
    "..",
    "content",
    "art.json",
);
const IMAGE_DIRECTORY = path.join(__dirname, "..", "imgs");

function issueField(body, label) {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const expression = new RegExp(
        `(?:^|\\n)### ${escapedLabel}\\s*\\n+([\\s\\S]*?)(?=\\n### |$)`,
    );
    const match = String(body ?? "").match(expression);
    const value = match?.[1].trim();

    if (!value || value === "_No response_") {
        throw new Error(`Issue field "${label}" is required.`);
    }

    return value;
}

function attachmentUrl(value) {
    const match = String(value).match(
        /https:\/\/github\.com\/user-attachments\/assets\/[A-Za-z0-9-]+/,
    );

    if (!match) {
        throw new Error("Artwork file must be a GitHub issue attachment.");
    }

    return match[0];
}

function slugify(value) {
    const slug = String(value)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);

    return slug || "artwork";
}

function detectImageExtension(bytes) {
    if (
        bytes.length >= 8 &&
        bytes.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        )
    ) {
        return "png";
    }

    if (
        bytes.length >= 3 &&
        bytes[0] === 0xff &&
        bytes[1] === 0xd8 &&
        bytes[2] === 0xff
    ) {
        return "jpg";
    }

    const header = bytes.subarray(0, 6).toString("ascii");

    if (header === "GIF87a" || header === "GIF89a") {
        return "gif";
    }

    if (
        bytes.length >= 12 &&
        bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
        bytes.subarray(8, 12).toString("ascii") === "WEBP"
    ) {
        return "webp";
    }

    throw new Error("Uploaded file is not a supported image.");
}

function addArtworkToManifest(manifestFile, imagePath) {
    const payload = JSON.parse(fs.readFileSync(manifestFile, "utf8"));

    if (!Array.isArray(payload.images)) {
        throw new Error('Art manifest must contain an "images" array.');
    }

    if (payload.images.includes(imagePath)) {
        throw new Error(`Art manifest already contains "${imagePath}".`);
    }

    payload.images.unshift(imagePath);
    const temporaryPath = `${manifestFile}.${process.pid}.tmp`;
    fs.writeFileSync(
        temporaryPath,
        `${JSON.stringify(payload, null, 4)}\n`,
    );
    fs.renameSync(temporaryPath, manifestFile);
}

async function downloadArtwork(url, fetchImplementation = fetch) {
    const response = await fetchImplementation(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
        throw new Error(`Could not download artwork (HTTP ${response.status}).`);
    }

    const declaredLength = Number(response.headers.get("content-length"));

    if (
        Number.isFinite(declaredLength) &&
        declaredLength > MAX_IMAGE_BYTES
    ) {
        throw new Error("Artwork exceeds the 10 MB size limit.");
    }

    const bytes = Buffer.from(await response.arrayBuffer());

    if (bytes.length === 0) {
        throw new Error("Downloaded artwork is empty.");
    }

    if (bytes.length > MAX_IMAGE_BYTES) {
        throw new Error("Artwork exceeds the 10 MB size limit.");
    }

    return bytes;
}

async function publishArtwork(options) {
    const name = issueField(options.issueBody, "Artwork name");
    const upload = issueField(options.issueBody, "Artwork file");
    const url = attachmentUrl(upload);
    const issueNumber = String(options.issueNumber ?? "").trim();

    if (!/^\d+$/.test(issueNumber)) {
        throw new Error("A numeric issue number is required.");
    }

    const bytes = await downloadArtwork(url, options.fetchImplementation);
    const extension = detectImageExtension(bytes);
    const filename = `${issueNumber}-${slugify(name)}.${extension}`;
    const destination = path.join(options.imageDirectory, filename);

    if (fs.existsSync(destination)) {
        throw new Error(`Artwork file already exists: ${filename}`);
    }

    fs.writeFileSync(destination, bytes, { flag: "wx" });

    try {
        addArtworkToManifest(
            options.manifestFile,
            `../imgs/${filename}`,
        );
    } catch (error) {
        fs.rmSync(destination);
        throw error;
    }

    return filename;
}

async function runCli() {
    const filename = await publishArtwork({
        issueBody: process.env.ISSUE_BODY,
        issueNumber: process.env.ISSUE_NUMBER,
        imageDirectory: IMAGE_DIRECTORY,
        manifestFile: ART_MANIFEST_FILE,
    });
    console.log(`Published artwork: ${filename}`);
}

if (require.main === module) {
    runCli().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = {
    attachmentUrl,
    detectImageExtension,
    issueField,
    publishArtwork,
    slugify,
};
