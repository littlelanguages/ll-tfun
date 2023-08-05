# String Calculator Kata

This code is of the
[String Calculator Kata](https://katalyst.codurance.com/string-calculator) coded
in `tfun`. The code in this note is the entire kata completed so, when reading
it, one does not see each individual step but rather the entire solution.
Nonetheless it is helpful to see the entire solution in one place and then, of
course, to use it to verify that the `tfun` implementation is working as
expected.

```fsharp xt id=StringCalculatorKata
import * as Integer from "../stdlib/Data/Integer.tfun" ;
import * as List from "../stdlib/Data/List.tfun" ;
import * as Maybe from "../stdlib/Data/Maybe.tfun" ;
import * as Result from "../stdlib/Data/Result.tfun" ;
import * as String from "../stdlib/Data/String.tfun" ;
import * as RE from "../stdlib/Text/Regex.tfun" ;

let add input =
  let content =
    if (input == "") 
      { separator: RE.parse ","
      , input: "0" 
      }
    else if (String.startsWith "//" input)
      match String.indexOf "\n" input with
      | Nothing -> { separator: RE.parse ",", input: "0" }
      | Just i ->
          let separator: String = String.slice 2 i input
           in if (String.startsWith "[" separator)
                { separator: separator
                      |> String.dropLeft 1
                      |> String.dropRight 1
                      |> RE.split (RE.parse "\]\[") 
                      |> List.map RE.literal 
                      |> List.join "|" 
                      |> RE.parse
                , input: String.dropLeft (i + 1) input
                }
              else
                { separator: separator |> RE.literal |> RE.parse
                , input: String.dropLeft (i + 1) input
                }
    else
      { separator: RE.parse ",|\\n" 
      , input: input
      }
  and numbers = 
        content.input
          |> RE.split content.separator
          |> List.map Integer.parse
          |> List.map (Maybe.withDefault 0)
  and negative n = n < 0
   in if (List.any negative numbers)
        numbers
          |> List.filter negative
          |> Error
      else
        numbers
          |> List.filter (\n = n < 1001)
          |> List.sum
          |> Okay
---
add = function: String -> Result (List Int) Int
```

## TDD Scenarios

Test Empty String: The function should return 0 for an empty string input.

```fsharp xt id=EmptyString; use=StringCalculatorKata
add ""
---
Okay 0: Result (List Int) Int
```

Test Single Number: The function should return the number itself if there is only one number in the input.

```fsharp xt id=SingleNumber; use=StringCalculatorKata
add "1"
---
Okay 1: Result (List Int) Int
```

Test Two Numbers: The function should return the sum of two numbers separated by a comma.

```fsharp xt id=TwoNumbers; use=StringCalculatorKata
add "1,2"
---
Okay 3: Result (List Int) Int
```

Test Multiple Numbers: The function should handle more than two numbers.
```fsharp xt id=MultipleNumbers; use=StringCalculatorKata
add "1,2,3,4,5,6"
---
Okay 21: Result (List Int) Int
```

Test Newline Delimiter: The function should handle newline delimiters as well as commas.

```fsharp xt id=NewlineDelimiter; use=StringCalculatorKata
add "1,2\n3,4\n5\n6"
---
Okay 21: Result (List Int) Int
```

Test Custom Delimiter: The function should support a custom delimiter specified at the beginning of the input.

```fsharp xt id=CustomDelimiter; use=StringCalculatorKata
add "//;\n1" ;
add "//;\n1;2;3;4;5" ;
add "//*\n1*2*3*4*5"
---
Okay 1: Result (List Int) Int
Okay 15: Result (List Int) Int
Okay 15: Result (List Int) Int
```

Test Negative Numbers: The function should raise an exception with the negative numbers listed if negative numbers are present in the input.

```fsharp xt id=NegativeNumbers; use=StringCalculatorKata
add "1,4,-3,-2" ;
add "1,4\n-3,-2" ;
add "//*\n1*4*-3*-2"
---
Error [-3, -2]: Result (List Int) Int
Error [-3, -2]: Result (List Int) Int
Error [-3, -2]: Result (List Int) Int
```

Test Ignore Large Numbers: The function should ignore numbers greater than 1000 in the sum.

```fsharp xt id=IgnoreLargeNumbers; use=StringCalculatorKata
add "2,1001,6,999" ;
add "2,1001\n6,999" ;
add "//;\n2;1001;6;999"
---
Okay 1007: Result (List Int) Int
Okay 1007: Result (List Int) Int
Okay 1007: Result (List Int) Int
```

Test Multiple Custom Delimiters: The function should support multiple custom delimiters.

```fsharp xt id=MultipleCustomDelimiters; use=StringCalculatorKata
add "//[*][%]\n1*2%3"
---
Okay 6: Result (List Int) Int
```

Test Multiple Custom Delimiters with Any Length: The function should handle multiple custom delimiters with any length, enclosed in square brackets.

```fsharp xt id=MultipleCustomDelimiters; use=StringCalculatorKata
add "//[***][%%]\n1***2%%3"
---
Okay 6: Result (List Int) Int
```

Test Delimiters with Special Characters: The function should handle delimiters that include special characters.

```fsharp xt id=MultipleCustomDelimiters; use=StringCalculatorKata
add "//[#@][&]\n2#@3&5"
---
Okay 10: Result (List Int) Int
```
