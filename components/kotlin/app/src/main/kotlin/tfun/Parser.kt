package tfun

import io.littlelanguages.data.*
import tfun.parser.Parser
import tfun.parser.Scanner
import tfun.parser.Token
import tfun.parser.Visitor
import java.io.StringReader

enum class Visibility { Public, Opaque, Private, None }

sealed class Element

sealed class Expression : Element()

interface ExpressionDeclaration {
    val decls: List<Declaration>
    val expr: Expression?
}

data class AppExpression(val e1: Expression, val e2: Expression) : Expression()

data class BuiltinExpression(val name: String) : Expression()

data class CaseExpression(val variable: String, val clauses: List<Clause>) : Expression()

data class Clause(val constructor: String, val variables: List<String?>, val expression: Expression)

data class IfExpression(val e1: Expression, val e2: Expression, val e3: Expression) : Expression()

data class LetExpression(override val decls: List<Declaration>, override val expr: Expression?) : Expression(),
    ExpressionDeclaration

data class LetRecExpression(override val decls: List<Declaration>, override val expr: Expression?) : Expression(),
    ExpressionDeclaration

data class Declaration(val n: String, val visibility: Visibility, val e: Expression)

object ErrorExpression : Expression()

object FailExpression : Expression()

data class FatBarExpression(val left: Expression, val right: Expression) : Expression()

data class LamExpression(val n: Parameter, val e: Expression, val returnType: TypeTerm?) : Expression()

data class LBoolExpression(val v: Boolean) : Expression()

data class LIntExpression(val v: Int) : Expression()

data class LStringExpression(val v: String) : Expression()

data class LTupleExpression(val es: List<Expression>) : Expression()

object LUnitExpression : Expression()

data class MatchExpression(val e: Expression, val cases: List<MatchCase>) : Expression()

data class MatchCase(val pattern: Pattern, val expr: Expression)

data class OpExpression(val e1: Expression, val e2: Expression, val op: Op) : Expression()

enum class Op { Equals, Plus, Minus, Times, Divide }

object RecordEmptyExpression : Expression()

data class RecordExtendExpression(val name: String, val e: Expression, val rest: Expression) : Expression()

data class RecordSelectExpression(val e: Expression, val name: String) : Expression()

data class TypingExpression(val e: Expression, val t: TypeTerm) : Expression()

data class VarExpression(val qualifier: String?, val name: String) : Expression()


sealed class Pattern

data class PDataPattern(val qualifier: String?, val name: String, val args: List<Pattern>) : Pattern()

data class PBoolPattern(val v: Boolean) : Pattern()

data class PIntPattern(val v: Int) : Pattern()

data class PRecordPattern(val fields: List<Tuple2<String, Pattern>>, val extension: Pattern?) : Pattern()

data class PStringPattern(val v: String) : Pattern()

data class PTuplePattern(val values: List<Pattern>) : Pattern()

object PUnitPattern : Pattern()

data class PVarPattern(val name: String) : Pattern()

object PWildcardPattern : Pattern()

data class DataDeclaration(val decls: List<TypeDeclaration>) : Element()

data class TypeDeclaration(
    val name: String,
    val visibility: Visibility,
    val parameters: List<String>,
    val constructors: List<ConstructorDeclaration>
)

data class ConstructorDeclaration(val name: String, val parameters: List<TypeTerm>)

sealed class TypeTerm

data class TypeVariable(val name: String) : TypeTerm()

data class TypeConstructor(val qualifier: String?, val name: String, val parameters: List<TypeTerm>) : TypeTerm()

data class TypeFunction(val left: TypeTerm, val right: TypeTerm) : TypeTerm()

data class TypeRecord(val fields: List<Tuple2<String, TypeTerm>>, val extension: TypeTerm?) : TypeTerm()

data class TypeTuple(val parameters: List<TypeTerm>) : TypeTerm()

object TypeUnit : TypeTerm()

data class TypeAliasDeclaration(
    val name: String,
    val visibility: Visibility,
    val parameters: List<String>,
    val type: TypeTerm
) : Element()

data class ImportStatement(val items: List<ImportItem>, val from: String) : Element()

sealed class ImportItem

data class ImportAll(val alias: String?) : ImportItem()
data class ImportNames(val items: List<ImportName>) : ImportItem()

data class ImportName(val name: String, val alias: String?, val visibility: Visibility) : ImportItem()

data class Parameter(val name: String, val type: TypeTerm?)

