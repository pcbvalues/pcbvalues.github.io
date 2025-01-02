/**
 * Type of a Quiz question as appears
 * on the dist/questions.json,
 * contains the question body,
 * a bitflag integer and an array with the
 * effects for each value.
 */
export type Question = {
    text: string;
    flags: number;
    effect: number[];
}

/**
 * Type of a Results axis as appears
 * on the dist/values.json,
 * contains name of value and associated key
 * labels, icons, colors for both sides,
 * white bitflag
 * and an array with the tiers.
 */
export type Value = {
    name: string;
    key: string;
    labels: [string, string];
    icons: [string, string];
    color: [string, string];
    white: number;
    tiers: string[];
}

/**
 * Type of User matches as appears
 * on the dist/users.json,
 * contains a name, bitflag int and
 * an array with the stats obtained.
 */
export type ScoreTuple = [
    name: string,
    flags: number,
    stats: number[]
];

/**
 * Parsed version of the score tuple
 * as an object with an optional bias
 * key used to overlap between 2 scores.
 */
export type Score = {
    name: string;
    flags: number;
    bias?: number;
    stats: number[];
}

/**
 * Parameters to feed to canvas instance
 * upon initialization, used for styling
 * and sizing the canvas.
 */
export type CanvasParams = {
    fg: string;
    bg: string;
    height: number;
    width: number;
    font: string;
}

/**
 * Parameters to feed to the 
 * `drawHeader()` method of the canvas
 * instance, all text apart from the 
 * gallery boolean that changes the
 * text diaplyed depending on the
 * context it's on.
 */
export type HeaderParams = {
    version: string;
    edition: string;
    gallery: boolean;
    user: string;
    basetext: string;
}

/**
 * Types of the JSONs in the dist
 * folder, for typesafe loading.
 */
export interface JsonTypes {
    questions: Question[];
    users: ScoreTuple[];
    values: Value[];
}