# Char

Functions for working with characters. Character literals are enclosed in a pair of single quotes.

```fsharp xassert id=Import; style=exec
import * from "./Char.tfun"
```

A `Char` is a single ASCII character (8 bits). Unicode characters are not supported.  Char literals, other than `'\n'`, are not supported and need to be created using the function `fromInt`.

```fsharp xt id=literal
'a'
---
'a': Char
```
