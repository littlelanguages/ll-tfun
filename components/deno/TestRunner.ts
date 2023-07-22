import { tokens } from "https://deno.land/x/rusty_markdown@v0.4.1/mod.ts";
import { parse, Program } from "./Parser.ts";
import { defaultEnv, Env, executeProgram } from "./Interpreter.ts";
import { from, home, Src } from "./Src.ts";
import { assertEquals } from "https://deno.land/std@0.137.0/testing/asserts.ts";
import {
  expressionToNestedString,
  nestedStringToString,
  RuntimeValue,
} from "./Values.ts";
import { Type } from "./Typing.ts";

// This is a tool is a test runner over markdown files.  I searches for code
// blocks and then, if there is a handler for the code block, will ensure that
// the code works as expected.

if (Deno.args.length === 0) {
  console.log("Usage: deno run --allow-read TestRunner.ts <file>...<file>");
  Deno.exit(1);
}

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
  ) => void;
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

type ExecuteCodeBlockResult = {
  expression: string;
  expected: string;
  ast: Program;
  result: Array<[RuntimeValue, Type | undefined]>;
  env: Env;
};

const executeCodeBlock = (
  codeBlock: string,
  env: Env,
): ExecuteCodeBlockResult => {
  const [expression, expected] = codeBlock.split("---").map((v) => v.trim());

  const ast = parse(expression);
  const [result, newEnv] = executeProgram(ast, env);

  return { expression, expected, ast, result, env: newEnv };
};

const assertCodeBlockResult = (
  codeBlockResult: ExecuteCodeBlockResult,
): void => {
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

  assertEquals(content.join("\n"), expected);
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
  ): void {
    const id = () => options.get("id") ?? options.get("name") ?? "test";

    const reportError = (e: Error) => {
      console.error(`${id()} failed:`, e);
      Deno.exit(1);
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
      assertCodeBlockResult(executeCodeBlockResult);
    } catch (e) {
      reportError(e);
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
  const src = from(file);

  for (const handler of handlers.values()) {
    handler.reset();
  }

  const tests = await parseTest(file);

  for (const [lang, code] of tests) {
    const handler = handlers.get(lang.name);
    if (handler === undefined) {
      console.error(`No handler for ${lang.name}`);
      Deno.exit(1);
    }
    handler.register(lang.options, code);
  }

  for (const [lang, code] of tests) {
    const handler = handlers.get(lang.name)!;
    handler.apply(src, lang.options, code);
  }
}
