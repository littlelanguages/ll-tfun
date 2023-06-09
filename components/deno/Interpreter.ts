import { Constraints } from "./Constraints.ts";
import { inferExpression, translateType } from "./Infer.ts";
import {
  DataDeclaration,
  Element,
  Expression,
  LetExpression,
  LetRecExpression,
  Op,
  parse,
  Pattern,
  Program,
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
  typeBool,
  TypeEnv,
  typeInt,
  typeString,
} from "./Typing.ts";
import {
  ImportEnv,
  ImportPackage,
  ImportValues,
  mkTuple,
  RuntimeValue,
  tupleComponent,
} from "./Values.ts";

type RuntimeEnvBindings = { [key: string]: RuntimeValue };

class RuntimeEnv {
  private bindings: RuntimeEnvBindings;

  constructor(
    bindings: RuntimeEnvBindings = {},
  ) {
    this.bindings = bindings;
  }

  bind(name: string, value: RuntimeValue): RuntimeEnv {
    this.bindings[name] = value;

    return this;
  }

  has(name: string): boolean {
    return this.bindings[name] !== undefined;
  }

  get(name: string): RuntimeValue {
    const v = this.bindings[name];

    if (v === undefined) {
      throw { type: "UnknownName", name };
    } else {
      return v;
    }
  }

  clone(): RuntimeEnv {
    return new RuntimeEnv({ ...this.bindings });
  }

  names(): Array<string> {
    return Object.keys(this.bindings);
  }
}

const importValueNames = (
  values: ImportValues,
): Array<string> => [...values.keys()];

export type Env = {
  runtime: RuntimeEnv;
  type: TypeEnv;
  src: Src;
  imports: ImportEnv;
};

export const emptyRuntimeEnv = () => new RuntimeEnv();

export const emptyImportEnv: ImportEnv = {};

export const emptyEnv = (src: Src): Env => ({
  runtime: emptyRuntimeEnv(),
  type: emptyTypeEnv,
  src,
  imports: emptyImportEnv,
});

export const defaultEnv = (src: Src): Env => ({
  runtime: emptyRuntimeEnv()
    .bind("string_length", (s: string) => s.length)
    .bind("string_concat", (s1: string) => (s2: string) => s1 + s2)
    .bind(
      "string_substring",
      (s: string) => (start: number) => (end: number) => s.slice(start, end),
    )
    .bind("string_equal", (s1: string) => (s2: string) => s1 === s2)
    .bind(
      "string_compare",
      (s1: string) => (s2: string) => s1 < s2 ? -1 : s1 === s2 ? 0 : 1,
    ),
  type: emptyTypeEnv
    .extend(
      "string_length",
      (new TArr(typeString, typeInt)).toScheme(),
    )
    .extend(
      "string_concat",
      (new TArr(typeString, new TArr(typeString, typeString))).toScheme(),
    )
    .extend(
      "string_substring",
      (new TArr(typeString, new TArr(typeInt, new TArr(typeInt, typeString))))
        .toScheme(),
    )
    .extend(
      "string_equal",
      (new TArr(typeString, new TArr(typeString, typeBool))).toScheme(),
    )
    .extend(
      "string_compare",
      (new TArr(typeString, new TArr(typeString, typeInt))).toScheme(),
    ),
  src,
  imports: emptyImportEnv,
});

const binaryOps = new Map<
  number,
  (v1: RuntimeValue, v2: RuntimeValue) => RuntimeValue
>([
  [Op.Equals, (a, b) => a === b],
  [Op.Plus, (a, b) => (a + b) | 0],
  [Op.Minus, (a, b) => (a - b) | 0],
  [Op.Times, (a, b) => (a * b) | 0],
  [Op.Divide, (a, b) => (a / b) | 0],
]);

