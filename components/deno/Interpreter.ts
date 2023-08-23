import { Constraints } from "./Constraints.ts";
import {
  CyclicImportException,
  DuplicateDataDeclarationException,
  FileNotFoundException,
  GeneralException,
  ImportNameAlreadyDeclaredException,
  UnknownImportNameException,
} from "./Errors.ts";
import { inferExpression, translateType } from "./Infer.ts";
import {
  DataDeclaration,
  Element,
  Expression,
  ImportStatement,
  LetExpression,
  LetRecExpression,
  NameLocation,
  Op,
  parse,
  Pattern,
  Program,
  TypeAliasDeclaration,
  Visibility,
} from "./Parser.ts";
import { Src } from "./Src.ts";
import {
  createFresh,
  DataDefinition,
  emptyTypeEnv,
  Scheme,
  TArr,
  TCon,
  TTuple,
  TVar,
  Type,
  TypeEnv,
  typeInt,
} from "./Typing.ts";
import {
  equals,
  ImportEnv,
  ImportPackage,
  ImportValues,
  mkChar,
  mkTuple,
  RuntimeValue,
  tupleComponent,
  VChar,
} from "./Values.ts";
import * as Location from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.1.1/location.ts";
import * as Runtime from "./Runtime.ts";

const importNames = (importPackage: ImportPackage): Array<string> =>
  [
    ...importPackage.values.keys(),
    ...importPackage.types.aliases(),
  ].sort();

export type Env = {
  runtime: Runtime.Env;
  type: TypeEnv;
  src: Src;
  imports: ImportEnv;
  preludeSrc: Src | undefined;
};

export const emptyEnv = (src: Src, preludeSrc: Src | undefined): Env => ({
  runtime: Runtime.emptyEnv(),
  type: emptyTypeEnv,
  src,
  imports: {},
  preludeSrc,
});

export const defaultEnv = (
  src: Src,
  preludeSrc: Src | undefined = undefined,
  imports: ImportEnv = {},
): Env => {
  const initialEnv = { runtime: Runtime.emptyEnv(), type: emptyTypeEnv, src, imports, preludeSrc };

  if (preludeSrc === undefined || src.urn() === preludeSrc.urn()) {
    return initialEnv;
  } else {
    const line = `import * from "${preludeSrc.urn()}"`;

    return parseExecute(src, line, initialEnv)[2];
  }
};

const binaryOps = new Map<number, (v1: RuntimeValue, v2: RuntimeValue) => RuntimeValue>([
  [Op.Append, (a, b) => a + b],
  [Op.Divide, (a, b) => (a / b) | 0],
  [Op.Equals, (a, b) => equals(a, b)],
  [Op.GreaterEquals, (a, b) => a >= b],
  [Op.GreaterThan, (a, b) => a > b],
  [Op.LessEquals, (a, b) => a <= b],
  [Op.LessThan, (a, b) => a < b],
  [Op.Minus, (a, b) => (a - b) | 0],
  [Op.NotEquals, (a, b) => !equals(a, b)],
  [Op.PipeRight, (a, b) => b(a)],
  [Op.Plus, (a, b) => (a + b) | 0],
  [Op.Times, (a, b) => (a * b) | 0],
]);

const arrayToList = (arr: Array<RuntimeValue>, runtimeEnv: Runtime.Env): RuntimeValue => {
  let result: RuntimeValue = runtimeEnv.get("Nil");
  for (let i = arr.length - 1; i >= 0; i--) {
    result = runtimeEnv.get("Cons")(arr[i])(result);
  }
  return result;
};

const literalReg = /[.*+?^${}()|[\]\\]/g;
const literal = (s: string) => s.replace(literalReg, "\\$&");

