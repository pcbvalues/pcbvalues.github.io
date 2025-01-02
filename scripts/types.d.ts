import type { Ctype } from "./lib/enums.ts";
import type { Score, ScoreTuple, Question, Value } from "../src/typescript/types.d.ts";

export { ScoreTuple, Question, Value, Score };

export type RespTuple = [resp: string | Buffer, ctype: Ctype, status: number, binary: boolean];

export type ValueKeys = "dmnr" | "pers" | "judg" | "polt" | "real" | "perc" | "horn";

export type SimpleScore = Omit<Score, "stats">;

export type RawQuestion = {
    question: string;
    yesno: boolean;
    short: boolean;
    effect: {
        [k in ValueKeys]: number;
    }
};

export type DBScore = {
    name: string;
    flags: number;
} & { [k in ValueKeys]: number; };

type _ConfigCredits = {
    title: string;
    elms: {
        name: string;
        color?: string;
    }[];
};

type _ConfigStrings = "api_url" | "discord_url" |
    "wiki_url" | "reddit_url" | "title" | "url" | "desc";

export type JsonObjects = {
    users: ScoreTuple[];
    questions: RawQuestion[];
    config: {
        values: (Value & {
            key: ValueKeys,
            desc?: string,
            white_label?: [boolean, boolean]
        })[];

        credits: _ConfigCredits[];

    } & { [k in _ConfigStrings]: string };
}