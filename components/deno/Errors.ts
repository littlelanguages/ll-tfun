import * as Path from "https://deno.land/std@0.137.0/path/mod.ts";
import { Src } from "./Src.ts";
import { Token, TToken } from "./parser/Scanner.ts";
import * as Location from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.1.1/location.ts";
import { renameTypeVariables, Type } from "./Typing.ts";

export class ArityMismatchException extends Error {
  src: Src;
  name: string;
  supplied: number;
  expected: number;
  location: Location.Location;

  constructor(src: Src, name: string, supplied: number, expected: number, location: Location.Location) {
    super();
    this.src = src;
    this.name = name;
    this.supplied = supplied;
    this.expected = expected;
    this.location = location;
  }

  toString(): string {
    return `Arity Mismatch: ${this.name} supplied with ${this.supplied} argument${
      this.supplied === 1 ? "" : "s"
    } but expected ${this.expected} at ${locationToString(this.src, this.location)}`;
  }
}

export class CyclicImportException extends Error {
  src: Src;
  name: string;
  location: Location.Location;

  constructor(src: Src, name: string, location: Location.Location) {
    super();
    this.src = src;
    this.name = name;
    this.location = location;
  }

  toString(): string {
    return `Cyclic Import: ${this.name} at ${locationToString(this.src, this.location)}`;
  }
}

export class DuplicateDataDeclarationException extends Error {
  src: Src;
  name: string;
  location: Location.Location;

  constructor(src: Src, name: string, location: Location.Location) {
    super();
    this.src = src;
    this.name = name;
    this.location = location;
  }

  toString(): string {
    return `Duplicate Data Declaration: ${this.name} at ${locationToString(this.src, this.location)}`;
  }
}

export class ImportNameAlreadyDeclaredException extends Error {
  src: Src;
  name: string;
  location: Location.Location;

  constructor(src: Src, name: string, location: Location.Location) {
    super();
    this.src = src;
    this.name = name;
    this.location = location;
  }

  toString(): string {
    return `Import Name Already Declared: ${this.name} at ${locationToString(this.src, this.location)}`;
  }
}

export class FileNotFoundException extends Error {
  src: Src;
  name: string;
  location: Location.Location;

  constructor(src: Src, name: string, location: Location.Location) {
    super();
    this.src = src;
    this.name = name;
    this.location = location;
  }

  toString(): string {
    const path = Path.relative(
      Path.dirname(this.src.urn()),
      Path.dirname(this.name),
    );
    let r: string;

    if (path.startsWith(".") || path.startsWith("/")) {
      r = path + "/";
    } else if (path === "") {
      r = "./";
    } else {
      r = "./" + path + "/";
    }

    return `File Not Found: ${r + Path.basename(this.name)} at ${locationToString(this.src, this.location)}`;
  }
}

export class GeneralException extends Error {
  message: string;
  // deno-lint-ignore no-explicit-any
  object: any;

  // deno-lint-ignore no-explicit-any
  constructor(message: string, object: any) {
    super();
    this.message = message;
    this.object = object;
  }

  toString(): string {
    return `General Exception: ${this.message}: ${JSON.stringify(this.object, null, 0)}`;
  }
}

export class UnknownLabelException extends Error {
  label: string;
  type1: Type;
  type2: Type;

  constructor(label: string, type1: Type, type2: Type) {
    super();

    this.label = label;
    this.type1 = type1;
    this.type2 = type2;
  }

  toString(): string {
    return `Unknown Label: ${this.label} in ${this.type1.toString()} -- ${this.type2.toString()}`;
  }
}

export class SyntaxErrorException extends Error {
  src: Src;
  found: Token;
  expected: Array<TToken>;

  constructor(src: Src, found: Token, expected: Array<TToken>) {
    super();

    this.src = src;
    this.found = found;
    this.expected = expected;
  }

  toString(): string {
    return `Syntax Error: Expected ${commaSeparated(this.expected.map((t) => ttokens.get(t)))} but found ${
      ttokens.get(this.found[0])
    } at ${locationToString(this.src, this.found[1])}`;
  }
}

export class UnificationMismatchException extends Error {
  type1: Type;
  type2: Type;

  constructor(type1: Type, type2: Type) {
    super();

    this.type1 = type1;
    this.type2 = type2;
  }

  toString(): string {
    const renderTypePosition = (type: Type): string => {
      if (type.position === undefined) {
        return type.toString();
      } else {
        return `${type.toString()} at ${
          locationToString(
            type.position[0],
            type.position[1],
          )
        }`;
      }
    };

    const [t1, t2] = renameTypeVariables([this.type1, this.type2]);
    if (
      t1.position !== undefined && t2.position !== undefined &&
      t1.position[0] === t2.position[0]
    ) {
      return `Unification Mismatch: ${t1.toString()} ${Location.toString(t1.position[1])} and ${t2.toString()} ${
        Location.toString(t2.position[1])
      } from ${Path.relative(Deno.cwd(), t1.position[0].urn())}`;
    } else {
      return `Unification Mismatch: ${renderTypePosition(t1)} and ${renderTypePosition(t2)}`;
    }
  }
}

