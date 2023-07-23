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

Finally an unknown qualifier.

```fsharp xt id=UnknownQualifierIdentifier
let x = T1.y + 1
---
Unknown Qualifier: T1 at ../../scenarios/error-reporting/SyntaxErrors.md 1:9-10
```
