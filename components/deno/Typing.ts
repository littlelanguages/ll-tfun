import * as Sets from "./Set.ts";
import * as Maps from "./Map.ts";
import { home, Src } from "./Src.ts";
import { NameLocation } from "./Parser.ts";
import {
  UnknownDataNameException,
  UnknownQualifierException,
} from "./Errors.ts";
import * as Location from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.1.1/location.ts";

export type Var = string;

export type Position = [Src, Location.Location];

export abstract class Type {
  position: Position | undefined;

  abstract apply(s: Subst): Type;
  abstract ftv(): Set<Var>;

  abstract atPosition(position: Position): Type;

  constructor(position: Position | undefined) {
    this.position = position;
  }

  toScheme(): Scheme {
    return new Scheme([...this.ftv()], this);
  }
}

export class TAlias extends Type {
  name: string;
  args: Array<Type>;
  scheme: Scheme;

  constructor(
    name: string,
    args: Array<Type>,
    scheme: Scheme,
    position: Position | undefined = undefined,
  ) {
    super(position);

    this.name = name;
    this.args = args;
    this.scheme = scheme;
  }

  apply(s: Subst): Type {
    return new TAlias(
      this.name,
      applyArray(s, this.args),
      this.scheme.apply(s),
    );
  }

  ftv(): Set<Var> {
    return Sets.flatUnion(this.args.map((t) => t.ftv()));
  }

  toString(): string {
    return `${this.name}${this.args.length > 0 ? " " : ""}${
      this.args.map((t) =>
        (t instanceof TCon && t.args.length > 0 || t instanceof TArr)
          ? `(${t.toString()})`
          : t.toString()
      ).join(" ")
    }`;
  }

  resolve(): Type {
    const bindings = new Map(
      this.scheme.names.map((n, i) => [n, this.args[i]]),
    );

    return this.scheme.type.apply(new Subst(bindings));
  }

  atPosition(position: Position): Type {
    return new TAlias(this.name, this.args, this.scheme, position);
  }
}

export class TArr extends Type {
  domain: Type;
  range: Type;

  constructor(
    domain: Type,
    range: Type,
    position: Position | undefined = undefined,
  ) {
    super(position);
    this.domain = domain;
    this.range = range;
  }

  apply(s: Subst): Type {
    return new TArr(this.domain.apply(s), this.range.apply(s));
  }

  ftv(): Set<Var> {
    return new Set([...this.domain.ftv(), ...this.range.ftv()]);
  }

  toString(): string {
    if (this.domain instanceof TArr) {
      return `(${this.domain}) -> ${this.range}`;
    } else {
      return `${this.domain} -> ${this.range}`;
    }
  }

  atPosition(position: Position): Type {
    return new TArr(this.domain, this.range, position);
  }
}

export class TCon extends Type {
  adt: DataDefinition;
  args: Array<Type>;

  constructor(
    adt: DataDefinition,
    args: Array<Type> = [],
    position: Position | undefined = undefined,
  ) {
    super(position);
    this.adt = adt;
    this.args = args;
  }

  apply(s: Subst): Type {
    if (this.args.length === 0) {
      return this;
    }

    return new TCon(this.adt, applyArray(s, this.args));
  }

  ftv(): Set<Var> {
    return Sets.flatUnion(this.args.map((t) => t.ftv()));
  }

  toString(): string {
    return `${this.adt.name}${this.args.length > 0 ? " " : ""}${
      this.args.map((t) =>
        (t instanceof TCon && t.args.length > 0 || t instanceof TArr)
          ? `(${t.toString()})`
          : t.toString()
      ).join(" ")
    }`;
  }

  qualifiedName(): string {
    return `${this.adt.src.urn()}#${this.adt.name}`;
  }

  atPosition(position: Position): Type {
    return new TCon(this.adt, this.args, position);
  }
}

export class TRowEmpty extends Type {
  constructor(position: Position | undefined = undefined) {
    super(position);
  }

  apply(_s: Subst): Type {
    return this;
  }

  ftv(): Set<Var> {
    return new Set();
  }

  toString(): string {
    return "{}";
  }

  atPosition(position: Position): Type {
    return new TRowEmpty(position);
  }
}

export class TRowExtend extends Type {
  name: string;
  type: Type;
  row: Type;

  constructor(
    name: string,
    type: Type,
    row: Type,
    position: Position | undefined = undefined,
  ) {
    super(position);
    this.name = name;
    this.type = type;
    this.row = row;
  }

  apply(s: Subst): Type {
    return new TRowExtend(this.name, this.type.apply(s), this.row.apply(s));
  }

