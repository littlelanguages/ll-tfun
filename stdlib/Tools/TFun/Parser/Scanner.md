# core:Tools/TFun/Parser/Scanner

The purpose of a scanner is to convert a stream of characters into a stream of tokens. The scanner is the first stage of the parser. The scanner is also responsible for handling comments and whitespace.

```fsharp xassert id=Import; style=exec
import * from "./Scanner.tfun"
```

### next: Scanner -> (Scanner * Token)

The `next` function is used to extract the next token from the scanner. It returns a tuple of the new scanner and the token.

In order to work through the scenarios we need to define a few helper functions.

```fsharp xassert id=tokens; style=exec; use=Import
import * as List from "../../../Data/List.tfun" ;

let tokens input = 
  let rec loop scanner = 
    match next scanner with
    | (_, EOS _) -> []
    | (scanner, token) -> token :: loop scanner
  in fromString input |> loop ;

let tokenStrings input = tokens input |> List.map toString
```

#### Scenario: Empty Input

```fsharp xassert id=nextEmptyInput; use=Import, tokens
tokens "" == []
```

#### Scenario: Whitespace

```fsharp xassert id=nextWhitespace; use=Import, tokens
tokens "    \n  \n   \n  " == []
```

#### Scenario: Literal Char

```fsharp xassert id=nextLiteralChar; use=Import, tokens
tokenStrings "'1'" == ["LiteralChar 1 1:1-3"]
tokenStrings "'\\''" == ["LiteralChar ' 1:1-4"]
```

#### Scenario: Literal Int

```fsharp xassert id=nextLiteralInt; use=Import, tokens
tokenStrings "123" == ["LiteralInt 123 1:1-3"]
tokenStrings "  123  " == ["LiteralInt 123 1:3-5"]
tokenStrings "  123  4  " == ["LiteralInt 123 1:3-5", "LiteralInt 4 1:8"]
```

#### Scenario: Literal String

```fsharp xassert id=nextLiteralString; use=Import, tokens
tokenStrings "\"hello\"" == ["LiteralString hello 1:1-7"]
tokenStrings "  \"hello\"  " == ["LiteralString hello 1:3-9"]
tokenStrings "  \"hello\"  \"world\"  " == ["LiteralString hello 1:3-9", "LiteralString world 1:12-18"]
```

Literal strings also support escape sequences as demonstrated below.

```fsharp xassert id=nextLiteralStringEscape; use=Import, tokens
tokenStrings "\"[\\\"]\"" == ["LiteralString [\"] 1:1-6"]
tokenStrings "\"[\\\\]\"" == ["LiteralString [\\] 1:1-6"]
```

#### Scenario: Lower Identifier

```fsharp xassert id=nextLowerIdentifier; use=Import, tokens
tokenStrings "hello" == ["LowerIdentifier hello 1:1-5"]
tokenStrings "  hello  " == ["LowerIdentifier hello 1:3-7"]
tokenStrings "  hello  world  " == ["LowerIdentifier hello 1:3-7", "LowerIdentifier world 1:10-14"]
```

#### Scenario: Symbols

```fsharp xassert id=nextSymbols; use=Import, tokens
tokenStrings "," == ["',' 1:1"]
```

#### Scenario: Upper Identifier

```fsharp xassert id=nextUpperIdentifier; use=Import, tokens
tokenStrings "Hello" == ["UpperIdentifier Hello 1:1-5"]
tokenStrings "  Hello  " == ["UpperIdentifier Hello 1:3-7"]
tokenStrings "  Hello  World  " == ["UpperIdentifier Hello 1:3-7", "UpperIdentifier World 1:10-14"]
```

### toString: Token -> String

The `toString` function is used to convert a token into a string. This is useful for debugging and error reporting.

```fsharp xassert id=toString; style=exec; use=Import
toString (LowerIdentifier "hello" (Range {line: 1, column: 1, offset: 2} {line:1, column: 5, offset: 6})) == "LowerIdentifier hello 1:1-5"
```

## See also

- [Location](./Location.md) is responsible for keeping track of the current position in the source file. It is used by the scanner to keep track of the location of tokens and is a critical ingredient in useful error reporting.
