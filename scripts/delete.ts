import { promises as fs } from "fs";
import * as path from "path";

const deleteDir = "./dist/";

const deleteExt = [".js", ".map"];

const whitelist = ["common.min.js"];


async function main(): Promise<void> {
    const dir = await fs.readdir(deleteDir);
    let count = 0;
    for (const file of dir) {
        if (whitelist.includes(file)) {
            continue;
        }
        const ext = path.extname(file);
        if (deleteExt.includes(ext)) {
            const fname = deleteDir + file;
            await fs.unlink(fname);
            count++;
        }
    }
    console.info(`${count} files deleted`);
}

main().catch(
    (err: Error) => {
        console.error(err);
    }
);