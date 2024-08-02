/**
 * Promise that resolves as the Window load event is triggered.
 */
export const windowPromise = new Promise(res => {
    window.addEventListener("load", () => res());
});
/**
 * Checks the currently active time.
 * @returns Currently active time.
 */
export function currentTheme() {
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return dark ? "dark" : "light";
}
/**
 * Type-safe getter for the test's configuration JSONs.
 * @param jsonType JSON file to get
 * @returns Corresponding partsed JS object
 */
export async function getJson(jsonType) {
    const filePath = `./dist/${jsonType}.json`;
    const resp = await fetch(filePath);
    if (resp.status > 299) {
        throw new Error(`Error in requesting file, status:${resp.status}`);
    }
    const contentType = resp.headers.get("Content-Type");
    if (!contentType || !contentType.startsWith("application/json")) {
        throw new Error(`Invalid mime type for response, expected application/json, got ${contentType}`);
    }
    return resp.json();
}
const scoreWeights = [1, 1, 1, 0.5, 0.5, 0, 1];
/**
 * Orders scores of all users based on how close they are
 * to the current score.
 * @param score Current score to weigh.
 * @param users user matches to weigh against.
 * @returns Score array ordered from the closest to
 * the furthest match with the optional `bias` field.
 */
export function orderScores(score, users) {
    const ordered = [];
    const weightSum = scoreWeights.reduce((pv, cv) => pv + cv, 0);
    for (const user of users) {
        let sum = 0;
        for (const [i, stat] of user.stats.entries()) {
            const weight = scoreWeights[i] ?? 1;
            const delta = Math.abs(score[i] - stat);
            sum += ((delta / 100) * weight) ** 2;
        }
        ordered.push({
            ...user,
            bias: sum / weightSum
        });
    }
    return ordered.sort((a, b) => a.bias - b.bias);
}
/**
 * Parses scores from string-delimited, URI encoded string.
 * @param scoreString Nullable string for the values
 * @param count number of scores to expect
 * @returns Array of parsed scores
 */
export function parseScores(scoreString, count) {
    if (!scoreString) {
        throw new Error("No scores provided");
    }
    const decoded = decodeURIComponent(scoreString);
    const numberScores = decoded.split(",").map(x => parseFloat(x));
    const overBounds = numberScores.some(v => v > 100 || v < 0 || isNaN(v));
    if (numberScores.length !== count || overBounds) {
        throw new Error("Invalid scores");
    }
    return numberScores;
}
export const flagTable = {
    popular: 0b1,
};
/**
 * Parses flags integer into a record of the keys with booleans.
 * @todo Implement all flags
 * @param flagInt Integer containing the flags bitfield
 * @returns Flags record
 */
export function parseFlags(flagInt) {
    if (!Number.isInteger(flagInt) || flagInt < 0) {
        throw new Error("Invalid number provided");
    }
    const flagObj = {};
    for (const [name, mask] of Object.entries(flagTable)) {
        flagObj[name] = Boolean(flagInt & mask);
    }
    return flagObj;
}
/**
 * Serializes `Record<Flags, boolean>` object to a single
 * integer containing all the fields as bit flags.
 * @param flagObj Flags record to serialize
 * @returns Integer representation of the flags
 */
export function serializeFlags(flagObj) {
    let flagInt = 0;
    for (const [name, mask] of Object.entries(flagTable)) {
        flagInt = (flagInt | (flagObj[name] ? mask : 0));
    }
    return flagInt;
}
/**
 * Transforms user match tuple into
 * corresponding Score object
 * @param users Array of score tuples to parse
 * @returns Array of parsed score objects
 */
export function parseUsers(users) {
    return users.map(([name, flags, stats]) => ({ name, flags, stats }));
}
/**
 * Shuffles array without modifying the original array.
 * @param input Array to shuffle
 * @returns Shuffled array
 */
export function shuffleArray(input) {
    const newArray = input.map(x => x);
    for (const [i, elm] of newArray.entries()) {
        const rnd = Math.floor(Math.random() * newArray.length);
        [newArray[i], newArray[rnd]] = [newArray[rnd], elm];
    }
    return newArray;
}
/**
 * Capitalize the first leter of a string.
 * @param input Text to capitalize.
 * @returns Text with capitalized first character.
 */
function capitalize(input) {
    return input.charAt(0).toUpperCase() + input.slice(1);
}
/**
 * Loads image from the assets/values folder.
 * @param name Name of the image in the values folder.
 * @returns Loaded image element.
 */
function loadImage(name) {
    const img = new Image();
    img.src = `./assets/values/${name}`;
    return new Promise((res, rej) => {
        img.addEventListener("load", () => res(img));
        img.addEventListener("abort", rej);
        img.addEventListener("error", rej);
    });
}
/**
 * Class representing the Canvas containing scores of the test
 */
