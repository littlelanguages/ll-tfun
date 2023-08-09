# core:Tools/TFun/Parser/Scanner

The purpose of a scanner is to convert a stream of characters into a stream of tokens. The scanner is the first stage of the parser. The scanner is also responsible for handling comments and whitespace.

```fsharp xassert id=Import; style=exec
import * from "./Scanner.tfun"
```

## Funny

The following code is erroring - it is not clear why.

```fsharp xassert id=funny1; style=exec; use=Import
isWhitespace 'x'
```

```fsharp xassert id=funny2; style=exec; use=Import
skipWhitespace (fromString "  \n  ") == fromString "  \n  "
```

### next: Scanner -> (Scanner * Token)

The `next` function is used to extract the next token from the scanner. It returns a tuple of the new scanner and the token.

In order to work through the scenarios we need to define a few helper functions.

```fsharp xassert id=tokens; style=exec; use=Import
let tokens input = 
  let rec loop scanner = 
    match next scanner with
    | (_, EOS _) -> []
    | (scanner, token) -> token :: loop scanner
  in fromString input |> loop
```

#### Scenario: Empty Input

```fsharp xassert id=nextEmptyInput; use=Import, tokens
tokens "" == []
```

#### Scenario: Whitespace

```fsharp xassert id=nextWhitespace; use=Import, tokens
tokens "    \n  \n   \n  " == []
```

#### Scenario: Upper Identifier

```fsharp xassert id=nextUpperIdentifier; use=Import, tokens
tokens "Hello" == [UpperIdentifier "Hello" (Range { column: 0, line: 0, offset: 0 } { column: 0, line: 0, offset: 5 })]
tokens "  Hello  " == [UpperIdentifier "Hello" (Range { column: 0, line: 0, offset: 2 } { column: 0, line: 0, offset: 7 })]
tokens "  Hello  World  " == [UpperIdentifier "Hello" (Range { column: 0, line: 0, offset: 2 } { column: 0, line: 0, offset: 7 }), UpperIdentifier "World" (Range { column: 0, line: 0, offset: 9 } { column: 0, line: 0, offset: 14 })]
```

## See also

- [Location](./Location.md) is responsible for keeping track of the current position in the source file. It is used by the scanner to keep track of the location of tokens and is a critical ingredient in useful error reporting.