const evaluate = (expr: Expression, runtimeEnv: RuntimeEnv): RuntimeValue => {
  switch (expr.type) {
    case "App": {
      const operator = evaluate(expr.e1, runtimeEnv);
      const operand = evaluate(expr.e2, runtimeEnv);
      return operator(operand);
    }
    case "Builtin":
      switch (expr.name) {
        case "String.Length":
          return (s: string) => s.length;
        default:
          throw new Error(`Unknown builtin ${expr.name}`);
      }
    case "If":
      return evaluate(expr.guard, runtimeEnv)
        ? evaluate(expr.then, runtimeEnv)
        : evaluate(expr.else, runtimeEnv);
    case "Lam":
      return (x: RuntimeValue): RuntimeValue => {
        const newRuntimeEnv = runtimeEnv.clone();
        newRuntimeEnv.bind(expr.name[0], x);
        return evaluate(expr.expr, newRuntimeEnv);
      };
    case "Let":
    case "LetRec":
      return executeDeclaration(expr, runtimeEnv, false)[0];
    case "LBool":
    case "LInt":
    case "LString":
      return expr.value;
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
      throw new Error("Match failed");
    }
    case "Op": {
      const left = evaluate(expr.left, runtimeEnv);
      const right = evaluate(expr.right, runtimeEnv);
      return binaryOps.get(expr.op)!(left, right);
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
        ? runtimeEnv.get(expr.name)
        : runtimeEnv.get(expr.qualifier).get(expr.name)![0];
    default:
      return null;
  }
};

