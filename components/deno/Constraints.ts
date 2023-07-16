import {
  nullSubs,
  Pump,
  Subst,
  TAlias,
  TArr,
  TCon,
  TRowEmpty,
  TRowExtend,
  TTuple,
  TVar,
  Type,
  Var,
} from "./Typing.ts";

type Constraint = [Type, Type];
type Unifier = [Subst, Array<Constraint>];

const emptyUnifier: Unifier = [nullSubs, []];

const bind = (
  name: Var,
  type: Type,
): Unifier => [new Subst(new Map([[name, type]])), []];

const unifies = (t1: Type, t2: Type, pump: Pump): Unifier => {
  // console.log(`unify: ${JSON.stringify(t1, null, 2)} with ${JSON.stringify(t2, null, 2)}`);
  // console.log(`unify: ${t1.toString()} with ${t2.toString()}`);

  if (t1 == t2) return emptyUnifier;
  if (t1 instanceof TVar) return bind(t1.name, t2);
  if (t2 instanceof TVar) return bind(t2.name, t1);
  if (t1 instanceof TArr && t2 instanceof TArr) {
    return unifyMany([t1.domain, t1.range], [t2.domain, t2.range], pump);
  }
  if (t1 instanceof TTuple && t2 instanceof TTuple) {
    return unifyMany(t1.types, t2.types, pump);
  }
  if (t1 instanceof TAlias) {
    return unifies(t1.resolve(), t2, pump);
  }
  if (t2 instanceof TAlias) {
    return unifies(t1, t2.resolve(), pump);
  }
  if (t1 instanceof TRowEmpty && t2 instanceof TRowEmpty) {
    return emptyUnifier;
  }
  if (t1 instanceof TRowExtend) {
    const rewriteRow = (row: Type): [Type, Type] | undefined => {
      if (row instanceof TRowEmpty) {
        throw {
          type: "RowDoesNotContainLabel",
          label: t1.name,
          t1,
          t2,
        };
      }
      if (row instanceof TRowExtend) {
        if (t1.name === row.name) {
          return [row.type, row.row];
        } else {
          const rr = rewriteRow(row.row);
          if (rr === undefined) {
            return undefined;
          }

          const [t2, r2] = rr;
          return [t2, new TRowExtend(row.name, row.type, r2)];
        }
      }

      return undefined;
    };

    const replaceInnerType = (newInner: Type, row: Type): [Type, Type] => {
      if (row instanceof TRowExtend) {
        const [t2, r2] = replaceInnerType(newInner, row.row);
        return [t2, new TRowExtend(row.name, row.type, r2)];
      } else {
        return [row, newInner];
      }
    };

    const rr = rewriteRow(t2);
    if (rr === undefined) {
      const newInner = pump.next();

      const [inner, r2] = replaceInnerType(newInner, t2);
      return unifyMany([new TRowExtend(t1.name, t1.type, newInner), t1.row], [
        inner,
        r2,
      ], pump);
    } else {
      return unifyMany([t1.type, t1.row], [rr[0], rr[1]], pump);
    }
  }
  if (t1 instanceof TCon && t2 instanceof TCon && t1.adt.name === t2.adt.name) {
    if (t1.qualifiedName() === t2.qualifiedName()) {
      return unifyMany(t1.args, t2.args, pump);
    } else {
      throw {
        type: "UnificationMismatch",
        reason: "Types have same name but declared in different packages",
        t1,
        t2,
      };
    }
  }

  throw `Unification Mismatch: ${t1.toString()} -- ${t2.toString()}`;
  // throw `Unification Mismatch: ${JSON.stringify(t1)} ${JSON.stringify(t2)}`;
};

const applyTypes = (s: Subst, ts: Array<Type>): Array<Type> =>
  ts.map((t) => t.apply(s));

const unifyMany = (ta: Array<Type>, tb: Array<Type>, pump: Pump): Unifier => {
  // console.log("unifyMany", ta.map((t) => t.toString()), tb.map((t) => t.toString()));

  if (ta.length === 0 && tb.length === 0) return emptyUnifier;
  if (ta.length === 0 || tb.length === 0) {
    throw `Unification Mismatch: ${ta.toString()} -- ${tb.toString()}`;
    // throw `Unification Mismatch: ${JSON.stringify(ta)} ${JSON.stringify(tb)}`;
  }

  const [t1, ...ts1] = ta;
  const [t2, ...ts2] = tb;

  const [su1, cs1] = unifies(t1, t2, pump);
  const [su2, cs2] = unifyMany(
    applyTypes(su1, ts1),
    applyTypes(su1, ts2),
    pump,
  );

  return [su2.compose(su1), cs1.concat(cs2)];
};

const solver = (constraints: Array<Constraint>, pump: Pump): Subst => {
  let su = nullSubs;
  let cs = [...constraints];

  while (cs.length > 0) {
    const [[t1, t2], ...cs0] = cs;
    const [su1, cs1] = unifies(t1, t2, pump);
    su = su1.compose(su);
    cs = cs1.concat(
      cs0.map(
        (constraint) => [
          constraint[0].apply(su1),
          constraint[1].apply(su1),
        ],
      ),
    );
  }

  return su;
};

export class Constraints {
  constraints: Array<Constraint>;

  constructor(constraints: Array<Constraint> = []) {
    this.constraints = constraints;
  }

  add(t1: Type, t2: Type): void {
    this.constraints.push([t1, t2]);
  }

  solve(pump: Pump): Subst {
    return solver(this.constraints, pump);
  }

  toString(): string {
    return this.constraints.map((a) =>
      `${a[0].toString()} ~ ${a[1].toString()}`
    ).join(", ");
  }

  clone(): Constraints {
    return new Constraints([...this.constraints]);
  }
}
