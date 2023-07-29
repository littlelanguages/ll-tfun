# Error Reporting

Error reporting allows the user to know the location, the reason and what is
expected. The accuracy of this reporting is very important in allowing a
programmer to know what to fix and where.

## Syntax Error Reporting

These errors relate to lexical or syntactic errors.

```fsharp xt id=SyntaxErrorEmptyFile
---
Syntax Error: Expected '(', literal Int, literal String, True, False, '\', let, if, Upper Identifier, Lower Identifier, match, '{', builtin, data, type or import but found end-of-input at ../../scenarios/error-reporting/SyntaxErrors.md 1:1
```

```fsharp xt id=SyntaxErrorPrematureEnd
let x = 1 +
---
Syntax Error: Expected '(', literal Int, literal String, True, False, '\', let, if, Upper Identifier, Lower Identifier, match, '{' or builtin but found end-of-input at ../../scenarios/error-reporting/SyntaxErrors.md 1:12
```

```fsharp xt id=SyntaxErrorEmptyLet
let
---
Syntax Error: Expected Lower Identifier but found end-of-input at ../../scenarios/error-reporting/SyntaxErrors.md 1:4
```

```fsharp xt id=SyntaxErrorRecord
{a: 10, }
---
Syntax Error: Expected Lower Identifier but found '}' at ../../scenarios/error-reporting/SyntaxErrors.md 1:9
```

## Unknown Identifier Errors

These errors relate to the use of an identifier that has not been defined. There
are two forms - value and types.

The first error is an unknown value identifier.

```fsharp xt id=UnknownValueIdentifier
let x = y + 1
---
Unknown Name: y at ../../scenarios/error-reporting/SyntaxErrors.md 1:9
```

Next is an unknown constructor name.

```fsharp xt id=UnknownConstructorIdentifier
data LList x = LNil | LCons x (LList x) ;

LCons 1 (LKons 2 Nil)
---
Unknown Name: LKons at ../../scenarios/error-reporting/SyntaxErrors.md 3:10-14
```

A similar error is also reported in pattern matching when attempting to match against an unknown constructor.

```fsharp xt id=UnknownConstructorIdentifier
match (Cons 1 Nil) with
| Nil -> 0
| Kons x xs -> x
---
Unknown Data Name: Kons at ../../scenarios/error-reporting/SyntaxErrors.md 3:3-6
```

Finally an unknown qualifier.

```fsharp xt id=UnknownQualifierIdentifier
let x = T1.y + 1
---
Unknown Qualifier: T1 at ../../scenarios/error-reporting/SyntaxErrors.md 1:9-10
```

An unknown qualifier is also reported in pattern matching.
```fsharp xt id=UnknownConstructorIdentifier
match (Cons 1 Nil) with
| Nil -> 0
| T1.Cons x xs -> x
---
Unknown Qualifier: T1 at ../../scenarios/error-reporting/SyntaxErrors.md 3:3-4
```

There are also a number of scenarios where a type identifier is unknown. The
first is where an unknown type is used in a type annotation.

```fsharp xt id=UnknownTypeIdentifier
let x: Fred = 1
---
Unknown Data Name: Fred at ../../scenarios/error-reporting/SyntaxErrors.md 1:8-11
```

The second type identifier is where a data declaration refers to an unknown
type.

```fsharp xt id=UnknownTypeIdentifier
data LList x = LNil | LCons x (Fred x)
---
Unknown Data Name: Fred at ../../scenarios/error-reporting/SyntaxErrors.md 1:32-35
```

A reference to an unknown type name inside a data declaration is reported as an error.

```fsharp xt id=UnknownDataTypeIdentifier
data LList x = LNil | LCons y (LList x)
---
Unknown Type Name: y at ../../scenarios/error-reporting/SyntaxErrors.md 1:29
```

The same error is also reported in a type alias declaration.

```fsharp xt id=UnknownTypeAliasIdentifier
type Fred x = (x * y)
---
Unknown Type Name: y at ../../scenarios/error-reporting/SyntaxErrors.md 1:20
```

## Duplicate Identifier Errors

The next error is if an attempt is made to create a duplicate data type.

```fsharp xt id=DuplicateDataType
data LList x = LNil | LCons x (LList x) ;
data LList x = LLNil | LLCons x (LList x)
---
Duplicate Data Declaration: LList at ../../scenarios/error-reporting/SyntaxErrors.md 2:6-10
```

It should be noted that, with the prelude importing a number of standard declarations like `List`, an attempt to redefine any one of these data declarations will also fail.

```fsharp xt id=DuplicateListDataType
data List x = LNil | LCons x (List x)
---
Duplicate Data Declaration: List at ../../scenarios/error-reporting/SyntaxErrors.md 1:6-9
```
