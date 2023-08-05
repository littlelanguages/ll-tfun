import {
  defaultEnv,
  emptyImportEnv,
  Env,
  executeProgram,
} from "./Interpreter.ts";
import { parse } from "./Parser.ts";
import { from, home } from "./Src.ts";
import { renameTypeVariables } from "./Typing.ts";
import {
  expressionToNestedString,
  nestedStringToString,
  valueToString,
} from "./Values.ts";

const readline = (): string | null => {
  const result: Array<string> = [];

  while (true) {
    const line = prompt(result.length === 0 ? ">" : ".");

    if (line === null) {
      return null;
    }

    if (line.trimEnd().endsWith(";;")) {
      result.push(line.trimEnd().substring(0, line.length - 2));
      return result.join("\n");
    }

    result.push(line);
  }
};

const execute = (line: string, env: Env): Env => {
  const ast = parse(env.src, line);
  const [result, newEnv] = executeProgram(ast, env);

  ast.forEach((e, i) => {
    if (e.type === "DataDeclaration") {
      console.log(result[i][0].toString());
    } else if (e.type === "TypeAliasDeclaration") {
      console.log(`${e.name} = ${newEnv.type.findAlias(e.name)?.toString()}`);
    } else if (e.type !== "ImportStatement") {
      const [value, type] = result[i];

      console.log(
        nestedStringToString(
          expressionToNestedString(value, renameTypeVariables([type!])[0], e),
        ),
      );
    }
  });

  return newEnv;
};

const loadPrelude = (env: Env): Env =>
  execute('import * from "../../stdlib/Prelude.tfun"', env);

if (Deno.args.length === 0) {
  console.log(
    "Welcome to the REPL of the Lambda Calculus with ADTs Interpreter!",
  );
  console.log('Type ".quit" to exit.');
  console.log("Enter a multi-line expression with ;; as a terminator.");

  let env: Env;

  try {
    env = defaultEnv(
      home,
      emptyImportEnv(),
      home.newSrc("../../stdlib/Prelude.tfun"),
    );
  } catch (e) {
    console.error(e.toString());
    Deno.exit(1);
  }

  env.src = home.newSrc("repl");

  while (true) {
    const line = readline();

    if (line == null) {
      break;
    }

    switch (line.trim()) {
      case ".quit":
        console.log("bye...");
        Deno.exit(0);
        break;
      case ".env":
        console.log("Runtime Environment");
        for (const field of env.runtime.names()) {
          try {
            console.log(
              `  ${field} = ${valueToString(env.runtime.get(field))}: ${
                env.type.scheme(field)
              }`,
            );
          } catch (_e) {
            console.log(
              `  ${field} = ...: ${env.type.scheme(field)}`,
            );
          }
        }
        console.log("Data Declarations");
        console.log(env.type.datas().map((a) => `  ${a}`).join("\n"));
        console.log("Type Aliases");
        console.log(env.type.aliases().map((a) => `  ${a}`).join("\n"));
        console.log("Imports");
        console.log(Object.keys(env.imports));
        break;
      default:
        try {
          env = execute(line, env);
        } catch (e) {
          console.error(e.toString());
        }
    }
  }
} else if (Deno.args.length === 1) {
  try {
    execute(
      Deno.readTextFileSync(Deno.args[0]),
      loadPrelude(defaultEnv(from(Deno.args[0]), emptyImportEnv(), undefined)),
    );
  } catch (e) {
    console.log(e.toString());
  }
} else {
  console.error("Invalid arguments");
}
