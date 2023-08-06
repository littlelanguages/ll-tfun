import {
  Either,
  left,
  right,
} from "https://raw.githubusercontent.com/littlelanguages/deno-lib-data-either/0.1.2/mod.ts";
import { mkScanner, Scanner, Token, TToken } from "./Scanner.ts";

export interface Visitor<
  T_Program,
  T_Element,
  T_Expression,
  T_BooleanOr,
  T_BooleanAnd,
  T_Equality,
  T_EqualityOps,
  T_AppendCons,
  T_AppendConsOps,
  T_Additive,
  T_AdditiveOps,
  T_Multiplicative,
  T_MultiplicativeOps,
  T_Apply,
  T_Typing,
  T_Projection,
  T_Factor,
  T_Identifier,
  T_ValueDeclaration,
  T_Parameter,
  T_Case,
  T_Pattern,
  T_PatternTerm,
  T_DataDeclaration,
  T_TypeDeclaration,
  T_ConstructorDeclaration,
  T_TypeType,
  T_ADTType,
  T_TermType,
  T_TypeAliasDeclarations,
  T_TypeAliasDeclaration,
  T_ImportStatement,
  T_ImportItems,
  T_ImportItem,
> {
  visitProgram(a1: T_Element, a2: Array<[Token, T_Element]>): T_Program;
  visitElement1(a: T_Expression): T_Element;
  visitElement2(a: T_DataDeclaration): T_Element;
  visitElement3(a: T_TypeAliasDeclarations): T_Element;
  visitElement4(a: T_ImportStatement): T_Element;
  visitExpression(
    a1: T_BooleanOr,
    a2: Array<[Token, T_BooleanOr]>,
  ): T_Expression;
  visitBooleanOr(
    a1: T_BooleanAnd,
    a2: Array<[Token, T_BooleanAnd]>,
  ): T_BooleanOr;
  visitBooleanAnd(a1: T_Equality, a2: Array<[Token, T_Equality]>): T_BooleanAnd;
  visitEquality(
    a1: T_AppendCons,
    a2: [T_EqualityOps, T_AppendCons] | undefined,
  ): T_Equality;
  visitEqualityOps1(a: Token): T_EqualityOps;
  visitEqualityOps2(a: Token): T_EqualityOps;
  visitEqualityOps3(a: Token): T_EqualityOps;
  visitEqualityOps4(a: Token): T_EqualityOps;
  visitEqualityOps5(a: Token): T_EqualityOps;
  visitEqualityOps6(a: Token): T_EqualityOps;
  visitAppendCons(
    a1: T_Additive,
    a2: Array<[T_AppendConsOps, T_Additive]>,
  ): T_AppendCons;
  visitAppendConsOps1(a: Token): T_AppendConsOps;
  visitAppendConsOps2(a: Token): T_AppendConsOps;
  visitAdditive(
    a1: T_Multiplicative,
    a2: Array<[T_AdditiveOps, T_Multiplicative]>,
  ): T_Additive;
  visitAdditiveOps1(a: Token): T_AdditiveOps;
  visitAdditiveOps2(a: Token): T_AdditiveOps;
  visitMultiplicative(
    a1: T_Apply,
    a2: Array<[T_MultiplicativeOps, T_Apply]>,
  ): T_Multiplicative;
  visitMultiplicativeOps1(a: Token): T_MultiplicativeOps;
  visitMultiplicativeOps2(a: Token): T_MultiplicativeOps;
  visitApply(a1: T_Typing, a2: Array<T_Typing>): T_Apply;
  visitTyping(a1: T_Projection, a2: [Token, T_TypeType] | undefined): T_Typing;
  visitProjection(a1: T_Factor, a2: Array<[Token, Token]>): T_Projection;
  visitFactor1(
    a1: Token,
    a2: [T_Expression, Array<[Token, T_Expression]>] | undefined,
    a3: Token,
  ): T_Factor;
  visitFactor2(a: Token): T_Factor;
  visitFactor3(a: Token): T_Factor;
  visitFactor4(a: Token): T_Factor;
  visitFactor5(a: Token): T_Factor;
  visitFactor6(a: Token): T_Factor;
  visitFactor7(
    a1: Token,
    a2: T_Parameter,
    a3: Array<T_Parameter>,
    a4: [Token, T_TypeType] | undefined,
    a5: Token,
    a6: T_Expression,
  ): T_Factor;
  visitFactor8(
    a1: Token,
    a2: Token | undefined,
    a3: T_ValueDeclaration,
    a4: Array<[Token, T_ValueDeclaration]>,
    a5: [Token, T_Expression] | undefined,
  ): T_Factor;
  visitFactor9(
    a1: Token,
    a2: Token,
    a3: T_Expression,
    a4: Token,
    a5: T_Expression,
    a6: Token,
    a7: T_Expression,
  ): T_Factor;
  visitFactor10(a1: Token, a2: [Token, T_Identifier] | undefined): T_Factor;
  visitFactor11(a: Token): T_Factor;
  visitFactor12(
    a1: Token,
    a2: T_Expression,
    a3: Token,
    a4: Token | undefined,
    a5: T_Case,
    a6: Array<[Token, T_Case]>,
  ): T_Factor;
  visitFactor13(
    a1: Token,
    a2: [T_Expression, Array<[Token, T_Expression]>] | undefined,
    a3: Token,
  ): T_Factor;
  visitFactor14(
    a1: Token,
    a2: [
      Token,
      Token,
      T_Expression,
      Array<[Token, Token, Token, T_Expression]>,
      [Token, T_Expression] | undefined,
    ] | undefined,
    a3: Token,
  ): T_Factor;
  visitFactor15(a1: Token, a2: Token): T_Factor;
  visitIdentifier1(a: Token): T_Identifier;
  visitIdentifier2(a: Token): T_Identifier;
  visitValueDeclaration(
    a1: Token,
    a2: Token | undefined,
    a3: Array<T_Parameter>,
    a4: [Token, T_TypeType] | undefined,
    a5: Token,
    a6: T_Expression,
  ): T_ValueDeclaration;
  visitParameter1(a: Token): T_Parameter;
  visitParameter2(
    a1: Token,
    a2: Token,
    a3: Token,
    a4: T_TypeType,
    a5: Token,
  ): T_Parameter;
  visitCase(a1: T_Pattern, a2: Token, a3: T_Expression): T_Case;
  visitPattern(a1: T_PatternTerm, a2: Array<[Token, T_PatternTerm]>): T_Pattern;
  visitPatternTerm1(
    a1: Token,
    a2: [T_Pattern, Array<[Token, T_Pattern]>] | undefined,
    a3: Token,
  ): T_PatternTerm;
  visitPatternTerm2(a: Token): T_PatternTerm;
  visitPatternTerm3(a: Token): T_PatternTerm;
  visitPatternTerm4(a: Token): T_PatternTerm;
  visitPatternTerm5(a: Token): T_PatternTerm;
  visitPatternTerm6(a: Token): T_PatternTerm;
  visitPatternTerm7(a: Token): T_PatternTerm;
  visitPatternTerm8(
    a1: Token,
    a2: [Token, Token] | undefined,
    a3: Array<T_Pattern>,
  ): T_PatternTerm;
  visitPatternTerm9(
    a1: Token,
    a2: [T_Pattern, Array<[Token, T_Pattern]>] | undefined,
    a3: Token,
  ): T_PatternTerm;
  visitPatternTerm10(
    a1: Token,
    a2: [
      Token,
      [Token, T_Pattern] | undefined,
      Array<[Token, Token, [Token, T_Pattern] | undefined]>,
      [Token, T_Pattern] | undefined,
    ] | undefined,
    a3: Token,
  ): T_PatternTerm;
  visitDataDeclaration(
    a1: Token,
    a2: T_TypeDeclaration,
    a3: Array<[Token, T_TypeDeclaration]>,
  ): T_DataDeclaration;
  visitTypeDeclaration(
    a1: Token,
    a2: (Token | Token) | undefined,
    a3: Array<Token>,
    a4: Token,
    a5: T_ConstructorDeclaration,
    a6: Array<[Token, T_ConstructorDeclaration]>,
  ): T_TypeDeclaration;
  visitConstructorDeclaration(
    a1: Token,
    a2: Array<T_TypeType>,
  ): T_ConstructorDeclaration;
  visitTypeType(a1: T_ADTType, a2: Array<[Token, T_ADTType]>): T_TypeType;
  visitADTType1(
    a1: Token,
    a2: [Token, Token] | undefined,
    a3: Array<(T_TermType | [Token, [Token, Token] | undefined])>,
  ): T_ADTType;
  visitADTType2(a: T_TermType): T_ADTType;
  visitTermType1(a: Token): T_TermType;
  visitTermType2(
    a1: Token,
    a2: [T_TypeType, Array<[Token, T_TypeType]>] | undefined,
    a3: Token,
  ): T_TermType;
  visitTermType3(
    a1: Token,
    a2: [
      Token,
      Token,
      T_TypeType,
      Array<[Token, Token, Token, T_TypeType]>,
      [Token, T_TypeType] | undefined,
    ] | undefined,
    a3: Token,
  ): T_TermType;
  visitTypeAliasDeclarations(
    a1: Token,
    a2: T_TypeAliasDeclaration,
  ): T_TypeAliasDeclarations;
  visitTypeAliasDeclaration(
    a1: Token,
    a2: (Token | Token) | undefined,
    a3: Array<Token>,
    a4: Token,
    a5: T_TypeType,
  ): T_TypeAliasDeclaration;
  visitImportStatement(
    a1: Token,
    a2: T_ImportItems,
    a3: Token,
    a4: Token,
  ): T_ImportStatement;
  visitImportItems1(a1: Token, a2: [Token, Token] | undefined): T_ImportItems;
  visitImportItems2(
    a1: T_ImportItem,
    a2: Array<[Token, T_ImportItem]>,
  ): T_ImportItems;
  visitImportItem1(a1: Token, a2: (Token | Token) | undefined): T_ImportItem;
  visitImportItem2(
    a1: Token,
    a2: [Token, Token] | undefined,
    a3: Token | undefined,
  ): T_ImportItem;
}

