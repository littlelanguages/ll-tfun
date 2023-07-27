import { Location } from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.1.1/location.ts";
import { SyntaxErrorException } from "./Errors.ts";
import { Src } from "./Src.ts";
import { parseProgram, SyntaxError, Visitor } from "./parser/Parser.ts";
import { Token } from "./parser/Scanner.ts";

export enum Visibility {
  Public,
  Opaque,
  Private,
  None,
}

export type NameLocation = {
  name: string;
  location: Location;
};

export type Program = Array<Element>;

export type Element =
  | Expression
  | DataDeclaration
  | TypeAliasDeclaration
  | ImportStatement;

export type Expression =
  | AppExpression
  | BuiltinExpression
  | IfExpression
  | LamExpression
  | LetExpression
  | LetRecExpression
  | LBoolExpression
  | LIntExpression
  | LRecordExpression
  | LStringExpression
  | LTupleExpression
  | LUnitExpression
  | MatchExpression
  | OpExpression
  | RecordEmptyExpression
  | RecordExtendExpression
  | RecordSelectExpression
  | TypingExpression
  | VarExpression;

export type AppExpression = {
  type: "App";
  e1: Expression;
  e2: Expression;
};

export type BuiltinExpression = {
  type: "Builtin";
  name: string;
};

export type IfExpression = {
  type: "If";
  guard: Expression;
  then: Expression;
  else: Expression;
};

export type LetExpression = {
  type: "Let";
  declarations: Array<Declaration>;
  expr: Expression | undefined;
};

export type LetRecExpression = {
  type: "LetRec";
  declarations: Array<Declaration>;
  expr: Expression | undefined;
};

export type Declaration = {
  type: "Declaration";
  name: string;
  visibility: Visibility;
  expr: Expression;
};

export type LamExpression = {
  type: "Lam";
  name: Parameter;
  expr: Expression;
  returnType: Type | undefined;
};

export type LBoolExpression = {
  type: "LBool";
  value: boolean;
};

export type LIntExpression = {
  type: "LInt";
  value: number;
};

export type LRecordExpression = {
  type: "LRecord";
  fields: Array<[string, Expression]>;
};

export type LStringExpression = {
  type: "LString";
  value: string;
};

export type LTupleExpression = {
  type: "LTuple";
  values: Array<Expression>;
};

export type LUnitExpression = {
  type: "LUnit";
};

export type MatchExpression = {
  type: "Match";
  expr: Expression;
  cases: Array<MatchCase>;
};

export type OpExpression = {
  type: "Op";
  left: Expression;
  op: Op;
  right: Expression;
};

export type RecordEmptyExpression = {
  type: "RecordEmpty";
};

export type RecordExtendExpression = {
  type: "RecordExtend";
  name: string;
  expr: Expression;
  rest: Expression;
};

export type RecordSelectExpression = {
  type: "RecordSelect";
  name: string;
  expr: Expression;
};

export enum Op {
  Equals,
  NotEquals,
  LessThan,
  LessEquals,
  GreaterThan,
  GreaterEquals,
  Plus,
  Minus,
  Times,
  Divide,
}

export type TypingExpression = {
  type: "Typing";
  expr: Expression;
  typ: Type;
};

export type VarExpression = {
  type: "Var";
  qualifier: NameLocation | undefined;
  name: NameLocation;
};

export type MatchCase = {
  pattern: Pattern;
  expr: Expression;
};

export type Parameter = [string, Type | undefined];

export type Pattern =
  | ConsPattern
  | LBoolPattern
  | LIntPattern
  | LStringPattern
  | LTuplePattern
  | LUnitPattern
  | RecordPattern
  | VarPattern
  | WildCardPattern;

export type ConsPattern = {
  type: "PCons";
  qualifier: string | undefined;
  name: string;
  args: Array<Pattern>;
};

export type LBoolPattern = {
  type: "PBool";
  value: boolean;
};

export type LIntPattern = {
  type: "PInt";
  value: number;
};

export type LStringPattern = {
  type: "PString";
  value: string;
};

export type LTuplePattern = {
  type: "PTuple";
  values: Array<Pattern>;
};

