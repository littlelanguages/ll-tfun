# Error Reporting

Error reporting allows the user to know the location, the reason and what is
expected. The accuracy of this reporting is very important in allowing a
programmer to know what to fix and where.

## Syntax Error Reporting

These errors relate to lexical or syntactic errors.

```fsharp xt id=SyntaxErrorEmptyFile
---
Syntax Error: Expected '(', literal Int, literal String, literal Char, True, False, '\', let, if, Upper Identifier, Lower Identifier, match, '[', '{', builtin, data, type or import but found end-of-input at ../../scenarios/ErrorReporting.md 1:1
```

```fsharp xt id=SyntaxErrorPrematureEnd
let x = 1 +
---
Syntax Error: Expected '(', literal Int, literal String, literal Char, True, False, '\', let, if, Upper Identifier, Lower Identifier, match, '[', '{' or builtin but found end-of-input at ../../scenarios/ErrorReporting.md 1:12
```

```fsharp xt id=SyntaxErrorEmptyLet
let
---
Syntax Error: Expected Lower Identifier but found end-of-input at ../../scenarios/ErrorReporting.md 1:4
```

```fsharp xt id=SyntaxErrorRecord
{a: 10, }
---
Syntax Error: Expected Lower Identifier but found '}' at ../../scenarios/ErrorReporting.md 1:9
```

## Unknown Identifier Errors

These errors relate to the use of an identifier that has not been defined. There
are two forms - value and types.

The first error is an unknown value identifier.

```fsharp xt id=UnknownValueIdentifier
let x = y + 1
---
Unknown Name: y at ../../scenarios/ErrorReporting.md 1:9
```

Next is an unknown constructor name.

```fsharp xt id=UnknownConstructorIdentifier
data LList x = LNil | LCons x (LList x) ;

LCons 1 (LKons 2 Nil)
---
Unknown Name: LKons at ../../scenarios/ErrorReporting.md 3:10-14
```

A similar error is also reported in pattern matching when attempting to match against an unknown constructor.

```fsharp xt id=UnknownConstructorIdentifier
match (Cons 1 Nil) with
| Nil -> 0
| Kons x xs -> x
---
Unknown Data Name: Kons at ../../scenarios/ErrorReporting.md 3:3-6
```

Finally an unknown qualifier.

```fsharp xt id=UnknownQualifierIdentifier
let x = T1.y + 1
---
Unknown Qualifier: T1 at ../../scenarios/ErrorReporting.md 1:9-10
```

An unknown qualifier is also reported in pattern matching.
```fsharp xt id=UnknownConstructorIdentifier
match (Cons 1 Nil) with
| Nil -> 0
| T1.Cons x xs -> x
---
Unknown Qualifier: T1 at ../../scenarios/ErrorReporting.md 3:3-4
```

There are also a number of scenarios where a type identifier is unknown. The
first is where an unknown type is used in a type annotation.

```fsharp xt id=UnknownTypeIdentifier
let x: Fred = 1
---
Unknown Data Name: Fred at ../../scenarios/ErrorReporting.md 1:8-11
```

The second type identifier is where a data declaration refers to an unknown
type.

```fsharp xt id=UnknownTypeIdentifier
data LList x = LNil | LCons x (Fred x)
---
Unknown Data Name: Fred at ../../scenarios/ErrorReporting.md 1:32-35
```

A reference to an unknown type name inside a data declaration is reported as an error.

```fsharp xt id=UnknownDataTypeIdentifier
data LList x = LNil | LCons y (LList x)
---
Unknown Type Name: y at ../../scenarios/ErrorReporting.md 1:29
```

The same error is also reported in a type alias declaration.

```fsharp xt id=UnknownTypeAliasIdentifier
type Fred x = (x * y)
---
Unknown Type Name: y at ../../scenarios/ErrorReporting.md 1:20
```

## Duplicate Identifier Errors

The next error is if an attempt is made to create a duplicate data type.