export const parseProgram = <
  T_Program,
  T_Element,
  T_Expression,
  T_BooleanOr,
  T_BooleanAnd,
  T_Equality,
  T_EqualityOps,
  T_AppendCons,
  T_AppendConsOps,
  T_Additive,
  T_AdditiveOps,
  T_Multiplicative,
  T_MultiplicativeOps,
  T_Apply,
  T_Typing,
  T_Projection,
  T_Factor,
  T_Identifier,
  T_ValueDeclaration,
  T_Parameter,
  T_Case,
  T_Pattern,
  T_PatternTerm,
  T_DataDeclaration,
  T_TypeDeclaration,
  T_ConstructorDeclaration,
  T_TypeType,
  T_ADTType,
  T_TermType,
  T_TypeAliasDeclarations,
  T_TypeAliasDeclaration,
  T_ImportStatement,
  T_ImportItems,
  T_ImportItem,
>(
  input: string,
  visitor: Visitor<
    T_Program,
    T_Element,
    T_Expression,
    T_BooleanOr,
    T_BooleanAnd,
    T_Equality,
    T_EqualityOps,
    T_AppendCons,
    T_AppendConsOps,
    T_Additive,
    T_AdditiveOps,
    T_Multiplicative,
    T_MultiplicativeOps,
    T_Apply,
    T_Typing,
    T_Projection,
    T_Factor,
    T_Identifier,
    T_ValueDeclaration,
    T_Parameter,
    T_Case,
    T_Pattern,
    T_PatternTerm,
    T_DataDeclaration,
    T_TypeDeclaration,
    T_ConstructorDeclaration,
    T_TypeType,
    T_ADTType,
    T_TermType,
    T_TypeAliasDeclarations,
    T_TypeAliasDeclaration,
    T_ImportStatement,
    T_ImportItems,
    T_ImportItem
  >,
): Either<SyntaxError, T_Program> => {
  try {
    return right(mkParser(mkScanner(input), visitor).program());
  } catch (e) {
    return left(e);
  }
};

export const mkParser = <
  T_Program,
  T_Element,
  T_Expression,
  T_BooleanOr,
  T_BooleanAnd,
  T_Equality,
  T_EqualityOps,
  T_AppendCons,
  T_AppendConsOps,
  T_Additive,
  T_AdditiveOps,
  T_Multiplicative,
  T_MultiplicativeOps,
  T_Apply,
  T_Typing,
  T_Projection,
  T_Factor,
  T_Identifier,
  T_ValueDeclaration,
  T_Parameter,
  T_Case,
  T_Pattern,
  T_PatternTerm,
  T_DataDeclaration,
  T_TypeDeclaration,
  T_ConstructorDeclaration,
  T_TypeType,
  T_ADTType,
  T_TermType,
  T_TypeAliasDeclarations,
  T_TypeAliasDeclaration,
  T_ImportStatement,
  T_ImportItems,
  T_ImportItem,