export class UnificationMismatchesException extends Error {
  type1: Array<Type>;
  type2: Array<Type>;

  constructor(type1: Array<Type>, type2: Array<Type>) {
    super();

    this.type1 = type1;
    this.type2 = type2;
  }

  toString(): string {
    return `Unification Mismatch: ${this.type1.toString()} -- ${this.type2.toString()}`;
  }
}

export class UnknownDataNameException extends Error {
  src: Src;
  name: string;
  location: Location.Location;

  constructor(src: Src, name: string, location: Location.Location) {
    super();
    this.src = src;
    this.name = name;
    this.location = location;
  }

  toString(): string {
    return `Unknown Data Name: ${this.name} at ${locationToString(this.src, this.location)}`;
  }
}

export class UnknownImportNameException extends Error {
  src: Src;
  name: string;
  location: Location.Location;
  available: Array<string>;

  constructor(src: Src, name: string, location: Location.Location, available: Array<string>) {
    super();
    this.src = src;
    this.name = name;
    this.location = location;
    this.available = available;
  }

  toString(): string {
    if (this.available.length === 0) {
      return `Unknown Import Name: ${this.name} at ${locationToString(this.src, this.location)}`;
    }

    return `Unknown Import Name: ${this.name} not one of ${commaSeparated(this.available)} at ${
      locationToString(this.src, this.location)
    }`;
  }
}

export class UnknownNameException extends Error {
  src: Src;
  name: string;
  location: Location.Location;

  constructor(src: Src, name: string, location: Location.Location) {
    super();
    this.src = src;
    this.name = name;
    this.location = location;
  }

  toString(): string {
    return `Unknown Name: ${this.name} at ${locationToString(this.src, this.location)}`;
  }
}

export class UnknownQualifierException extends Error {
  src: Src;
  name: string;
  location: Location.Location;

  constructor(src: Src, name: string, location: Location.Location) {
    super();

    this.src = src;
    this.name = name;
    this.location = location;
  }

  toString(): string {
    return `Unknown Qualifier: ${this.name} at ${locationToString(this.src, this.location)}`;
  }
}

export class UnknownTypeNameException extends Error {
  src: Src;
  name: string;
  location: Location.Location;

  constructor(src: Src, name: string, location: Location.Location) {
    super();
    this.src = src;
    this.name = name;
    this.location = location;
  }

  toString(): string {
    return `Unknown Type Name: ${this.name} at ${locationToString(this.src, this.location)}`;
  }
}

// deno-lint-ignore no-explicit-any
const commaSeparated = (items: Array<any>): string => {
  if (items.length === 0) {
    return "";
  } else if (items.length === 1) {
    return items[0].toString();
  } else if (items.length === 2) {
    return `${items[0]} or ${items[1]}`;
  } else {
    return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`;
  }
};

const locationToString = (src: Src, location: Location.Location): string => {
  return Location.toString(location, Path.relative(Deno.cwd(), src.urn()));
};

const ttokens = new Map<TToken, string>([
  [TToken.As, "as"],
  [TToken.From, "from"],
  [TToken.Import, "import"],
  [TToken.Type, "type"],
  [TToken.Data, "data"],
  [TToken.DashGreaterThan, "'->'"],
  [TToken.Builtin, "builtin"],
  [TToken.RBracket, "']'"],
  [TToken.LBracket, "'['"],
  [TToken.RCurly, "'}'"],
  [TToken.LCurly, "'{'"],
  [TToken.Bar, "'|'"],
  [TToken.With, "with"],
  [TToken.Match, "match"],
  [TToken.Else, "else"],
  [TToken.If, "if"],
  [TToken.In, "in"],
  [TToken.And, "and"],
  [TToken.Rec, "rec"],
  [TToken.Let, "let"],
  [TToken.Equal, "'='"],
  [TToken.Backslash, "'\\'"],
  [TToken.False, "False"],
  [TToken.True, "True"],
  [TToken.RParen, "')'"],
  [TToken.Comma, "','"],
  [TToken.LParen, "'('"],
  [TToken.Period, "'.'"],
  [TToken.Colon, "':'"],
  [TToken.Slash, "'/'"],
  [TToken.Star, "'*'"],
  [TToken.Dash, "'-'"],
  [TToken.Plus, "'+'"],
  [TToken.GreaterThanEqual, "'>='"],
  [TToken.GreaterThan, "'>'"],
  [TToken.LessThanEqual, "'<='"],
  [TToken.LessThan, "'<'"],
  [TToken.SlashEqual, "'/='"],
  [TToken.EqualEqual, "'=='"],
  [TToken.Semicolon, "';'"],
  [TToken.UpperIdentifier, "Upper Identifier"],
  [TToken.LowerIdentifier, "Lower Identifier"],
  [TToken.LiteralChar, "literal Char"],
  [TToken.LiteralInt, "literal Int"],
  [TToken.LiteralString, "literal String"],
  [TToken.EOS, "end-of-input"],
  [TToken.ERROR, "ERROR"],
]);
