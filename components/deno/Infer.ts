import * as AST from "./Parser.ts";
import { Constraints } from "./Constraints.ts";
import {
  applyArray,
  emptyTypeEnv,
  Pump,
  Scheme,
  Subst,
  TArr,
  TCon,
  TRowEmpty,
  TRowExtend,
  TTuple,
  TVar,
  Type,
  typeBool,
  TypeEnv,
  typeError,
  typeInt,
  typeString,
  typeUnit,
} from "./Typing.ts";
import { emptyImportEnv, ImportEnv } from "./Values.ts";

export type Env = {
  type: TypeEnv;
  imports: ImportEnv;
};

export const emptyEnv = (): Env => ({
  type: emptyTypeEnv,
  imports: emptyImportEnv(),
});

const ops = new Map([
  [AST.Op.Equals, new TArr(typeInt, new TArr(typeInt, typeBool))],
  [AST.Op.Plus, new TArr(typeInt, new TArr(typeInt, typeInt))],
  [AST.Op.Minus, new TArr(typeInt, new TArr(typeInt, typeInt))],
  [AST.Op.Times, new TArr(typeInt, new TArr(typeInt, typeInt))],
  [AST.Op.Divide, new TArr(typeInt, new TArr(typeInt, typeInt))],
]);

export const inferProgram = (
  env: Env,
  program: AST.Program,
  constraints: Constraints,
  pump: Pump,
): [Constraints, Array<Type>, Env] => {
  const types: Array<Type> = [];
  program.forEach((e) => {
    if (e.type === "DataDeclaration") {
      throw new Error("inferProgram: Data declarations not supported yet");
    }

    if (e.type === "TypeAliasDeclarations") {
      throw new Error(
        "inferProgram: Type alias declarations not supported yet",
      );
    }

    if (e.type === "ImportStatement") {
      throw new Error("TODO: inferProgram: Import statement not supported yet");
    }

    const [, tp, newEnv] = inferExpression(e, env, constraints, pump);

    types.push(tp);
    env = newEnv;
  });

  return [constraints, types, env];
};