class ParserVisitor : Visitor<
        List<Element>, // T_Program
        Element, // T_Element
        Expression, // T_Expression
        Expression, // T_Relational
        Expression, // T_Additive
        Op, // T_AdditiveOps
        Expression, // T_Multiplicative
        Op, // T_MultiplicativeOps
        Expression, // T_Typing
        Expression, // T_Projection
        Expression, // T_Factor
        String, // T_Identifier
        Declaration, // T_ValueDeclaration
        Parameter, // T_Parameter
        MatchCase, // T_Case
        Pattern, // T_Pattern
        DataDeclaration, // T_DataDeclaration
        TypeDeclaration, // T_TypeDeclaration
        ConstructorDeclaration, // T_ConstructorDeclaration
        TypeTerm, // T_Type
        TypeTerm, // T_ADTType
        TypeTerm, // T_TermType
        TypeAliasDeclaration, // T_TypeAliasDeclaration
        TypeAliasDeclaration, // T_TypeAliasDeclaration
        ImportStatement, // T_ImportStatement
        ImportItem, // T_ImportItem
        ImportName, // T_ImportName
        > {
    override fun visitProgram(a1: Element, a2: List<Tuple2<Token, Element>>): List<Element> =
        listOf(a1) + a2.map { it.b }

    override fun visitElement1(a: Expression): Element = a
    override fun visitElement2(a: DataDeclaration): Element = a
    override fun visitElement3(a: TypeAliasDeclaration): Element = a
    override fun visitElement4(a: ImportStatement): Element = a

    override fun visitExpression(a1: Expression, a2: List<Expression>): Expression =
        a2.fold(a1) { acc, e -> AppExpression(acc, e) }

    override fun visitRelational(a1: Expression, a2: Tuple2<Token, Expression>?): Expression =
        if (a2 == null) a1 else OpExpression(a1, a2.b, Op.Equals)

    override fun visitAdditive(a1: Expression, a2: List<Tuple2<Op, Expression>>): Expression =
        a2.fold(a1) { acc, e -> OpExpression(acc, e.b, e.a) }

    override fun visitAdditiveOps1(a: Token): Op = Op.Plus
    override fun visitAdditiveOps2(a: Token): Op = Op.Minus

    override fun visitMultiplicative(a1: Expression, a2: List<Tuple2<Op, Expression>>): Expression =
        a2.fold(a1) { acc, e -> OpExpression(acc, e.b, e.a) }

    override fun visitMultiplicativeOps1(a: Token): Op = Op.Times
    override fun visitMultiplicativeOps2(a: Token): Op = Op.Divide

    override fun visitTyping(a1: Expression, a2: Tuple2<Token, TypeTerm>?): Expression =
        if (a2 == null) a1 else TypingExpression(a1, a2.b)

    override fun visitProjection(a1: Expression, a2: List<Tuple2<Token, Token>>): Expression =
        a2.fold(a1) { acc, e -> RecordSelectExpression(acc, e.b.lexeme) }

    override fun visitFactor1(
        a1: Token,
        a2: Tuple2<Expression, List<Tuple2<Token, Expression>>>?,
        a3: Token
    ): Expression =
        when {
            a2 == null -> LUnitExpression
            a2.b.isEmpty() -> a2.a
            else -> LTupleExpression(listOf(a2.a) + a2.b.map { it.b })
        }

    override fun visitFactor2(a: Token): Expression = LIntExpression(a.lexeme.toInt())

    override fun visitFactor3(a: Token): Expression =
        LStringExpression(a.lexeme.drop(1).dropLast(1).replace("\\\"", "\""))

    override fun visitFactor4(a: Token): Expression = LBoolExpression(true)

    override fun visitFactor5(a: Token): Expression = LBoolExpression(false)

    override fun visitFactor6(
        a1: Token,
        a2: Parameter,
        a3: List<Parameter>,
        a4: Tuple2<Token, TypeTerm>?,
        a5: Token,
        a6: Expression
    ): Expression =
        composeLambda(listOf(a2) + a3.map { it }, a6, a4?.b)

    override fun visitFactor7(
        a1: Token, a2: Token?, a3: Declaration, a4: List<Tuple2<Token, Declaration>>, a5: Tuple2<Token, Expression>?
    ): Expression {
        val declarations = listOf(a3) + a4.map { it.b }

        return if (a2 == null) LetExpression(declarations, a5?.b)
        else LetRecExpression(declarations, a5?.b)
    }

    override fun visitFactor8(
        a1: Token,
        a2: Token,
        a3: Expression,
        a4: Token,
        a5: Expression,
        a6: Token,
        a7: Expression
    ): Expression =
        IfExpression(a3, a5, a7)


    override fun visitFactor9(a1: Token, a2: Tuple2<Token, String>?): Expression =
        if (a2 == null) VarExpression(null, a1.lexeme)
        else VarExpression(a2.b, a1.lexeme)

    override fun visitFactor10(a: Token): Expression = VarExpression(null, a.lexeme)

    override fun visitFactor11(
        a1: Token,
        a2: Expression,
        a3: Token,
        a4: Token?,
        a5: MatchCase,
        a6: List<Tuple2<Token, MatchCase>>
    ): Expression =
        MatchExpression(a2, listOf(a5) + a6.map { it.b })

    override fun visitFactor12(
        a1: Token,
        a2: io.littlelanguages.data.Tuple5<Token, Token, Expression, List<Tuple4<Token, Token, Token, Expression>>, io.littlelanguages.data.Tuple2<Token, Expression>?>?,
        a3: Token
    ): Expression =
        TODO("visitFactor12")

    override fun visitFactor13(a1: Token, a2: Token): Expression =
        TODO("visitFactor13")

    override fun visitIdentifier1(a: Token): String = a.lexeme
    override fun visitIdentifier2(a: Token): String = a.lexeme

    override fun visitValueDeclaration(
        a1: Token,
        a2: Token?,
        a3: List<Parameter>,
        a4: Tuple2<Token, TypeTerm>?,
        a5: Token,
        a6: Expression
    ): Declaration =
        Declaration(
            a1.lexeme,
            if (a2 == null) Visibility.None else Visibility.Public,
            composeLambda(a3, a6, a4?.b)
        )

    override fun visitParameter1(a: Token): Parameter =
        Parameter(a.lexeme, null)

    override fun visitParameter2(a1: Token, a2: Token, a3: Token, a4: TypeTerm, a5: Token): Parameter =
        Parameter(a1.lexeme, a4)

    override fun visitCase(a1: Pattern, a2: Token, a3: Expression): MatchCase = MatchCase(a1, a3)

    override fun visitPattern1(a1: Token, a2: Tuple2<Pattern, List<Tuple2<Token, Pattern>>>?, a3: Token): Pattern =
        when {
            a2 == null -> PUnitPattern
            a2.b.isEmpty() -> a2.a
            else -> PTuplePattern(listOf(a2.a) + a2.b.map { it.b })
        }

    override fun visitPattern2(a: Token): Pattern = PIntPattern(a.lexeme.toInt())

    override fun visitPattern3(a: Token): Pattern = PStringPattern(a.lexeme.drop(1).dropLast(1).replace("\\\"", "\""))

    override fun visitPattern4(a: Token): Pattern = PBoolPattern(true)

    override fun visitPattern5(a: Token): Pattern = PBoolPattern(false)

    override fun visitPattern6(a: Token): Pattern =
        if (a.lexeme == "_") PWildcardPattern else PVarPattern(a.lexeme)

    override fun visitPattern7(
        a1: Token,
        a2: Tuple2<Token, Token>?,
        a3: List<Pattern>
    ): Pattern =
        if (a2 == null) PDataPattern(null, a1.lexeme, a3)
        else PDataPattern(a1.lexeme, a2.b.lexeme, a3)

    override fun visitPattern8(
        a1: Token,
        a2: Tuple4<Token, Tuple2<Token, Pattern>?, List<Tuple3<Token, Token, Tuple2<Token, Pattern>?>>, Tuple2<Token, Pattern>?>?,
        a3: Token
    ): Pattern =
        TODO("visitPattern8")

    override fun visitDataDeclaration(
        a1: Token,
        a2: TypeDeclaration,
        a3: List<Tuple2<Token, TypeDeclaration>>
    ): DataDeclaration =
        DataDeclaration(listOf(a2) + a3.map { it.b })

    override fun visitTypeDeclaration(
        a1: Token,
        a2: Union2<Token, Token>?,
        a3: List<Token>,
        a4: Token,
        a5: ConstructorDeclaration,
        a6: List<Tuple2<Token, ConstructorDeclaration>>
    ): TypeDeclaration =
        TypeDeclaration(
            a1.lexeme,
            when {
                a2 == null -> Visibility.None
                a2.isA() -> Visibility.Public
                else -> Visibility.Opaque
            },
            a3.map { it.lexeme },
            listOf(a5) + a6.map { it.b }
        )


    override fun visitConstructorDeclaration(a1: Token, a2: List<TypeTerm>): ConstructorDeclaration =
        ConstructorDeclaration(a1.lexeme, a2)

    override fun visitTypeType(a1: TypeTerm, a2: List<Tuple2<Token, TypeTerm>>): TypeTerm =
        composeFunctionType(listOf(a1) + a2.map { it.b })

    override fun visitADTType1(
        a1: Token,
        a2: Tuple2<Token, Token>?,
        a3: List<Union2<TypeTerm, Tuple2<Token, Tuple2<Token, Token>?>>>
    ): TypeTerm {
        val args =
            a3.map {
                when {
                    it.isA() -> it.a()
                    it.b().b == null -> TypeConstructor(null, it.b().a.lexeme, emptyList())
                    else -> TypeConstructor(it.b().a.lexeme, it.b().b!!.b.lexeme, emptyList())
                }
            }

        return if (a2 == null)
            TypeConstructor(null, a1.lexeme, args)
        else TypeConstructor(a1.lexeme, a2.b.lexeme, args)
    }

    override fun visitADTType2(a: TypeTerm): TypeTerm = a

    override fun visitTermType1(a: Token): TypeTerm = TypeVariable(a.lexeme)

    override fun visitTermType2(a1: Token, a2: Tuple2<TypeTerm, List<Tuple2<Token, TypeTerm>>>?, a3: Token): TypeTerm =
        when {
            a2 == null -> TypeUnit
            a2.b.isEmpty() -> a2.a
            else -> TypeTuple(listOf(a2.a) + a2.b.map { it.b })
        }

    override fun visitTermType3(
        a1: Token,
        a2: Tuple5<Token, Token, TypeTerm, List<Tuple4<Token, Token, Token, TypeTerm>>, Tuple2<Token, TypeTerm>?>?,
        a3: Token
    ): TypeTerm =
        TODO("visitTermType3")

    override fun visitImportItems1(a1: Token, a2: Tuple2<Token, Token>?): ImportItem =
        TODO("Not yet implemented")

    override fun visitImportItem1(a1: Token, a2: Union2<Token, Token>?): ImportName =
        TODO("visitImportItems1")

    override fun visitImportItem2(a1: Token, a2: Tuple2<Token, Token>?, a3: Token?): ImportName =
        TODO("visitImportItem2")

    override fun visitImportItems2(a1: ImportName, a2: List<Tuple2<Token, ImportName>>): ImportItem =
        TODO("visitImportItems2")

    override fun visitImportStatement(a1: Token, a2: ImportItem, a3: Token, a4: Token): ImportStatement =
        TODO("visitImportStatement")

    override fun visitTypeAliasDeclaration(
        a1: Token,
        a2: Union2<Token, Token>?,
        a3: List<Token>,
        a4: Token,
        a5: TypeTerm
    ): TypeAliasDeclaration =
        TODO("visitTypeAliasDeclaration")

    override fun visitTypeAliasDeclarations(a1: Token, a2: TypeAliasDeclaration): TypeAliasDeclaration =
        TODO("visitTypeAliasDeclarations")

    private fun composeLambda(names: List<Parameter>, e: Expression, returnType: TypeTerm?): Expression =
        if (names.isEmpty() && returnType != null)
            TypingExpression(e, returnType)
        else
            names.foldRight(e) { name, acc -> LamExpression(name, acc, if (e == acc) returnType else null) }

    private fun composeFunctionType(ts: List<TypeTerm>): TypeTerm =
        ts.dropLast(1).foldRight(ts.last()) { t1, acc -> TypeFunction(t1, acc) }
}

fun parse(scanner: Scanner): List<Element> =
    Parser(scanner, ParserVisitor()).program()

fun parse(input: String): List<Element> =
    parse(Scanner(StringReader(input)))

fun parseExpressions(input: String): List<Expression> {
    val elements = parse(input)

    return elements.map {
        when (it) {
            is Expression -> it
            is DataDeclaration -> throw IllegalArgumentException("Data declaration found")
            is ImportStatement -> throw IllegalArgumentException("Import statement found")
            is TypeAliasDeclaration -> throw IllegalArgumentException("type alias declaration found")
        }
    }
}
