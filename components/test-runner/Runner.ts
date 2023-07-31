import { from, Src } from "../deno/Src.ts";
import { performance } from "https://deno.land/std@0.137.0/node/perf_hooks.ts";

export type TestResult = TestSuccess | TestFailure | TestIgnored;

export type TestSuccess = {
  type: "Success";
};

export type TestFailure = {
  type: "Failure";
  expected: string;
  actual: string;
};

export type TestIgnored = {
  type: "Ignored";
};

type BlockLang = {
  name: string;
  options: Map<string, string | undefined>;
};

export type Handler = {
  reset: () => void;
  register: (options: Map<string, string | undefined>, code: string) => void;
  apply: (
    src: Src,
    options: Map<string, string | undefined>,
    code: string,
  ) => TestResult;
};

const parseCodeBlockLang = (codeBlockLang: string): BlockLang | undefined => {
  const parts = codeBlockLang.split(" ");
  const lang = parts[0];
  const name = parts[1];

  if (lang === undefined || name === undefined) {
    return undefined;
  }

  const options = new Map(
    codeBlockLang.substring(lang.length + 1 + name.length + 1).split(";").map(
      (part) => {
        const [name, value] = part.split("=").map((v) => v.trim());
        return [name, value];
      },
    ),
  );
  return { name, options };
};

type Block = {
  lang: BlockLang;
  code: string;
  location: [number, number];
};

const parseTest = async (
  fileName: string,
): Promise<Array<Block>> => {
  const result: Array<Block> = [];

  const lines = (await Deno.readTextFile(fileName)).split("\n");

  let inCodeBlock = false;
  let codeBlock: Array<string> = [];
  let codeBlockLang = "";
  let lineNumber = 0;
  let codeBlockStartLine = 0;

  for (const line of lines) {
    lineNumber += 1;

    if (line.startsWith("```") && !inCodeBlock) {
      inCodeBlock = true;
      codeBlock = [];
      codeBlockLang = line.slice(3).trim();
      codeBlockStartLine = lineNumber;
    } else if (inCodeBlock) {
      if (line.startsWith("```")) {
        inCodeBlock = false;
        const lang = parseCodeBlockLang(codeBlockLang);
        if (lang !== undefined) {
          result.push({
            lang,
            code: codeBlock.join("\n"),
            location: [codeBlockStartLine, lineNumber],
          });
        }
      } else {
        codeBlock.push(line);
      }
    }
  }

  return result;
};

export const run = async (fileNames: Array<string>, handlers: Map<string, Handler>): Promise<number> => {
  let numberOfFiles = 0;
  let numberOfTests = 0;
  let numberOfSuccesses = 0;
  let numberOfFailures = 0;
  let numberIgnored = 0;

  for (const file of fileNames) {
    numberOfFiles += 1;
    const src = from(file);

    for (const handler of handlers.values()) {
      handler.reset();
    }

    const tests = await parseTest(file);

    console.log(
      `%crunning ${tests.length} test${tests.length === 1 ? "" : "s"
      } from ${file}%c`,
      "color: grey",
      "",
    );
    for (const { lang, code } of tests) {
      const handler = handlers.get(lang.name);
      if (handler !== undefined) {
        handler.register(lang.options, code);
      }
    }

    for (const { lang, code, location: [startLine, endLine] } of tests) {
      numberOfTests += 1;

      let testResult: TestResult;

      const handler = handlers.get(lang.name);
      const startTime = performance.now();
      if (handler === undefined) {
        testResult = { type: "Ignored" };
      } else {
        try {
          testResult = handler.apply(src, lang.options, code);
        } catch (e) {
          testResult = { type: "Failure", expected: "", actual: e.toString() };
        }
      }
      const endTime = performance.now();
      if (testResult.type === "Success") {
        numberOfSuccesses += 1;
      } else if (testResult.type === "Failure") {
        numberOfFailures += 1;
      } else if (testResult.type === "Ignored") {
        numberIgnored += 1;
      }

      const id = lang.options.get("id") ?? lang.options.get("name") ?? "test";
      if (testResult.type === "Ignored") {
        console.log(
          `%c${id} (${startLine}-${endLine}) ... ${testResult.type.toLowerCase()}`,
          "color: grey",
        );
      } else {
        console.log(
          `${id} (${startLine}-${endLine}) ... %c${testResult.type.toLowerCase()} %c(${endTime - startTime
          }ms)`,
          `color: ${testResult.type === "Success" ? "green" : "red"}`,
          "color: grey",
        );
        if (testResult.type === "Failure") {
          console.log(
            `%c  expected:%c ${testResult.expected}`,
            "color: grey",
            "",
          );
          console.log(`%c  actual:%c ${testResult.actual}`, "color: grey", "");
        }
      }
    }
  }

  const messageContent =
    `${numberOfTests} tests | ${numberOfSuccesses} passed | ${numberOfFailures} failed | ${numberIgnored} ignored`;
  console.log("");
  console.log(
    `%c${numberOfFailures === 0 ? "ok" : "not ok"
    }%c ${messageContent} %c(${performance.now()}ms)`,
    `color: ${numberOfFailures === 0 ? "green" : "red"}`,
    "",
    "color: grey",
  );
  return (numberOfFailures === 0 ? 0 : 1);
}