>(
  scanner: Scanner,
  visitor: Visitor<
    T_Program,
    T_Element,
    T_Expression,
    T_BooleanOr,
    T_BooleanAnd,
    T_Equality,
    T_EqualityOps,
    T_AppendCons,
    T_AppendConsOps,
    T_Additive,
    T_AdditiveOps,
    T_Multiplicative,
    T_MultiplicativeOps,
    T_Apply,
    T_Typing,
    T_Projection,
    T_Factor,
    T_Identifier,
    T_ValueDeclaration,
    T_Parameter,
    T_Case,
    T_Pattern,
    T_PatternTerm,
    T_DataDeclaration,
    T_TypeDeclaration,
    T_ConstructorDeclaration,
    T_TypeType,
    T_ADTType,
    T_TermType,
    T_TypeAliasDeclarations,
    T_TypeAliasDeclaration,
    T_ImportStatement,
    T_ImportItems,
    T_ImportItem
  >,
) => {
  const matchToken = (ttoken: TToken): Token => {
    if (isToken(ttoken)) {
      return nextToken();
    } else {
      throw {
        tag: "SyntaxError",
        found: scanner.current(),
        expected: [ttoken],
      };
    }
  };

  const isToken = (ttoken: TToken): boolean => currentToken() === ttoken;

  const isTokens = (ttokens: Array<TToken>): boolean => ttokens.includes(currentToken());

  const currentToken = (): TToken => scanner.current()[0];

  const nextToken = (): Token => {
    const result = scanner.current();
    scanner.next();
    return result;
  };

  return {
    program: function (): T_Program {
      const a1: T_Element = this.element();
      const a2: Array<[Token, T_Element]> = [];

      while (isToken(TToken.Semicolon)) {
        const a2t1: Token = matchToken(TToken.Semicolon);
        const a2t2: T_Element = this.element();
        const a2t: [Token, T_Element] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitProgram(a1, a2);
    },
    element: function (): T_Element {
      if (
        isTokens([
          TToken.LParen,
          TToken.LiteralInt,
          TToken.LiteralString,
          TToken.LiteralChar,
          TToken.True,
          TToken.False,
          TToken.Backslash,
          TToken.Let,
          TToken.If,
          TToken.UpperIdentifier,
          TToken.LowerIdentifier,
          TToken.Match,
          TToken.LBracket,
          TToken.LCurly,
          TToken.Builtin,
        ])
      ) {
        return visitor.visitElement1(this.expression());
      } else if (isToken(TToken.Data)) {
        return visitor.visitElement2(this.dataDeclaration());
      } else if (isToken(TToken.Type)) {
        return visitor.visitElement3(this.typeAliasDeclarations());
      } else if (isToken(TToken.Import)) {
        return visitor.visitElement4(this.importStatement());
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [
            TToken.LParen,
            TToken.LiteralInt,
            TToken.LiteralString,
            TToken.LiteralChar,
            TToken.True,
            TToken.False,
            TToken.Backslash,
            TToken.Let,
            TToken.If,
            TToken.UpperIdentifier,
            TToken.LowerIdentifier,
            TToken.Match,
            TToken.LBracket,
            TToken.LCurly,
            TToken.Builtin,
            TToken.Data,
            TToken.Type,
            TToken.Import,
          ],
        };
      }
    },
    expression: function (): T_Expression {
      const a1: T_BooleanOr = this.booleanOr();
      const a2: Array<[Token, T_BooleanOr]> = [];

      while (isToken(TToken.BarGreaterThan)) {
        const a2t1: Token = matchToken(TToken.BarGreaterThan);
        const a2t2: T_BooleanOr = this.booleanOr();
        const a2t: [Token, T_BooleanOr] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitExpression(a1, a2);
    },
    booleanOr: function (): T_BooleanOr {
      const a1: T_BooleanAnd = this.booleanAnd();
      const a2: Array<[Token, T_BooleanAnd]> = [];

      while (isToken(TToken.BarBar)) {
        const a2t1: Token = matchToken(TToken.BarBar);
        const a2t2: T_BooleanAnd = this.booleanAnd();
        const a2t: [Token, T_BooleanAnd] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitBooleanOr(a1, a2);
    },
    booleanAnd: function (): T_BooleanAnd {
      const a1: T_Equality = this.equality();
      const a2: Array<[Token, T_Equality]> = [];

      while (isToken(TToken.AmpersandAmpersand)) {
        const a2t1: Token = matchToken(TToken.AmpersandAmpersand);
        const a2t2: T_Equality = this.equality();
        const a2t: [Token, T_Equality] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitBooleanAnd(a1, a2);
    },
    equality: function (): T_Equality {
      const a1: T_AppendCons = this.appendCons();
      let a2: [T_EqualityOps, T_AppendCons] | undefined = undefined;

      if (
        isTokens([
          TToken.EqualEqual,
          TToken.SlashEqual,
          TToken.LessThan,
          TToken.LessThanEqual,
          TToken.GreaterThan,
          TToken.GreaterThanEqual,
        ])
      ) {
        const a2t1: T_EqualityOps = this.equalityOps();
        const a2t2: T_AppendCons = this.appendCons();
        const a2t: [T_EqualityOps, T_AppendCons] = [a2t1, a2t2];
        a2 = a2t;
      }
      return visitor.visitEquality(a1, a2);
    },
    equalityOps: function (): T_EqualityOps {
      if (isToken(TToken.EqualEqual)) {
        return visitor.visitEqualityOps1(matchToken(TToken.EqualEqual));
      } else if (isToken(TToken.SlashEqual)) {
        return visitor.visitEqualityOps2(matchToken(TToken.SlashEqual));
      } else if (isToken(TToken.LessThan)) {
        return visitor.visitEqualityOps3(matchToken(TToken.LessThan));
      } else if (isToken(TToken.LessThanEqual)) {
        return visitor.visitEqualityOps4(matchToken(TToken.LessThanEqual));
      } else if (isToken(TToken.GreaterThan)) {
        return visitor.visitEqualityOps5(matchToken(TToken.GreaterThan));
      } else if (isToken(TToken.GreaterThanEqual)) {
        return visitor.visitEqualityOps6(matchToken(TToken.GreaterThanEqual));
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [
            TToken.EqualEqual,
            TToken.SlashEqual,
            TToken.LessThan,
            TToken.LessThanEqual,
            TToken.GreaterThan,
            TToken.GreaterThanEqual,
          ],
        };
      }
    },
    appendCons: function (): T_AppendCons {
      const a1: T_Additive = this.additive();
      const a2: Array<[T_AppendConsOps, T_Additive]> = [];

      while (isTokens([TToken.ColonColon, TToken.PlusPlus])) {
        const a2t1: T_AppendConsOps = this.appendConsOps();
        const a2t2: T_Additive = this.additive();
        const a2t: [T_AppendConsOps, T_Additive] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitAppendCons(a1, a2);
    },
    appendConsOps: function (): T_AppendConsOps {
      if (isToken(TToken.ColonColon)) {
        return visitor.visitAppendConsOps1(matchToken(TToken.ColonColon));
      } else if (isToken(TToken.PlusPlus)) {
        return visitor.visitAppendConsOps2(matchToken(TToken.PlusPlus));
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.ColonColon, TToken.PlusPlus],
        };
      }
    },
    additive: function (): T_Additive {
      const a1: T_Multiplicative = this.multiplicative();
      const a2: Array<[T_AdditiveOps, T_Multiplicative]> = [];

      while (isTokens([TToken.Plus, TToken.Dash])) {
        const a2t1: T_AdditiveOps = this.additiveOps();
        const a2t2: T_Multiplicative = this.multiplicative();
        const a2t: [T_AdditiveOps, T_Multiplicative] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitAdditive(a1, a2);
    },
    additiveOps: function (): T_AdditiveOps {
      if (isToken(TToken.Plus)) {
        return visitor.visitAdditiveOps1(matchToken(TToken.Plus));
      } else if (isToken(TToken.Dash)) {
        return visitor.visitAdditiveOps2(matchToken(TToken.Dash));
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.Plus, TToken.Dash],
        };
      }
    },
    multiplicative: function (): T_Multiplicative {
      const a1: T_Apply = this.apply();
      const a2: Array<[T_MultiplicativeOps, T_Apply]> = [];

      while (isTokens([TToken.Star, TToken.Slash])) {
        const a2t1: T_MultiplicativeOps = this.multiplicativeOps();
        const a2t2: T_Apply = this.apply();
        const a2t: [T_MultiplicativeOps, T_Apply] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitMultiplicative(a1, a2);
    },
    multiplicativeOps: function (): T_MultiplicativeOps {
      if (isToken(TToken.Star)) {
        return visitor.visitMultiplicativeOps1(matchToken(TToken.Star));
      } else if (isToken(TToken.Slash)) {
        return visitor.visitMultiplicativeOps2(matchToken(TToken.Slash));
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.Star, TToken.Slash],
        };
      }
    },
    apply: function (): T_Apply {
      const a1: T_Typing = this.typing();
      const a2: Array<T_Typing> = [];

      while (
        isTokens([
          TToken.LParen,
          TToken.LiteralInt,
          TToken.LiteralString,
          TToken.LiteralChar,
          TToken.True,
          TToken.False,
          TToken.Backslash,
          TToken.Let,
          TToken.If,
          TToken.UpperIdentifier,
          TToken.LowerIdentifier,
          TToken.Match,
          TToken.LBracket,
          TToken.LCurly,
          TToken.Builtin,
        ])
      ) {
        const a2t: T_Typing = this.typing();
        a2.push(a2t);
      }
      return visitor.visitApply(a1, a2);
    },
    typing: function (): T_Typing {
      const a1: T_Projection = this.projection();
      let a2: [Token, T_TypeType] | undefined = undefined;

      if (isToken(TToken.Colon)) {
        const a2t1: Token = matchToken(TToken.Colon);
        const a2t2: T_TypeType = this.typeType();
        const a2t: [Token, T_TypeType] = [a2t1, a2t2];
        a2 = a2t;
      }
      return visitor.visitTyping(a1, a2);
    },
    projection: function (): T_Projection {
      const a1: T_Factor = this.factor();
      const a2: Array<[Token, Token]> = [];

      while (isToken(TToken.Period)) {
        const a2t1: Token = matchToken(TToken.Period);
        const a2t2: Token = matchToken(TToken.LowerIdentifier);
        const a2t: [Token, Token] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitProjection(a1, a2);
    },
    factor: function (): T_Factor {
      if (isToken(TToken.LParen)) {
        const a1: Token = matchToken(TToken.LParen);
        let a2: [T_Expression, Array<[Token, T_Expression]>] | undefined = undefined;

        if (
          isTokens([
            TToken.LParen,
            TToken.LiteralInt,
            TToken.LiteralString,
            TToken.LiteralChar,
            TToken.True,
            TToken.False,
            TToken.Backslash,
            TToken.Let,
            TToken.If,
            TToken.UpperIdentifier,
            TToken.LowerIdentifier,
            TToken.Match,
            TToken.LBracket,
            TToken.LCurly,
            TToken.Builtin,
          ])
        ) {
          const a2t1: T_Expression = this.expression();
          const a2t2: Array<[Token, T_Expression]> = [];

          while (isToken(TToken.Comma)) {
            const a2t2t1: Token = matchToken(TToken.Comma);
            const a2t2t2: T_Expression = this.expression();
            const a2t2t: [Token, T_Expression] = [a2t2t1, a2t2t2];
            a2t2.push(a2t2t);
          }
          const a2t: [T_Expression, Array<[Token, T_Expression]>] = [
            a2t1,
            a2t2,
          ];
          a2 = a2t;
        }
        const a3: Token = matchToken(TToken.RParen);
        return visitor.visitFactor1(a1, a2, a3);
      } else if (isToken(TToken.LiteralInt)) {
        return visitor.visitFactor2(matchToken(TToken.LiteralInt));
      } else if (isToken(TToken.LiteralString)) {
        return visitor.visitFactor3(matchToken(TToken.LiteralString));
      } else if (isToken(TToken.LiteralChar)) {
        return visitor.visitFactor4(matchToken(TToken.LiteralChar));
      } else if (isToken(TToken.True)) {
        return visitor.visitFactor5(matchToken(TToken.True));
      } else if (isToken(TToken.False)) {
        return visitor.visitFactor6(matchToken(TToken.False));
      } else if (isToken(TToken.Backslash)) {
        const a1: Token = matchToken(TToken.Backslash);
        const a2: T_Parameter = this.parameter();
        const a3: Array<T_Parameter> = [];

        while (isTokens([TToken.LowerIdentifier, TToken.LParen])) {
          const a3t: T_Parameter = this.parameter();
          a3.push(a3t);
        }
        let a4: [Token, T_TypeType] | undefined = undefined;

        if (isToken(TToken.Colon)) {
          const a4t1: Token = matchToken(TToken.Colon);
          const a4t2: T_TypeType = this.typeType();
          const a4t: [Token, T_TypeType] = [a4t1, a4t2];
          a4 = a4t;
        }
        const a5: Token = matchToken(TToken.Equal);
        const a6: T_Expression = this.expression();
        return visitor.visitFactor7(a1, a2, a3, a4, a5, a6);
      } else if (isToken(TToken.Let)) {
        const a1: Token = matchToken(TToken.Let);
        let a2: Token | undefined = undefined;

        if (isToken(TToken.Rec)) {
          const a2t: Token = matchToken(TToken.Rec);
          a2 = a2t;
        }
        const a3: T_ValueDeclaration = this.valueDeclaration();
        const a4: Array<[Token, T_ValueDeclaration]> = [];

        while (isToken(TToken.And)) {
          const a4t1: Token = matchToken(TToken.And);
          const a4t2: T_ValueDeclaration = this.valueDeclaration();
          const a4t: [Token, T_ValueDeclaration] = [a4t1, a4t2];
          a4.push(a4t);
        }
        let a5: [Token, T_Expression] | undefined = undefined;

        if (isToken(TToken.In)) {
          const a5t1: Token = matchToken(TToken.In);
          const a5t2: T_Expression = this.expression();
          const a5t: [Token, T_Expression] = [a5t1, a5t2];
          a5 = a5t;
        }
        return visitor.visitFactor8(a1, a2, a3, a4, a5);
      } else if (isToken(TToken.If)) {
        const a1: Token = matchToken(TToken.If);
        const a2: Token = matchToken(TToken.LParen);
        const a3: T_Expression = this.expression();
        const a4: Token = matchToken(TToken.RParen);
        const a5: T_Expression = this.expression();
        const a6: Token = matchToken(TToken.Else);
        const a7: T_Expression = this.expression();
        return visitor.visitFactor9(a1, a2, a3, a4, a5, a6, a7);
      } else if (isToken(TToken.UpperIdentifier)) {
        const a1: Token = matchToken(TToken.UpperIdentifier);
        let a2: [Token, T_Identifier] | undefined = undefined;

        if (isToken(TToken.Period)) {
          const a2t1: Token = matchToken(TToken.Period);
          const a2t2: T_Identifier = this.identifier();
          const a2t: [Token, T_Identifier] = [a2t1, a2t2];
          a2 = a2t;
        }
        return visitor.visitFactor10(a1, a2);
      } else if (isToken(TToken.LowerIdentifier)) {
        return visitor.visitFactor11(matchToken(TToken.LowerIdentifier));
      } else if (isToken(TToken.Match)) {
        const a1: Token = matchToken(TToken.Match);
        const a2: T_Expression = this.expression();
        const a3: Token = matchToken(TToken.With);
        let a4: Token | undefined = undefined;

        if (isToken(TToken.Bar)) {
          const a4t: Token = matchToken(TToken.Bar);
          a4 = a4t;
        }
        const a5: T_Case = this.case();
        const a6: Array<[Token, T_Case]> = [];

        while (isToken(TToken.Bar)) {
          const a6t1: Token = matchToken(TToken.Bar);
          const a6t2: T_Case = this.case();
          const a6t: [Token, T_Case] = [a6t1, a6t2];
          a6.push(a6t);
        }
        return visitor.visitFactor12(a1, a2, a3, a4, a5, a6);
      } else if (isToken(TToken.LBracket)) {
        const a1: Token = matchToken(TToken.LBracket);
        let a2: [T_Expression, Array<[Token, T_Expression]>] | undefined = undefined;

        if (
          isTokens([
            TToken.LParen,
            TToken.LiteralInt,
            TToken.LiteralString,
            TToken.LiteralChar,
            TToken.True,
            TToken.False,
            TToken.Backslash,
            TToken.Let,
            TToken.If,
            TToken.UpperIdentifier,
            TToken.LowerIdentifier,
            TToken.Match,
            TToken.LBracket,
            TToken.LCurly,
            TToken.Builtin,
          ])
        ) {
          const a2t1: T_Expression = this.expression();
          const a2t2: Array<[Token, T_Expression]> = [];

          while (isToken(TToken.Comma)) {
            const a2t2t1: Token = matchToken(TToken.Comma);
            const a2t2t2: T_Expression = this.expression();
            const a2t2t: [Token, T_Expression] = [a2t2t1, a2t2t2];
            a2t2.push(a2t2t);
          }
          const a2t: [T_Expression, Array<[Token, T_Expression]>] = [
            a2t1,
            a2t2,
          ];
          a2 = a2t;
        }
        const a3: Token = matchToken(TToken.RBracket);
        return visitor.visitFactor13(a1, a2, a3);
      } else if (isToken(TToken.LCurly)) {
        const a1: Token = matchToken(TToken.LCurly);
        let a2: [
          Token,
          Token,
          T_Expression,
          Array<[Token, Token, Token, T_Expression]>,
          [Token, T_Expression] | undefined,
        ] | undefined = undefined;

        if (isToken(TToken.LowerIdentifier)) {
          const a2t1: Token = matchToken(TToken.LowerIdentifier);
          const a2t2: Token = matchToken(TToken.Colon);
          const a2t3: T_Expression = this.expression();
          const a2t4: Array<[Token, Token, Token, T_Expression]> = [];

          while (isToken(TToken.Comma)) {
            const a2t4t1: Token = matchToken(TToken.Comma);
            const a2t4t2: Token = matchToken(TToken.LowerIdentifier);
            const a2t4t3: Token = matchToken(TToken.Colon);
            const a2t4t4: T_Expression = this.expression();
            const a2t4t: [Token, Token, Token, T_Expression] = [
              a2t4t1,
              a2t4t2,
              a2t4t3,
              a2t4t4,
            ];
            a2t4.push(a2t4t);
          }
          let a2t5: [Token, T_Expression] | undefined = undefined;

          if (isToken(TToken.Bar)) {
            const a2t5t1: Token = matchToken(TToken.Bar);
            const a2t5t2: T_Expression = this.expression();
            const a2t5t: [Token, T_Expression] = [a2t5t1, a2t5t2];
            a2t5 = a2t5t;
          }
          const a2t: [
            Token,
            Token,
            T_Expression,
            Array<[Token, Token, Token, T_Expression]>,
            [Token, T_Expression] | undefined,
          ] = [a2t1, a2t2, a2t3, a2t4, a2t5];
          a2 = a2t;
        }
        const a3: Token = matchToken(TToken.RCurly);
        return visitor.visitFactor14(a1, a2, a3);
      } else if (isToken(TToken.Builtin)) {
        const a1: Token = matchToken(TToken.Builtin);
        const a2: Token = matchToken(TToken.LiteralString);
        return visitor.visitFactor15(a1, a2);
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [
            TToken.LParen,
            TToken.LiteralInt,
            TToken.LiteralString,
            TToken.LiteralChar,
            TToken.True,
            TToken.False,
            TToken.Backslash,
            TToken.Let,
            TToken.If,
            TToken.UpperIdentifier,
            TToken.LowerIdentifier,
            TToken.Match,
            TToken.LBracket,
            TToken.LCurly,
            TToken.Builtin,
          ],
        };
      }
    },
    identifier: function (): T_Identifier {
      if (isToken(TToken.LowerIdentifier)) {
        return visitor.visitIdentifier1(matchToken(TToken.LowerIdentifier));
      } else if (isToken(TToken.UpperIdentifier)) {
        return visitor.visitIdentifier2(matchToken(TToken.UpperIdentifier));
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.LowerIdentifier, TToken.UpperIdentifier],
        };
      }
    },
    valueDeclaration: function (): T_ValueDeclaration {
      const a1: Token = matchToken(TToken.LowerIdentifier);
      let a2: Token | undefined = undefined;

      if (isToken(TToken.Star)) {
        const a2t: Token = matchToken(TToken.Star);
        a2 = a2t;
      }
      const a3: Array<T_Parameter> = [];

      while (isTokens([TToken.LowerIdentifier, TToken.LParen])) {
        const a3t: T_Parameter = this.parameter();
        a3.push(a3t);
      }
      let a4: [Token, T_TypeType] | undefined = undefined;

      if (isToken(TToken.Colon)) {
        const a4t1: Token = matchToken(TToken.Colon);
        const a4t2: T_TypeType = this.typeType();
        const a4t: [Token, T_TypeType] = [a4t1, a4t2];
        a4 = a4t;
      }
      const a5: Token = matchToken(TToken.Equal);
      const a6: T_Expression = this.expression();
      return visitor.visitValueDeclaration(a1, a2, a3, a4, a5, a6);
    },
    parameter: function (): T_Parameter {
      if (isToken(TToken.LowerIdentifier)) {
        return visitor.visitParameter1(matchToken(TToken.LowerIdentifier));
      } else if (isToken(TToken.LParen)) {
        const a1: Token = matchToken(TToken.LParen);
        const a2: Token = matchToken(TToken.LowerIdentifier);
        const a3: Token = matchToken(TToken.Colon);
        const a4: T_TypeType = this.typeType();
        const a5: Token = matchToken(TToken.RParen);
        return visitor.visitParameter2(a1, a2, a3, a4, a5);
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.LowerIdentifier, TToken.LParen],
        };
      }
    },
    case: function (): T_Case {
      const a1: T_Pattern = this.pattern();
      const a2: Token = matchToken(TToken.DashGreaterThan);
      const a3: T_Expression = this.expression();
      return visitor.visitCase(a1, a2, a3);
    },
    pattern: function (): T_Pattern {
      const a1: T_PatternTerm = this.patternTerm();
      const a2: Array<[Token, T_PatternTerm]> = [];

      while (isToken(TToken.ColonColon)) {
        const a2t1: Token = matchToken(TToken.ColonColon);
        const a2t2: T_PatternTerm = this.patternTerm();
        const a2t: [Token, T_PatternTerm] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitPattern(a1, a2);
    },
    patternTerm: function (): T_PatternTerm {
      if (isToken(TToken.LParen)) {
        const a1: Token = matchToken(TToken.LParen);
        let a2: [T_Pattern, Array<[Token, T_Pattern]>] | undefined = undefined;

        if (
          isTokens([
            TToken.LParen,
            TToken.LiteralInt,
            TToken.LiteralString,
            TToken.LiteralChar,
            TToken.True,
            TToken.False,
            TToken.LowerIdentifier,
            TToken.UpperIdentifier,
            TToken.LBracket,
            TToken.LCurly,
          ])
        ) {
          const a2t1: T_Pattern = this.pattern();
          const a2t2: Array<[Token, T_Pattern]> = [];

          while (isToken(TToken.Comma)) {
            const a2t2t1: Token = matchToken(TToken.Comma);
            const a2t2t2: T_Pattern = this.pattern();
            const a2t2t: [Token, T_Pattern] = [a2t2t1, a2t2t2];
            a2t2.push(a2t2t);
          }
          const a2t: [T_Pattern, Array<[Token, T_Pattern]>] = [a2t1, a2t2];
          a2 = a2t;
        }
        const a3: Token = matchToken(TToken.RParen);
        return visitor.visitPatternTerm1(a1, a2, a3);
      } else if (isToken(TToken.LiteralInt)) {
        return visitor.visitPatternTerm2(matchToken(TToken.LiteralInt));
      } else if (isToken(TToken.LiteralString)) {
        return visitor.visitPatternTerm3(matchToken(TToken.LiteralString));
      } else if (isToken(TToken.LiteralChar)) {
        return visitor.visitPatternTerm4(matchToken(TToken.LiteralChar));
      } else if (isToken(TToken.True)) {
        return visitor.visitPatternTerm5(matchToken(TToken.True));
      } else if (isToken(TToken.False)) {
        return visitor.visitPatternTerm6(matchToken(TToken.False));
      } else if (isToken(TToken.LowerIdentifier)) {
        return visitor.visitPatternTerm7(matchToken(TToken.LowerIdentifier));
      } else if (isToken(TToken.UpperIdentifier)) {
        const a1: Token = matchToken(TToken.UpperIdentifier);
        let a2: [Token, Token] | undefined = undefined;

        if (isToken(TToken.Period)) {
          const a2t1: Token = matchToken(TToken.Period);
          const a2t2: Token = matchToken(TToken.UpperIdentifier);
          const a2t: [Token, Token] = [a2t1, a2t2];
          a2 = a2t;
        }
        const a3: Array<T_Pattern> = [];

        while (
          isTokens([
            TToken.LParen,
            TToken.LiteralInt,
            TToken.LiteralString,
            TToken.LiteralChar,
            TToken.True,
            TToken.False,
            TToken.LowerIdentifier,
            TToken.UpperIdentifier,
            TToken.LBracket,
            TToken.LCurly,
          ])
        ) {
          const a3t: T_Pattern = this.pattern();
          a3.push(a3t);
        }
        return visitor.visitPatternTerm8(a1, a2, a3);
      } else if (isToken(TToken.LBracket)) {
        const a1: Token = matchToken(TToken.LBracket);
        let a2: [T_Pattern, Array<[Token, T_Pattern]>] | undefined = undefined;

        if (
          isTokens([
            TToken.LParen,
            TToken.LiteralInt,
            TToken.LiteralString,
            TToken.LiteralChar,
            TToken.True,
            TToken.False,
            TToken.LowerIdentifier,
            TToken.UpperIdentifier,
            TToken.LBracket,
            TToken.LCurly,
          ])
        ) {
          const a2t1: T_Pattern = this.pattern();
          const a2t2: Array<[Token, T_Pattern]> = [];

          while (isToken(TToken.Comma)) {
            const a2t2t1: Token = matchToken(TToken.Comma);
            const a2t2t2: T_Pattern = this.pattern();
            const a2t2t: [Token, T_Pattern] = [a2t2t1, a2t2t2];
            a2t2.push(a2t2t);
          }
          const a2t: [T_Pattern, Array<[Token, T_Pattern]>] = [a2t1, a2t2];
          a2 = a2t;
        }
        const a3: Token = matchToken(TToken.RBracket);
        return visitor.visitPatternTerm9(a1, a2, a3);
      } else if (isToken(TToken.LCurly)) {
        const a1: Token = matchToken(TToken.LCurly);
        let a2: [
          Token,
          [Token, T_Pattern] | undefined,
          Array<[Token, Token, [Token, T_Pattern] | undefined]>,
          [Token, T_Pattern] | undefined,
        ] | undefined = undefined;

        if (isToken(TToken.LowerIdentifier)) {
          const a2t1: Token = matchToken(TToken.LowerIdentifier);
          let a2t2: [Token, T_Pattern] | undefined = undefined;

          if (isToken(TToken.Colon)) {
            const a2t2t1: Token = matchToken(TToken.Colon);
            const a2t2t2: T_Pattern = this.pattern();
            const a2t2t: [Token, T_Pattern] = [a2t2t1, a2t2t2];
            a2t2 = a2t2t;
          }
          const a2t3: Array<[Token, Token, [Token, T_Pattern] | undefined]> = [];

          while (isToken(TToken.Comma)) {
            const a2t3t1: Token = matchToken(TToken.Comma);
            const a2t3t2: Token = matchToken(TToken.LowerIdentifier);
            let a2t3t3: [Token, T_Pattern] | undefined = undefined;

            if (isToken(TToken.Colon)) {
              const a2t3t3t1: Token = matchToken(TToken.Colon);
              const a2t3t3t2: T_Pattern = this.pattern();
              const a2t3t3t: [Token, T_Pattern] = [a2t3t3t1, a2t3t3t2];
              a2t3t3 = a2t3t3t;
            }
            const a2t3t: [Token, Token, [Token, T_Pattern] | undefined] = [
              a2t3t1,
              a2t3t2,
              a2t3t3,
            ];
            a2t3.push(a2t3t);
          }
          let a2t4: [Token, T_Pattern] | undefined = undefined;

          if (isToken(TToken.Bar)) {
            const a2t4t1: Token = matchToken(TToken.Bar);
            const a2t4t2: T_Pattern = this.pattern();
            const a2t4t: [Token, T_Pattern] = [a2t4t1, a2t4t2];
            a2t4 = a2t4t;
          }
          const a2t: [
            Token,
            [Token, T_Pattern] | undefined,
            Array<[Token, Token, [Token, T_Pattern] | undefined]>,
            [Token, T_Pattern] | undefined,
          ] = [a2t1, a2t2, a2t3, a2t4];
          a2 = a2t;
        }
        const a3: Token = matchToken(TToken.RCurly);
        return visitor.visitPatternTerm10(a1, a2, a3);
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [
            TToken.LParen,
            TToken.LiteralInt,
            TToken.LiteralString,
            TToken.LiteralChar,
            TToken.True,
            TToken.False,
            TToken.LowerIdentifier,
            TToken.UpperIdentifier,
            TToken.LBracket,
            TToken.LCurly,
          ],
        };
      }
    },
    dataDeclaration: function (): T_DataDeclaration {
      const a1: Token = matchToken(TToken.Data);
      const a2: T_TypeDeclaration = this.typeDeclaration();
      const a3: Array<[Token, T_TypeDeclaration]> = [];

      while (isToken(TToken.And)) {
        const a3t1: Token = matchToken(TToken.And);
        const a3t2: T_TypeDeclaration = this.typeDeclaration();
        const a3t: [Token, T_TypeDeclaration] = [a3t1, a3t2];
        a3.push(a3t);
      }
      return visitor.visitDataDeclaration(a1, a2, a3);
    },
    typeDeclaration: function (): T_TypeDeclaration {
      const a1: Token = matchToken(TToken.UpperIdentifier);
      let a2: (Token | Token) | undefined = undefined;

      if (isTokens([TToken.Star, TToken.Dash])) {
        if (isToken(TToken.Star)) {
          const a2t: Token = matchToken(TToken.Star);
          a2 = a2t;
        } else if (isToken(TToken.Dash)) {
          const a2t: Token = matchToken(TToken.Dash);
          a2 = a2t;
        } else {
          throw {
            tag: "SyntaxError",
            found: scanner.current(),
            expected: [TToken.Star, TToken.Dash],
          };
        }
      }
      const a3: Array<Token> = [];

      while (isToken(TToken.LowerIdentifier)) {
        const a3t: Token = matchToken(TToken.LowerIdentifier);
        a3.push(a3t);
      }
      const a4: Token = matchToken(TToken.Equal);
      const a5: T_ConstructorDeclaration = this.constructorDeclaration();
      const a6: Array<[Token, T_ConstructorDeclaration]> = [];

      while (isToken(TToken.Bar)) {
        const a6t1: Token = matchToken(TToken.Bar);
        const a6t2: T_ConstructorDeclaration = this.constructorDeclaration();
        const a6t: [Token, T_ConstructorDeclaration] = [a6t1, a6t2];
        a6.push(a6t);
      }
      return visitor.visitTypeDeclaration(a1, a2, a3, a4, a5, a6);
    },
    constructorDeclaration: function (): T_ConstructorDeclaration {
      const a1: Token = matchToken(TToken.UpperIdentifier);
      const a2: Array<T_TypeType> = [];

      while (
        isTokens([
          TToken.UpperIdentifier,
          TToken.LowerIdentifier,
          TToken.LParen,
          TToken.LCurly,
        ])
      ) {
        const a2t: T_TypeType = this.typeType();
        a2.push(a2t);
      }
      return visitor.visitConstructorDeclaration(a1, a2);
    },
    typeType: function (): T_TypeType {
      const a1: T_ADTType = this.aDTType();
      const a2: Array<[Token, T_ADTType]> = [];

      while (isToken(TToken.DashGreaterThan)) {
        const a2t1: Token = matchToken(TToken.DashGreaterThan);
        const a2t2: T_ADTType = this.aDTType();
        const a2t: [Token, T_ADTType] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitTypeType(a1, a2);
    },
    aDTType: function (): T_ADTType {
      if (isToken(TToken.UpperIdentifier)) {
        const a1: Token = matchToken(TToken.UpperIdentifier);
        let a2: [Token, Token] | undefined = undefined;

        if (isToken(TToken.Period)) {
          const a2t1: Token = matchToken(TToken.Period);
          const a2t2: Token = matchToken(TToken.UpperIdentifier);
          const a2t: [Token, Token] = [a2t1, a2t2];
          a2 = a2t;
        }
        const a3: Array<(T_TermType | [Token, [Token, Token] | undefined])> = [];

        while (
          isTokens([
            TToken.LowerIdentifier,
            TToken.LParen,
            TToken.LCurly,
            TToken.UpperIdentifier,
          ])
        ) {
          if (
            isTokens([TToken.LowerIdentifier, TToken.LParen, TToken.LCurly])
          ) {
            const a3t: T_TermType = this.termType();
            a3.push(a3t);
          } else if (isToken(TToken.UpperIdentifier)) {
            const a3t1: Token = matchToken(TToken.UpperIdentifier);
            let a3t2: [Token, Token] | undefined = undefined;

            if (isToken(TToken.Period)) {
              const a3t2t1: Token = matchToken(TToken.Period);
              const a3t2t2: Token = matchToken(TToken.UpperIdentifier);
              const a3t2t: [Token, Token] = [a3t2t1, a3t2t2];
              a3t2 = a3t2t;
            }
            const a3t: [Token, [Token, Token] | undefined] = [a3t1, a3t2];
            a3.push(a3t);
          } else {
            throw {
              tag: "SyntaxError",
              found: scanner.current(),
              expected: [
                TToken.LowerIdentifier,
                TToken.LParen,
                TToken.LCurly,
                TToken.UpperIdentifier,
              ],
            };
          }
        }
        return visitor.visitADTType1(a1, a2, a3);
      } else if (
        isTokens([TToken.LowerIdentifier, TToken.LParen, TToken.LCurly])
      ) {
        return visitor.visitADTType2(this.termType());
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [
            TToken.UpperIdentifier,
            TToken.LowerIdentifier,
            TToken.LParen,
            TToken.LCurly,
          ],
        };
      }
    },
    termType: function (): T_TermType {
      if (isToken(TToken.LowerIdentifier)) {
        return visitor.visitTermType1(matchToken(TToken.LowerIdentifier));
      } else if (isToken(TToken.LParen)) {
        const a1: Token = matchToken(TToken.LParen);
        let a2: [T_TypeType, Array<[Token, T_TypeType]>] | undefined = undefined;

        if (
          isTokens([
            TToken.UpperIdentifier,
            TToken.LowerIdentifier,
            TToken.LParen,
            TToken.LCurly,
          ])
        ) {
          const a2t1: T_TypeType = this.typeType();
          const a2t2: Array<[Token, T_TypeType]> = [];

          while (isToken(TToken.Star)) {
            const a2t2t1: Token = matchToken(TToken.Star);
            const a2t2t2: T_TypeType = this.typeType();
            const a2t2t: [Token, T_TypeType] = [a2t2t1, a2t2t2];
            a2t2.push(a2t2t);
          }
          const a2t: [T_TypeType, Array<[Token, T_TypeType]>] = [a2t1, a2t2];
          a2 = a2t;
        }
        const a3: Token = matchToken(TToken.RParen);
        return visitor.visitTermType2(a1, a2, a3);
      } else if (isToken(TToken.LCurly)) {
        const a1: Token = matchToken(TToken.LCurly);
        let a2: [
          Token,
          Token,
          T_TypeType,
          Array<[Token, Token, Token, T_TypeType]>,
          [Token, T_TypeType] | undefined,
        ] | undefined = undefined;

        if (isToken(TToken.LowerIdentifier)) {
          const a2t1: Token = matchToken(TToken.LowerIdentifier);
          const a2t2: Token = matchToken(TToken.Colon);
          const a2t3: T_TypeType = this.typeType();
          const a2t4: Array<[Token, Token, Token, T_TypeType]> = [];

          while (isToken(TToken.Comma)) {
            const a2t4t1: Token = matchToken(TToken.Comma);
            const a2t4t2: Token = matchToken(TToken.LowerIdentifier);
            const a2t4t3: Token = matchToken(TToken.Colon);
            const a2t4t4: T_TypeType = this.typeType();
            const a2t4t: [Token, Token, Token, T_TypeType] = [
              a2t4t1,
              a2t4t2,
              a2t4t3,
              a2t4t4,
            ];
            a2t4.push(a2t4t);
          }
          let a2t5: [Token, T_TypeType] | undefined = undefined;

          if (isToken(TToken.Bar)) {
            const a2t5t1: Token = matchToken(TToken.Bar);
            const a2t5t2: T_TypeType = this.typeType();
            const a2t5t: [Token, T_TypeType] = [a2t5t1, a2t5t2];
            a2t5 = a2t5t;
          }
          const a2t: [
            Token,
            Token,
            T_TypeType,
            Array<[Token, Token, Token, T_TypeType]>,
            [Token, T_TypeType] | undefined,
          ] = [a2t1, a2t2, a2t3, a2t4, a2t5];
          a2 = a2t;
        }
        const a3: Token = matchToken(TToken.RCurly);
        return visitor.visitTermType3(a1, a2, a3);
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.LowerIdentifier, TToken.LParen, TToken.LCurly],
        };
      }
    },
    typeAliasDeclarations: function (): T_TypeAliasDeclarations {
      const a1: Token = matchToken(TToken.Type);
      const a2: T_TypeAliasDeclaration = this.typeAliasDeclaration();
      return visitor.visitTypeAliasDeclarations(a1, a2);
    },
    typeAliasDeclaration: function (): T_TypeAliasDeclaration {
      const a1: Token = matchToken(TToken.UpperIdentifier);
      let a2: (Token | Token) | undefined = undefined;

      if (isTokens([TToken.Star, TToken.Dash])) {
        if (isToken(TToken.Star)) {
          const a2t: Token = matchToken(TToken.Star);
          a2 = a2t;
        } else if (isToken(TToken.Dash)) {
          const a2t: Token = matchToken(TToken.Dash);
          a2 = a2t;
        } else {
          throw {
            tag: "SyntaxError",
            found: scanner.current(),
            expected: [TToken.Star, TToken.Dash],
          };
        }
      }
      const a3: Array<Token> = [];

      while (isToken(TToken.LowerIdentifier)) {
        const a3t: Token = matchToken(TToken.LowerIdentifier);
        a3.push(a3t);
      }
      const a4: Token = matchToken(TToken.Equal);
      const a5: T_TypeType = this.typeType();
      return visitor.visitTypeAliasDeclaration(a1, a2, a3, a4, a5);
    },
    importStatement: function (): T_ImportStatement {
      const a1: Token = matchToken(TToken.Import);
      const a2: T_ImportItems = this.importItems();
      const a3: Token = matchToken(TToken.From);
      const a4: Token = matchToken(TToken.LiteralString);
      return visitor.visitImportStatement(a1, a2, a3, a4);
    },
    importItems: function (): T_ImportItems {
      if (isToken(TToken.Star)) {
        const a1: Token = matchToken(TToken.Star);
        let a2: [Token, Token] | undefined = undefined;

        if (isToken(TToken.As)) {
          const a2t1: Token = matchToken(TToken.As);
          const a2t2: Token = matchToken(TToken.UpperIdentifier);
          const a2t: [Token, Token] = [a2t1, a2t2];
          a2 = a2t;
        }
        return visitor.visitImportItems1(a1, a2);
      } else if (isTokens([TToken.UpperIdentifier, TToken.LowerIdentifier])) {
        const a1: T_ImportItem = this.importItem();
        const a2: Array<[Token, T_ImportItem]> = [];

        while (isToken(TToken.Comma)) {
          const a2t1: Token = matchToken(TToken.Comma);
          const a2t2: T_ImportItem = this.importItem();
          const a2t: [Token, T_ImportItem] = [a2t1, a2t2];
          a2.push(a2t);
        }
        return visitor.visitImportItems2(a1, a2);
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [
            TToken.Star,
            TToken.UpperIdentifier,
            TToken.LowerIdentifier,
          ],
        };
      }
    },
    importItem: function (): T_ImportItem {
      if (isToken(TToken.UpperIdentifier)) {
        const a1: Token = matchToken(TToken.UpperIdentifier);
        let a2: (Token | Token) | undefined = undefined;

        if (isTokens([TToken.Star, TToken.Dash])) {
          if (isToken(TToken.Star)) {
            const a2t: Token = matchToken(TToken.Star);
            a2 = a2t;
          } else if (isToken(TToken.Dash)) {
            const a2t: Token = matchToken(TToken.Dash);
            a2 = a2t;
          } else {
            throw {
              tag: "SyntaxError",
              found: scanner.current(),
              expected: [TToken.Star, TToken.Dash],
            };
          }
        }
        return visitor.visitImportItem1(a1, a2);
      } else if (isToken(TToken.LowerIdentifier)) {
        const a1: Token = matchToken(TToken.LowerIdentifier);
        let a2: [Token, Token] | undefined = undefined;

        if (isToken(TToken.As)) {
          const a2t1: Token = matchToken(TToken.As);
          const a2t2: Token = matchToken(TToken.LowerIdentifier);
          const a2t: [Token, Token] = [a2t1, a2t2];
          a2 = a2t;
        }
        let a3: Token | undefined = undefined;

        if (isToken(TToken.Star)) {
          const a3t: Token = matchToken(TToken.Star);
          a3 = a3t;
        }
        return visitor.visitImportItem2(a1, a2, a3);
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.UpperIdentifier, TToken.LowerIdentifier],
        };
      }
    },
  };
};

export type SyntaxError = {
  tag: "SyntaxError";
  found: Token;
  expected: Array<TToken>;
};
