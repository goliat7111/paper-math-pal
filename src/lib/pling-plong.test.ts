import { expect, it } from "vitest";
import { generatePlingPlong, PLING_LEVELS, type PlingLevel } from "./pling-plong";
import {
  generateSubjectPlingPlong,
  parseCustomPlingQuestions,
  PLING_SUBJECTS,
} from "./pling-plong-subjects";

const levels = Object.keys(PLING_LEVELS) as PlingLevel[];
const num = (s: string) => Number(s.replace(/\u00a0/g, ""));

it("creates 100 questions with the requested number of pling-plong questions", () => {
  for (const level of levels) {
    for (let run = 0; run < 20; run++) {
      const qs = generatePlingPlong({ ops: ["add", "sub", "mul", "div"], level, plingCount: 15 });
      expect(qs).toHaveLength(100);
      expect(qs.filter((q) => q.pling)).toHaveLength(15);
      expect(new Set(qs.map((q) => q.text)).size).toBe(qs.length);
      for (const q of qs) expect(Number.isFinite(num(q.answer))).toBe(true);
    }
  }
});

it("distributes selected operations evenly", () => {
  const qs = generatePlingPlong({
    ops: ["add", "sub", "mul", "div"],
    level: "medium",
    plingCount: 0,
    tiles: 40,
  });
  const count = (re: RegExp) => qs.filter((q) => re.test(q.text)).length;
  expect([count(/ \+ /), count(/ − /), count(/ × /), count(/ ÷ /)]).toEqual([10, 10, 10, 10]);
});

it("supports fewer tiles", () => {
  for (const tiles of [20, 30, 40, 50, 60, 80]) {
    const qs = generatePlingPlong({ ops: ["add"], level: "easy", plingCount: 3, tiles });
    expect(qs).toHaveLength(tiles);
    expect(qs.filter((q) => q.pling)).toHaveLength(3);
  }
});

it("answers basic operations correctly and respects selected operations", () => {
  for (const level of levels) {
    const qs = generatePlingPlong({ ops: ["sub", "div"], level, plingCount: 0 });
    for (const q of qs) {
      const sub = q.text.match(/^(.+) − (.+)$/);
      const div = q.text.match(/^(.+) ÷ (.+)$/);
      expect(Boolean(sub) || Boolean(div)).toBe(true);
      if (sub) expect(num(sub[1]!) - num(sub[2]!)).toBe(num(q.answer));
      if (div) expect(num(div[1]!) / num(div[2]!)).toBe(num(q.answer));
    }
  }
});

it("answers the challenging questions correctly", () => {
  for (const level of levels) {
    for (let run = 0; run < 30; run++) {
      for (const q of generatePlingPlong({ ops: ["add"], level, plingCount: 100 })) {
        const t = q.text;
        let expected: number | undefined;
        let m: RegExpMatchArray | null;
        if ((m = t.match(/^\((\d+) \+ (\d+)\) × (\d+)$/))) expected = (+m[1]! + +m[2]!) * +m[3]!;
        else if ((m = t.match(/^(\d+) × (\d+) \+ (\d+) × (\d+)$/)))
          expected = +m[1]! * +m[2]! + +m[3]! * +m[4]!;
        else if ((m = t.match(/^(\d+) % av (.+)$/))) expected = (+m[1]! * num(m[2]!)) / 100;
        else if ((m = t.match(/^\? \+ (.+) = (.+)$/))) expected = num(m[2]!) - num(m[1]!);
        else if ((m = t.match(/^(.+) − \? = (.+)$/))) expected = num(m[1]!) - num(m[2]!);
        else if ((m = t.match(/^\? × (\d+) = (.+)$/))) expected = num(m[2]!) / +m[1]!;
        else if ((m = t.match(/^(\d+) × (\d+)$/))) expected = +m[1]! * +m[2]!;
        else if ((m = t.match(/^Hälften av (.+)$/))) expected = num(m[1]!) / 2;
        else if ((m = t.match(/^(\d+)²$/))) expected = Number(m[1]) ** 2;
        expect(expected, t).toBeDefined();
        expect(Number.isInteger(expected), t).toBe(true);
        expect(num(q.answer), t).toBe(expected);
      }
    }
  }
});

it("does not repeat single-operation, word, geometry, or challenge questions", () => {
  for (const level of levels) {
    for (const op of ["add", "sub", "mul", "div"] as const) {
      const operationQuestions = generatePlingPlong({ ops: [op], level, plingCount: 0 });
      expect(new Set(operationQuestions.map((question) => question.text)).size).toBe(
        operationQuestions.length,
      );

      const wordQuestions = generatePlingPlong({
        ops: [op],
        level,
        plingCount: 0,
        textShare: 1,
      });
      expect(new Set(wordQuestions.map((question) => question.text)).size).toBe(
        wordQuestions.length,
      );
    }

    const geometryQuestions = generatePlingPlong({
      ops: ["add"],
      level,
      plingCount: 0,
      geometryShare: 1,
    });
    expect(new Set(geometryQuestions.map((question) => question.text)).size).toBe(
      geometryQuestions.length,
    );

    const challengeQuestions = generatePlingPlong({
      ops: ["add"],
      level,
      plingCount: 100,
    });
    expect(new Set(challengeQuestions.map((question) => question.text)).size).toBe(100);
  }
});

it("does not repeat questions when operations are randomized", () => {
  for (const level of levels) {
    for (let run = 0; run < 40; run++) {
      const questions = generatePlingPlong({
        ops: ["add", "sub", "mul", "div"],
        level,
        plingCount: 25,
        textShare: 0.25,
        geometryShare: 0.25,
        randomOps: true,
      });
      expect(new Set(questions.map((question) => question.text)).size).toBe(questions.length);
    }
  }
});

it("generates subject questions with the requested board and bonus counts", () => {
  for (const subject of Object.keys(PLING_SUBJECTS) as (keyof typeof PLING_SUBJECTS)[]) {
    const questions = generateSubjectPlingPlong({
      subject,
      tiles: 100,
      plingCount: 25,
    });
    expect(questions).toHaveLength(100);
    expect(questions.filter((question) => question.pling)).toHaveLength(25);
    expect(
      questions.every((question) => question.text.length > 0 && question.answer.length > 0),
    ).toBe(true);
    expect(new Set(questions.map((question) => question.text)).size).toBe(questions.length);
  }
  expect(() =>
    generateSubjectPlingPlong({
      subject: "geografi",
      customQuestions: [["En fråga?", "Ett svar"]],
      tiles: 2,
      plingCount: 0,
    }),
  ).toThrow(RangeError);
});

it("parses teacher questions separated by semicolons and reports malformed rows", () => {
  expect(parseCustomPlingQuestions("Vad heter Sveriges huvudstad?; Stockholm\nFel rad")).toEqual({
    questions: [["Vad heter Sveriges huvudstad?", "Stockholm"]],
    invalidLines: [2],
  });
  expect(parseCustomPlingQuestions("Vad är 1 + 1?;2\n  vad är 1 + 1? ; 2")).toEqual({
    questions: [["Vad är 1 + 1?", "2"]],
    invalidLines: [2],
  });
});
