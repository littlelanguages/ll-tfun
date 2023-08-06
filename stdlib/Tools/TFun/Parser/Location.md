# core:Tools/TFun/Parser/Location

Location is responsible for keeping track of the current position in the source file. It is used by the scanner to keep track of the location of tokens and is a critical ingredient in useful error reporting.

```fsharp xassert id=Import; style=exec
import * from "./Location.tfun"
```

The following are a collection of named locations used to test the `combine` function.

```fsharp xassert id=Values; style=exec; use=Import
let loc1 = Point { line: 1, column: 2, offset: 3 } ;
let loc2 = Point { line: 4, column: 5, offset: 6 } ;
let loc3 = Range { line: 7, column: 8, offset: 9 } { line: 7, column: 11, offset: 12 } ;
let loc4 = Range { line: 13, column: 14, offset: 15 } { line: 16, column: 17, offset: 18 }
```

### combine: Location -> Location -> Location

The most important function over `Location` is `combine` - the merging together of two locations. This is used by the scanner to combine the location of the start of a token with the location of the end of a token.

The following illustrates the `combine` function.

```fsharp xassert id=combine; use=Import, Values
combine loc1 loc1 == loc1

combine loc1 loc2 == Range { line: 1, column: 2, offset: 3 } { line: 4, column: 5, offset: 6 }
combine loc2 loc1 == Range { line: 1, column: 2, offset: 3 } { line: 4, column: 5, offset: 6 }

combine loc3 loc3 == loc3

combine loc1 loc3 == Range { line: 1, column: 2, offset: 3 } { line: 7, column: 11, offset: 12 }
combine loc3 loc1 == Range { line: 1, column: 2, offset: 3 } { line: 7, column: 11, offset: 12 }

combine loc3 loc4 == Range { line: 7, column: 8, offset: 9 } { line: 16, column: 17, offset: 18 }
combine loc4 loc3 == Range { line: 7, column: 8, offset: 9 } { line: 16, column: 17, offset: 18 }
```

### toString: Location -> String

The `toString` function is used to convert a `Location` into a string. This is used by the scanner to convert a location into a string for error reporting.

The following illustrates the `toString` function.

```fsharp xassert id=toString; use=Import, Values
toString loc1 == "1:2"
toString loc3 == "7:8-11"
toString loc4 == "13:14-16:17"
```
