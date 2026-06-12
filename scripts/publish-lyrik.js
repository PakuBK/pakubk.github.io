"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { germanDate } = require("./update-content.js");
const { issueField } = require("./publish-art.js");

const LYRIK_FILE = path.join(__dirname, "..", "content", "lyrik.json");

function lyricalText(issueBody) {
    const match = String(issueBody ?? "").match(
        /(?:^|\n)### Text\s*\n+([\s\S]*)$/,
    );
    const text = match?.[1].trim();

    if (!text || text === "_No response_") {
        throw new Error('Issue field "Text" is required.');
    }

    return text.replace(/\r\n/g, "\n");
}

function publishLyricalWork(filePath, issueBody, now = new Date()) {
    const title = issueField(issueBody, "Title");
    const text = lyricalText(issueBody);

    if (title.length > 200) {
        throw new Error("Title must be 200 characters or fewer.");
    }

    if (text.length > 20_000) {
        throw new Error("Text must be 20,000 characters or fewer.");
    }

    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (!Array.isArray(payload.works)) {
        throw new Error('Lyrik file must contain a "works" array.');
    }

    const work = {
        title,
        date: germanDate(now),
        text,
    };

    payload.works.unshift(work);
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(
        temporaryPath,
        `${JSON.stringify(payload, null, 4)}\n`,
    );
    fs.renameSync(temporaryPath, filePath);
    return work;
}

function runCli() {
    const work = publishLyricalWork(
        LYRIK_FILE,
        process.env.ISSUE_BODY,
    );
    console.log(`Published lyrical work: ${work.title}`);
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
    lyricalText,
    publishLyricalWork,
};
