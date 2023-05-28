import {
  nullSubs,
  Subst,
  TArr,
  TCon,
  TRecord,
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

const unifies = (t1: Type, t2: Type): Unifier => {
  if (t1 == t2) return emptyUnifier;
  if (t1 instanceof TVar) return bind(t1.name, t2);
  if (t2 instanceof TVar) return bind(t2.name, t1);
  if (t1 instanceof TArr && t2 instanceof TArr) {
    return unifyMany([t1.domain, t1.range], [t2.domain, t2.range]);
  }
  if (t1 instanceof TTuple && t2 instanceof TTuple) {
    return unifyMany(t1.types, t2.types);
  }
  if (t1 instanceof TCon && t2 instanceof TCon && t1.adt.name === t2.adt.name) {
    if (t1.qualifiedName() === t2.qualifiedName()) {
      return unifyMany(t1.args, t2.args);
    } else {
      throw {
        type: "UnificationMismatch",
        reason: "Types have same name but declared in different packages",
        t1,
        t2,
      };
    }
  }
  if (t1 instanceof TRecord && t2 instanceof TRecord) {
    if (t1.open && t2.open) {
      const t2Fields = new Map(t2.fields);
      const t1Types: Array<Type> = [];
      const t2Types: Array<Type> = [];

      for (const [name, t1Type] of t1.fields) {
        if (t2Fields.has(name)) {
          t1Types.push(t1Type);
          t2Types.push(t2Fields.get(name)!);
        }
      }
      return unifyMany(t1Types, t2Types);
    }
    if (t1.open && !t2.open) {
      const t2Fields = new Map(t2.fields);
      const t1Types: Array<Type> = [];
      const t2Types: Array<Type> = [];

      for (const [name, t1Type] of t1.fields) {
        if (t2Fields.has(name)) {
          t1Types.push(t1Type);
          t2Types.push(t2Fields.get(name)!);
        } else {
          throw {
            type: "UnificationMismatch",
            reason: "Record types have different fields",
            t1,
            t2,
          };
        }
      }

      return unifyMany(t1Types, t2Types);
    }

    if (!t1.open && t2.open) {
      const t1Fields = new Map(t1.fields);
      const t1Types: Array<Type> = [];
      const t2Types: Array<Type> = [];

      for (const [name, t2Type] of t2.fields) {
        if (t1Fields.has(name)) {
          t1Types.push(t1Fields.get(name)!);
          t2Types.push(t2Type);
        } else {
          throw {
            type: "UnificationMismatch",
            reason: "Record types have different fields",
            t1,
            t2,
          };
        }
      }

      return unifyMany(t1Types, t2Types);
    }
    if (!t1.open && !t2.open) {
      if (t1.fields.length !== t2.fields.length) {
        throw {
          type: "UnificationMismatch",
          reason: "Record types have different fields",
          t1,
          t2,
        };
      }

      const t2Fields = new Map(t2.fields);
      const t1Types: Array<Type> = [];
      const t2Types: Array<Type> = [];

      for (const [name, t1Type] of t1.fields) {
        if (t2Fields.has(name)) {
          t1Types.push(t1Type);
          t2Types.push(t2Fields.get(name)!);
        } else {
          throw {
            type: "UnificationMismatch",
            reason: "Record types have different fields",
            t1,
            t2,
          };
        }
      }

      return unifyMany(t1Types, t2Types);
    }
  }

  throw `Unification Mismatch: ${JSON.stringify(t1)} ${JSON.stringify(t2)}`;
};

const applyTypes = (s: Subst, ts: Array<Type>): Array<Type> =>
  ts.map((t) => t.apply(s));

const unifyMany = (ta: Array<Type>, tb: Array<Type>): Unifier => {
  if (ta.length === 0 && tb.length === 0) return emptyUnifier;
  if (ta.length === 0 || tb.length === 0) {
    throw `Unification Mismatch: ${JSON.stringify(ta)} ${JSON.stringify(tb)}`;
  }

  const [t1, ...ts1] = ta;
  const [t2, ...ts2] = tb;

  const [su1, cs1] = unifies(t1, t2);
  const [su2, cs2] = unifyMany(applyTypes(su1, ts1), applyTypes(su1, ts2));

  return [su2.compose(su1), cs1.concat(cs2)];
};

const solver = (constraints: Array<Constraint>): Subst => {
  let su = nullSubs;
  let cs = [...constraints];

  while (cs.length > 0) {
    const [[t1, t2], ...cs0] = cs;
    const [su1, cs1] = unifies(t1, t2);
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

  solve(): Subst {
    return solver(this.constraints);
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
