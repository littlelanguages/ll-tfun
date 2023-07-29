```fsharp xt id=Scratch
let rec range n = if (n == 0) Nil else (Cons n (range (n - 1))) ; 
match (range 10) with | Nil -> 0 | Cons v _ -> v
---
range = function: Int -> List Int
10: Int
```