export type LUnitPattern = {
  type: "PUnit";
};

export type RecordPattern = {
  type: "PRecord";
  fields: Array<[string, Pattern]>;
  extension: Pattern | undefined;
};

export type VarPattern = {
  type: "PVar";
  name: string;
};

export type WildCardPattern = {
  type: "PWildcard";
};

export type DataDeclaration = {
  type: "DataDeclaration";
  declarations: Array<TypeDeclaration>;
};

export type TypeDeclaration = {
  type: "TypeDeclaration";
  name: string;
  visibility: Visibility;
  parameters: Array<string>;
  constructors: Array<ConstructorDeclaration>;
};

export type ConstructorDeclaration = {
  type: "ConstructorDeclaration";
  name: string;
  parameters: Array<Type>;
};

export type Type =
  | TypeConstructor
  | TypeFunction
  | TypeRecord
  | TypeTuple
  | TypeUnit
  | TypeVariable;

export type TypeVariable = {
  type: "TypeVariable";
  name: string;
};

export type TypeConstructor = {
  type: "TypeConstructor";
  qualifier: string | undefined;
  qualifierLocation: Location | undefined;
  name: string;
  nameLocation: Location;
  arguments: Array<Type>;
};

export type TypeTuple = {
  type: "TypeTuple";
  values: Array<Type>;
};

export type TypeFunction = {
  type: "TypeFunction";
  left: Type;
  right: Type;
};

export type TypeRecord = {
  type: "TypeRecord";
  fields: Array<[string, Type]>;
  extension: Type | undefined;
};

export type TypeUnit = {
  type: "TypeUnit";
};

export type TypeAliasDeclaration = {
  type: "TypeAliasDeclaration";
  name: string;
  visibility: Visibility;
  parameters: Array<string>;
  typ: Type;
};

export type ImportStatement = {
  type: "ImportStatement";
  items: ImportAll | ImportNames;
  from: string;
};

export type ImportAll = {
  type: "ImportAll";
  as: string | undefined;
  visibility: Visibility;
};

export type ImportNames = {
  type: "ImportNames";
  items: Array<ImportName>;
};

export type ImportName = {
  name: string;
  as: string | undefined;
  visibility: Visibility;
};

const stringToOps = new Map<string, Op>([
  ["==", Op.Equals],
  ["/=", Op.NotEquals],
  ["<", Op.LessThan],
  ["<=", Op.LessEquals],
  [">", Op.GreaterThan],
  [">=", Op.GreaterEquals],
  ["+", Op.Plus],
  ["-", Op.Minus],
  ["*", Op.Times],
  ["/", Op.Divide],
]);

export const transformLiteralString = (s: string): string =>
  s.substring(1, s.length - 1).replaceAll('\\"', '"');

export const parse = (src: Src, input: string): Program =>
  parseProgram(input, visitor).either((l: SyntaxError): Program => {
    throw new SyntaxErrorException(src, l.found, l.expected);
  }, (r: Array<Element>): Program => r);

const visitor: Visitor<
  Array<Element>, // T_Program
  Element, // T_Element
  Expression, // T_Expression
  Expression, // T_Relational
  string, // T_RelationalOps
  Expression, // T_Additive
  string, // T_AdditiveOps
  Expression, // T_Multiplicative
  string, // T_MultiplicativeOps
  Expression, // T_Typing
  Expression, // T_Projection
  Expression, // T_Factor
  string, // T_Identifier
  Declaration, // T_ValueDeclaration
  Parameter, // T_Parameter
  MatchCase, // T_Case
  Pattern, // T_Pattern
  DataDeclaration, // T_DataDeclaration
  TypeDeclaration, // T_TypeDeclaration
  ConstructorDeclaration, // T_ConstructorDeclaration
  Type, // T_Type
  Type, // T_ADTType
  Type, // T_TermType
  TypeAliasDeclaration, // T_TypeAliasDeclarations
  TypeAliasDeclaration, // T_TypeAliasDeclaration
  ImportStatement, // T_ImportStatement
  ImportAll | ImportNames, // T_ImportItems
  ImportName // T_ImportItem
