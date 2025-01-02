import type { APIActions, APIResponse, Score } from "./types.d.ts";
import type { Flags } from "./common.js";
import { parseFlags, serializeFlags } from "./common.js";

const jsonInput = <HTMLTextAreaElement>document.getElementById("json-input")!;

const submitButton = <HTMLButtonElement>document.getElementById("submit-button")!;
const listButton = <HTMLButtonElement>document.getElementById("list-button")!;
const clearButton = <HTMLButtonElement>document.getElementById("clear-button")!;

const overrideCheckbox = <HTMLInputElement>document.getElementById("override-checkbox")!;
const clearCheckbox = <HTMLInputElement>document.getElementById("clear-checkbox")!;

const dialog = <HTMLDialogElement>document.getElementById("dialog-popup")!;
const dialogContents = <HTMLDivElement>document.getElementById("dialog-content")!;
const dialogClose = <HTMLButtonElement>document.getElementById("dialog-close")!;

declare global {
    var activeUser: string | null;
}

globalThis.activeUser = null;

class JsonReq {
    static async request(endpoint: string, params: Record<string, string>, options: RequestInit = {}): Promise<Response> {
        const abortController = new AbortController();
        const timeout = setTimeout(
            () => abortController.abort(), 5000
        );
        options.signal = abortController.signal;

        const urlParams = new URLSearchParams(params);
        const finalUrl = `/${endpoint}?${urlParams}`;

        const resp = await fetch(finalUrl, options);

        clearTimeout(timeout);

        const ctype = resp.headers.get("Content-Type");
        if (!ctype || !ctype.startsWith("application/json")) {
            throw new Error(`Invalid content type, expected application/json, got ${ctype}`);
        }

        if (resp.status > 299) {
            throw new Error(`Recieved error response code: ${resp.status}, ${resp.statusText}`);
        }
        return resp;
    }

    static async get<T>(params: Record<string, string>): Promise<T> {
        const resp = await this.request("get", params);
        return resp.json() as Promise<T>;
    }

    static async post<T>(params: Record<string, string>, body: unknown): Promise<T> {
        const options: RequestInit = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        }
        const resp = await this.request("post", params, options);

        return resp.json() as Promise<T>;
    }
}

function validateScores(scores: unknown): boolean {
    if (typeof scores !== "object" || scores === null) {
        return false;
    }
    const { name, stats } = scores as Score;

    if (!name || typeof name !== "string") {
        return false;
    }

    if (stats && stats instanceof Array) {
        for (const i of stats) {
            if (typeof i !== "number" || i < 0 || i > 100) {
                return false;
            }
        }
        return true;
    }
    return false;
}

function openDialog(contents: HTMLElement): void {
    if (dialog.open) {
        return;
    }

    while (dialogContents.children.length) {
        dialogContents.removeChild(dialogContents.lastChild);
    }

    dialogContents.appendChild(contents);
    dialog.showModal();
}

function confirmDialog(text: string): Promise<boolean> {
    const parent = document.createElement("div");

    const textElm = document.createElement("p");
    textElm.textContent = text;

    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Yes";
    confirmButton.classList.add("left-button");

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "No";
    cancelButton.classList.add("right-button");

    parent.append(textElm, confirmButton, cancelButton);
    openDialog(parent);

    let resolved = false;

    return new Promise<boolean>((res, _rej) => {
        dialog.addEventListener("close", () => {
            if (!resolved && !dialog.open) {
                res(false)
            }
        });
        confirmButton.addEventListener("click", () => {
            resolved = true;
            res(true);
            dialog.close();
        });
        cancelButton.addEventListener("click", () => {
            resolved = true;
            res(false);
            dialog.close();
        });
    });
}

function flagsDialog(user: string, flagBitField: number): void {
    const checkboxParent = document.createElement("div");

    const parsedFlags = parseFlags(flagBitField);

    const header = document.createElement("h2");
    header.innerText = `Editing flags for user: ${user}`;
    checkboxParent.append(header);

    for (const [key, val] of Object.entries(parsedFlags)) {
        const checkBoxDiv = document.createElement("div");
        checkBoxDiv.classList.add("flag-container");

        const checkBoxLabel = document.createElement("span");
        checkBoxLabel.classList.add("flag-label");
        checkBoxLabel.textContent = key;

        const checkBox = document.createElement("input");
        checkBox.type = "checkbox";
        checkBox.classList.add("flag-checkbox");
        checkBox.checked = val;

        checkBoxDiv.append(checkBoxLabel, checkBox);
        checkboxParent.append(checkBoxDiv);
    }

    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit flags";
    submitButton.addEventListener("click", () => {
        const flagContainers = [...checkboxParent.querySelectorAll("div.flag-container")];

        if (flagContainers.length !== Object.keys(parsedFlags).length) {
            throw new Error("Invalid keyset");
        }

        const keyObj = {} as Record<Flags, boolean>;

        for (const elm of flagContainers) {
            const label = elm.querySelector<HTMLSpanElement>("span.flag-label");
            const checkbox = elm.querySelector<HTMLInputElement>("input.flag-checkbox");

            if (!label || !checkbox) {
                throw new Error("Missing flag elements");
            }

            keyObj[label.textContent as Flags] = checkbox.checked;
        }

        const newFlags = serializeFlags(keyObj);

        API.editFlags(user, newFlags);
    });

    checkboxParent.append(submitButton);

    dialog.close();
    openDialog(checkboxParent);
}