const matchPattern = (
  pattern: Pattern,
  value: RuntimeValue,
  runtimeEnv: RuntimeEnv,
): RuntimeEnv | null => {
  switch (pattern.type) {
    case "PVar": {
      const newEnv = runtimeEnv.clone();
      newEnv.bind(pattern.name, value);
      return newEnv;
    }
    case "PCons": {
      let newRuntimeEnv: RuntimeEnv | null = runtimeEnv;

      if (value[0] !== pattern.name) {
        return null;
      }
      for (let i = 0; i < pattern.args.length; i++) {
        newRuntimeEnv = matchPattern(
          pattern.args[i],
          value[i + 1],
          newRuntimeEnv,
        );
        if (newRuntimeEnv === null) {
          return null;
        }
      }
      return newRuntimeEnv;
    }
    case "PRecord": {
      let newRuntimeEnv: RuntimeEnv | null = runtimeEnv;
      for (const [name, p] of pattern.fields) {
        newRuntimeEnv = matchPattern(
          p,
          value[name],
          newRuntimeEnv,
        );
        if (newRuntimeEnv === null) {
          return null;
        }
      }
      return newRuntimeEnv;
    }
    case "PTuple": {
      let newRuntimeEnv: RuntimeEnv | null = runtimeEnv;
      for (let i = 0; i < pattern.values.length; i++) {
        newRuntimeEnv = matchPattern(
          pattern.values[i],
          tupleComponent(value, i),
          newRuntimeEnv,
        );
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

const executeDeclaration = (
  expr: LetExpression | LetRecExpression,
  runtimeEnv: RuntimeEnv,
  toplevel: boolean,
): [RuntimeValue, RuntimeEnv] => {
  const newRuntimeEnv = runtimeEnv.clone();
  const values: Array<RuntimeValue> = [];

  expr.declarations.forEach((d) => {
    if (!toplevel && d.visibility !== Visibility.None) {
      throw {
        type: "VisibilityModifierError",
        name: d.name,
        Visibility: d.visibility,
      };
    }

    const value = evaluate(d.expr, newRuntimeEnv);
    newRuntimeEnv.bind(d.name, value);
    values.push(value);
  });

  return (expr.expr === undefined)
    ? [values, newRuntimeEnv]
    : [evaluate(expr.expr, newRuntimeEnv), runtimeEnv];
};

const executeExpression = (
  expr: Expression,
  runtimeEnv: RuntimeEnv,
): [RuntimeValue, RuntimeEnv] =>
  (expr.type === "Let" || expr.type === "LetRec")
    ? executeDeclaration(expr, runtimeEnv, true)
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
    return (x1: RuntimeValue) => (x2: RuntimeValue) => (x3: RuntimeValue) => [
      name,
      x1,
      x2,
      x3,
    ];
  }
  if (arity === 4) {
    return (x1: RuntimeValue) =>
    (x2: RuntimeValue) =>
    (x3: RuntimeValue) =>
    (x4: RuntimeValue) => [name, x1, x2, x3, x4];
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
  dd: DataDeclaration,
  env: Env,
): [Array<DataDefinition>, Env] => {
  const adts: Array<DataDefinition> = [];

  dd.declarations.forEach((d) => {
    if (env.type.data(d.name) !== undefined) {
      throw { type: "DuplicateDataDeclaration", name: d.name };
    }

    const adt = new DataDefinition(env.src, d.name, d.parameters, []);

    env = { ...env, type: env.type.addData(adt) };
  });

  dd.declarations.forEach((d) => {
    const adt = env.type.data(d.name)!;

    d.constructors.forEach((c) => {
      adt.addConstructor(
        c.name,
        c.parameters.map((t) => translateType(t, env)),
      );
    });

    adts.push(adt);
    const runtimeEnv = env.runtime;
    let typeEnv = env.type.addData(adt);

    const parameters = new Set(adt.parameters);
    const constructorResultType = new TCon(
      adt,
      adt.parameters.map((p) => new TVar(p)),
    );
    adt.constructors.forEach((c) => {
      typeEnv = typeEnv.extend(
        c.name,
        new Scheme(
          parameters,
          c.args.reduceRight(
            (acc: Type, t: Type) => new TArr(t, acc),
            constructorResultType,
          ),
        ),
      );

      runtimeEnv.bind(c.name, mkConstructorFunction(c.name, c.args.length));
    });

    env = { ...env, runtime: runtimeEnv, type: typeEnv };
  });

  return [adts, env];
};

const startsWithUppercase = (str: string) =>
  str.length > 0 && str.charCodeAt(0) >= 65 && str.charCodeAt(0) <= 90;

const executeElement = (
  e: Element,
  env: Env,
): [RuntimeValue, Type | undefined, Env] => {
  if (e.type === "DataDeclaration") {
    const [adts, newEnv] = executeDataDeclaration(e, env);
    return [adts, undefined, newEnv];
  } else if (e.type === "ImportStatement") {
    const imports = executeImport(e.from, env.src, env.imports);

    if (e.items.type === "ImportAll") {
      if (e.items.as === undefined) {
        const runtime = env.runtime.clone();
        let type = env.type;

        imports.values.forEach(([v, t], n) => {
          if (runtime.has(n)) {
            throw {
              type: "ImportNameAlreadyDeclared",
              name: n,
            };
          }

          runtime.bind(n, v);
          type = type.extend(n, t.toScheme());
        });

        imports.types.datas().forEach((adt) => {
          type = type.addData(adt);
        });

        return [null, undefined, { ...env, runtime, type }];
      } else {
        if (env.runtime.has(e.items.as)) {
          throw {
            type: "ImportNameAlreadyDeclared",
            name: e.items.as,
          };
        }
        const runtime = env.runtime.clone();
        let type = env.type;

        runtime.bind(e.items.as, imports.values);
        type = type.addImport(e.items.as, imports.types);

        return [null, undefined, { ...env, runtime, type }];
      }
    }
    if (e.items.type === "ImportNames") {
      const runtime = env.runtime.clone();
      let type = env.type;

      e.items.items.forEach(({ name, as }) => {
        if (startsWithUppercase(name[0])) {
          const adt = imports.types.data(name);
          if (adt === undefined) {
            throw {
              type: "UnknownImportName",
              name,
              names: importValueNames(imports.values),
            };
          }
          if (type.data(adt.name) !== undefined) {
            throw {
              type: "ImportNameAlreadyDeclared",
              name: adt.name,
            };
          }
          type = type.addData(adt);

          adt.constructors.forEach((c) => {
            if (runtime.has(c.name)) {
              throw {
                type: "ImportNameAlreadyDeclared",
                name: adt.name,
              };
            }
            const v = imports.values.get(c.name)!;
            runtime.bind(
              c.name,
              v[0],
            );
            type = type.extend(c.name, v[1].toScheme());
          });
        } else {
          const item = imports.values.get(name);

          if (item === undefined) {
            throw {
              type: "UnknownImportName",
              name,
              names: importValueNames(imports.values),
            };
          }
          const n = as ?? name;

          if (runtime.has(n)) {
            throw {
              type: "ImportNameAlreadyDeclared",
              name: n,
            };
          }

          runtime.bind(n, item[0]);
          type = type.extend(n, item[1].toScheme());
        }
      });

      return [null, undefined, { ...env, runtime, type }];
    }

    throw new Error("TODO: Interpreter: Import statement not yet supported");
  } else {
    const pump = createFresh();
    const [constraints, type, newTypeEnv] = inferExpression(
      e,
      env,
      new Constraints(),
      pump,
    );
    const subst = constraints.solve(pump);
    const newType = type.apply(subst);

    const [value, newRuntime] = executeExpression(e, env.runtime);

    return [value, newType, {
      ...env,
      runtime: newRuntime,
      type: newTypeEnv.type,
    }];
  }
};

export const executeProgram = (
  program: Program,
  env: Env,
): [Array<[RuntimeValue, Type | undefined]>, Env] => {
  const results: Array<[RuntimeValue, Type | undefined]> = [];

  for (const element of program) {
    const [value, type, newEnv] = executeElement(element, env);
    results.push([value, type]);
    env = newEnv;
  }

  return [results, env];
};

export type ExecuteResult = [Array<[RuntimeValue, Type | undefined]>, Env];

export const execute = (
  input: string,
  env: Env,
): ExecuteResult => executeProgram(parse(input), env);

export const executeImport = (
  name: string,
  referencedFrom: Src,
  importEnv: ImportEnv = {},
): ImportPackage => {
  const src = referencedFrom.newSrc(name);
  const urn = src.urn();

  const env = importEnv[urn];
  if (env === undefined) {
    const importValues: ImportValues = new Map();
    let env = emptyTypeEnv;

    const ast = parse(Deno.readTextFileSync(urn));
    const [result, resultEnv] = executeProgram(ast, defaultEnv(src));

    ast.forEach((e, i) => {
      if (e.type === "Let" || e.type === "LetRec") {
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
      } else if (e.type === "DataDeclaration") {
        e.declarations.forEach((d) => {
          if (d.visibility === Visibility.Public) {
            d.constructors.forEach((c) => {
              const constructorScheme = resultEnv.type.scheme(c.name)!;
              const constructorType = constructorScheme.instantiate(
                createFresh(),
              );

              importValues.set(c.name, [
                resultEnv.runtime.get(c.name),
                constructorType,
              ]);
              env = env.extend(c.name, constructorScheme);
            });
            env = env.addData(resultEnv.type.data(d.name)!);
          } else if (d.visibility === Visibility.Opaque) {
            env = env.addData(
              new DataDefinition(
                src,
                d.name,
                d.parameters,
                [],
              ),
            );
          }
        });
      } else if (e.type === "ImportStatement") {
        const imports = executeImport(e.from, src, importEnv);

        if (e.items.type === "ImportNames") {
          e.items.items.forEach(({ name, as, visibility }) => {
            if (visibility === Visibility.Public) {
              if (startsWithUppercase(name[0])) {
                const adt = imports.types.data(name);
                if (adt === undefined) {
                  throw {
                    type: "UnknownImportName",
                    name,
                    names: importValueNames(imports.values),
                  };
                }
                env = env.addData(adt);

                adt.constructors.forEach((c) => {
                  const v = imports.values.get(c.name)!;
                  importValues.set(c.name, [v[0], v[1]]);
                  env = env.extend(c.name, v[1].toScheme());
                });
              } else {
                const item = imports.values.get(name);

                if (item === undefined) {
                  throw {
                    type: "UnknownImportName",
                    name,
                    names: importValueNames(imports.values),
                  };
                }

                const n = as ?? name;

                importValues.set(n, [item[0], item[1]]);
                env = env.extend(n, item[1].toScheme());
              }
            }
          });
        }
      }
    });

    const r: ImportPackage = { values: importValues, types: env };
    importEnv[urn] = r;
    return r;
  } else {
    return env;
  }
};
