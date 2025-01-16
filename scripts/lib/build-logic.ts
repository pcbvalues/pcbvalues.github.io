import type { ValueKeys, Question, RawQuestion, Value, JsonObjects, BadgesConfig } from "../types.d.ts";
import { promises as fs } from "fs";
import * as path from "path";
import * as terser from "terser";
import * as pug from "pug";

function parseJS(output: terser.MinifyOutput, filename: string): [string, string] {
    const bareName = path.parse(filename).name;
    const { code } = output;
    if (!code) {
        return [bareName, ""];
    }
    const filtCode = code.replaceAll(/\.\/(\w+)\.js/gmi, "./dist/$1.min.js");
    return [bareName, filtCode];
}

async function minifyJS(file: string, dir: string, params: terser.MinifyOptions): Promise<[string, string] | null> {
    const ext = path.extname(file);
    if (ext !== ".js") {
        return null;
    }
    const filePath = dir + file;
    const readFile = await fs.readFile(filePath, { encoding: "utf-8" });
    const minified = await terser.minify(readFile, params);

    return parseJS(minified, file);
}

export async function minifyAll(dir: string, keep: string[], params: terser.MinifyOptions): Promise<Record<string, string>> {
    const files = await fs.readdir(dir);

    const minJS = await Promise.all(
        files.map(x => minifyJS(x, dir, params))
    );

    const fullfilled = minJS.filter(
        x => x
    ) as [string, string][];

    const jsObj = fullfilled.reduce(
        (pv, cv) => ({ ...pv, [cv[0]]: cv[1] })
        , {} as Record<string, string>
    );

    for (const k of keep) {
        const min = jsObj[k] ?? "";
        const path = `${dir}${k}.min.js`;
        await fs.writeFile(path, min);
    }
    return jsObj;
}

export async function renderTemplates(dirName: string, config: Record<string, unknown>): Promise<unknown> {
    const fsPromises = [] as Promise<unknown>[];

    for (const file of await fs.readdir(dirName)) {
        const ext = path.extname(file);

        if (ext === ".pug") {
            const pathName = dirName + file;
            const basename = path.parse(file).name;

            const html = pug.renderFile(pathName, config as pug.Options);
            const pHtml = html.replaceAll(/\n/gm, "").replaceAll(" = ", "=");

            fsPromises.push(
                fs.writeFile(`./${basename}.html`, pHtml)
            );
        }
    }
    return Promise.all(fsPromises);
}

export async function loadData(dirName: string): Promise<JsonObjects> {
    const dataRecord = {} as JsonObjects;

    for (const file of await fs.readdir(dirName)) {
        const ext = path.extname(file);
        if (ext === ".json") {
            const pathName = dirName + file;
            const fileBuff = await fs.readFile(pathName, { encoding: "utf-8" });

            const basename = path.parse(file).name;
            dataRecord[basename as keyof JsonObjects] = JSON.parse(fileBuff);
        }
    }
    return dataRecord;
}

export async function writeJSON(outDir: string, keys: ValueKeys[], obj: JsonObjects): Promise<void> {
    const values = structuredClone(obj.config.values);
    const keysToArr = (vals: Record<ValueKeys, number>): number[] => keys.map(x => vals[x]);

    for (const [fileName, fileObject] of Object.entries(obj)) {
        switch (fileName) {
            case "config":
                const newVal = [] as Value[];

                for (const val of values) {
                    const nv = structuredClone(val) as Value & { desc?: string, white_label?: [boolean, boolean] };
                    delete nv.desc;

                    const wl = nv.white_label as [boolean, boolean];
                    nv.white = (Number(wl[0]) << 1) | Number(wl[1]);
                    delete nv.white_label;

                    newVal.push(nv);
                }
                await fs.writeFile(`${outDir}values.json`, JSON.stringify(newVal));
                break;

            case "questions":
                const newQuestions = [] as Question[];
                const questions = fileObject as RawQuestion[];

                for (const q of questions) {
                    const text = q.question;
                    const effect = keysToArr(q.effect);
                    const flags = Number(q.yesno) << 1 | Number(q.short);
                    newQuestions.push({ text, effect, flags });
                }

                await fs.writeFile(`${outDir}questions.json`, JSON.stringify(newQuestions));
                break;

            default:
                await fs.writeFile(`${outDir}${fileName}.json`, JSON.stringify(fileObject));
                break;
        }
    }
}

export async function renderMarkdownTemplate(
    srcPath: string, destPath: string, badgeConfigs: BadgesConfig[],
    config: JsonObjects["config"], replaceName = "{{{LINKS}}}"
): Promise<void> {
    const file = await fs.readFile(srcPath, { encoding: "utf-8" });

    const badgeStrings = badgeConfigs.map(({ title, image, link }) =>
        `[![${title}](${image})](${config[link]})`
    ).join("\n");

    const outputStr = file.replaceAll(replaceName, badgeStrings);

    return fs.writeFile(destPath, outputStr, { encoding: "utf-8" });
}