const API = {
    submit: async function (scores: string, override: boolean): Promise<void> {
        const data = JSON.parse(scores);
        data.stats = data.stats ?? data.values ?? data.vals;

        if (!validateScores(data)) {
            return;
        }

        const loadingElm = document.createElement("div");
        loadingElm.textContent = "Submitting...";

        openDialog(loadingElm);

        const resp = await JsonReq.post<APIResponse<{ score: Score }>>({
            action: "submit", override: String(override)
        }, data);

        dialog.close();

        switch (resp.action) {
            case "CONFIRM":
                const promptResp = await confirmDialog(resp.message);
                if (promptResp) {
                    await API.submit(scores, true);
                }
                break;

            case "SUCCESS":
                if (clearCheckbox.checked) {
                    jsonInput.value = "";
                }
                const elm = document.createElement("div");
                elm.textContent = resp.message;
                openDialog(elm);
                break;

            case "ERROR":
            case "FAILURE":
                throw new Error(resp.message);
        }
    },
    list: async function (): Promise<void> {
        const resp = await JsonReq.get<APIResponse<{ scores: Score[] }>>({
            action: "list"
        });

        const parent = document.createElement("div");
        parent.classList.add("list-container");

        function generateList(name: string, values: string[], flags: number): HTMLDivElement {
            const child = document.createElement("div");
            child.classList.add("list-elm");

            const nameSpan = document.createElement("span");
            nameSpan.textContent = name;
            nameSpan.classList.add("left-align");

            const rightColumn = document.createElement("span");
            rightColumn.classList.add("right-align");

            const valuesSpan = document.createElement("span");
            valuesSpan.innerHTML = values.map(x => x.padStart(5).replaceAll(" ", "&nbsp;")).join(" ");
            valuesSpan.classList.add("monospaced");

            //WIP
            if (name !== "Names") {
                const flagsButton = document.createElement("button");
                flagsButton.classList.add("slim-button");
                flagsButton.textContent = "Change user flags";
                flagsButton.addEventListener("click", () => flagsDialog(name, flags));

                rightColumn.append(valuesSpan, flagsButton);
            } else {
                const placeholder = document.createElement("span");
                placeholder.style.width = "84pt";
                rightColumn.append(valuesSpan, placeholder);
            }
            child.append(nameSpan, rightColumn);

            return child;
        }

        parent.appendChild(generateList("Names", ["dmnr", "pers", "judg", "polt", "real", "perc", "horn"], 0));

        for (const { name, stats, flags } of resp.extra.scores) {
            parent.appendChild(
                generateList(
                    name, stats.map(x => x.toFixed(1)), flags
                )
            );
        }

        openDialog(parent);
    },
    editFlags: async function (name: string, flags: number) {
        const resp = await JsonReq.post<APIResponse<void>>(
            { action: "editflags" }, { name, flags }
        );

        const div = document.createElement("div");

        if (resp.action === "SUCCESS") {
            div.innerText = `Edited flags for user ${name} sucessfully`;
        } else {
            div.innerText = `Failed to edit flags for user ${name}`;
        }
        dialog.close();
        openDialog(div);
    }
}

dialogClose.addEventListener("click", () => {
    dialog.close();
});

dialog.addEventListener("click", (ev) => {
    const { target } = ev;
    if (!(target instanceof HTMLDialogElement)) {
        return;
    }
    const bounds = target.getBoundingClientRect();
    const inWidth = ev.clientX > bounds.left && ev.clientX < bounds.right;
    const inHeight = ev.clientY > bounds.top && ev.clientY < bounds.bottom;

    if (!inWidth || !inHeight) {
        dialog.close();
    }
});


submitButton.addEventListener("click", () => {
    const text = jsonInput.value.trim();
    if (!text) {
        return;
    }
    API.submit(text, overrideCheckbox.checked);
});

listButton.addEventListener("click", () => {
    API.list();
});

clearButton.addEventListener("click", () => {
    jsonInput.value = "";
});