```fsharp xt id=DuplicateDataType
data LList x = LNil | LCons x (LList x) ;
data LList x = LLNil | LLCons x (LList x)
---
Duplicate Data Declaration: LList at ../../scenarios/ErrorReporting.md 2:6-10
```

It should be noted that, with the prelude importing a number of standard declarations like `List`, an attempt to redefine any one of these data declarations will also fail.

```fsharp xt id=DuplicateListDataType
data List x = LNil | LCons x (List x)
---
Duplicate Data Declaration: List at ../../scenarios/ErrorReporting.md 1:6-9
```

## Arity Mismatch Errors

Arity errors are errors where the number of supplied arguments does not match the number of arguments expected.

The first error is where a data constructor is supplied with too many arguments.  This occurs when the data constructor is supplied with more arguments than it has parameters during pattern matching.

```fsharp xt id=ArityMismatchDataConstructor
match (Cons 1 Nil) with
| Nil -> 0
| Cons a b c -> a
---
Arity Mismatch: Cons supplied with 3 arguments but expected 2 at ../../scenarios/ErrorReporting.md 3:3-6
```

This can also happen when using a type alias with a data constructor.

```fsharp xt id=ArityMismatchTypeAlias
type Pair x y = (x * y) ;

data Funny = Funny (Pair Int)
---
Arity Mismatch: Pair supplied with 1 argument but expected 2 at ../../scenarios/ErrorReporting.md 3:21-24
```

An error is reported when not supplying the correct number of arguments in a data declaration.

```fsharp xt id=ArityMismatchDataDeclaration
data Funny = Funny List
---
Arity Mismatch: List supplied with 0 arguments but expected 1 at ../../scenarios/ErrorReporting.md 1:20-23
```

Further arity scenarios pertain to type qualify variables. The first is where a data declaration is referenced.

```fsharp xt id=ArityMismatchDataQualifier
let x: List = Nil
---
Arity Mismatch: List supplied with 0 arguments but expected 1 at ../../scenarios/ErrorReporting.md 1:8-11
```


The second scenario is where a type alias is referenced.

```fsharp xt id=ArityMismatchTypeAliasQualifier
type Pair x y = (x * y) ;
let x: Pair Int = (1, 2)
---
Arity Mismatch: Pair supplied with 1 argument but expected 2 at ../../scenarios/ErrorReporting.md 2:8-11
```

## Import Errors

Import errors are errors that occur when importing a module and fall into 4 categories

- Unknown module aka File Not Found,
- Duplicate declaration,
- Reference to an unknown declaration, and
- Cyclic dependency

### Unknown Module

The first error is where an unknown module is imported.  A number of examples are used to ensure that the relative paths are correctly set up.

```fsharp xt id=ImportUnknownModule1
import * from "./fred/known-file-name.tfun"
---
File Not Found: ./fred/known-file-name.tfun at ../../scenarios/ErrorReporting.md 1:15-43
```

```fsharp xt id=ImportUnknownModule2
import * from "fred/known-file-name.tfun"
---
File Not Found: ./fred/known-file-name.tfun at ../../scenarios/ErrorReporting.md 1:15-41
```

```fsharp xt id=ImportUnknownModule3
import * from "./known-file-name.tfun"
---
File Not Found: ./known-file-name.tfun at ../../scenarios/ErrorReporting.md 1:15-38
```

```fsharp xt id=ImportUnknownModule4
import * from "known-file-name.tfun"
---
File Not Found: ./known-file-name.tfun at ../../scenarios/ErrorReporting.md 1:15-36
```

```fsharp xt id=ImportUnknownModule5
import * from "../known-file-name.tfun"
---
File Not Found: ../known-file-name.tfun at ../../scenarios/ErrorReporting.md 1:15-39
```

### Duplicate Declaration

The next error is where a name is imported however the name is already in use.

