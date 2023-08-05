import { Program } from "../deno/Parser.ts";
import {
  defaultEnv,
  emptyImportEnv,
  Env,
  parseExecute,
} from "../deno/Interpreter.ts";
import { home, Src } from "../deno/Src.ts";
import {
  expressionToNestedString,
  nestedStringToString,
  RuntimeValue,
} from "../deno/Values.ts";
import { Type } from "../deno/Typing.ts";
import { Handler, TestResult } from "./Runner.ts";

export type ExecuteCodeBlockResult =
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

export const executeCodeBlock = (
  codeBlock: string,
  env: Env,
): ExecuteCodeBlockResult => {
  const [expression, parsedExpected] = codeBlock.split("---").map((v) =>
    v.trim()
  );
  const expected = parsedExpected ?? "";

  try {
    const [ast, result, newEnv] = parseExecute(env.src, expression, env);

    return { type: "Success", expression, expected, ast, result, env: newEnv };
  } catch (e) {
    return {
      type: "Error",
      expression,
      expected,
      ast: undefined,
      error: e,
      env,
    };
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

    const errorString = error instanceof Error
      ? error.toString()
      : JSON.stringify(error);

    if (errorString === expected) {
      return { type: "Success" };
    } else {
      return {
        type: "Failure",
        expected,
        actual: errorString,
      };
    }
  }
};

export class XTHandler implements Handler {
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
    try {
      let env = defaultEnv(
        home,
        emptyImportEnv(),
        home.newSrc("../../stdlib/Prelude.tfun"),
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
      return { type: "Failure", expected: "", actual: e.toString() };
    }
  }
}
