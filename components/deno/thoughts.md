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

Some other thoughts around an trait based language. Well everything is an object and an object, by declaration, has an
interface. That facet is normative. The traits are structural. Let's take an example of a list.

```
data List<T> = Nil | Cons T List<T>
```

Now this all looks surprisingly similar to tfun. We now introduce methods over `List<T>`.

```
fun List<T>.length: Int = 
  match this with
  | Nil -> 0
  | Cons _ xs -> 1 + xs.length

fun List<T>.map<S>(f: T -> S): List<S> =
  match this with
  | Nil -> Nil
  | Cons x xs -> Cons (f x) (xs.map f)
```

Further to that we can introduce methods that are specific to a particular type of list.

```
fun List<Int>.sum(): Int =
  match this with
  | Nil -> 0
  | Cons x xs -> x + xs.sum
```

Can even take this a step further and consider the scenario where the type variable `T` is constrained to a particular
trait.

```
fun List<T: Stringable>.join(): String =
  match this with
  | Nil -> ""
  | Cons x Nil -> x.toString
  | Cons x xs -> x.toString + "," + xs.join

fun List<T: Stringable>.toString: String =
  "[" + this.join + "]"
```

I can go further and introduce the idea of a `Foldable` trait.

```
trait Foldable<T>
  fun foldl: (S -> T -> S) -> S -> S
  fun foldr: (T -> S -> S) -> S -> S
```

Now I can introduce a `List` instance of `Foldable`.

```
fun List<T>.foldl<S> (f: S -> T -> S) (s: S): S =
  match this with
  | Nil -> s
  | Cons x xs -> xs.foldl f (f s x)

fun List<T>.foldr<S> (f: T -> S -> S) (s: S): S =
  match this with
  | Nil -> s
  | Cons x xs -> f x (xs.foldr f s)
```

Now I can introduce a `sum` function that is generic over any `Foldable` type.

```
fun sum<T: Foldable<Int>> (xs: T): Int =
  xs.foldl (\s x -> s + x) 0
```

I can also rewrite `map` in terms of `foldr`.

```
fun List<T>.map<S> (f: T -> S): List<S> =
  this.foldr (\x xs -> Cons (f x) xs) Nil
```

Rewriting `join` is a little more tricky because `join` is not a function that is generic over any `Foldable` type. It
is specific to `List`.

```
fun List<T: Stringable>.join(): String =
  this.foldl (\s x -> s + "," + x.toString) ""
```

Unfortunately the above code doesn't work particularly well for a single element list. The `join` function will return a
string that starts with a comma. We can fix this by introducing a `Stringable` trait.

What about a thing that has a `length`?

What about iteration? We have two traits to get this working - firstly a container to iterate over and then the iterator
itself.

```
trait Iterable<T>
  fun iterator(): Iterator<T>
  
trait Iterator<T> =
  fun next(): Option<T>
```

We now implement `fold` over `Iterator`.

```
fun Iterator<T>.foldl<S> (f: S -> T -> S) (s: S): S =
  match this.next with
  | None -> s
  | Some x -> this.foldl f (f s x)

fun Iterator<T>.foldr<S> (f: T -> S -> S) (s: S): S =
  match this.next with
  | None -> s
  | Some x -> f x (this.foldr f s)
```

With this definition we can also implement `fold` over `Iterable`.

```
fun Iterable<T>.foldl<S> (f: S -> T -> S) (s: S): S =
  this.iterator().foldl f s

fun Iterable<T>.foldr<S> (f: T -> S -> S) (s: S): S =
  this.iterator().foldr f s
```

Now that we have `Iterable` and `fold` over `Iterator` we can implement `length` and `sum` in terms of these
definitions.

```
fun Iterable<T>.length(): Int =
  this.foldl (\s _ -> s + 1) 0

fun Iterable<Int>.sum(): Int =
  this.foldl (\s x -> s + x) 0
```

All that is now left is to implement `iterator` over a generic list.

```
fun List<T>.iterator(): Iterator<T> =
  { _state!: this
    next: () -> 
      match _state with
      | Nil -> Nothing
      | Cons x xs -> 
          _state! := xs
          Just x
    clone: () -> 
      { _state: _state! | self }
  }
```

With this we can now test out using a REPL.

```
> let x = [1, 2, 3, 4, 5]
x: List<Int>

> x.length()
5: Int

> x.sum()
15: Int
```

What is unbelievably cool about this is that the methods `length` and `sum` are not defined on `List`. They are defined
on `Iterable`. This means that these methods will work on any type that implements `Iterable`. It means that these
methods need not be defined or even thought of when `List` is being developed. This has the great fortune of being able
to add methods onto an existing class simply because the class, structurally, has the right shape.

Can this be made to work? I think so. My tenant is that the program remains a "scripted" language in the sense that, as
the program is processed, element by element, the declarations are expanded upon and consistency is validated with each
step. This piece requires more thinking but the principle seems sound. The implication of this is that, if the `List`
above is brought into scope but the `Iterable` or `length` and `sum` are not, then the program will fail to compile.
This is because traits are not universal facts but rather contextual.

This seems a little weird but, after some reflection, makes sense.

This all seems perhaps a little too weird. What would be a middle ground:

- tfun +
- destruction on declaration
- var side effects
- record fields can be declared as mutable
- tuple patterns
- indent based syntax
- exception handling - not having it is annoying

Issue with deno - it is slow! Option 2 - Kotlin or Zigg. Zigg would be super fast. Kotlin would be a little slower but I
understand it better and the memory management is MUCH simpler. Zigg will build on my laptop whilst Kotlin will not.
Kotlin has an source level debugger which Zigg doesn't...

What about removing the curried functions and rather adopting an old fashioned procedural style.

```
fun fold(f: (S, T) -> S, s: S, xs: List<T>): S =
  match xs with
  | Nil -> s
  | Cons x xs -> fold(f, f(s, x), xs)
```

This is a little more verbose but it is also a little more familiar. It also means that we can now introduce a `sum`
function.

```
let sum(xs: List<Int>): Int =
  let compose(s: Int, x: Int): Int = s + x

  fold(compose, 0, xs)
```

An even more traditional style would be to introduce a `for` loop.

```
let sum(xs: List<Int>): Int =
  var s := 0

  for x in xs
    s += x
  s
```

Is there anyway to start to introduce ADT based methods?

```
data List<T> = Nil | Cons T List<T>

let List<T>.fold(f: (S, T) -> S, s: S): S =
  match this with
  | Nil -> s
  | Cons x xs -> xs.fold(f, f(s, x))

let List<Int>.sum(): Int =
  this.fold(fun (s, x) = s + x, 0)
```
