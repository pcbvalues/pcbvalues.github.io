import type { ScoreTuple } from "../src/typescript/types"
import { expect, test } from "@jest/globals";
import {
    orderScores, parseScores, parseFlags, parseUsers, shuffleArray, Canvas
} from "../src/typescript/common";

const sampleUsers1 = [
    ["user1", 0, [46.4, 100, 70.8, 10.4, 0, 12.5, 75]],
    ["user2", 0, [48.2, 91.1, 33.3, 66.7, 66.7, 70, 32.5]],
    ["user3", 0, [30.4, 62.5, 35.4, 37.5, 25, 70, 0]],
    ["user4", 0, [41.1, 23.2, 27.1, 37.5, 39.6, 42.5, 42.5]],
    ["user5", 0, [26.8, 92.9, 68.8, 68.8, 62.5, 70, 57.5]],
    ["user6", 0, [62.5, 69.6, 54.2, 75, 77.1, 77.5, 45]],
    ["user7", 0, [60.7, 75, 72.9, 66.7, 75, 67.5, 67.5]],
    ["user8", 0, [53.6, 67.9, 77.1, 66.7, 54.2, 50, 52.5]],
    ["user9", 0, [50, 66.1, 66.7, 52.1, 41.7, 40, 70]],
    ["user10", 0, [33.9, 69.6, 45.8, 33.3, 58.3, 62.5, 97.5]],
    ["user11", 0, [28.6, 80.4, 33.3, 35.4, 31.3, 72.5, 75]],
    ["user12", 0, [57.1, 73.2, 95.8, 56.3, 70.8, 45, 47.5]],
    ["user13", 0, [44.6, 76.8, 27.1, 58.3, 58.3, 62.5, 75]],
    ["user14", 0, [62.5, 80.4, 45.8, 27.1, 41.7, 35, 70]],
    ["user15", 0, [41.1, 76.8, 70.8, 60.4, 79.2, 82.5, 50]],
    ["user16", 0, [71.4, 53.6, 35.4, 62.5, 66.7, 65, 22.5]],
    ["user17", 245, [60.7, 69.6, 91.7, 77.1, 72.9, 65, 40]]
] as ScoreTuple[];

test("parseUsers return values", () => {
    const users = parseUsers(sampleUsers1);
    const firstUser = users[0];
    const lastUser = users[users.length - 1];

    expect(users.length).toBe(17);

    expect(firstUser.stats)
        .toStrictEqual([46.4, 100, 70.8, 10.4, 0, 12.5, 75]);

    expect(lastUser.stats)
        .toStrictEqual([60.7, 69.6, 91.7, 77.1, 72.9, 65, 40]);

    expect(firstUser.flags).toBe(0);
    expect(lastUser.flags).toBe(245);

    expect(firstUser.name).toBe("user1");
    expect(lastUser.name).toBe("user17");
});

test("Testing orderScores function", () => {
    const users = parseUsers(sampleUsers1);

    const order1 = orderScores(
        [62.5, 80.4, 45.8, 27.1, 41.7, 35, 70],
        users
    );

    expect(order1[0].name).toBe("user14");
    expect(order1[order1.length - 1].name).toBe("user3");

    expect(order1[0].bias).toBe(0);
    expect(order1[order1.length - 1].bias)
        .toBeCloseTo(0.13, 2);

    const order2 = orderScores(
        [50, 50, 50, 50, 50, 50, 50],
        users
    );

    expect(order2[0].name).toBe("user6");
    expect(order2[order2.length - 1].name).toBe("user1");

    expect(order2[0].bias).toBeCloseTo(0.018, 3);
    expect(order2[order2.length - 1].bias)
        .toBeCloseTo(0.092, 3);

});

test("parseScores error cases", () => {
    expect(() => parseScores(null, 7))
        .toThrow("No scores provided");

    expect(() => parseScores("", 7))
        .toThrow("No scores provided");

    expect(() => parseScores("invalid string", 7))
        .toThrow("Invalid scores");

    expect(() => parseScores(
        "50.0%2C50.0%2C50.0%2C50.0%2C50.0%2C50.0%2C50.0%2C50.0",
        7
    )).toThrow("Invalid scores");

    expect(() => parseScores(
        "50.0%2C50.0%2C50.0%2C50.0%2C50.0%2C50.0",
        7
    )).toThrow("Invalid scores");

    expect(() => parseScores(
        "-1.0%2C50.0%2C50.0%2C50.0%2C50.0%2C50.0%2C50.0",
        7
    )).toThrow("Invalid scores");

    expect(() => parseScores(
        "101%2C50.0%2C50.0%2C50.0%2C50.0%2C50.0%2C50.0",
        7
    )).toThrow("Invalid scores");
});

test("parseScores return values", () => {
    expect(parseScores(
        "50.0%2C50.0%2C50.0%2C50.0%2C50.0%2C50.0%2C50.0",
        7
    )).toStrictEqual(Array(7).fill(50));

    expect(parseScores(
        "100.0%2C50.0%2C50.0%2C50.0%2C50.0%2C50.0%2C50.0",
        7
    )).toStrictEqual([100, 50, 50, 50, 50, 50, 50]);

    expect(parseScores(
        "100.0%2C25.5%2C75.7%2C45.1%2C0.1%2C99.9%2C0.0",
        7
    )).toStrictEqual([100, 25.5, 75.7, 45.1, 0.1, 99.9, 0]);
});

test("parseFlags error cases", () => {
    expect(() => parseFlags(-1))
        .toThrow("Invalid number provided");

    expect(() => parseFlags(37.1))
        .toThrow("Invalid number provided");
});

test("parseFlags return value", () => {
    expect(parseFlags(0).popular).toBe(false);
    expect(parseFlags(1).popular).toBe(true);

    expect(parseFlags(2).popular).toBe(false);
    expect(parseFlags(3).popular).toBe(true);
});

test("shuffleArray return value", () => {
    const originalArray = [
        { a: 1 },
        { b: 2 },
        { c: 3 },
        { d: 4 },
        { e: 5 },
        { f: 6 },
        { g: 7 },
        { h: 8 }
    ] as Record<string, number>[];

    const shuffled = shuffleArray(originalArray);

    expect(shuffled.length).toBe(originalArray.length);

    let identical = 0;

    for (let i = 0; i < originalArray.length; i++) {
        //Check if original array is untouched
        expect(
            originalArray[i][String.fromCharCode(0x61 + i)]
        ).toBe(i + 1);
        //Check if all elements are in the new array
        expect(shuffled).toContain(originalArray[i]);

        if (originalArray[i] === shuffled[i]) {
            identical++;
        }
    }
    //Checks if array is properly shuffled (less than 1/4 remain in original spots)
    expect(identical).toBeLessThan(Math.floor(originalArray.length / 4));
});

test("Canvas tier finder", () => {
    const tiers = [
        "SJW",
        "Careful",
        "Inclusive",
        "Cautioned",
        "Attentive",
        "Moderate",
        "Unaffected",
        "Biased",
        "Selective",
        "Intolerant",
        "Reckless"
    ];

    expect(Canvas.findTier(0, tiers)).toBe("Reckless");
    expect(Canvas.findTier(50, tiers)).toBe("Moderate");
    expect(Canvas.findTier(100, tiers)).toBe("SJW");
});