const evaluate = (expr: Expression, runtimeEnv: Runtime.Env): RuntimeValue => {
  switch (expr.type) {
    case "App": {
      const operator = evaluate(expr.e1, runtimeEnv);
      const operand = evaluate(expr.e2, runtimeEnv);
      return operator(operand);
    }
    case "Builtin":
      switch (expr.name) {
        case "Data.Char.fromInt":
          return (n: number) => mkChar(n < 256 ? n : 32);
        case "Data.Char.toInt":
          return (c: VChar) => c.value;
        case "Data.Char.toString":
          return (c: VChar) => String.fromCharCode(c.value);
        case "Data.Integer.fromString":
          return (s: string) => {
            const n = parseInt(s, 10);
            return isNaN(n) ? runtimeEnv.get("Nothing") : runtimeEnv.get("Just")(n);
          };
        case "Data.Integer.toString":
          return (n: number) => `${n}`;
        case "Data.Ref.Assign":
          return (v: RuntimeValue) => (r: RuntimeValue) => {
            const result = r[1];
            r[1] = v;
            return result;
          };
        case "Data.String.append":
          return (a: string) => (b: string) => a + b;
        case "Data.String.at":
          return (i: number) => (s: string) =>
            (i < s.length) ? runtimeEnv.get("Just")(mkChar(s[i])) : runtimeEnv.get("Nothing");
        case "Data.String.indexOf":
          return (n: string) => (s: string) => {
            const i = s.indexOf(n);

            return (i == -1) ? runtimeEnv.get("Nothing") : runtimeEnv.get("Just")(i);
          };
        case "Data.String.length":
          return (s: string) => s.length;
        case "Data.String.replace":
          return (searchValue: string) => (replaceValue: string) => (s: string) =>
            s.replace(new RegExp(literal(searchValue), "g"), replaceValue);
        case "Data.String.reverse":
          return (s: string) => s.split("").reverse().join("");
        case "Data.String.slice":
          return (start: number) => (end: number) => (s: string) => s.slice(start, end);
        case "System.IO.Console.print":
          return (s: string) => {
            console.log(s);
            return null;
          };
        case "System.IO.Console.printLn":
          return (s: string) => {
            console.log(s);
            return null;
          };
        case "Text.Regex.literal":
          return literal;
        case "Text.Regex.parse":
          return (s: string) => new RegExp(s);
        case "Text.Regex.split":
          return (r: RegExp) => (s: string) => arrayToList(s.split(r), runtimeEnv);
        default:
          throw new GeneralException("Unknown builtin", { name: expr.name });
      }
    case "If":
      return evaluate(expr.guard, runtimeEnv) ? evaluate(expr.then, runtimeEnv) : evaluate(expr.else, runtimeEnv);
    case "Lam":
      return (x: RuntimeValue): RuntimeValue => {
        const newRuntimeEnv = runtimeEnv.clone();
        newRuntimeEnv.bind(expr.name.name.name, x);
        return evaluate(expr.expr, newRuntimeEnv);
      };
    case "Let":
    case "LetRec":
      return executeValueDeclaration(expr, runtimeEnv, false)[0];
    case "LBool":
    case "LInt":
    case "LString":
      return expr.value;
    case "LChar":
      return mkChar(expr.value);
    case "LTuple":
      return mkTuple(expr.values.map((v) => evaluate(v, runtimeEnv)));
    case "LUnit":
      return null;
    case "Match": {
      const e = evaluate(expr.expr, runtimeEnv);

      for (const c of expr.cases) {
        const newEnv = matchPattern(c.pattern, e, runtimeEnv);
        if (newEnv !== null) {
          return evaluate(c.expr, newEnv);
        }
      }
      throw new GeneralException("MatchFailed", { expr });
    }
    case "Op":
      switch (expr.op) {
        case Op.And:
          return evaluate(expr.left, runtimeEnv) &&
            evaluate(expr.right, runtimeEnv);
        case Op.Cons: {
          const left = evaluate(expr.left, runtimeEnv);
          const right = evaluate(expr.right, runtimeEnv);
          return runtimeEnv.get("Cons")(left)(right);
        }
        case Op.Or:
          return evaluate(expr.left, runtimeEnv) ||
            evaluate(expr.right, runtimeEnv);
        default: {
          const left = evaluate(expr.left, runtimeEnv);
          const right = evaluate(expr.right, runtimeEnv);
          return binaryOps.get(expr.op)!(left, right);
        }
      }
    case "RecordEmpty":
      return {};
    case "RecordExtend": {
      const e = evaluate(expr.expr, runtimeEnv);
      const rest = evaluate(expr.rest, runtimeEnv);
      return { ...rest, [expr.name]: e };
    }
    case "RecordSelect": {
      const e = evaluate(expr.expr, runtimeEnv);
      return e[expr.name];
    }
    case "Typing":
      return evaluate(expr.expr, runtimeEnv);
    case "Var":
      return (expr.qualifier === undefined)
        ? runtimeEnv.get(expr.name.name)
        : runtimeEnv.get(expr.qualifier.name).get(expr.name.name)![0];
    default:
      return null;
  }
};