  ftv(): Set<Var> {
    return new Set([...this.type.ftv(), ...this.row.ftv()]);
  }

  toString(): string {
    const items = [];

    items.push("{ ");

    let isFirst = true;
    // deno-lint-ignore no-this-alias
    let item: Type = this;
    while (item instanceof TRowExtend) {
      if (isFirst) {
        isFirst = false;
      } else {
        items.push(", ");
      }

      items.push(`${item.name}: ${item.type}`);
      item = item.row;
    }

    if (!(item instanceof TRowEmpty)) {
      items.push(" | ");
      items.push(item.toString());
    }
    items.push(" }");

    return items.join("");
  }

  atPosition(position: Position): Type {
    return new TRowExtend(this.name, this.type, this.row, position);
  }
}

export class TTuple extends Type {
  types: Type[];

  constructor(types: Type[], position: Position | undefined = undefined) {
    super(position);
    this.types = types;
  }

  apply(s: Subst): Type {
    return new TTuple(applyArray(s, this.types));
  }

  ftv(): Set<Var> {
    return new Set(this.types.flatMap((t) => [...t.ftv()]));
  }

  toString(): string {
    return `(${this.types.join(" * ")})`;
  }

  atPosition(position: Position): Type {
    return new TTuple(this.types, position);
  }
}

export class TVar extends Type {
  name: Var;

  constructor(name: Var, position: Position | undefined = undefined) {
    super(position);
    this.name = name;
  }

  apply(s: Subst): Type {
    return s.get(this.name) || this;
  }

  ftv(): Set<Var> {
    return new Set([this.name]);
  }

  toString(): string {
    return this.name;
  }

  atPosition(position: Position): Type {
    return new TVar(this.name, position);
  }
}

export class Subst {
  protected items: Map<Var, Type>;

  constructor(items: Map<Var, Type>) {
    this.items = items;
  }

  compose(s: Subst): Subst {
    return new Subst(
      Maps.union(Maps.map(s.items, (v) => v.apply(this)), this.items),
    );
  }

  get(v: Var): Type | undefined {
    return this.items.get(v);
  }

  entries(): Array<[Var, Type]> {
    return [...this.items.entries()];
  }

  remove(names: Set<Var>): Subst {
    return new Subst(Maps.removeKeys(this.items, names));
  }
}

export const nullSubs = new Subst(new Map());

export class Scheme {
  names: Array<Var>;
  type: Type;

  constructor(names: Array<Var>, type: Type) {
    this.names = names;
    this.type = type;
  }

  apply(s: Subst): Scheme {
    return new Scheme(
      this.names,
      this.type.apply(s.remove(new Set(this.names))),
    );
  }

  ftv(): Set<Var> {
    return Sets.difference(this.type.ftv(), new Set(this.names));
  }

  instantiate(pump: Pump): Type {
    const subst = new Subst(
      new Map([...this.names].map((n) => [n, pump.next()])),
    );

    return this.type.apply(subst);
  }

  toString(): string {
    return `${
      this.names.length == 0 ? "" : `∀ ${this.names.join(", ")}. `
    }${this.type}`;
  }
}

export const applyArray = (s: Subst, ts: Array<Type>): Array<Type> =>
  ts.map((t) => t.apply(s));

interface DataConstructor {
  name: string;
  args: Array<Type>;
}

export class DataDefinition {
  src: Src;
  name: string;
  parameters: Array<string>;
  constructors: Array<DataConstructor>;

  constructor(
    src: Src,
    name: string,
    parameters: Array<string>,
    constructors: Array<DataConstructor>,
  ) {
    this.src = src;
    this.name = name;
    this.parameters = parameters;
    this.constructors = constructors;
  }

  addConstructor(name: string, args: Array<Type>): DataConstructor {
    const c = { name, args };
    this.constructors.push(c);
    return c;
  }

  toString(): string {
    return `${this.name}${this.parameters.length > 0 ? " " : ""}${
      this.parameters.join(" ")
    } = ${
      this.constructors.map((c) =>
        [c.name].concat(c.args.map((a) =>
          (a instanceof TCon && a.args.length > 0 || a instanceof TArr)
            ? `(${a.toString()})`
            : a.toString()
        )).join(" ")
      ).join(" | ")
    }`;
  }

  instantiate(pump: Pump | undefined = undefined): Type {
    return new TCon(this, this.parameters.map(() => pump!.next()));
  }

  instantiateWith(): Type {
    return new TCon(this, this.parameters.map((p) => new TVar(p)));
  }
}

export class TypeEnv {
  private values: Map<string, Scheme>;
  private adts: Array<DataDefinition>;
  private _aliases: Map<string, Scheme>;
  private imports: Map<string, TypeEnv>;

