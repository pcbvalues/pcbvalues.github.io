import type { ValueKeys } from "./types.d.ts";
import type { MinifyOptions } from "terser";
import { promises as fs } from "fs";
import { DataBase, scoreToScoreTuple, KEY_PATH } from "./lib/common-logic.ts";
import { minifyAll, loadData, renderTemplates, writeJSON } from "./lib/build-logic.ts";

const buildParams = {
    jsDir: "./dist/",
    jsKeep: ["common"],
    viewsDir: "./src/pug/",
    dataDir: "./src/data/",
    dataOutDir: "./dist/",
    minify: process.argv.some(x => x.toLowerCase() === "--minify"),
    pasedb: process.argv.some(x => x.toLowerCase() === "--parsedb"),
    terserParams: {
        compress: {
            ecma: 2022,
            arrows: true,
            unsafe: true,
            unsafe_arrows: true,
            passes: 2
        },
        mangle: {
            properties: {
                regex: /^_/
            }
        },
        module: true,
        toplevel: true
    }
};


async function main(params: typeof buildParams): Promise<void> {
    const dataRecord = await loadData(buildParams.dataDir);
    console.info(`${Object.keys(dataRecord).length} data objects loaded`);

    let jsRecord: Record<string, string> | null = null;
    if (buildParams.minify) {
        jsRecord = await minifyAll(
            buildParams.jsDir,
            buildParams.jsKeep,
            buildParams.terserParams as MinifyOptions
        );

        console.info(`${Object.keys(jsRecord).length} JavaScript files minified`);
    }

    const keys = dataRecord.config.values.map(x => x.key);

    await fs.writeFile(KEY_PATH, JSON.stringify(keys), { encoding: "utf-8" });

    if (buildParams.pasedb) {
        const db = await DataBase.load();
        const users = await db.loadAll();
        dataRecord.users = users
            .map(scoreToScoreTuple)
            .sort((a, b) => a[0].localeCompare(b[0]));

        console.info(`${users.length} user scores loaded from database`);
    }

    const dataConfig = {
        ...dataRecord,
        version: process.env.npm_package_version,
        size: dataRecord.config.values.length,
        longq: dataRecord.questions.length,
        shortq: dataRecord.questions.filter((x: any) => x.short).length,
        js: jsRecord
    };

    await renderTemplates(buildParams.viewsDir, dataConfig);
    console.info("Templates rendered");

    await writeJSON(params.dataOutDir, keys, dataRecord);
    console.info("Configuration files written");
}

main(buildParams).catch(
    (err: Error) => {
        console.error(err);
    }
);