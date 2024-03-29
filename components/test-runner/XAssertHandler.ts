import { Program } from "../deno/Parser.ts";
import { defaultEnv, Env, parseExecute } from "../deno/Interpreter.ts";
import { home, Src } from "../deno/Src.ts";
import { RuntimeValue, valueToString } from "../deno/Values.ts";
import { Handler, TestResult } from "./Runner.ts";
import { executeCodeBlock } from "./XTHandler.ts";

type ExecuteAssertBlockResult =
  | SuccessfulExecuteAssertBlockResult
  | ErrorExecuteAssertBlockResult;

type SuccessfulExecuteAssertBlockResult = {
  type: "Success";
};

type ErrorExecuteAssertBlockResult = {
  type: "Error";
  expression: string;
  ast: Program | undefined;
  error: RuntimeValue;
  env: Env;
};

const executeAssertBlock = (
  codeBlock: string,
  env: Env,
): ExecuteAssertBlockResult => {
  const expressions = codeBlock.split("\n").map((v) => v.trim());

  for (const expression of expressions) {
    if (expression !== "") {
      try {
        const [ast, [[result]], _newEnv] = parseExecute(
          env.src,
          expression,
          env,
        );

        if (typeof result !== "boolean" || !result) {
          return { type: "Error", expression, ast, error: valueToString(result), env };
        }
      } catch (e) {
        return { type: "Error", expression, ast: undefined, error: e, env };
      }
    }
  }

  return { type: "Success" };
};

export class XAssertHandler implements Handler {
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
      let env = defaultEnv(home, home.newSrc("../../stdlib/Prelude.tfun"));
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

      if (options.get("style") === "exec") {
        const executeResult = executeCodeBlock(code, env);
        if (executeResult.type === "Error") {
          return {
            type: "Failure",
            expected: executeResult.expected,
            actual: executeResult.error,
          };
        }
        return { type: "Success" };
      }

      const executeAssertBlockResult = executeAssertBlock(code, env);

      if (executeAssertBlockResult.type === "Success") {
        return { type: "Success" };
      } else {
        return {
          type: "Failure",
          expected: "True: Bool",
          actual: executeAssertBlockResult.error,
        };
        }
    } catch (e) {
      return { type: "Failure", expected: "", actual: e.toString() };
    }
  }
}