export const inferExpression = (
  expression: AST.Expression,
  env: Env,
  constraints: Constraints,
  pump: Pump,
): [Constraints, Type, Env] => {
  const fix = (
    env: Env,
    expr: AST.Expression,
    constraints: Constraints,
  ): Type => {
    const [_, t1] = inferExpression(expr, env, constraints, pump);
    const tv = pump.next();

    constraints.add(new TArr(tv, tv), t1);

    return tv;
  };

  const infer = (expr: AST.Expression, env: Env): [Type, Env] => {
    if (expr.type === "App") {
      const [t1] = infer(expr.e1, env);
      const [t2] = infer(expr.e2, env);
      const tv = pump.next();

      constraints.add(t1, new TArr(t2, tv));

      return [tv, env];
    }
    if (expr.type === "Builtin") {
      return [pump.next(), env];
    }
    if (expr.type === "If") {
      const [tg] = infer(expr.guard, env);
      const [tt] = infer(expr.then, env);
      const [et] = infer(expr.else, env);

      constraints.add(tg, typeBool);
      constraints.add(tt, et);

      return [tt, env];
    }
    if (expr.type === "Lam") {
      const tv = expr.name[1] === undefined
        ? pump.next()
        : translateType(expr.name[1], env);
      const [t] = infer(
        expr.expr,
        extend(env, expr.name[0], new Scheme(new Set(), tv)),
      );

      if (expr.returnType !== undefined) {
        constraints.add(t, translateType(expr.returnType, env));
      }

      return [new TArr(tv, t), env];
    }
    if (expr.type === "Let") {
      let newEnv = env;
      const types: Array<Type> = [];

      for (const declaration of expr.declarations) {
        const [nc, tb] = inferExpression(
          declaration.expr,
          newEnv,
          constraints,
          pump,
        );

        const subst = nc.solve(pump);

        newEnv = { ...newEnv, type: newEnv.type.apply(subst) };
        const type = tb.apply(subst);
        types.push(type);
        const sc = newEnv.type.generalise(type);
        newEnv = { ...newEnv, type: newEnv.type.extend(declaration.name, sc) };
      }

      if (expr.expr === undefined) {
        return [new TTuple(types), newEnv];
      } else {
        return [infer(expr.expr, newEnv)[0], env];
      }
    }
    if (expr.type === "LetRec") {
      const tvs = pump.nextN(expr.declarations.length);
      const newEnv = expr.declarations.reduce(
        (acc, declaration, idx) => ({
          ...acc,
          type: acc.type.extend(
            declaration.name,
            new Scheme(new Set(), tvs[idx]),
          ),
        }),
        env,
      );

      const declarationType = fix(
        newEnv,
        {
          type: "Lam",
          name: ["_bob", undefined],
          expr: {
            type: "LTuple",
            values: expr.declarations.map((d) => d.expr),
          },
          returnType: undefined,
        },
        constraints,
      );
      constraints.add(new TTuple(tvs), declarationType);
      const types: Array<Type> = [];

      const subst = constraints.solve(pump);
      const solvedTypeEnv = apply(env, subst);
      const solvedEnv = expr.declarations.reduce(
        (acc, declaration, idx) => {
          const type: Type = tvs[idx].apply(subst);
          types.push(type);

          return extend(
            acc,
            declaration.name,
            solvedTypeEnv.type.generalise(type),
          );
        },
        solvedTypeEnv,
      );

      if (expr.expr === undefined) {
        return [new TTuple(types), solvedEnv];
      } else {
        return [infer(expr.expr, solvedEnv)[0], env];
      }
    }
    if (expr.type === "LBool") {
      return [typeBool, env];
    }
    if (expr.type === "LInt") {
      return [typeInt, env];
    }
    if (expr.type === "LString") {
      return [typeString, env];
    }
    if (expr.type === "LTuple") {
      return [new TTuple(expr.values.map((v) => infer(v, env)[0])), env];
    }
    if (expr.type === "LUnit") {
      return [typeUnit, env];
    }
    if (expr.type === "Match") {
      const [t] = infer(expr.expr, env);
      const tv = pump.next();

      for (const { pattern, expr: pexpr } of expr.cases) {
        const [tp, newEnv] = inferPattern(pattern, env, constraints, pump);
        const [te] = infer(pexpr, newEnv);
        constraints.add(tp, t);
        constraints.add(te, tv);
      }

      return [tv, env];
    }
    if (expr.type === "Op") {
      const [tl] = infer(expr.left, env);
      const [tr] = infer(expr.right, env);
      const tv = pump.next();

      const u1 = new TArr(tl, new TArr(tr, tv));
      const u2 = ops.get(expr.op)!;
      constraints.add(u1, u2);
      return [tv, env];
    }
    if (expr.type === "RecordEmpty") {
      return [new TRowEmpty(), env];
    }
    if (expr.type === "RecordExtend") {
      const [t1] = infer(expr.expr, env);
      const [t2] = infer(expr.rest, env);

      return [new TRowExtend(expr.name, t1, t2), env];
    }
    if (expr.type === "RecordSelect") {
      const [t] = infer(expr.expr, env);
      const t1 = pump.next();
      const t2 = pump.next();

      constraints.add(t, new TRowExtend(expr.name, t1, t2));

      return [t1, env];
    }
    if (expr.type === "Typing") {
      const [t] = infer(expr.expr, env);
      const t1 = translateType(expr.typ, env);
      constraints.add(t, t1);
      return [t, env];
    }
    if (expr.type === "Var") {
      let varEnv: TypeEnv | undefined = env.type;
      if (expr.qualifier !== undefined) {
        varEnv = env.type.import(expr.qualifier);
        if (varEnv === undefined) {
          throw `Unknown qualifier: ${expr.qualifier}`;
        }
      }
      const scheme = varEnv.scheme(expr.name);

      if (scheme === undefined) {
        throw `Unknown name: ${expr.name}`;
      }

      return [scheme.instantiate(pump), env];
    }

    return [typeError, env];
  };

  return [constraints, ...infer(expression, env)];
};

