# core:Tools/TFun/Interpreter

The interpreter is the final stage of the compiler taking the AST and executing it. The interpreter is responsible for handling the semantics of the language.  This document is broken up into the different language features and can be used as an introduction into understanding TFun. 

```fsharp xassert id=Import; style=exec
import * from "./Interpreter.tfun"
```

## Literal Values

### Bool

```fsharp xassert id=literalBool; use=Import
parseAndExecute "True" == Okay (VBool True)
parseAndExecute "False" == Okay (VBool False)
```

### Int

```fsharp xassert id=literalInt; use=Import
parseAndExecute "0" == Okay (VInt 0)
parseAndExecute "-0" == Okay (VInt 0)
parseAndExecute "123" == Okay (VInt 123)
parseAndExecute "-123" == Okay (VInt -123)
```

