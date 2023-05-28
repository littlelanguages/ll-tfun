# ll-tfun

A typed functional language with IO side effects.

This little language builds on
[`tlca`](https://github.com/littlelanguages/ll-tlca) by adding the following
macro features:

- Packages,
- Record types,
- Value type signatures,
- Type aliases,
- Sequences of code,
- IO Operation side effects, and
- Standard prelude

Each of the preceding features are to be introduced and built in sequence.

The supported implementation for `tfun` are:

- A deno REPL
- A Kotlin REPL
- A Kotlin compiler that produces `tfun` specific bytecode
- A deno bytecode interpreter
- A Zig bytecode interpreter

# Packages

Each file consists of declarations where a declaration can be a value or an
abstract data type (ADT). A value declaration can either be accessible from
outside the package or not. If accessible outside then that declaration is said
to be _public_ otherwise it is _private_. ADT's declarations can be one of
_public_, _opaque_ or _private_. Public ADT's type and constructors are visible
outside the package, an opaque ADT's type is visible with the constructors
private and a private ADT is completely hidden.

A value or ADT declaration with a `*` suffix in it's name will be public. An ADT
declaration with a `-` suffix will be opaque. Note the following code:

```
data List* 'a = Nil | Cons a (List a) ;

data Result- 'a 'b = Error 'a | Okay 'b ;

data Option 'a = None | Some 'a ;

let rec length* lst =
  match lst of
  | Nil -> 0
  | Cons _ xs -> 1 + length xs ;

let listOf2 = Cons 1 (Cons 2 Nil)
```

The value `length` is public whilst `listOf2` is private. Similarly `List` and
its constructors `Nil` and `Cons` are public, `Result` is public however its
constructors `Error` and `Okay` are private, whilst `Option` and its
constructors are all private.

The importing of a package has the traditional syntax:

```
import * as List from "./List";
import * from "./../lib/Array";
import length*, map as listMap*, foldLeft, List from "./List";
import size as setSize* from "https://....../blah.tfun";
```

Some commentary on the above:

- The first imports an entire package under the qualifying name `List`. It is
  not possible to add scope qualifyers when importing a package in this manner
  with the declaration limited to the current package.
- The third line imports individual names, making `length` and `listMap` public
  while renaming `map` to `listMap`.
- The final line imports declarations from a remote package.

Finally packages may not be cyclically dependent.

# Records

Records operate as expected and mimics what is commonly available in functional languages.  Literal records are defined as follows:

```
let me = { name: "Graeme Lockley", age: 55, height: 180 } 
```

Fields within a record can be referenced using the standard `.`-notation.

```
me.name
```

Finally, on my birthday, my age can be ticked over.

```
{ me | age: me.age + 1 }
```


# See also

- [TODO](TODO.md) lists the tasks to implement this language
