import { Constraints } from "./Constraints.ts";
import { inferExpression } from "./Infer.ts";
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
  Type as TypeItem,
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
  typeUnit,
} from "./Typing.ts";
import { mkTuple, RuntimeValue, tupleComponent } from "./Values.ts";

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

type ImportPackage = Array<[string, RuntimeValue, Type]>;

type ImportEnv = { [key: string]: ImportPackage };

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
      new Scheme(new Set(), new TArr(typeString, typeInt)),
    )
    .extend(
      "string_concat",
      new Scheme(
        new Set(),
        new TArr(typeString, new TArr(typeString, typeString)),
      ),
    )
    .extend(
      "string_substring",
      new Scheme(
        new Set(),
        new TArr(typeString, new TArr(typeInt, new TArr(typeInt, typeString))),
      ),
    )
    .extend(
      "string_equal",
      new Scheme(
        new Set(),
        new TArr(typeString, new TArr(typeString, typeBool)),
      ),
    )
    .extend(
      "string_compare",
      new Scheme(
        new Set(),
        new TArr(typeString, new TArr(typeString, typeInt)),
      ),
    )
    .addData(new DataDefinition("Int", [], []))
    .addData(new DataDefinition("String", [], []))
    .addData(new DataDefinition("Bool", [], [])),
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
  if (expr.type === "App") {
    const operator = evaluate(expr.e1, runtimeEnv);
    const operand = evaluate(expr.e2, runtimeEnv);
    return operator(operand);
  }
  if (expr.type === "If") {
    return evaluate(expr.guard, runtimeEnv)
      ? evaluate(expr.then, runtimeEnv)
      : evaluate(expr.else, runtimeEnv);
  }
  if (expr.type === "Lam") {
    return (x: RuntimeValue): RuntimeValue => {
      const newRuntimeEnv = runtimeEnv.clone();
      newRuntimeEnv.bind(expr.name, x);
      return evaluate(expr.expr, newRuntimeEnv);
    };
  }
  if (expr.type === "Let" || expr.type === "LetRec") {
    return executeDeclaration(expr, runtimeEnv, false)[0];
  }
  if (expr.type === "LBool") {
    return expr.value;
  }
  if (expr.type === "LInt") {
    return expr.value;
  }
  if (expr.type === "LString") {
    return expr.value;
  }
  if (expr.type === "LTuple") {
    return mkTuple(expr.values.map((v) => evaluate(v, runtimeEnv)));
  }
  if (expr.type === "LUnit") {
    return null;
  }
  if (expr.type === "Match") {
    const e = evaluate(expr.expr, runtimeEnv);

    for (const c of expr.cases) {
      const newEnv = matchPattern(c.pattern, e, runtimeEnv);
      if (newEnv !== null) {
        return evaluate(c.expr, newEnv);
      }
    }
    throw new Error("Match failed");
  }
  if (expr.type === "Op") {
    const left = evaluate(expr.left, runtimeEnv);
    const right = evaluate(expr.right, runtimeEnv);
    return binaryOps.get(expr.op)!(left, right);
  }
  if (expr.type === "Var") {
    return runtimeEnv.get(expr.name);
  }

  return null;
};

const matchPattern = (
  pattern: Pattern,
  value: RuntimeValue,
  runtimeEnv: RuntimeEnv,
): RuntimeEnv | null => {
  if (pattern.type === "PBool") {
    return pattern.value === value ? runtimeEnv : null;
  }
  if (pattern.type === "PInt") {
    return pattern.value === value ? runtimeEnv : null;
  }
  if (pattern.type === "PString") {
    return pattern.value === value ? runtimeEnv : null;
  }
  if (pattern.type === "PVar") {
    const newEnv = runtimeEnv.clone();
    newEnv.bind(pattern.name, value);
    return newEnv;
  }
  if (pattern.type === "PTuple") {
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
  if (pattern.type === "PUnit") {
    return value === null ? runtimeEnv : null;
  }
  if (pattern.type === "PWildcard") {
    return runtimeEnv;
  }
  if (pattern.type === "PCons") {
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
  return null;
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
  const translate = (t: TypeItem): Type => {
    if (t.type === "TypeConstructor") {
      const tc = env.type.data(t.name);
      if (tc === undefined) {
        throw { type: "UnknownDataError", name: t.name };
      }
      if (t.arguments.length !== tc.parameters.length) {
        throw {
          type: "IncorrectTypeArguments",
          name: t.name,
          expected: tc.parameters.length,
          actual: t.arguments.length,
        };
      }

      return new TCon(tc.name, t.arguments.map(translate));
    }
    if (t.type === "TypeVariable") {
      return new TVar(t.name);
    }
    if (t.type === "TypeFunction") {
      return new TArr(translate(t.left), translate(t.right));
    }
    if (t.type === "TypeTuple") {
      return new TTuple(t.values.map(translate));
    }
    if (t.type === "TypeUnit") {
      return typeUnit;
    }

    throw { type: "UnknownTypeItemError", item: t };
  };

  const adts: Array<DataDefinition> = [];

  dd.declarations.forEach((d) => {
    if (env.type.data(d.name) !== undefined) {
      throw { type: "DuplicateDataDeclaration", name: d.name };
    }

    const adt = new DataDefinition(d.name, d.parameters, []);

    env = { ...env, type: env.type.addData(adt) };
  });

  dd.declarations.forEach((d) => {
    const adt = new DataDefinition(
      d.name,
      d.parameters,
      d.constructors.map((c) => new TCon(c.name, c.parameters.map(translate))),
    );

    adts.push(adt);
    const runtimeEnv = env.runtime;
    let typeEnv = env.type.addData(adt);

    const parameters = new Set(adt.parameters);
    const constructorResultType = new TCon(
      adt.name,
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

        imports.forEach(([n, v, t]) => {
          runtime.bind(n, v);
          type = type.extend(n, new Scheme(t.ftv(), t));
        });

        return [null, undefined, { ...env, runtime, type }];
      }
    }

    throw new Error("TODO: Interpreter: Import statement not yet supported");
  } else {
    const pump = createFresh();
    const [constraints, type, newTypeEnv] = inferExpression(
      e,
      env.type,
      new Constraints(),
      pump,
    );
    const subst = constraints.solve();
    const newType = type.apply(subst);

    const [value, newRuntime] = executeExpression(e, env.runtime);

    return [value, newType, { ...env, runtime: newRuntime, type: newTypeEnv }];
  }
};

export const executeProgram = (
  program: Program,
  env: Env,
): [Array<[RuntimeValue, Type | undefined]>, Env] => {
  const results: Array<[RuntimeValue, Type | undefined]> = [];

  program.forEach((e) => {
    const [value, type, newEnv] = executeElement(e, env);
    results.push([value, type]);
    env = newEnv;
  });

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
  if (env !== undefined) {
    return env;
  } else {
    const importPackage: ImportPackage = [];

    const ast = parse(Deno.readTextFileSync(urn));
    const [result, _] = executeProgram(ast, defaultEnv(src));

    ast.forEach((e, i) => {
      if (e.type === "Let" || e.type === "LetRec") {
        const [value, type] = result[i];

        const tt = type as TTuple;

        e.declarations.forEach((d, i2) => {
          if (d.visibility === Visibility.Public) {
            importPackage.push([d.name, value[i2], tt.types[i2]]);
          }
        });
      }
    });

    importEnv[urn] = importPackage;

    return importPackage;
  }
};
