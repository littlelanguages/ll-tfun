# String Calculator Kata

This code is of the [String Calculator Kata](https://katalyst.codurance.com/string-calculator) coded in `tfun`.  The code in this note is the entire kata completed so, when reading it, one does not see each individual step but rather the entire solution.  Nonetheless it is helpful to see the entire solution in one place and then, of course, to use it to verify that the `tfun` implementation is working as expected.

``` fsharp xt id=StringCalculatorKata
import * as Integer from "../stdlib/Data/Integer.tfun" ;
import * as List from "../stdlib/Data/List.tfun" ;
import * as Maybe from "../stdlib/Data/Maybe.tfun" ;
-- import * as String from "../stdlib/Data/String.tfun" ;
import * as RE from "../stdlib/Text/Regex.tfun" ;

let add input =
  if (input == "") 0
  else let separator = RE.parse ",|\\n"
       and numbers = List.map (Maybe.withDefault 0) (List.map Integer.parse (RE.split separator input))
        in List.sum numbers
---
add = function: String -> Int
```

The first test is to return `0` when the input is an empty string.

``` fsharp xt id=Given a blank; use=StringCalculatorKata
add ""
---
0: Int
```

The second test is to return the number when the input is a single number.

``` fsharp xt id=Given a value; use=StringCalculatorKata
add "1" ;
add "123"
---
1: Int
123: Int
```

The third test is to return the sum of numbers when separated with a comma

``` fsharp xt id=Given values separated with a comma; use=StringCalculatorKata
add "1,2,3,4"
---
10: Int
```

The next test is to return the sum of numbers when separated with a comma or newline.

``` fsharp xt id=Given values separated with a comma or newline; use=StringCalculatorKata
add "1,2\n3,4\n5"
---
15: Int
```

The custom separator test is to return the sum of numbers when separated with a single character custom separator.

``` fsharp xt id=Given values separated with a single character separator; use=StringCalculatorKata
add "//;\n1;2;3;4;5"
---
1: Int
```

