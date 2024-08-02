import { promises as fs } from "fs";
import * as path from "path";

const FILE_NAME = "common.ts";
const SRC_DIR = "./src/typescript/";
const DEST_DIR = "./scripts/webui-src/";

function replaceImports(fileContents: string): string {
    const typeRegEx = /import\s+type\s*{([\w_\s\,]*)}\s*from\s*"\.\/types"\s*;/;

    const imports = typeRegEx.exec(fileContents);

    if (!imports || !imports[1]) {
        throw new Error("Missing type imports in provided file");
    }

    const fixedImports = `import type {${imports[1]}} from "../../src/typescript/types.d.ts";`

    return fileContents.replace(typeRegEx, fixedImports);
}


async function main(): Promise<void> {
    const infile = await fs.readFile(`${SRC_DIR}${FILE_NAME}`, { encoding: "utf-8" });
    const fixedFile = replaceImports(infile);
    fs.writeFile(`${DEST_DIR}${FILE_NAME}`, fixedFile, { encoding: "utf-8" })
}

main()
    .catch((err) => {
        console.error(err);
    })
    .then(() => {
        console.info("Copied latest common.ts to webui-src folder");
    });