```fsharp xt id=ImportDuplicateValueDeclaration
import someFun from "./General.tfun" ;
import someFun from "./General.tfun"
---
Import Name Already Declared: someFun at ../../scenarios/ErrorReporting.md 2:8-14
```

```fsharp xt id=ImportDuplicateValueDeclaration
import * from "./General.tfun" ;
import someFun from "./General.tfun"
---
Import Name Already Declared: someFun at ../../scenarios/ErrorReporting.md 2:8-14
```

```fsharp xt id=ImportDuplicateValueDeclaration
import someFun, someFun from "./General.tfun"
---
Import Name Already Declared: someFun at ../../scenarios/ErrorReporting.md 1:17-23
```

```fsharp xt id=ImportDuplicateValueDeclaration
let fred = 1 ;
import someFun as fred from "./General.tfun"
---
Import Name Already Declared: fred at ../../scenarios/ErrorReporting.md 2:19-22
```

The following two errors are where an alias has been defined and at attempt is made to an alias with the same name.

```fsharp xt id=ImportDuplicateAliasDeclaration
type Pair* a b = (a * b) ;
import Pair from "./General.tfun"
---
Import Name Already Declared: Pair at ../../scenarios/ErrorReporting.md 2:8-11
```

```fsharp xt id=ImportDuplicateAliasDeclaration
type Pair* a b = (a * b) ;
import * from "./General.tfun"
---
Import Name Already Declared: Pair at ../../scenarios/ErrorReporting.md 2:15-30
```

The following two errors are where a data declarations has been defined.

```fsharp xt id=ImportDuplicateDataDeclaration
data Data a = Data a ;
import Data from "./General.tfun"
---
Import Name Already Declared: Data at ../../scenarios/ErrorReporting.md 2:8-11
```

```fsharp xt id=ImportDuplicateDataDeclaration
data Data a = Data a ;
import * from "./General.tfun"
---
Import Name Already Declared: Data at ../../scenarios/ErrorReporting.md 2:15-30
```

The final two errors are where a constructor name clash is attempted during an import.

```fsharp xt id=ImportDuplicateConstructorDeclaration
data TheData a = Data a ;
import Data from "./General.tfun"
---
Import Name Already Declared: Data at ../../scenarios/ErrorReporting.md 2:8-11
```

```fsharp xt id=ImportDuplicateConstructorDeclaration
data TheData a = Data a ;
import * from "./General.tfun"
---
Import Name Already Declared: Data at ../../scenarios/ErrorReporting.md 2:15-30
```

### Unknown Reference

These scenarios are where a reference is make to a name that is not exported by the module being imported.

``` fsharp xt id=ImportUnknownValueDeclaration
import Fred from "./General.tfun"
---
Unknown Import Name: Fred not one of Data, Pair or someFun at ../../scenarios/ErrorReporting.md 1:8-11
```

``` fsharp xt id=ImportUnknownValueDeclaration
import fred from "./General.tfun"
---
Unknown Import Name: fred not one of Data, Pair or someFun at ../../scenarios/ErrorReporting.md 1:8-11
```

### Cyclic Dependency

The final error is where a cyclic dependency is detected.

```fsharp xt id=ImportCyclicDependency
import * from "./CycleA.tfun"
---
Cyclic Import: ./CycleA.tfun at ../../scenarios/CycleC.tfun 1:15-29
```

## Type Inference

Type inference errors are generally tricky to report as the location can be lost during inference and unification.

```fsharp xt id=TypeInferenceError
let x = 1 + "hello"
---
Unification Mismatch: String at ../../scenarios/ErrorReporting.md 1:13-19 and Int
```

```fsharp xt id=TypeInferenceError
let compose f g x = f (g x) ; compose 10
---
Unification Mismatch: a -> b and Int at ../../scenarios/ErrorReporting.md 1:39-40
```

```fsharp xt id=TypeInferenceError
1 + if (True) "a" else "b"
---
Unification Mismatch: String at ../../scenarios/ErrorReporting.md 1:5-26 and Int
```
