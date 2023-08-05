# core:Data/Char

Functions for working with characters. Character literals are enclosed in a pair of single quotes.

```fsharp xassert id=Import; style=exec
import * from "./Char.tfun"
```

A `Char` is a single ASCII character (8 bits). Unicode characters are not supported.  Char literals, other than `'\n'`, are not supported and need to be created using the function `fromInt`.

```fsharp xt id=literalValue
'a' ;
'\'' ;
'\n' ;
'\\'
---
'a': Char
'\'': Char
'\n': Char
'\\': Char
```

Chars can also be used as literal values during pattern matching.

```fsharp xt id=literalPattern
match 'a' with 'a' -> True | _ -> False ;
match 'b' with 'a' -> True | _ -> False
---
True: Bool
False: Bool
```

## ASCII Characters

### isUpper: Char -> Bool

Detect upper case ASCII characters.

```fsharp xassert id=isUpper; use=Import
isUpper 'A' == True
isUpper 'B' == True
isUpper 'Z' == True

isUpper '0' == False
isUpper 'a' == False
isUpper '-' == False
```

### isLower: Char -> Bool

Detect lower case ASCII characters.

```fsharp xassert id=isLower; use=Import
isLower 'a' == True
isLower 'b' == True
isLower 'z' == True

isLower '0' == False
isLower 'A' == False
isLower '-' == False
```

### isAlpha: Char -> Bool

Detect upper case and lower case ASCII characters.

```fsharp xassert id=isAlpha; use=Import
isAlpha 'a' == True
isAlpha 'b' == True
isAlpha 'E' == True
isAlpha 'Y' == True

isAlpha '0' == False
isAlpha '-' == False
``````

### isAlphaDigit: Char -> Bool

Detect upper case, lower case or digit ASCII characters.

```fsharp xassert id=isAlphaDigit; use=Import
isAlphaDigit 'a' == True
isAlphaDigit 'b' == True
isAlphaDigit 'E' == True
isAlphaDigit 'Y' == True
isAlphaDigit '0' == True
isAlphaDigit '7' == True

isAlphaDigit '-' == False
```

### isDigit: Char -> Bool

Detect digit ASCII characters.

```fsharp xassert id=isDigit; use=Import
isDigit '0' == True
isDigit '1' == True
isDigit '9' == True

isDigit 'a' == False
isDigit 'b' == False
isDigit 'A' == False
```

## Conversion

### toUpper: Char -> Char

Converts to upper case

```fsharp xassert id=toUpper; use=Import
toUpper 'a' == 'A'
toUpper 'b' == 'B'
toUpper 'z' == 'Z'

toUpper 'A' == 'A'
toUpper 'B' == 'B'
toUpper 'Z' == 'Z'

toUpper '0' == '0'
toUpper '-' == '-'
```

### toLower: Char -> Char

Converts to lower case

```fsharp xassert id=toLower; use=Import
toLower 'a' == 'a'
toLower 'b' == 'b'
toLower 'z' == 'z'

toLower 'A' == 'a'
toLower 'B' == 'b'
toLower 'Z' == 'z'

toLower '0' == '0'
toLower '-' == '-'
```

### toInt: Char -> Int

Converts a char value to the corresponding ASCII integer value.

```fsharp xassert id=toInt; use=Import
toInt 'a' == 97
```

### toString: Char -> String

Converts a char value to a string of length 1 composed solely of the char value.

```fsharp xassert id=toString; use=Import
toString 'a' == "a"
```

### fromInt: Int -> Char

Converts an ASCII integer value to the corresponding char value.  Should the integer value be outside the range of ASCII values, the result is `' '`.

```fsharp xassert id=fromInt; use=Import
fromInt 32 == ' '
fromInt 10 == '\n'
fromInt 39 == '\''
fromInt 92 == '\\'
fromInt 65 == 'A'
fromInt 97 == 'a'
```
