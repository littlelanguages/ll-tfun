import * as AST from "./Parser.ts";
import { Constraints } from "./Constraints.ts";
import {
  applyArray,
  emptyTypeEnv,
  Position,
  Pump,
  Scheme,
  Subst,
  TAlias,
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
import { Src } from "./Src.ts";
import {
  ArityMismatchException,
  UnknownDataNameException,
  UnknownNameException,
  UnknownTypeNameException,
} from "./Errors.ts";
import * as Location from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.1.1/location.ts";

const arbLocation = Location.mkCoordinate(0, 0, 0);

export type Env = {
  type: TypeEnv;
  src: Src;
  imports: ImportEnv;
};

export const emptyEnv = (src: Src): Env => ({
  type: emptyTypeEnv,
  src,
  imports: emptyImportEnv(),
});

const ops = new Map([
  [AST.Op.LessThan, new TArr(typeInt, new TArr(typeInt, typeBool))],
  [AST.Op.LessEquals, new TArr(typeInt, new TArr(typeInt, typeBool))],
  [AST.Op.GreaterThan, new TArr(typeInt, new TArr(typeInt, typeBool))],
  [AST.Op.GreaterEquals, new TArr(typeInt, new TArr(typeInt, typeBool))],
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

    if (e.type === "TypeAliasDeclaration") {
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
    const positionAt: Position = [env.src, expr.location];
    const position = (t: Type): Type => t.atPosition(positionAt);

    switch (expr.type) {
      case "App": {
        const [t1] = infer(expr.e1, env);
        const [t2] = infer(expr.e2, env);
        const tv = position(pump.next());

        constraints.add(t1, new TArr(t2, tv));

        return [tv, env];
      }
      case "Builtin":
        return [position(pump.next()), env];
      case "If": {
        const [tg] = infer(expr.guard, env);
        const [tt] = infer(expr.then, env);
        const [et] = infer(expr.else, env);

        constraints.add(tg, typeBool);
        constraints.add(tt, et);

        return [position(tt), env];
      }
      case "Lam": {
        const tv = expr.name.typ === undefined
          ? pump.next().atPosition([env.src, expr.name.name.location])
          : translateType(expr.name.typ, env);
        const [t] = infer(
          expr.expr,
          extend(env, expr.name.name.name, new Scheme([], tv)),
        );

        if (expr.returnType === undefined) {
          return [position(new TArr(tv, t)), env];
        } else {
          const returnType = translateType(expr.returnType, env);

          constraints.add(t, returnType);
          return [new TArr(tv, returnType, positionAt), env];
        }
      }
      case "Let": {
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
          newEnv = {
            ...newEnv,
            type: newEnv.type.extend(declaration.name, sc),
          };
        }

        if (expr.expr === undefined) {
          return [
            new TTuple(types, positionAt),
            newEnv,
          ];
        } else {
          return [infer(expr.expr, newEnv)[0], env];
        }
      }
      case "LetRec": {
        const tvs = pump.nextN(expr.declarations.length);
        const newEnv = expr.declarations.reduce(
          (acc, declaration, idx) => ({
            ...acc,
            type: acc.type.extend(
              declaration.name,
              new Scheme([], tvs[idx]),
            ),
          }),
          env,
        );

        const declarationType = fix(
          newEnv,
          {
            type: "Lam",
            name: {
              name: { name: "_bob", location: arbLocation },
              typ: undefined,
            },
            expr: {
              type: "LTuple",
              values: expr.declarations.map((d) => d.expr),
              location: arbLocation,
            },
            returnType: undefined,
            location: arbLocation,
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
          return [new TTuple(types, positionAt), solvedEnv];
        } else {
          return [infer(expr.expr, solvedEnv)[0], env];
        }
      }
      case "LBool":
        return [position(typeBool), env];
      case "LInt":
        return [position(typeInt), env];
      case "LString":
        return [position(typeString), env];
      case "LTuple":
        return [
          new TTuple(expr.values.map((v) => infer(v, env)[0]), positionAt),
          env,
        ];
      case "LUnit":
        return [position(typeUnit), env];
      case "Match": {
        const [t] = infer(expr.expr, env);
        const tv = position(pump.next());

        for (const { pattern, expr: pexpr } of expr.cases) {
          const [tp, newEnv] = inferPattern(pattern, env, constraints, pump);
          const [te] = infer(pexpr, newEnv);
          constraints.add(tp, t);
          constraints.add(te, tv);
        }

        return [tv, env];
      }
      case "Op": {
        const [tl] = infer(expr.left, env);
        const [tr] = infer(expr.right, env);
        const tv = position(pump.next());

        if (expr.op === AST.Op.PipeRight) {
          constraints.add(tr, new TArr(tl, tv, positionAt));

          return [tv, env];
        } else {
          const u1 = new TArr(tl, new TArr(tr, tv));
          if (expr.op === AST.Op.Equals || expr.op === AST.Op.NotEquals) {
            constraints.add(tl, tr);
            constraints.add(tv, typeBool);
          } else {
            const u2 = ops.get(expr.op)!;
            constraints.add(u1, u2);
          }
          return [tv, env];
        }
      }
      case "RecordEmpty":
        return [new TRowEmpty(positionAt), env];
      case "RecordExtend": {
        const [t1] = infer(expr.expr, env);
        const [t2] = infer(expr.rest, env);

        return [new TRowExtend(expr.name, t1, t2, positionAt), env];
      }
      case "RecordSelect": {
        const [t] = infer(expr.expr, env);
        const t1 = position(pump.next());
        const t2 = position(pump.next());

        constraints.add(t, new TRowExtend(expr.name, t1, t2));

        return [t1, env];
      }
      case "Typing": {
        const [t] = infer(expr.expr, env);
        const t1 = translateType(expr.typ, env);
        constraints.add(t, t1);
        return [t1, env];
      }
      case "Var": {
        let varEnv: TypeEnv = env.type;
        if (expr.qualifier !== undefined) {
          varEnv = env.type.getImport(env.src, expr.qualifier);
        }
        const scheme = varEnv.scheme(expr.name.name);

        if (scheme === undefined) {
          throw new UnknownNameException(
            env.src,
            expr.name.name,
            expr.name.location,
          );
        }

        return [position(scheme.instantiate(pump)), env];
      }
      default:
        return [position(typeError), env];
    }
  };

  return [constraints, ...infer(expression, env)];
};

export const inferPattern = (
  pattern: AST.Pattern,
  env: Env,
  constraints: Constraints,
  pump: Pump,
): [Type, Env] => {
  const positionAt: Position = [env.src, pattern.location];
  const position = (t: Type): Type => t.atPosition(positionAt);

  switch (pattern.type) {
    case "PBool":
      return [position(typeBool), env];
    case "PCons": {
      const [constructor, adt] = pattern.qualifier === undefined
        ? env.type.getConstructor(env.src, pattern.name)
        : env.type.getImport(env.src, pattern.qualifier).getConstructor(
          env.src,
          pattern.name,
        );

      if (constructor.args.length !== pattern.args.length) {
        throw new ArityMismatchException(
          env.src,
          pattern.name.name,
          pattern.args.length,
          constructor.args.length,
          pattern.name.location,
        );
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

      return [new TCon(adt, parameters, positionAt), newEnv];
    }
    case "PInt":
      return [typeInt, env];
    case "PRecord": {
      const result: [Type, Env] = pattern.extension === undefined
        ? [new TRowEmpty(positionAt), env]
        : inferPattern(pattern.extension, env, constraints, pump);

      for (const [name, p] of pattern.fields) {
        const [t, e] = inferPattern(p, result[1], constraints, pump);
        result[0] = new TRowExtend(name, t, result[0]);
        result[1] = e;
      }

      return result;
    }
    case "PString":
      return [position(typeString), env];
    case "PTuple": {
      const values: Array<Type> = [];
      let newEnv = env;
      for (const p of pattern.values) {
        const [t, e] = inferPattern(p, newEnv, constraints, pump);
        values.push(t);
        newEnv = e;
      }
      return [new TTuple(values, positionAt), newEnv];
    }
    case "PUnit":
      return [position(typeUnit), env];
    case "PVar": {
      const tv = position(pump.next());
      return [tv, extend(env, pattern.name, new Scheme([], tv))];
    }
    case "PWildcard":
      return [position(pump.next()), env];
    default:
      return [position(typeError), env];
  }
};

export const translateType = (
  t: AST.Type,
  env: Env,
  parameters: Set<string> | undefined = undefined,
): Type => {
  const translate = (t: AST.Type): Type => {
    const positionAt: Position = [env.src, t.location];
    const position = (t: Type): Type => t.atPosition(positionAt);

    switch (t.type) {
      case "TypeConstructor": {
        const qualifiedEnv = t.qualifier === undefined
          ? env.type
          : env.type.getImport(env.src, {
            name: t.qualifier,
            location: t.qualifierLocation!,
          });
        const tc = qualifiedEnv.data(t.name);
        if (tc === undefined) {
          const aliasType = qualifiedEnv.findAlias(t.name);
          if (aliasType === undefined) {
            throw new UnknownDataNameException(env.src, t.name, t.nameLocation);
          } else if (aliasType.names.length !== t.arguments.length) {
            throw new ArityMismatchException(
              env.src,
              t.name,
              t.arguments.length,
              aliasType.names.length,
              t.nameLocation,
            );
          } else {
            return new TAlias(
              t.name,
              t.arguments.map(translate),
              aliasType,
              positionAt,
            );
          }
        }
        if (t.arguments.length !== tc.parameters.length) {
          throw new ArityMismatchException(
            env.src,
            t.name,
            t.arguments.length,
            tc.parameters.length,
            t.nameLocation,
          );
        }

        return new TCon(tc, t.arguments.map(translate), positionAt);
      }
      case "TypeFunction":
        return new TArr(translate(t.left), translate(t.right), positionAt);
      case "TypeRecord": {
        const f = (acc: Type, field: [string, AST.Type]) => {
          const field1 = translate(field[1]);
          return new TRowExtend(field[0], field1, acc, [
            env.src,
            t.location,
          ]);
        };
        const initial: Type = t.extension === undefined
          ? new TRowEmpty(positionAt)
          : translate(t.extension);

        return t.fields.reduceRight(f, initial);
      }
      case "TypeTuple":
        return new TTuple(t.values.map(translate), positionAt);
      case "TypeUnit":
        return position(typeUnit);
      case "TypeVariable":
        if (parameters !== undefined && !parameters.has(t.name.name)) {
          throw new UnknownTypeNameException(
            env.src,
            t.name.name,
            t.name.location,
          );
        }

        return new TVar(t.name.name, positionAt);
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
