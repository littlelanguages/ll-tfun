import { relative } from "https://deno.land/std@0.137.0/path/mod.ts";
import { Src } from "./Src.ts";
import { Token, TToken } from "./parser/Scanner.ts";
import * as Location from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.1.1/location.ts";

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
    return `Duplicate Data Declaration: ${this.name} at ${
      locationToString(this.src, this.location)
    }`;
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
    return `Syntax Error: Expected ${
      commaSeparated(this.expected.map((t) => ttokens.get(t)))
    } but found ${ttokens.get(this.found[0])} at ${
      locationToString(this.src, this.found[1])
    }`;
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
    return `Unknown Data Name: ${this.name} at ${
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
    return `Unknown Name: ${this.name} at ${
      locationToString(this.src, this.location)
    }`;
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
    return `Unknown Qualifier: ${this.name} at ${
      locationToString(this.src, this.location)
    }`;
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
    return `Unknown Type Name: ${this.name} at ${
      locationToString(this.src, this.location)
    }`;
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
  return Location.toString(location, relative(Deno.cwd(), src.urn()));
};

const ttokens = new Map<TToken, string>([
  [TToken.As, "as"],
  [TToken.From, "from"],
  [TToken.Import, "import"],
  [TToken.Type, "type"],
  [TToken.Data, "data"],
  [TToken.DashGreaterThan, "'->'"],
  [TToken.Builtin, "builtin"],
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
  [TToken.LiteralInt, "literal Int"],
  [TToken.LiteralString, "literal String"],
  [TToken.EOS, "end-of-input"],
  [TToken.ERROR, "ERROR"],
]);
