import type { Score, SimpleScore } from "../types.d.ts";
import { Ctype, APIActions } from "../lib/enums.ts";
import { DataBase } from "./common-logic.ts";
import type * as http from "node:http"
import { promises as fs } from "fs";
import * as pug from "pug";

export class HTTPError extends Error {
    status: number;
    ctype: Ctype;

    constructor(message: string, status: number = 500, ctype: Ctype = Ctype.HTML) {
        super(message);
        this.status = status;
        this.name = `HTTPError (Status:${status})`;
        this.ctype = ctype;
    }

    static fromError(e: unknown, ctype: Ctype): HTTPError {
        if (e instanceof Error) {
            return new HTTPError(e.message, 500, ctype);
        }
        return new HTTPError(String(e), 500, ctype);
    }
}

function parseURLBool(value: string | null): boolean {
    if (value === undefined || value === null) {
        return false;
    }

    if (value.toLowerCase() === "false") {
        return false;
    }

    return true;
}

export async function loadDBEntries(): Promise<string> {
    const db = await DataBase.load();
    const scores = await db.loadAll();

    return JSON.stringify({
        action: APIActions[APIActions.SUCCESS],
        message: "",
        extra: {
            scores
        }
    });
}

export async function addDBEntry(
    data: Buffer, override: string | null = null
): Promise<string> {

    const overrideFlag = parseURLBool(override);
    const userString = data.toString("utf-8");

    const { name, stats } = JSON.parse(userString) as Score;

    if (typeof name !== "string") {
        throw new HTTPError("Invalid name", 400, Ctype.JSON);
    }

    if (!(stats instanceof Array) || stats.some(x => typeof x !== "number")) {
        throw new HTTPError("Invalid scores", 400, Ctype.JSON);
    }

    const db = await DataBase.load();

    const existentUser = await db.find(name);

    if (existentUser && !overrideFlag) {
        return JSON.stringify({
            action: APIActions[APIActions.CONFIRM],
            message: `User ${name} already exists in the database, do you want to override the last score?`,
            extra: {
                score: existentUser
            }
        });
    }

    await db.add(name, stats);

    return JSON.stringify({
        action: APIActions[APIActions.SUCCESS],
        message: "User sucessfully inserted into the database"
    });
}

export async function findDBEntry(name: string | null): Promise<string> {
    if (!name) {
        throw new HTTPError("Missing name to find in Database", 400, Ctype.JSON);
    }

    const db = await DataBase.load();
    const user = await db.find(name.trim());

    if (user) {
        return JSON.stringify({
            action: APIActions[APIActions.SUCCESS],
            message: "Found user in database with the provided name",
            extra: {
                score: user
            }
        });
    }

    return JSON.stringify({
        action: APIActions[APIActions.FAILURE],
        message: "No user found in database with provided name",
    });
}

export async function editDBFlags(data: Buffer): Promise<string> {
    const userString = data.toString("utf-8");
    const { name, flags } = JSON.parse(userString) as SimpleScore;

    const db = await DataBase.load();
    await db.editFlags(name, flags);

    return JSON.stringify({
        action: APIActions[APIActions.SUCCESS],
        message: "User flags sucessfully updated in database"
    });
}

export function serveFile(fileName: string, absolute = false, binary = false): Promise<string | Buffer> {
    const fullPath = absolute ? fileName : `./scripts/static/${fileName}`;
    return fs.readFile(fullPath, { encoding: binary ? "utf-8" : undefined });
}

export async function renderPug(
    filename: string, locals: pug.LocalsObject = {}, options: pug.Options = {}
): Promise<string> {

    const file = await fs.readFile(
        `./scripts/webui-src/${filename}`,
        { encoding: "utf-8" }
    );
    return pug.compile(file, options)(locals);
}

export function retrievePOSTBody(req: http.IncomingMessage): Promise<Buffer | null> {
    return new Promise((res, rej) => {
        if (req.method === "POST") {
            const dataChunks = [] as Uint8Array[];

            req.on("data", data => {
                dataChunks.push(data);
            });

            req.on("end", () => {
                res(Buffer.concat(dataChunks));
            });

            req.on("error", rej);

        } else {
            res(null);
        }
    });
}