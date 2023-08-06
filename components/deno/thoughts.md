The development of `tfun` is off of a number of iterations. It is _super_ important that these iterations are built off
of each other. These pages serve not only as a complete set of test cases but also a description of the language and how
the language is used.

Let's start.

```tfun xt
x = 1
y = "Hello"
---
x: Int = 1
y: String = "Hello"
```

The above is a simple program that declares two variables, `x` and `y`. The first variable is an `Int` and the second is
a `String`. The `---` is a delimiter that separates the program from the expected output. The expected output is a list
of variable names, types, and values. The `xt` command is a test command that runs the program and compares the output
to the expected output.

```tfun [id=List]
data List<T> = 
   Nil 
| Cons T List<T>
```

Now that we have a simple list data type, let's use it.

```tfun xt [use=[List]]
Nil
(Cons 1 Nil)
Cons 1 (Cons 2 (Cons 3 Nil))
---
[]: List<T>
[1]: List<Int>
[1, 2, 3]: List<Int>
```

const x: List<Int> = primes 1000 const if List.length x > 100 then Assert.fail "Too many primes"

length: List<T> -> Int length [] = 0 length (_::xs) = 1 + length xs

let rec length (xs: List<T>): Int = match xs with | [] -> 0 | _::xs -> 1 + length xs

```tfun solve
\x -> \y -> \z -> x + y + z
---
Int -> Int -> Int -> Int
```

Modules are a way to organize code. Firstly I would like to create a module that contains the `List` data type with a
handful of functions over the data type.

```tfun save [file=module/List.tfun]
data List*<T> = 
  Nil
| Cons T List<T>

let rec length* (xs: List<T>): Int =
  match xs with
  | [] -> 0
  | _::xs -> 1 + length xs

let rec map* (f: T -> U) (xs: List<T>): List<U> =
  match xs with
  | [] -> []
  | x::xs -> f x :: map f xs

let rec range (start: Int) (end: Int): List<Int> =
  if start > end then
    []
  else
    start :: range (start + 1) end
```

Now that we have a module, let's use it.

```tfun xt [use=[module/List]]
import * as List from "./module/List.tfun"

List.Nil
(List.Cons 1 List.Nil)

List.length (List.range 1 100)
---
Nil: List<T>
[1]: List<Int>
100: Int
```
