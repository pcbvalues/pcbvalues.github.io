import { getJson, windowPromise, shuffleArray } from "./common.js";
import { Question } from "./types";

const questionNumber = <HTMLHeadingElement>document.getElementById("question-number")!;
const questionText = <HTMLParagraphElement>document.getElementById("question-text")!;

/**
 * Class representing an instance of the Quiz,
 * its questions, the answer and the progression.
 */
class Quiz {
    private _index: number;
    private _questions: Question[];
    private _scores: number[];
    private _short: boolean;

    constructor(questions: Question[], short: boolean) {
        this._index = 0;
        this._questions = questions;
        this._scores = Array(this._questions.length).fill(0);
        this._short = short;
    }

    /**
     * Question index (1-based index).
     */
    get index(): number {
        return this._index + 1;
    }

    /**
     * Total number of quiz questions.
     */
    get size(): number {
        return this._questions.length;
    }

    /**
     * If the question is of the yes/no type
     */
    get yesno(): boolean {
        return Boolean(this._questions[this._index].flags & 0b10);
    }

    /**
     * Text body of the current question.
     */
    get text(): string {
        return this._questions[this._index].text;
    }

    /**
     * Moves the quiz to the next question.
     * @param weight Weight of the answer selected 
     * by the user for the current question.
     * @returns if more questions remain ahead
     */
    nextQuestion(weight: number): boolean {
        this._scores[this._index] = weight;
        return ++this._index < this._questions.length;
    }

    /**
     * Moves the quiz to the previous question.
     * @returns if there's any questions to go back to.
     */
    previousQuestion(): boolean {
        return this._index-- > 0;
    }

    /**
     * Digests a string using the SHA-512 algorythm
     * for validating the authenticity of results.
     * @param input the string to digested
     * @returns The digested string, base64 encoded.
     */
    static async _digestString(input: string): Promise<string> {
        const bytes = (new TextEncoder).encode(input);
        const digest = await crypto.subtle.digest("SHA-512", bytes);
        const digestStr = String.fromCharCode(... new Uint8Array(digest));
        return btoa(digestStr);
    }

    /**
     * Stores a string hash with the current time
     * for analytics and recordkeeping. 
     * This data only leaves the browser if associated
     * score is submitted.
     * @param hash String hash to store.
     */
    static _storeTime(hash: string): void {
        const now = new Date();
        localStorage.setItem(hash, now.toISOString());
    }

    /**
     * Calcualates final scores and returns a URL for
     * the results page with the associated score.
     * @returns results url
     */
    async getScores(): Promise<string> {
        const len = this._questions[0].effect.length;

        const rawScores = this._questions.map((q, i) =>
            q.effect.map(k => this._scores[i] * k)
        ).reduce((cv, pv) =>
            pv.map((x, i) => cv[i] + x),
            Array(len).fill(0) as number[]
        );

        const maxScores = this._questions.map(q =>
            q.effect.map(Math.abs)
        ).reduce((cv, pv) =>
            pv.map((x, i) => cv[i] + x),
            Array(len).fill(0) as number[]
        );

        const finalScores = maxScores.map(
            (m, i) => Math.abs(100 * (m + rawScores[i]) / (2 * m))
        );

        if (finalScores.some(x => x > 100 || x < 0 || isNaN(x))) {
            throw new Error("Invalid scores");
        }

        const scoreStr = finalScores.map(x => x.toFixed(1)).join(",");
        const b64Digest = await Quiz._digestString(scoreStr);

        Quiz._storeTime(b64Digest);

        const params = new URLSearchParams([
            ["score", scoreStr],
            ["digest", b64Digest],
            ["edition", this._short ? "s" : "f"]
        ]);
        return `results.html?${params}`;
    }
}

/**
 * Renders a question to the page.
 * To be called every time something needs
 * to be updated about the quiz.
 * @param quiz Instance of Quiz class to render info.
 * @param buttons Array containing quiz button elements
 */
function renderQuestion(quiz: Quiz, buttons: HTMLButtonElement[]): void {
    questionNumber.textContent = `Question ${quiz.index} of ${quiz.size}`;
    questionText.textContent = quiz.text;

    for (const [i, elm] of buttons.entries()) {
        if (quiz.yesno) {
            switch (i) {
                case 0:
                    elm.textContent = "Yes";
                    break;
                case 4:
                    elm.textContent = "No";
                    break;
                default:
                    elm.style.display = "none";
            }
        } else {
            switch (i) {
                case 0:
                    elm.textContent = "Strongly Agree";
                    break;
                case 4:
                    elm.textContent = "Strongly Disagree";
                    break;
                default:
                    elm.style.display = "block";
            }
        }
    }
}

/**
 * Initializes and assigns events to the quiz page.
 * @param questions Parsed Question array
 * @param short Is the quiz short form?
 * @param random Randomize questions?
 */
function main(questions: Question[], short: boolean, random: boolean): void {
    const keys = ["stag", "ag", "neut", "disag", "stdisag"];

    const parsedQuestions = short ? questions.filter(x => x.flags & 0b01) : questions;
    const randQuestions = random ? shuffleArray(parsedQuestions) : parsedQuestions;
    const quiz = new Quiz(randQuestions, short);

    const buttons = keys.map(v => <HTMLButtonElement>document.getElementById(`button-${v}`)!);

    for (const [i, elm] of buttons.entries()) {
        const weight = (2 - i) / 2;
        elm.addEventListener("click", () => {
            if (quiz.nextQuestion(weight)) {
                renderQuestion(quiz, buttons);
            } else {
                quiz.getScores().then(
                    score => location.href = score
                );
            }
        });
    }

    document.getElementById("back-button")!
        .addEventListener("click", () => {
            if (quiz.previousQuestion()) {
                renderQuestion(quiz, buttons);
            } else {
                window.history.back();
            }
        });

    renderQuestion(quiz, buttons);
}

(async () => {
    const [questions, _] = await Promise.all(
        [getJson("questions"), windowPromise]
    );

    const urlChar = [...location.search.toLowerCase()];

    const short = urlChar.some(x => x === "s");
    const random = urlChar.some(x => x === "r");

    main(questions, short, random);
})()