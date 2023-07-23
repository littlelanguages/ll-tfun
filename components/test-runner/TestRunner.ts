import { tokens } from "https://deno.land/x/rusty_markdown@v0.4.1/mod.ts";
import { parse, Program } from "../deno/Parser.ts";
import { defaultEnv, Env, executeProgram } from "../deno/Interpreter.ts";
import { from, home, Src } from "../deno/Src.ts";
import {
  expressionToNestedString,
  nestedStringToString,
  RuntimeValue,
} from "../deno/Values.ts";
import { Type } from "../deno/Typing.ts";
import { performance } from "https://deno.land/std@0.137.0/node/perf_hooks.ts";

// This is a tool is a test runner over markdown files.  I searches for code
// blocks and then, if there is a handler for the code block, will ensure that
// the code works as expected.

if (Deno.args.length === 0) {
  console.log("Usage: deno run --allow-read TestRunner.ts <file>...<file>");
  Deno.exit(1);
}

type TestResult = TestSuccess | TestFailure | TestIgnored;

type TestSuccess = {
  type: "Success";
};

type TestFailure = {
  type: "Failure";
  expected: string;
  actual: string;
};

type TestIgnored = {
  type: "Ignored";
};

let numberOfFiles = 0;
let numberOfTests = 0;
let numberOfSuccesses = 0;
let numberOfFailures = 0;
let numberIgnored = 0;

type BlockLang = {
  name: string;
  options: Map<string, string | undefined>;
};

type Handler = {
  reset: () => void;
  register: (options: Map<string, string | undefined>, code: string) => void;
  apply: (
    src: Src,
    options: Map<string, string | undefined>,
    code: string,
  ) => TestResult;
};