const matchPattern = (pattern: Pattern, value: RuntimeValue, runtimeEnv: Runtime.Env): Runtime.Env | null => {
  switch (pattern.type) {
    case "PChar":
      return pattern.value === (value as VChar).value ? runtimeEnv : null;
    case "PVar": {
      return runtimeEnv.clone().bind(pattern.name, value);
    }
    case "PCons": {
      let newRuntimeEnv: Runtime.Env | null = runtimeEnv;

      if (value[0] !== pattern.name.name) {
        return null;
      }
      for (let i = 0; i < pattern.args.length; i++) {
        newRuntimeEnv = matchPattern(pattern.args[i], value[i + 1], newRuntimeEnv);
        if (newRuntimeEnv === null) {
          return null;
        }
      }
      return newRuntimeEnv;
    }
    case "PRecord": {
      let newRuntimeEnv: Runtime.Env | null = runtimeEnv;
      for (const [name, p] of pattern.fields) {
        newRuntimeEnv = matchPattern(p, value[name], newRuntimeEnv);
        if (newRuntimeEnv === null) {
          return null;
        }
      }
      return newRuntimeEnv;
    }
    case "PTuple": {
      let newRuntimeEnv: Runtime.Env | null = runtimeEnv;
      for (let i = 0; i < pattern.values.length; i++) {
        newRuntimeEnv = matchPattern(pattern.values[i], tupleComponent(value, i), newRuntimeEnv);
        if (newRuntimeEnv === null) {
          return null;
        }
      }
      return newRuntimeEnv;
    }
    case "PUnit":
      return value === null ? runtimeEnv : null;
    case "PWildcard":
      return runtimeEnv;
    default:
      return pattern.value === value ? runtimeEnv : null;
  }
};

const executeValueDeclaration = (
  expr: LetExpression | LetRecExpression,
  runtimeEnv: Runtime.Env,
  toplevel: boolean,
): [RuntimeValue, Runtime.Env] => {
  const newRuntimeEnv = runtimeEnv.clone();
  const values: Array<RuntimeValue> = [];

  expr.declarations.forEach((d) => {
    if (!toplevel && d.visibility !== Visibility.None) {
      throw new GeneralException("VisibilityModifierError", {
        name: d.name,
        Visibility: d.visibility,
      });
    }

    const value = evaluate(d.expr, newRuntimeEnv);
    newRuntimeEnv.bind(d.name, value);
    values.push(value);
  });

  return (expr.expr === undefined) ? [values, newRuntimeEnv] : [evaluate(expr.expr, newRuntimeEnv), runtimeEnv];
};

const executeExpression = (expr: Expression, runtimeEnv: Runtime.Env): [RuntimeValue, Runtime.Env] =>
  (expr.type === "Let" || expr.type === "LetRec")
    ? executeValueDeclaration(expr, runtimeEnv, true)
    : [evaluate(expr, runtimeEnv), runtimeEnv];