> = {
  visitProgram: (
    a1: Expression,
    a2: Array<[Token, Expression]>,
  ): Array<Expression> => [a1].concat(a2.map(([, e]) => e)),

  visitElement1: (a1: Expression): Element => a1,
  visitElement2: (a1: DataDeclaration): Element => a1,
  visitElement3: (a1: TypeAliasDeclaration): Element => a1,
  visitElement4: (a1: ImportStatement): Element => a1,

  visitExpression: (a1: Expression, a2: Array<Expression>): Expression =>
    a2.reduce((acc: Expression, e: Expression): Expression => ({
      type: "App",
      e1: acc,
      e2: e,
    }), a1),

  visitRelational: (
    a1: Expression,
    a2: [string, Expression] | undefined,
  ): Expression =>
    a2 === undefined
      ? a1
      : { type: "Op", left: a1, op: stringToOps.get(a2[0])!, right: a2[1] },

  visitRelationalOps1: (a: Token): string => a[2],
  visitRelationalOps2: (a: Token): string => a[2],
  visitRelationalOps3: (a: Token): string => a[2],
  visitRelationalOps4: (a: Token): string => a[2],
  visitRelationalOps5: (a: Token): string => a[2],
  visitRelationalOps6: (a: Token): string => a[2],

  visitMultiplicative: (
    a1: Expression,
    a2: Array<[string, Expression]>,
  ): Expression =>
    a2 === undefined ? a1 : a2.reduce(
      (acc: Expression, e: [string, Expression]): Expression => ({
        type: "Op",
        left: acc,
        right: e[1],
        op: stringToOps.get(e[0])!,
      }),
      a1,
    ),

  visitMultiplicativeOps1: (a: Token): string => a[2],
  visitMultiplicativeOps2: (a: Token): string => a[2],

  visitAdditive: (
    a1: Expression,
    a2: Array<[string, Expression]>,
  ): Expression =>
    a2 === undefined ? a1 : a2.reduce(
      (acc: Expression, e: [string, Expression]): Expression => ({
        type: "Op",
        left: acc,
        right: e[1],
        op: stringToOps.get(e[0])!,
      }),
      a1,
    ),

  visitAdditiveOps1: (a: Token): string => a[2],
  visitAdditiveOps2: (a: Token): string => a[2],

  visitTyping: (a1: Expression, a2: [Token, Type] | undefined): Expression =>
    a2 === undefined ? a1 : { type: "Typing", expr: a1, typ: a2[1] },

  visitProjection: (a1: Expression, a2: Array<[Token, Token]>): Expression =>
    a2.length === 0 ? a1 : a2.reduce((acc, field) => ({
      type: "RecordSelect",
      expr: acc,
      name: field[1][2],
    }), a1),

  visitFactor1: (
    _a1: Token,
    a2: [Expression, Array<[Token, Expression]>] | undefined,
    _a3: Token,
  ): Expression =>
    a2 === undefined
      ? { type: "LUnit" }
      : a2[1].length === 0
      ? a2[0]
      : { type: "LTuple", values: [a2[0]].concat(a2[1].map(([, e]) => e)) },

  visitFactor2: (a: Token): Expression => ({
    type: "LInt",
    value: parseInt(a[2]),
  }),

  visitFactor3: (a: Token): Expression => ({
    type: "LString",
    value: transformLiteralString(a[2]),
  }),

  visitFactor4: (_a: Token): Expression => ({
    type: "LBool",
    value: true,
  }),

  visitFactor5: (_a: Token): Expression => ({
    type: "LBool",
    value: false,
  }),

  visitFactor6: (
    _a1: Token,
    a2: Parameter,
    a3: Array<Parameter>,
    a4: [Token, Type] | undefined,
    _a5: Token,
    a6: Expression,
  ): Expression =>
    composeLambda([a2].concat(a3), a6, a4 === undefined ? undefined : a4[1]),

  visitFactor7: (
    _a1: Token,
    a2: Token | undefined,
    a3: Declaration,
    a4: Array<[Token, Declaration]>,
    a5: [Token, Expression] | undefined,
  ): Expression => ({
    type: a2 === undefined ? "Let" : "LetRec",
    declarations: [a3].concat(a4.map((a) => a[1])),
    expr: a5 === undefined ? undefined : a5[1],
  }),

  visitFactor8: (
    _a1: Token,
    _a2: Token,
    a3: Expression,
    _a4: Token,
    a5: Expression,
    _a6: Token,
    a7: Expression,
  ): Expression => ({
    type: "If",
    guard: a3,
    then: a5,
    else: a7,
  }),

  visitFactor9: (a1: Token, a2: [Token, string] | undefined): Expression => ({
    type: "Var",
    qualifier: a2 === undefined ? undefined : { name: a1[2], location: a1[1] },
    name: a2 === undefined
      ? { name: a1[2], location: a1[1] }
      : { name: a2[1], location: a2[0][1] },
  }),

  visitFactor10: (a1: Token): Expression => ({
    type: "Var",
    qualifier: undefined,
    name: { name: a1[2], location: a1[1] },
  }),

  visitFactor11: (
    _a1: Token,
    a2: Expression,
    _a3: Token,
    _a4: Token | undefined,
    a5: MatchCase,
    a6: Array<[Token, MatchCase]>,
  ): Expression => ({
    type: "Match",
    expr: a2,
    cases: [a5].concat(a6.map((a) => a[1])),
  }),

  visitFactor12: (
    _a1: Token,
    a2: [
      Token,
      Token,
      Expression,
      Array<[Token, Token, Token, Expression]>,
      [Token, Expression] | undefined,
    ] | undefined,
    _a3: Token,
  ): Expression => {
    if (a2 === undefined) {
      return { type: "RecordEmpty" };
    }

    const field: [Token, Token, Token, Expression] = [
      a2[0],
      a2[0],
      a2[1],
      a2[2],
    ];
    const fields: Array<[Token, Token, Token, Expression]> = [field].concat(
      a2[3],
    );

    return fields.reduceRight((acc, e) => ({
      type: "RecordExtend",
      name: e[1][2],
      expr: e[3],
      rest: acc,
    }), a2[4] === undefined ? { type: "RecordEmpty" } : a2[4][1]);
  },

  visitFactor13: (_a1: Token, a2: Token): Expression => ({
    type: "Builtin",
    name: transformLiteralString(a2[2]),
  }),

  visitIdentifier1: (a: Token): string => a[2],
  visitIdentifier2: (a: Token): string => a[2],

  visitValueDeclaration: (
    a1: Token,
    a2: Token | undefined,
    a3: Array<Parameter>,
    a4: [Token, Type] | undefined,
    _a5: Token,
    a6: Expression,
  ): Declaration => ({
    type: "Declaration",
    name: a1[2],
    visibility: a2 === undefined ? Visibility.None : Visibility.Public,
    expr: composeLambda(a3, a6, a4 === undefined ? undefined : a4[1]),
  }),

  visitParameter1: (a: Token): Parameter => [a[2], undefined],
  visitParameter2: (
    _a1: Token,
    a2: Token,
    _a3: Token,
    a4: Type,
    _a5: Token,
  ): Parameter => [a2[2], a4],

  visitCase: (a1: Pattern, _a2: Token, a3: Expression): MatchCase => ({
    pattern: a1,
    expr: a3,
  }),

  visitPattern1: (
    _a1: Token,
    a2: [Pattern, Array<[Token, Pattern]>] | undefined,
    _a3: Token,
  ): Pattern =>
    a2 === undefined
      ? { type: "PUnit" }
      : a2[1].length === 0
      ? a2[0]
      : { type: "PTuple", values: [a2[0]].concat(a2[1].map(([, e]) => e)) },

  visitPattern2: (a: Token): Pattern => ({
    type: "PInt",
    value: parseInt(a[2]),
  }),

  visitPattern3: (a: Token): Pattern => ({
    type: "PString",
    value: transformLiteralString(a[2]),
  }),

  visitPattern4: (_a: Token): Pattern => ({
    type: "PBool",
    value: true,
  }),

  visitPattern5: (_a: Token): Pattern => ({
    type: "PBool",
    value: false,
  }),

  visitPattern6: (a: Token): Pattern =>
    a[2] === "_" ? { type: "PWildcard" } : {
      type: "PVar",
      name: a[2],
    },

  visitPattern7: (
    a1: Token,
    a2: [Token, Token] | undefined,
    a3: Array<Pattern>,
  ): Pattern => ({
    type: "PCons",
    qualifier: a2 === undefined ? undefined : a1[2],
    name: a2 === undefined ? a1[2] : a2[1][2],
    args: a3,
  }),
  visitPattern8: (
    _a1: Token,
    a2: [
      Token,
      [Token, Pattern] | undefined,
      Array<[Token, Token, [Token, Pattern] | undefined]>,
      [Token, Pattern] | undefined,
    ] | undefined,
    _a3: Token,
  ): Pattern => {
    if (a2 === undefined) {
      return {
        type: "PRecord",
        fields: [],
        extension: undefined,
      };
    }

    const field: [string, Pattern] = [
      a2[0][2],
      a2[1] === undefined ? { type: "PVar", name: a2[0][2] } : a2[1][1],
    ];
    const fields = [field].concat(
      a2[2].map((
        [, a, b],
      ) => [a[2], b === undefined ? { type: "PVar", name: a[2] } : b[1]]),
    );
    const extension = a2[3] === undefined ? undefined : a2[3][1];

    return {
      type: "PRecord",
      fields,
      extension,
    };
  },

  visitDataDeclaration: (
    _a1: Token,
    a2: TypeDeclaration,
    a3: Array<[Token, TypeDeclaration]>,
  ): DataDeclaration => ({
    type: "DataDeclaration",
    declarations: [a2].concat(a3.map((a) => a[1])),
  }),

  visitTypeDeclaration: (
    a1: Token,
    a2: (Token | Token) | undefined,
    a3: Array<Token>,
    _a4: Token,
    a5: ConstructorDeclaration,
    a6: Array<[Token, ConstructorDeclaration]>,
  ): TypeDeclaration => ({
    type: "TypeDeclaration",
    name: a1[2],
    visibility: a2 === undefined
      ? Visibility.Private
      : a2[2] === "*"
      ? Visibility.Public
      : Visibility.Opaque,
    parameters: a3.map((a) => a[2]),
    constructors: [a5].concat(a6.map((a) => a[1])),
  }),

  visitConstructorDeclaration: (
    a1: Token,
    a2: Array<Type>,
  ): ConstructorDeclaration => ({
    type: "ConstructorDeclaration",
    name: a1[2],
    parameters: a2,
  }),

  visitTypeType: (a1: Type, a2: Array<[Token, Type]>): Type =>
    composeFunctionType([a1].concat(a2.map((a) => a[1]))),

  visitADTType1: (
    a1: Token,
    a2: [Token, Token] | undefined,
    a3: Array<(Type | [Token, [Token, Token] | undefined])>,
  ): Type => {
    const mkTypeConstructor = (
      qualifier: string | undefined,
      qualifierLocation: Location | undefined,
      name: string,
      nameLocation: Location,
      args: Array<Type>,
    ): Type => ({
      type: "TypeConstructor",
      qualifier,
      qualifierLocation,
      name,
      nameLocation,
      arguments: args,
    });

    const args: Array<Type> = a3.map((a) =>
      Array.isArray(a)
        ? a[1] === undefined
          ? mkTypeConstructor(undefined, undefined, a[0][2], a[0][1], [])
          : mkTypeConstructor(a[0][2], a[0][1], a[1][0][2], a[1][0][1], [])
        : a
    );

    return mkTypeConstructor(
      a2 === undefined ? undefined : a1[2],
      a2 === undefined ? undefined : a1[1],
      a2 === undefined ? a1[2] : a2[1][2],
      a2 === undefined ? a1[1] : a2[1][1],
      args,
    );
  },
  visitADTType2: (a: Type): Type => a,

  visitTermType1: (a: Token): Type => ({
    type: "TypeVariable",
    name: a[2],
  }),
  visitTermType2: (
    _a1: Token,
    a2: [Type, Array<[Token, Type]>] | undefined,
    _a3: Token,
  ): Type =>
    a2 === undefined ? { type: "TypeUnit" } : a2[1].length === 0 ? a2[0] : {
      type: "TypeTuple",
      values: [a2[0]].concat(a2[1].map(([, e]) => e)),
    },
  visitTermType3: (
    _a1: Token,
    a2: [
      Token,
      Token,
      Type,
      Array<[Token, Token, Token, Type]>,
      [Token, Type] | undefined,
    ] | undefined,
    _a3: Token,
  ): Type => {
    if (a2 === undefined) {
      return {
        type: "TypeRecord",
        fields: [],
        extension: undefined,
      };
    }

    const field: [string, Type] = [a2[0][2], a2[2]];
    const fields = [field].concat(a2[3].map(([, a, , b]) => [a[2], b]));
    const extension = a2[4] === undefined ? undefined : a2[4][1];

    return {
      type: "TypeRecord",
      fields,
      extension,
    };
  },

  visitTypeAliasDeclarations: (
    _a1: Token,
    a2: TypeAliasDeclaration,
  ): TypeAliasDeclaration => a2,

  visitTypeAliasDeclaration: (
    a1: Token,
    a2: (Token | Token) | undefined,
    a3: Array<Token>,
    _a4: Token,
    a5: Type,
  ): TypeAliasDeclaration => ({
    type: "TypeAliasDeclaration",
    name: a1[2],
    visibility: a2 === undefined
      ? Visibility.Private
      : a2[2] === "*"
      ? Visibility.Public
      : Visibility.Opaque,
    parameters: a3.map((a) => a[2]),
    typ: a5,
  }),

  visitImportStatement: (
    _a1: Token,
    a2: ImportAll | ImportNames,
    _a3: Token,
    a4: Token,
  ): ImportStatement => ({
    type: "ImportStatement",
    items: a2,
    from: transformLiteralString(a4[2]),
  }),

  visitImportItems1: (
    _a1: Token,
    a2: [Token, Token] | undefined,
  ): ImportAll | ImportNames => ({
    type: "ImportAll",
    as: a2 === undefined ? undefined : a2[1][2],
    visibility: Visibility.None,
  }),
  visitImportItems2: (
    a1: ImportName,
    a2: [Token, ImportName][],
  ): ImportAll | ImportNames => ({
    type: "ImportNames",
    items: a2 === undefined ? [a1] : [a1].concat(a2.map((i) => i[1])),
  }),

  visitImportItem1: (
    a1: Token,
    a2: (Token | Token) | undefined,
  ): ImportName => ({
    name: a1[2],
    as: undefined,
    visibility: a2 === undefined
      ? Visibility.Private
      : a2[2] === "*"
      ? Visibility.Public
      : Visibility.Opaque,
  }),
  visitImportItem2: (
    a1: Token,
    a2: [Token, Token] | undefined,
    a3: Token | undefined,
  ): ImportName => ({
    name: a1[2],
    as: a2 === undefined ? undefined : a2[1][2],
    visibility: a3 === undefined ? Visibility.None : Visibility.Public,
  }),
};

const composeLambda = (
  names: Array<Parameter>,
  expr: Expression,
  returnType: Type | undefined,
): Expression => {
  if (names.length === 0 && returnType !== undefined) {
    return {
      type: "Typing",
      expr,
      typ: returnType,
    };
  }

  return names.reduceRight((acc, name) => ({
    type: "Lam",
    name,
    expr: acc,
    returnType: expr === acc ? returnType : undefined,
  }), expr);
};

const composeFunctionType = (types: Array<Type>): Type =>
  types.slice(1).reduceRight((acc, type) => ({
    type: "TypeFunction",
    left: acc,
    right: type,
  }), types[0]);

// console.log(JSON.stringify(parse("data List n = Nil | Cons n (List n) ; let compose f g x = f(g x) ; compose"), null, 2));
// console.log(JSON.stringify(parse("let recs a = { x: 1, y: a } ; let y = recs 10 ; y ; y.x.z"), null, 2));
// console.log(JSON.stringify(parse("\\(v: Int) . v"), null, 2));