export class Canvas {
    _ctx;
    params;
    constructor(canvas, params) {
        canvas.width = params.width;
        canvas.height = params.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Failed to get canvas context");
        }
        this._ctx = ctx;
        this.params = params;
        this._ctx.fillStyle = this.params.bg;
        this._ctx.fillRect(0, 0, this.params.width, this.params.height);
    }
    _drawValueBg(height) {
        this._ctx.strokeStyle = "#000";
        this._ctx.lineJoin = "round";
        this._ctx.lineWidth = 75;
        this._ctx.fillStyle = "#222222";
        this._ctx.strokeRect(165, 50 + height, 470, 0);
    }
    _drawHalfCircle(x, y, r, color, reverse) {
        const [s, e] = reverse ? [1.5, 0.5] : [0.5, 1.5];
        this._ctx.fillStyle = color;
        this._ctx.beginPath();
        this._ctx.arc(x, y, r, s * Math.PI, e * Math.PI);
        this._ctx.fill();
    }
    _drawScoreRect(value, score, index) {
        this._ctx.lineWidth = 65;
        const height = 220 + index * 120;
        const [v1, v2] = value.color;
        const [c1, c2] = score > 98 ? [v1, v1] : score < 2 ? [v2, v2] : [v1, v2];
        //Draw ends
        this._drawHalfCircle(166, height, 32, c1, false);
        this._drawHalfCircle(634, height, 32, c2, true);
        //Draw bars
        const extra = score > 98 || score < 2 ? 6 : 0;
        const gap = Math.max(Math.min(score, 98), 2) - 2;
        const ratio = 4.82 * gap;
        this._ctx.fillStyle = c1;
        this._ctx.fillRect(166, height - 32, ratio + extra, 64);
        this._ctx.fillStyle = c2;
        this._ctx.fillRect(172 + ratio, height - 32, (464 - ratio), 64);
    }
    _drawScoreLabel(value, score, index) {
        this._ctx.font = `32px '${this.params.font}', sans-serif`;
        const height = index * 120 + 232.5;
        if (score == null || score > 100 || score < 0) {
            throw new Error(`Invalid score: ${score}`);
        }
        const w = value.white;
        const whiteLabel = [w & 0b10, w & 0b01];
        if (score > 20) {
            this._ctx.fillStyle = whiteLabel[0] ? "#FFF" : "#000";
            this._ctx.textAlign = "left";
            this._ctx.fillText(score.toFixed(1) + "%", 150, height);
        }
        if (score < 80) {
            this._ctx.fillStyle = whiteLabel[1] ? "#FFF" : "#000";
            this._ctx.textAlign = "right";
            this._ctx.fillText((100 - score).toFixed(1) + "%", 650, height);
        }
        this._ctx.fillStyle = this.params.fg;
        this._ctx.textAlign = "center";
        this._ctx.font = `bold 30px '${this.params.font}', sans-serif`;
        const name = capitalize(value.name);
        const tier = Canvas.findTier(score, value.tiers);
        const tierName = `${name} Axis: ${tier}`;
        this._ctx.fillText(tierName, 400, 170 + index * 120, 550);
        return tier;
    }
    clearFields() {
        this._ctx.fillStyle = this.params.bg;
        this._ctx.fillRect(126, 130, 550, 1000);
        this._ctx.fillRect(0, 0, 800, 150);
    }
    /**
     * Draws specified value at the specified index on the canvas.
     * @param value Value to draw.
     * @param score Corresponding value score.
     * @param index Index to draw value at.
     * @param drawImages Draw images or not (not for redraws)
     * @returns Tier text for the corresponding score and value.
     */
    async drawValue(value, score, index, drawImages = true) {
        const height = 170 + index * 120;
        this._drawValueBg(height);
        this._drawScoreRect(value, score, index);
        const tier = this._drawScoreLabel(value, score, index);
        if (drawImages) {
            const { icons } = value;
            const [l, r] = await Promise.all(icons.map(loadImage));
            this._ctx.drawImage(l, 20, height, 100, 100);
            this._ctx.drawImage(r, 680, height, 100, 100);
        }
        return tier;
    }
    /**
     * Draws quiz header with provided parameters.
     * @param params Parameters to fill header with.
     */
    drawHeader(params) {
        this._ctx.fillStyle = this.params.fg;
        this._ctx.font = `700 50px '${this.params.font}', sans-serif`;
        this._ctx.textAlign = "left";
        this._ctx.fillText("PCBvalues", 20, 90);
        this._ctx.font = `30px '${this.params.font}', sans-serif`;
        const user = !params.gallery ?
            "Closest Match: " + params.user : params.user;
        this._ctx.fillText(user, 20, 130, 480);
        this._ctx.textAlign = "right";
        this._ctx.font = `300 25px '${this.params.font}', sans-serif`;
        this._ctx.fillText("pcbvalues.github.io", 780, 40);
        this._ctx.fillText(params.version, 780, 70);
        this._ctx.fillText(params.edition, 780, 100);
        const date = (new Date()).toLocaleDateString("en-GB");
        const text = `${params.basetext} on ${date}`;
        this._ctx.fillText(text, 780, 130);
    }
    /**
     * Finds tier based on scores
     * @param score value of current score.
     * @param tiers Array of possible tiers for the current value.
     * @returns Corresponding tier text.
     */
    static findTier(score, tiers) {
        const index = Math.floor((100 - score) / 100 * tiers.length);
        return tiers[index] ?? tiers.at(-1);
    }
    /**
     * Download screenshot provided HTML canvas element.
     * @param canvas Canvas element to download screenshot of.
     */
    static download(canvas) {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "PCBValues.png";
        link.click();
        link.remove();
    }
}