const mkConstructorFunction = (name: string, arity: number): RuntimeValue => {
  if (arity === 0) {
    return [name];
  }
  if (arity === 1) {
    return (x1: RuntimeValue) => [name, x1];
  }
  if (arity === 2) {
    return (x1: RuntimeValue) => (x2: RuntimeValue) => [name, x1, x2];
  }
  if (arity === 3) {
    return (x1: RuntimeValue) => (x2: RuntimeValue) => (x3: RuntimeValue) => [name, x1, x2, x3];
  }
  if (arity === 4) {
    return (x1: RuntimeValue) => (x2: RuntimeValue) => (x3: RuntimeValue) => (x4: RuntimeValue) => [
      name,
      x1,
      x2,
      x3,
      x4,
    ];
  }
  if (arity === 5) {
    return (x1: RuntimeValue) =>
    (x2: RuntimeValue) =>
    (x3: RuntimeValue) =>
    (x4: RuntimeValue) =>
    (x5: RuntimeValue) => [name, x1, x2, x3, x4, x5];
  }

  throw { type: "TooManyConstructorArgumentsErrors", name, arity };
};

const executeDataDeclaration = (
  ast: DataDeclaration,
  env: Env,
): [Array<DataDefinition>, Env] => {
  const adts: Array<DataDefinition> = [];

  ast.declarations.forEach((d) => {
    if (env.type.data(d.name.name) !== undefined) {
      throw new DuplicateDataDeclarationException(env.src, d.name.name, d.name.location);
    }

    const adt = new DataDefinition(env.src, d.name.name, d.parameters, []);

    env = { ...env, type: env.type.addData(adt) };
  });

  ast.declarations.forEach((d) => {
    const adt = env.type.data(d.name.name)!;

    const parameters = new Set(d.parameters);

    d.constructors.forEach((c) => {
      adt.addConstructor(c.name, c.parameters.map((t) => translateType(t, env, parameters)));
    });

    adts.push(adt);
    const runtimeEnv = env.runtime;
    let typeEnv = env.type.addData(adt);

    const constructorResultType = new TCon(
      adt,
      adt.parameters.map((p) => new TVar(p)),
    );
    adt.constructors.forEach((c) => {
      typeEnv = typeEnv.extend(
        c.name,
        new Scheme(
          adt.parameters,
          c.args.reduceRight((acc: Type, t: Type) => new TArr(t, acc), constructorResultType),
        ),
      );

      runtimeEnv.bind(c.name, mkConstructorFunction(c.name, c.args.length));
    });

    env = { ...env, runtime: runtimeEnv, type: typeEnv };
  });

  return [adts, env];
};

const executeTypeAliasDeclaration = (ast: TypeAliasDeclaration, env: Env): Env => {
  const typ = translateType(ast.typ, env, new Set(ast.parameters));

  return { ...env, type: env.type.addAlias(ast.name, new Scheme(ast.parameters, typ)) };
};

