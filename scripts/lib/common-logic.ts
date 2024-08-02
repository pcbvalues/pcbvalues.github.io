import type { ValueKeys, ScoreTuple, DBScore, Score } from "../types.js";
import { promises as fs } from "fs";
import * as sqlite from "sqlite";
//@ts-ignore
import sqlite3 from "sqlite3";

const DB_PATH = "./db/scores.db";
export const KEY_PATH = "./scripts/keys.json";

function parseScore(scores: DBScore, keys: ValueKeys[]): Score {
    const stats = keys.map(x => scores[x]);
    const { name, flags } = scores;

    return { name: decodeURIComponent(name), flags, stats };
}

export function scoreToScoreTuple(score: Score): ScoreTuple {
    const { name, flags, stats } = score;
    return [name, flags, stats];
}

class DBError extends Error {
    constructor(message: string, options: ErrorOptions = {}) {
        super(message, options);
    }

    static fromErrors(message: string, ...errors: unknown[]) {
        const cause = errors.map(x => String(x)).join(";\n");
        return new DBError(message, { cause });
    }
}

export class DataBase {
    db: sqlite.Database;
    keys: ValueKeys[];

    constructor(db: sqlite.Database, keys: ValueKeys[]) {
        this.db = db;
        this.keys = keys;
    }

    static async load(dbPath: string = DB_PATH, keyPath: string = KEY_PATH): Promise<DataBase> {
        const db = await sqlite.open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        const keys = await fs.readFile(keyPath, { encoding: "utf-8" });

        return new DataBase(db, JSON.parse(keys) as ValueKeys[]);
    }

    async loadAll(): Promise<Score[]> {
        const users = [] as Score[];
        const errors = [] as unknown[];

        await this.db.each("SELECT * FROM scores", (err: unknown, row: DBScore) => {
            if (err) {
                errors.push(err);
            } else {
                users.push(parseScore(row, this.keys));
            }
        });

        if (errors.length > 0) {
            throw DBError.fromErrors("Errors while fetching from DB", ...errors);
        }

        return users;
    }

    async find(name: string): Promise<Score | null> {
        try {
            const user = await this.db.get(
                "SELECT * FROM scores WHERE name=?", [encodeURIComponent(name)]
            );

            if (user) {
                return parseScore(user, this.keys);
            }
            return null;
        } catch (e: unknown) {
            throw DBError.fromErrors("Error querying the database for a match", e);
        }
    }

    async add(name: string, scores: number[]): Promise<void> {
        if (scores.length !== this.keys.length) {
            throw new DBError("Invalid scores length")
        }

        try {
            await this.db.run(
                "INSERT OR REPLACE INTO scores VALUES(?,?,?,?,?,?,?,?,?)",
                [encodeURIComponent(name), 0, ...scores]
            );
        } catch (e: unknown) {
            throw DBError.fromErrors("Error adding score to database", e);
        }
    }

    async editFlags(name: string, flags: number): Promise<void> {
        if (!Number.isInteger(flags) || flags < 0 || flags > 2e31) {
            throw new DBError("Invalid flags provided");
        }

        const user = await this.find(name);
        if (!user) {
            throw new DBError("User not found in database");
        }

        try {
            await this.db.run(
                "UPDATE scores SET flags=? WHERE name=?",
                [flags, encodeURIComponent(name)]
            );
        } catch (e: unknown) {
            throw DBError.fromErrors("Error editing user flags in database", e);
        }
    }
}