export const inferPattern = (
  pattern: AST.Pattern,
  env: Env,
  constraints: Constraints,
  pump: Pump,
): [Type, Env] => {
  if (pattern.type === "PBool") {
    return [typeBool, env];
  }
  if (pattern.type === "PInt") {
    return [typeInt, env];
  }
  if (pattern.type === "PString") {
    return [typeString, env];
  }
  if (pattern.type === "PTuple") {
    const values: Array<Type> = [];
    let newEnv = env;
    for (const p of pattern.values) {
      const [t, e] = inferPattern(p, newEnv, constraints, pump);
      values.push(t);
      newEnv = e;
    }
    return [new TTuple(values), newEnv];
  }
  if (pattern.type === "PUnit") {
    return [typeUnit, env];
  }
  if (pattern.type === "PRecord") {
    const result: [Type, Env] = pattern.extension === undefined
      ? [new TRowEmpty(), env]
      : inferPattern(pattern.extension, env, constraints, pump);

    for (const [name, p] of pattern.fields) {
      const [t, e] = inferPattern(
        p,
        result[1],
        constraints,
        pump,
      );
      result[0] = new TRowExtend(name, t, result[0]);
      result[1] = e;
    }

    return result;
  }
  if (pattern.type === "PVar") {
    const tv = pump.next();
    return [tv, extend(env, pattern.name, new Scheme(new Set(), tv))];
  }
  if (pattern.type === "PWildcard") {
    return [pump.next(), env];
  }
  if (pattern.type === "PCons") {
    const c = pattern.qualifier === undefined
      ? env.type.findConstructor(pattern.name)
      : env.type.import(pattern.qualifier)?.findConstructor(pattern.name);

    if (c === undefined) {
      throw { type: "UnknownConstructorError", name: pattern.name };
    }

    const [constructor, adt] = c;
    if (constructor.args.length !== pattern.args.length) {
      throw {
        type: "ArityMismatchError",
        constructor: constructor,
        pattern,
      };
    }

    const parameters = pump.nextN(adt.parameters.length);
    const subst = new Subst(new Map(zip(adt.parameters, parameters)));
    const constructorArgTypes = applyArray(subst, constructor.args);

    let newEnv = env;
    pattern.args.forEach((p, i) => {
      const [t, e] = inferPattern(p, newEnv, constraints, pump);
      constraints.add(t, constructorArgTypes[i]);
      newEnv = e;
    });

    return [new TCon(adt, parameters), newEnv];
  }

  return [typeError, env];
};

export const translateType = (t: AST.Type, env: Env): Type => {
  const translate = (t: AST.Type): Type => {
    switch (t.type) {
      case "TypeConstructor": {
        const qualifiedEnv = t.qualifier === undefined
          ? env.type
          : env.type.import(t.qualifier);
        const tc = qualifiedEnv?.data(t.name);
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

        return new TCon(tc, t.arguments.map(translate));
      }
      case "TypeFunction":
        return new TArr(translate(t.left), translate(t.right));
      case "TypeRecord": {
        const f = (acc: Type, field: [string, AST.Type]) =>
          new TRowExtend(field[0], translate(field[1]), acc);
        const initial: Type = t.extension === undefined
          ? new TRowEmpty()
          : translate(t.extension);

        return t.fields.reduceRight(f, initial);
      }
      case "TypeTuple":
        return new TTuple(t.values.map(translate));
      case "TypeUnit":
        return typeUnit;
      case "TypeVariable":
        return new TVar(t.name);
      default:
        throw { type: "UnknownTypeItemError", item: t };
    }
  };

  return translate(t);
};

const apply = (env: Env, s: Subst): Env => ({
  ...env,
  type: env.type.apply(s),
});

const extend = (env: Env, name: string, scheme: Scheme): Env => ({
  ...env,
  type: env.type.extend(name, scheme),
});

const zip = <A, B>(a: Array<A>, b: Array<B>): Array<[A, B]> =>
  a.map((k, i) => [k, b[i]]);
