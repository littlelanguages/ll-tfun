There are a number of macro features to be built and tested:

- Packages,
- Value type signatures,
- Record types,
- Type aliases,
- Sequences of code,
- IO Operation side effects, and
- Standard prelude

Each of the preceding macro featurse are to be built roughly in sequence.

# Packages

Each file consists of declarations where a declaration can be a value or an
abstract data type (ADT). A value declaration can either be accessible from outside
the package or not. If accessible outside then that declaration is said to be
_public_ otherwise it is _private_.  ADT's declarations can be one of _public_, _opaque_ or _private_.  Public ADT's type and constructors are visible outside the package, an opaque ADT's type is visible with the constructors private and a private ADT is completely hidden.

A value or ADT declaration with a `*` suffix in it's name will be public.  An ADT declaration with a `-` suffix will be opaque.  Note the following code:

```
data List* 'a = Nil | Cons a (List a) ;

data Result- 'a 'b = Error 'a | Okay 'b ;

data Option 'a = None | Some 'a ;

let rec length* lst =
  match lst of
  | Nil -> 0
  | Cons _ xs -> 1 + length xs

let listOf2 = Cons 1 (Cons 2 Nil)
```

The value `length` is public whilst `listOf2` is private.  Similaraly `List` and its constructors `Nil` and `Cons` are public, `Result` is public however its constructors `Error` and `Okay` are private, whilst `Option` and its constructors are all private.

Finally packages may not be cyclically dependent.


## Tasks

- [ ] Add visibility suffixes into the grammar
- [ ] Add `import` statement into grammar
- [ ] Load the declarations from a source file