  constructor(
    values: Map<string, Scheme>,
    adts: Array<DataDefinition>,
    aliases: Map<string, Scheme>,
    imports: Map<string, TypeEnv>,
  ) {
    this.values = values;
    this.adts = adts;
    this.imports = imports;
    this._aliases = aliases;
  }

  combine(other: TypeEnv): TypeEnv {
    return new TypeEnv(
      Maps.union(this.values, other.values),
      [
        ...this.adts,
        ...other.adts,
      ],
      Maps.union(this._aliases, other._aliases),
      Maps.union(this.imports, other.imports),
    );
  }

  extend(name: string, scheme: Scheme): TypeEnv {
    const result = Maps.clone(this.values);

    result.set(name, scheme);

    return new TypeEnv(result, this.adts, this._aliases, this.imports);
  }

  addData(adt: DataDefinition): TypeEnv {
    const adts = [adt, ...this.adts.filter((a) => a.name !== adt.name)];

    return new TypeEnv(this.values, adts, this._aliases, this.imports);
  }

  addImport(name: string, env: TypeEnv): TypeEnv {
    const imports = new Map(this.imports);
    imports.set(name, env);

    return new TypeEnv(this.values, this.adts, this._aliases, imports);
  }

  addAlias(name: string, type: Scheme): TypeEnv {
    const aliases = new Map(this._aliases);
    aliases.set(name, type);

    return new TypeEnv(this.values, this.adts, aliases, this.imports);
  }

  getConstructor(
    src: Src,
    name: NameLocation,
  ): [DataConstructor, DataDefinition] {
    for (const adt of this.adts) {
      for (const constructor of adt.constructors) {
        if (constructor.name === name.name) {
          return [constructor, adt];
        }
      }
    }

    throw new UnknownDataNameException(src, name.name, name.location);
  }

  findAlias(name: string): Scheme | undefined {
    return this._aliases.get(name);
  }

  apply(s: Subst): TypeEnv {
    return new TypeEnv(
      Maps.map(this.values, (scheme) => scheme.apply(s)),
      this.adts,
      this._aliases,
      this.imports,
    );
  }

  ftv(): Set<Var> {
    return Sets.flatUnion([...this.values.values()].map((v) => v.ftv()));
  }

  scheme(name: string): Scheme | undefined {
    return this.values.get(name);
  }

  aliases(): Array<string> {
    return [...this._aliases.keys()];
  }

  data(name: string): DataDefinition | undefined {
    return this.adts.find((a) => a.name === name);
  }

  datas(): Array<DataDefinition> {
    return this.adts;
  }

  getImport(src: Src, name: NameLocation): TypeEnv {
    const result = this.imports.get(name.name);

    if (result === undefined) {
      throw new UnknownQualifierException(src, name.name, name.location);
    } else {
      return result;
    }
  }

  generalise(t: Type): Scheme {
    return new Scheme([...Sets.difference(t.ftv(), this.ftv())], t);
  }
}

export const emptyTypeEnv = new TypeEnv(new Map(), [], new Map(), new Map())
  .addData(new DataDefinition(home, "Bool", [], []))
  .addData(new DataDefinition(home, "Error", [], []))
  .addData(new DataDefinition(home, "Int", [], []))
  .addData(new DataDefinition(home, "String", [], []))
  .addData(new DataDefinition(home, "()", [], []));

export type Pump = { next: () => TVar; nextN: (n: number) => Array<TVar> };

export const createFresh = (): Pump => {
  let count = 0;

  return {
    next: (): TVar => new TVar("V" + ++count),
    nextN: (n: number): Array<TVar> =>
      Array(n).fill(0).map(() => new TVar("V" + ++count)),
  };
};

export const renameTypeVariables = (types: Array<Type>): Array<Type> => {
  let i = 0;

  const nextVar = (): string => {
    if (i < 26) {
      return String.fromCharCode(97 + i++);
    } else {
      return `t${i++}`;
    }
  };

  const vars = Sets.flatUnion(types.map((t) => t.ftv()));

  const subst = new Subst(
    new Map([...vars].map((v) => [v, new TVar(nextVar())])),
  );
  return types.map((t) => t.apply(subst));
};

export const typeBool = emptyTypeEnv.data("Bool")!.instantiate();
export const typeError = emptyTypeEnv.data("Error")!.instantiate();
export const typeInt = emptyTypeEnv.data("Int")!.instantiate();
export const typeString = emptyTypeEnv.data("String")!.instantiate();
export const typeUnit = emptyTypeEnv.data("()")!.instantiate();
