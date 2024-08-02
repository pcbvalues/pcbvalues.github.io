import { Canvas, getJson, currentTheme, windowPromise, parseUsers } from "./common.js";
import type { Value, Score, ScoreTuple, CanvasParams } from "./types";

declare global {
    var VERSION: string;
    var DEFAULT_FLAGS: number;
}

/**
 * Returns matching canvas color scheme for
 * currently active theme.
 * @returns Tuple with bg and fg colors to
 * apply to currently active canvas.
 */
function getColorScheme(): [string, string] {
    const dark = currentTheme() === "dark";
    return dark ? ["#EEE", "#333"] : ["#333", "#EEE"];
}

/**
 * Draws provided score on the provided canvas element
 * @param canvas Canvas instance to render into
 * @param score Score to render onto canvas
 * @param values Reference values in other of use
 * @param images Redrawing images?
 */
function drawScores(canvas: Canvas, score: Score, values: Value[], images = false): void {
    canvas.clearFields();
    canvas.drawHeader({
        version: globalThis.VERSION,
        edition: "User Gallery",
        gallery: true,
        user: score.name,
        basetext: "Viewed"
    });

    const [fg, bg] = getColorScheme();

    canvas.params.fg = fg;
    canvas.params.bg = bg;

    for (const [i, s] of score.stats.entries()) {
        canvas.drawValue(values[i], s, i, images);
    }

}

/**
 * Prepares the dropdown element with all
 * provided user scores.
 * @param dropDown target element
 * @param users User objects to render onto the dropdown.
 */
function prepareDropdown(dropDown: HTMLSelectElement, users: Score[]): void {
    const createOption = (user: Score, index: number): HTMLOptionElement => {
        const option = document.createElement("option");
        option.value = index.toFixed();
        option.textContent = user.name;
        return option;
    };

    const options = users.map(createOption);

    for (const opt of options) {
        dropDown.appendChild(opt);
    }
}

/**
 * Finds matching index for the name provided
 * in URL parameters.
 * @param scores List of scores to search through.
 * @param user Nullable string containing the 
 * name to search through scores for match.
 * @returns Index of matching score or 0 if
 * no matching score found.
 */
function findMatchingIndex(scores: Score[], user: string | null): number {
    if (!user) {
        return 0;
    }
    const parsedName = decodeURIComponent(user);

    const index = scores.findIndex(x => x.name === parsedName);

    return index >= 0 ? index : 0;
}

/**
 * Gets the requires values, initializes and mounts all the necessary events.
 */
async function main(): Promise<void> {
    const [values, rawUsers, _] = await Promise.all(
        [getJson("values"), getJson("users"), windowPromise]
    );

    const users = parseUsers(rawUsers);

    const [fg, bg] = getColorScheme();
    const params: CanvasParams = {
        bg, fg,
        height: 1000,
        width: 800,
        font: "Andika"
    };

    const canvasElm = <HTMLCanvasElement>document.getElementById("banner");
    const canvas = new Canvas(canvasElm, params);

    const urlParams = new URLSearchParams(location.search);
    const selectedUser = findMatchingIndex(users, urlParams.get("user"));

    const dropDown = <HTMLSelectElement>document.getElementById("userdropdown");
    prepareDropdown(dropDown, users);

    drawScores(canvas, users[selectedUser], values, true);
    dropDown.selectedIndex = selectedUser;
    document.title = `PCBValues - ${users[selectedUser].name}`;

    dropDown.addEventListener("change", () => {
        const index = dropDown.selectedIndex;
        const name = users[index].name;

        const params = new URLSearchParams({ user: name });
        const path = `${location.origin}${location.pathname}?${params}`;

        history.pushState(index, "", path);
        document.title = `PCBValues - ${name}`;
        drawScores(canvas, users[index], values);
    });

    window.addEventListener("popstate", (ev: PopStateEvent) => {
        const oldUser = ev.state ?? selectedUser as number;

        dropDown.selectedIndex = oldUser;
        document.title = `PCBValues - ${users[oldUser].name}`;
        drawScores(canvas, users[oldUser], values);
    });
}

main().catch((err: Error) => {
    console.error(err);
});
