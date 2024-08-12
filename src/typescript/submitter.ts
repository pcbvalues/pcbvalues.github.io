import { parseScores } from "./common.js";

type Animate = "success" | "failure";

type APIResponse = {
    success?: boolean;
    status?: number;
    message?: string;
};

type LottiePlayer = HTMLElement & {
    play: () => void;
    load: (url: string) => void;
    loop: boolean;
};

declare global {
    var VERSION: string;
    var API_URL: string;
    var SIZE: number;
}

const files = {
    "success": "./assets/85185-checkmark.json",
    "failure": "./assets/94303-failed.json",
    "loading": "./assets/124239-loading-bouncy.json"
};

let lock = false;
let count = 0;
const player = <LottiePlayer>document.querySelector("lottie-player")!;
const name = <HTMLInputElement>document.getElementById("name")!;

/**
 * Prompts the user if they wish to
 * download a scores JSON for manual
 * submission.
 * @param scores JSON string to download.
 */
function downloadScores(scores: string): void {
    if (confirm("Automatic submission of your scores failed, do you wish to download a copy of the scores to submit manually to the developers?")) {
        const link = document.createElement("a");
        link.href = `data:text/json;charset=utf-8,${encodeURIComponent(scores)}`;
        link.download = "scores.json";
        link.click();
    }
}

/**
 * Plays a specified animation in the
 * webpage's lottie player.
 * @param animate Lottie file to select
 * @param scores Scores JSON string
 * to download at the end, ignore to
 * not pass string to user.
 */
function playAnimation(animate: Animate, scores: string | null = null): void {
    player.load(files[animate]);
    player.style.display = "block";
    player.loop = false;
    player.play();

    const listener = () => {
        player.style.display = "none";
        player.removeEventListener("complete", listener);
        if (scores) {
            downloadScores(scores);
        }
    }
    player.addEventListener("complete", listener);
}

/**
 * Checks if username if valid and
 * removes whitespace.
 * @param userName Name to check
 * @returns Trimmed name
 */
function checkUsername(userName: string): string {
    const trimmed = userName.trim();
    if (trimmed.length === 0) {
        const user = prompt("You did not enter a username, please enter one and submit.");
        if (user === null) {
            throw new Error("Username entering cancelled");
        } else {
            return checkUsername(user);
        }
    } else {
        return trimmed;
    }
}

/**
 * URL parameter parser with
 * URI decoding built-in.
 * @param urlParams Instance to search for
 * @param param Key to search
 * @returns Decoded string if found, null 
 * if not found or empty string.
 */
function decodeParams(urlParams: URLSearchParams, param: string): string | null {
    const found = urlParams.get(param);
    if (!found) {
        return null;
    }
    return decodeURIComponent(found);
}

/**
 * Extracts the 3 parameters from the 
 * current URL search section.
 * @returns Tuple of edition, digest and the values.
 */
function getUrlParams(): [e: string | null, d: string | null, v: string | null] {
    const urlParams = new URLSearchParams(location.search);

    const edition = decodeParams(urlParams, "edition");
    const digest = decodeParams(urlParams, "digest");
    const rawVals = decodeParams(urlParams, "score");

    return [edition, digest, rawVals];
}

/**
 * Finds when the user finished taking
 * the test with the current score digest.
 * @param hash digest to check localstorage
 * @returns ISO-8601 string if found else null
 */
function getAnswerTime(hash: string | null): string | null {
    if (!hash) {
        return null;
    }
    return localStorage.getItem(hash);
}

/**
 * Calculates the number of takes
 * stored in the user's browser's
 * localStorage by filtering all
 * keys that do not meet the requirements.
 * @returns Total quiz takes of the user.
 */
function totalTakes(): number {
    return Object.keys(localStorage).filter(x => {
        if (x.length < 64) {
            return false;
        }

        const val = localStorage.getItem(x);
        if (!val) {
            return false;
        }

        try {
            const dt = new Date(val);
            //2023-01-01 timestamp
            return dt.valueOf() > 1_672_531_200;
        } catch (e: any) {
            return false;
        }
    }).length;
}

/**
 * Creates a properly formatted JSON string
 * containing the final score to be submitted
 * @param userName Username to submit under
 * @returns stringified JSON representation of
 * score to be submitted.
 */
function prepareScoreObject(userName: string): string {
    const [edition, digest, stats] = getUrlParams();

    const bodyObj = {
        name: userName,
        vals: parseScores(stats, globalThis.SIZE),
        time: getAnswerTime(digest),
        edition, digest,
        takes: totalTakes(),
        version: globalThis.VERSION
    };

    return JSON.stringify(bodyObj);
}

/**
 * Does an HTTP post request to the global API_URL
 * with the provided JSON body and checks if it
 * was submitted sucessfully.
 * @param body JSON-stringified body to send
 */
async function sendScores(body: string): Promise<void> {
    const controller = new AbortController();
    const timeOut = setTimeout(
        //Aborts request after waiting for 10 seconds without a response
        () => controller.abort(), 10_000
    );

    const params: RequestInit = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        signal: controller.signal,
        body
    };

    const res = await fetch(globalThis.API_URL, params);

    clearTimeout(timeOut);

    const data = await res.json() as APIResponse;

    if (res.status > 299 || !data.success) {
        throw new Error(`Failed to submit scores: ${data.status}: ${data.message}`);
    }
}

/**
 * Checks, confirms and submits score
 */
function sendMessage(): void {
    if (lock) {
        return;
    }

    const userName = checkUsername(name.value);
    if (count > 0) {
        if (!confirm("You already submitted your scores, do you wish to submit a new time?")) {
            return;
        }
    } else {
        if (!confirm(`Do you confirm you wish to submit your scores under the name of "${userName}"?`)) {
            return;
        }
    }

    const scores = prepareScoreObject(userName);
    localStorage.setItem("last-submittion", scores);

    lock = true;

    player.load(files["loading"]);
    player.style.display = "block";
    player.loop = true;
    player.play();

    sendScores(scores)
        .then(() => {
            count++;
            playAnimation("success");
        })
        .catch((err: Error) => {
            console.error(err);

            localStorage.removeItem("last-submittion");

            playAnimation("failure", scores);
        })
        .finally(() => {
            lock = false;
        });
}

document.getElementById("name")?.addEventListener("keydown", (key) => {
    if (key.key === "Enter") {
        key.preventDefault();
        sendMessage();
    }
});

document.getElementById("send-button")?.addEventListener("click", () => {
    sendMessage();
});

window.addEventListener("load", () => {
    try {
        //JSON version of the last submitted score
        const lastSub = localStorage.getItem("last-submittion");
        if (!lastSub) {
            return;
        }
        //Parsed version of the last submited score's values
        const data = JSON.parse(lastSub).vals as number[];
        if (!data) {
            return;
        }
        //Current URL parameters' scores
        const scores = parseScores(getUrlParams()[2], globalThis.SIZE);
        //Check if they all match to the last submitted scores
        const match = scores.every((x, i) => x === data[i]);
        if (match) {
            alert("You already submitted this score before");
        }
    } catch (e: unknown) {
        console.error(e);
        alert(String(e));
    }
});