const executeImportStatement = (ast: ImportStatement, env: Env): Env => {
  const imports = importPackage(ast.from, env);

  switch (ast.items.type) {
    case "ImportAll": {
      if (ast.items.as === undefined) {
        const runtime = env.runtime.clone();
        let type = env.type;
        imports.values.forEach(([v, t], n) => {
          if (runtime.has(n)) {
            throw new ImportNameAlreadyDeclaredException(env.src, n, ast.from.location);
          }

          runtime.bind(n, v);
          type = type.extend(n, t.toScheme());
        });

        imports.types.datas().forEach((adt) => {
          type = type.addData(adt);
        });

        imports.types.aliases().forEach((name) => {
          if (type.findAlias(name) === undefined) {
            type = type.addAlias(name, imports.types.findAlias(name)!);
          } else {
            throw new ImportNameAlreadyDeclaredException(env.src, name, ast.from.location);
          }
        });

        return { ...env, runtime, type };
      } else {
        if (env.runtime.has(ast.items.as.name)) {
          throw new ImportNameAlreadyDeclaredException(env.src, ast.items.as.name, ast.items.as.location);
        }
        const runtime = env.runtime.clone();
        let type = env.type;

        runtime.bind(ast.items.as.name, imports.values);
        type = type.addImport(ast.items.as.name, imports.types);

        return { ...env, runtime, type };
      }
    }
    case "ImportNames": {
      const runtime = env.runtime.clone();
      let type = env.type;

      ast.items.items.forEach(({ name, as }) => {
        if (startsWithUppercase(name.name[0])) {
          const adt = imports.types.data(name.name);

          if (adt === undefined) {
            const alias = imports.types.findAlias(name.name);
            if (alias === undefined) {
              throw new UnknownImportNameException(env.src, name.name, name.location, importNames(imports));
            } else if (type.findAlias(name.name) !== undefined) {
              throw new ImportNameAlreadyDeclaredException(env.src, name.name, name.location);
            }
            type = type.addAlias(name.name, alias);
          } else {
            if (type.data(adt.name) !== undefined) {
              throw new ImportNameAlreadyDeclaredException(env.src, name.name, name.location);
            }
            type = type.addData(adt);

            adt.constructors.forEach((c) => {
              if (runtime.has(c.name)) {
                throw new ImportNameAlreadyDeclaredException(env.src, name.name, name.location);
              }
              const v = imports.values.get(c.name)!;
              runtime.bind(c.name, v[0]);
              type = type.extend(c.name, v[1].toScheme());
            });
          }
        } else {
          const item = imports.values.get(name.name);

          if (item === undefined) {
            throw new UnknownImportNameException(env.src, name.name, name.location, importNames(imports));
          }
          const n = as ?? name;

          if (runtime.has(n.name)) {
            throw new ImportNameAlreadyDeclaredException(env.src, n.name, n.location);
          }

          runtime.bind(n.name, item[0]);
          type = type.extend(n.name, item[1].toScheme());
        }
      });

      return { ...env, runtime, type };
    }
    default:
      throw new GeneralException("NotImplemented", { ast });
  }
};

const executeElement = (
  e: Element,
  env: Env,
): [RuntimeValue, Type | undefined, Env] => {
  switch (e.type) {
    case "DataDeclaration": {
      const [adts, newEnv] = executeDataDeclaration(e, env);
      return [adts, undefined, newEnv];
    }
    case "TypeAliasDeclaration": {
      const newEnv = executeTypeAliasDeclaration(e, env);
      return [null, undefined, newEnv];
    }
    case "ImportStatement": {
      const newEnv = executeImportStatement(e, env);
      return [null, undefined, newEnv];
    }
    default: {
      const pump = createFresh();
      const [constraints, type, newTypeEnv] = inferExpression(e, env, new Constraints(), pump);
      const subst = constraints.solve(pump);
      const newType = type.apply(subst);

      const [value, newRuntime] = executeExpression(e, env.runtime);

      return [value, newType, { ...env, runtime: newRuntime, type: newTypeEnv.type }];
    }
  }
};

type ExecuteResult = [Array<[RuntimeValue, Type | undefined]>, Env];

const executeProgram = (program: Program, env: Env): ExecuteResult => {
  const results: Array<[RuntimeValue, Type | undefined]> = [];

  for (const element of program) {
    const [value, type, newEnv] = executeElement(element, env);
    results.push([value, type]);
    env = newEnv;
  }

  return [results, env];
};

export const execute = (input: string, env: Env): ExecuteResult => executeProgram(parse(env.src, input), env);

const readTextFile = (src: Src, path: string, location: Location.Location): string => {
  try {
    return Deno.readTextFileSync(path);
  } catch (_e) {
    throw new FileNotFoundException(src, path, location);
  }
};

const loadingImport: ImportPackage = {
  values: new Map(),
  types: emptyTypeEnv.extend("_Loading", new Scheme([], typeInt)),
};

