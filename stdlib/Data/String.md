# core:Data/String

A string is a chunk of text.

```fsharp xassert id=Import; style=exec
import * from "./String.tfun"
```

### isEmpty: String -> Bool

Determine if a string is empty.

```fsharp xassert id=isEmpty; use=Import
isEmpty "" == True
isEmpty "the world" == False
```

### length: String -> Int

Get the length of a string.

```fsharp xassert id=length; use=Import
length "" == 0
length "the world" == 9
```

### reverse: String -> String

Reverse a string.

```fsharp xassert id=reverse; use=Import
reverse "" == ""
reverse "stressed" == "desserts"
```

### repeat: Int -> String -> String 

Repeat a string *n* times.

```fsharp xassert id=repeat; use=Import
repeat 0 "Rodger" == ""
repeat 2 "Rodger" == "RodgerRodger"
```

### replace: String -> String -> String -> String

Replace all occurrences of some substring.

```fsharp xassert id=replace; use=Import
replace " " "-" "Bye bye love" == "Bye-bye-love"
replace "," "/" "a,b,c,d,e" == "a/b/c/d/e"
replace "*" "" "a*b*c*d*e" == "abcde"
```

## Building and Splitting

# append: String -> String -> String

Append two strings.

```fsharp xassert id=append; use=Import
append "Star" "Wars" == "StarWars"
```
