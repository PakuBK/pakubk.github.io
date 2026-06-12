"use strict";

const crypto = require("node:crypto");
const http = require("node:http");
const { execFile } = require("node:child_process");

const clientId = String(process.env.SPOTIFY_CLIENT_ID ?? "").trim();
const clientSecret = String(process.env.SPOTIFY_CLIENT_SECRET ?? "").trim();
const redirectUri =
    process.env.SPOTIFY_REDIRECT_URI ??
    "http://127.0.0.1:8888/callback";

if (!clientId || !clientSecret) {
    console.error(
        "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET before running this script.",
    );
    process.exit(1);
}

const redirect = new URL(redirectUri);

if (
    redirect.protocol !== "http:" ||
    redirect.hostname !== "127.0.0.1" ||
    redirect.pathname !== "/callback"
) {
    console.error(
        "SPOTIFY_REDIRECT_URI must use http://127.0.0.1:<port>/callback.",
    );
    process.exit(1);
}

const state = crypto.randomBytes(24).toString("hex");
const authorizationUrl = new URL("https://accounts.spotify.com/authorize");
authorizationUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "user-read-recently-played",
    state,
}).toString();

const exchangeCode = async (code) => {
    const authorization = Buffer.from(
        `${clientId}:${clientSecret}`,
    ).toString("base64");
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${authorization}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
        }),
    });
    const payload = await response.json();

    if (!response.ok || !payload.refresh_token) {
        throw new Error(
            `Spotify token exchange failed: ${JSON.stringify(payload)}`,
        );
    }

    return payload.refresh_token;
};

const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, redirectUri);

    if (requestUrl.pathname !== redirect.pathname) {
        response.writeHead(404);
        response.end("Not found");
        return;
    }

    if (requestUrl.searchParams.get("state") !== state) {
        response.writeHead(400);
        response.end("State mismatch. Please restart the authorization.");
        server.close();
        return;
    }

    const code = requestUrl.searchParams.get("code");

    if (!code) {
        response.writeHead(400);
        response.end(
            `Spotify authorization failed: ${requestUrl.searchParams.get("error") || "missing code"}`,
        );
        server.close();
        return;
    }

    try {
        const refreshToken = await exchangeCode(code);
        response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        response.end(
            "Authorization complete. Return to the terminal and close this tab.",
        );
        console.log("\nSPOTIFY_REFRESH_TOKEN:");
        console.log(refreshToken);
        console.log(
            "\nStore this value as a GitHub Actions secret. Do not commit it.",
        );
    } catch (error) {
        response.writeHead(500);
        response.end("Token exchange failed. Check the terminal.");
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        server.close();
    }
});

server.listen(Number(redirect.port), redirect.hostname, () => {
    console.log(
        `Add ${redirectUri} to your Spotify app's Redirect URIs before continuing.`,
    );
    console.log(`\nOpen this URL:\n${authorizationUrl}\n`);

    if (process.platform === "win32") {
        execFile("powershell", [
            "-NoProfile",
            "-Command",
            `Start-Process '${authorizationUrl.toString().replaceAll("'", "''")}'`,
        ]);
    }
});