export const parseExecute = (
  src: Src,
  program: string,
  initialEnv: Env,
): [Program, Array<[RuntimeValue, Type | undefined]>, Env] => {
  const ast = parse(src, program);

  const [result, resultEnv] = executeProgram(ast, initialEnv);
  return [ast, result, resultEnv];
};

export const importPackage = (
  importFileName: NameLocation,
  referencedFrom: Env,
): ImportPackage => {
  const src = referencedFrom.src.newSrc(importFileName.name);
  const urn = src.urn();
  const importEnv = referencedFrom.imports;

  const env = importEnv[urn];
  if (env === undefined) {
    importEnv[urn] = loadingImport;

    const importValues: ImportValues = new Map();
    let env = emptyTypeEnv;

    const program = readTextFile(referencedFrom.src, urn, importFileName.location);
    const initialImportEnv = defaultEnv(src, referencedFrom.preludeSrc, referencedFrom.imports);
    const [ast, result, resultEnv] = parseExecute(src, program, initialImportEnv);

    ast.forEach((e, i) => {
      switch (e.type) {
        case "Let":
        case "LetRec": {
          const [value, type] = result[i];

          const tt = type as TTuple;

          e.declarations.forEach((d, i2) => {
            if (d.visibility === Visibility.Public) {
              const v = value[i2];
              const vType = tt.types[i2];

              importValues.set(d.name, [v, vType]);
              env = env.extend(d.name, vType.toScheme());
            }
          });
          break;
        }
        case "DataDeclaration": {
          e.declarations.forEach((d) => {
            if (d.visibility === Visibility.Public) {
              d.constructors.forEach((c) => {
                const constructorScheme = resultEnv.type.scheme(c.name)!;
                const constructorType = constructorScheme.instantiate(createFresh());

                importValues.set(c.name, [resultEnv.runtime.get(c.name), constructorType]);
                env = env.extend(c.name, constructorScheme);
              });
              env = env.addData(resultEnv.type.data(d.name.name)!);
            } else if (d.visibility === Visibility.Opaque) {
              env = env.addData(new DataDefinition(src, d.name.name, d.parameters, []));
            }
          });
          break;
        }
        case "ImportStatement": {
          const imports = importPackage(e.from, initialImportEnv);

          if (e.items.type === "ImportNames") {
            e.items.items.forEach(({ name, as, visibility }) => {
              if (visibility === Visibility.Public) {
                if (startsWithUppercase(name.name[0])) {
                  const adt = imports.types.data(name.name);
                  if (adt === undefined) {
                    const alias = imports.types.findAlias(name.name);
                    if (alias === undefined) {
                      throw new UnknownImportNameException(src, name.name, name.location, importNames(imports));
                    }
                    env = env.addAlias(name.name, alias);
                  } else {
                    env = env.addData(adt);

                    adt.constructors.forEach((c) => {
                      const v = imports.values.get(c.name)!;
                      importValues.set(c.name, [v[0], v[1]]);
                      env = env.extend(c.name, v[1].toScheme());
                    });
                  }
                } else {
                  const item = imports.values.get(name.name);

                  if (item === undefined) {
                    throw new UnknownImportNameException(src, name.name, name.location, importNames(imports));
                  }

                  const n = as ?? name;

                  importValues.set(n.name, [item[0], item[1]]);
                  env = env.extend(n.name, item[1].toScheme());
                }
              }
            });
          }
          break;
        }
        case "TypeAliasDeclaration":
          if (e.visibility === Visibility.Public) {
            env = env.addAlias(e.name, resultEnv.type.findAlias(e.name)!);
          }
          break;
      }
    });

    const r: ImportPackage = { values: importValues, types: env };
    importEnv[urn] = r;
    return r;
  } else if (env === loadingImport) {
    throw new CyclicImportException(referencedFrom.src, importFileName.name, importFileName.location);
  } else {
    return env;
  }
};

const startsWithUppercase = (str: string) => str.length > 0 && str.charCodeAt(0) >= 65 && str.charCodeAt(0) <= 90;
