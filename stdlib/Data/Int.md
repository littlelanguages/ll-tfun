# core:Data/Integer

Functions for working with Integers.

```fsharp xassert id=Import; style=exec
import * from "./Int.tfun"
```

An `Int` is a 64-bit signed integer. Integer literals are written as a sequence of digits.

```fsharp xt id=literalValue; use=Import
0 ;
1 ;
-1 ;
1234567890123456
---
0: Int
1: Int
-1: Int
1234567890123456: Int
```

Integers can also be used as literal values during pattern matching.

```fsharp xt id=literalPattern; use=Import
match 0 with 0 -> True | _ -> False ;
match 1 with 0 -> True | _ -> False
---
True: Bool
False: Bool
```

## Conversion

### fromString: String -> Maybe Int

Convert a string into an integer using best endeavors.

```fsharp xassert id=fromString; use=Import
fromString "0" == Just 0
fromString "1" == Just 1
fromString "-1" == Just -1
fromString "1234567890123456" == Just 1234567890123456
fromString "1a" == Just 1

fromString "a" == Nothing
fromString "a1" == Nothing
fromString "1a1" == Just 1
fromString "1.1" == Just 1
```

### toString: Int -> String

Convert an integer into a string.

```fsharp xassert id=toString; use=Import
toString 0 == "0"
toString 1 == "1"
toString -1 == "-1"
```
