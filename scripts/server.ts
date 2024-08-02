import type { RespTuple } from "./types.d.ts";
import { Ctype, APIActions } from "./lib/enums.ts"
import {
    loadDBEntries, addDBEntry, findDBEntry, editDBFlags,
    serveFile, renderPug, HTTPError, retrievePOSTBody
} from "./lib/server-logic.ts";
import fs from "node:fs";
import * as http from "node:http";
import { Buffer } from "node:buffer";
import open from "open";

const HOST = "localhost";
const PORT = 8080;
const BASE_URL = `http://${HOST}:${PORT}`;

async function getData(params: URLSearchParams): Promise<string> {
    const action = params.get("action");
    if (!action) {
        throw new HTTPError("Action not specified", 400, Ctype.JSON);
    }

    switch (action.toLowerCase()) {
        case "get":
            return findDBEntry(params.get("name"));

        case "list":
            return loadDBEntries();

        default:
            throw new HTTPError("Action not implemented", 501, Ctype.JSON);
    }
}

async function postData(params: URLSearchParams, postData: Buffer | null): Promise<string> {
    if (!postData) {
        throw new HTTPError("POST data missing", 400);
    }

    const action = params.get("action");
    if (!action) {
        throw new HTTPError("Action not specified", 400, Ctype.JSON);
    }

    switch (action.toLowerCase()) {
        case "submit":
            return addDBEntry(postData, params.get("override"));

        case "editflags":
            return editDBFlags(postData);

        default:
            throw new HTTPError("Action not implemented", 501, Ctype.JSON);
    }
}

async function handleEndpoint(endpoint: string | null | undefined, body: Buffer | null): Promise<RespTuple> {
    const { pathname, searchParams } = new URL(endpoint ?? "/", BASE_URL);

    switch (pathname.toLowerCase()) {
        case "/":
        case "/index":
        case "/index.html":
            return [await serveFile("index.html"), Ctype.HTML, 200, false];

        case "/script.js":
            return [await serveFile("script.js"), Ctype.JS, 200, false];

        case "/common.js":
                return [await serveFile("common.js"), Ctype.JS, 200, false];

        case "/style.css":
            return [await serveFile("style.css"), Ctype.CSS, 200, false];

        case "/icon.png":
            return ["./assets/icon.png", Ctype.PNG, 200, true];

        case "/get":
            return [await getData(searchParams), Ctype.JSON, 200, false];

        case "/post":
            return [await postData(searchParams, body), Ctype.JSON, 200, false];

        default:
            return [await serveFile("404.html"), Ctype.HTML, 404, false];
    }
}


async function handleRequest(req: http.IncomingMessage): Promise<RespTuple> {
    try {
        const postBody = await retrievePOSTBody(req);
        const { url } = req;
        return await handleEndpoint(url, postBody);

    } catch (e: unknown) {
        console.error(e);
        if (e instanceof HTTPError) {
            const { message, status, ctype } = e;
            switch (ctype) {
                case Ctype.HTML:
                    const file = await renderPug("template.pug", { message, status });
                    return [file, Ctype.HTML, status, false];

                case Ctype.JSON:
                    const body = JSON.stringify({
                        action: APIActions[APIActions.ERROR],
                        message
                    });
                    return [body, Ctype.JSON, status, false]

                default:
                    return [`/*${message}*/\n`, ctype, status, false];
            }
        }
        return [await serveFile("500.html"), Ctype.HTML, 500, false];
    }
}

const server = http.createServer(async (req, resp) => {
    const [respBody, ctype, status, binary] = await handleRequest(req);

    if (binary) {
        const stream = fs.createReadStream(respBody);
        resp.statusCode = 200;
        resp.setHeader("Content-Type", ctype);
        stream.pipe(resp);
    } else {
        resp.setHeader("Content-Type", ctype);
        resp.writeHead(status);
        resp.end(respBody, "utf-8");
    }
});

server.listen(PORT, HOST, () => {
    process.stdout.write(`Server running on ${HOST}:${PORT}\nOpen browser? [y,N]`);
    process.stdin.resume();

    process.stdin.on("data", data => {
        const uniformData = data.toString().toLowerCase();

        if (uniformData.startsWith("y")) {
            open(`http://${HOST}:${PORT}`);
        }

        process.stdout.write("\nPress ctrl+c to close server");
        process.stdin.end()
    });
});
