# core:Data/List

A list is a collection of values of the same type. Lists are immutable and can be constructed using the `::` operator, using the `[1, 2, 3]` syntax, or using the `Cons` and `Nil` constructors.

```fsharp xassert id=Import; style=exec
import * from "./List.tfun"
```

A list can be destructed using pattern matching.

```fsharp xt id=patternMatch1
match Cons 1 (Cons 2 (Cons 3 Nil)) with
| Cons x _ -> x
| Nil -> 0
---
1: Int
```

This can be written using `::` rather than explicit use of `Cons`.

```fsharp xt id=patternMatch2
match 1 :: 2 :: 3 :: Nil with
| x :: _ -> x
| Nil -> 0
---
1: Int
```

Finally this can be written using the `[1, 2, 3]` syntax.

```fsharp xt id=patternMatch3
match [1, 2, 3] with
| x :: _ -> x
| [] -> 0 ;

match [1, 2, 3] with
| [a, b, c] -> a + b + c
| [] -> 0
---
1: Int
6: Int
```