const parseCodeBlockLang = (codeBlockLang: string): BlockLang => {
  const parts = codeBlockLang.split(" ");
  const lang = parts[0];
  const name = parts[1];
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

type ExecuteCodeBlockResult =
  | SuccessfulExecuteCodeBlockResult
  | ErrorExecuteCodeResult;

type SuccessfulExecuteCodeBlockResult = {
  type: "Success";
  expression: string;
  expected: string;
  ast: Program;
  result: Array<[RuntimeValue, Type | undefined]>;
  env: Env;
};

type ErrorExecuteCodeResult = {
  type: "Error";
  expression: string;
  expected: string;
  ast: Program | undefined;
  error: RuntimeValue;
  env: Env;
};

const executeCodeBlock = (
  codeBlock: string,
  env: Env,
): ExecuteCodeBlockResult => {
  const [expression, expected] = codeBlock.split("---").map((v) => v.trim());

  let ast: Program | undefined;
  try {
    ast = parse(env.src, expression);
  } catch (e) {
    return { type: "Error", expression, expected, ast, error: e, env };
  }

  try {
    const [result, newEnv] = executeProgram(ast, env);

    return { type: "Success", expression, expected, ast, result, env: newEnv };
  } catch (e) {
    return { type: "Error", expression, expected, ast, error: e, env };
  }
};

const assertCodeBlockResult = (
  codeBlockResult: ExecuteCodeBlockResult,
): TestResult => {
  if (codeBlockResult.type === "Success") {
    const { expected, ast, result, env: newEnv } = codeBlockResult;

    const content: Array<string> = [];
    ast.forEach((e, i) => {
      if (e.type === "DataDeclaration") {
        content.push(result[i][0].toString());
      } else if (e.type === "TypeAliasDeclaration") {
        content.push(
          `${e.name} = ${newEnv.type.findAlias(e.name)?.toString()}`,
        );
      } else if (e.type !== "ImportStatement") {
        const [value, type] = result[i];

        content.push(
          nestedStringToString(expressionToNestedString(value, type!, e)),
        );
      }
    });

    if (content.join("\n") === expected) {
      return { type: "Success" };
    } else {
      return {
        type: "Failure",
        expected,
        actual: content.join("\n"),
      };
    }
  } else {
    const { expected, error } = codeBlockResult;

    if (error.toString() === expected) {
      return { type: "Success" };
    } else {
      return {
        type: "Failure",
        expected,
        actual: error.toString(),
      };
    }
  }
};

class XTHandler implements Handler {
  private state = new Map<string, string>();

  reset(): void {
    this.state = new Map<string, string>();
  }

  register(options: Map<string, string | undefined>, code: string): void {
    if (options.has("id")) {
      this.state.set(options.get("id")!, code);
    }
  }

  apply(
    src: Src,
    options: Map<string, string | undefined>,
    code: string,
  ): TestResult {
    const id = () => options.get("id") ?? options.get("name") ?? "test";

    const reportError = (e: Error) => {
      console.error(`${id()} failed:`, e);
    };

    try {
      let { env } = executeCodeBlock(
        'import * from "../../stdlib/Prelude.tfun"',
        defaultEnv(home),
      );

      env.src = src;

      if (options.has("use")) {
        for (
          const use of options.get("use")!.split(/[, ]/).map((v) => v.trim())
        ) {
          if (this.state.has(use)) {
            const useExpression = this.state.get(use)!;
            const useResult = executeCodeBlock(useExpression, env);
            env = useResult.env;
          }
        }
      }

      const executeCodeBlockResult = executeCodeBlock(code, env);
      return assertCodeBlockResult(executeCodeBlockResult);
    } catch (e) {
      reportError(e);
      return { type: "Failure", expected: "", actual: e.toString() };
    }
  }
}

const handlers = new Map<string, Handler>([["xt", new XTHandler()]]);

const parseTest = async (
  fileName: string,
): Promise<Array<[BlockLang, string]>> => {
  const result: Array<[BlockLang, string]> = [];

  const text = await Deno.readTextFile(fileName);
  const tkns = tokens(text);

  let inCodeBlock = false;
  let codeBlock = "";
  let codeBlockLang = "";

  for (const tkn of tkns) {
    if (
      tkn.type === "start" && tkn.tag === "codeBlock" && tkn.kind === "fenced"
    ) {
      inCodeBlock = true;
      codeBlock = "";
      codeBlockLang = tkn.language;
    } else if (inCodeBlock) {
      if (tkn.type === "text") {
        codeBlock += tkn.content;
      } else if (tkn.type === "end" && tkn.tag === "codeBlock") {
        inCodeBlock = false;
        result.push([parseCodeBlockLang(codeBlockLang), codeBlock]);
      }
    }
  }

  return result;
};

for (const file of Deno.args) {
  numberOfFiles += 1;
  const src = from(file);

  for (const handler of handlers.values()) {
    handler.reset();
  }

  const tests = await parseTest(file);

  console.log(
    `%crunning ${tests.length} test${
      tests.length === 1 ? "" : "s"
    } from ${file}%c`,
    "color: grey",
    "",
  );
  for (const [lang, code] of tests) {
    const handler = handlers.get(lang.name);
    if (handler !== undefined) {
      handler.register(lang.options, code);
    }
  }

  for (const [lang, code] of tests) {
    numberOfTests += 1;

    let testResult: TestResult;

    const handler = handlers.get(lang.name);
    const startTime = performance.now();
    if (handler === undefined) {
      testResult = { type: "Ignored" };
      numberIgnored += 1;
    } else {
      try {
        testResult = handler.apply(src, lang.options, code);
      } catch (e) {
        testResult = { type: "Failure", expected: "", actual: e.toString() };
      }
    }
    const startEnd = performance.now();
    if (testResult.type === "Success") {
      numberOfSuccesses += 1;
    } else if (testResult.type === "Failure") {
      numberOfFailures += 1;
    } else if (testResult.type === "Ignored") {
      numberIgnored += 1;
    }

    console.log(
      `${
        lang.options.get("id") ?? lang.options.get("name") ?? "test"
      } ... %c${testResult.type.toLowerCase()} %c(${startEnd - startTime}ms)`,
      `color: ${testResult.type === "Success" ? "green" : "red"}`,
      "color: grey",
    );
    if (testResult.type === "Failure") {
      console.log(`%c  expected:%c ${testResult.expected}`, "color: grey", "");
      console.log(`%c  actual:%c ${testResult.actual}`, "color: grey", "");
    }
  }
}

const messageContent =
  `${numberOfTests} tests | ${numberOfSuccesses} passed | ${numberOfFailures} failed | ${numberIgnored} ignored`;
console.log("");
console.log(
  `%c${
    numberOfFailures === 0 ? "ok" : "not ok"
  }%c ${messageContent} %c(${performance.now()}ms)`,
  `color: ${numberOfFailures === 0 ? "green" : "red"}`,
  "",
  "color: grey",
);

Deno.exit(numberOfFailures === 0 ? 0 : 1);
