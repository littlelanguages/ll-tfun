# core:Tools/TFun/Parser/Scanner

The purpose of a scanner is to convert a stream of characters into a stream of tokens. The scanner is the first stage of the parser. The scanner is also responsible for handling comments and whitespace.

```fsharp xassert id=Import; style=exec
import * from "./Scanner.tfun"
```

## See also

- [Location](./Location.md) is responsible for keeping track of the current position in the source file. It is used by the scanner to keep track of the location of tokens and is a critical ingredient in useful error reporting.
