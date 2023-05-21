import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.137.0/testing/asserts.ts";

import { defaultEnv, executeImport, executeProgram } from "./Interpreter.ts";
import { parse } from "./Parser.ts";
import { expressionToNestedString, NestedString } from "./Values.ts";
import { home } from "./Src.ts";

Deno.test("App 1", () => {
  assertExecute("(\\n -> n + 1) 1", ["2: Int"]);
});

Deno.test("App", () => {
  assertExecute("(\\a -> \\b -> a + b) 10 20", ["30: Int"]);
});

Deno.test("If", () => {
  assertExecute("if (True) 1 else 2", ["1: Int"]);
  assertExecute("if (False) 1 else 2", ["2: Int"]);
});

Deno.test("Lam", () => {
  assertExecute("\\a -> \\b -> a + b", ["function: Int -> Int -> Int"]);
});

Deno.test("Let", () => {
  assertExecute("let add a b = a + b and incr = add 1 ; incr 10", [
    ["add = function: Int -> Int -> Int", "incr = function: Int -> Int"],
    "11: Int",
  ]);
  assertExecute("let add a b = a + b and incr = add 1 in incr 10", ["11: Int"]);
});

Deno.test("LetRec", () => {
  assertExecute(
    "let rec fact n = if (n == 0) 1 else n * (fact (n - 1)) ; fact",
    [["fact = function: Int -> Int"], "function: Int -> Int"],
  );
  assertExecute(
    "let rec fact n = if (n == 0) 1 else n * (fact (n - 1)) ; fact 5",
    [["fact = function: Int -> Int"], "120: Int"],
  );
  assertExecute(
    "let rec fact n = if (n == 0) 1 else n * (fact (n - 1)) in fact",
    ["function: Int -> Int"],
  );
  assertExecute(
    "let rec fact n = if (n == 0) 1 else n * (fact (n - 1)) in fact 5",
    ["120: Int"],
  );

  assertExecute(
    "let rec isOdd n = if (n == 0) False else isEven (n - 1) and isEven n = if (n == 0) True else isOdd (n - 1) ; isEven 5",
    [
      ["isOdd = function: Int -> Bool", "isEven = function: Int -> Bool"],
      "false: Bool",
    ],
  );
  assertExecute(
    "let rec isOdd n = if (n == 0) False else isEven (n - 1) and isEven n = if (n == 0) True else isOdd (n - 1) ; isOdd 5",
    [
      ["isOdd = function: Int -> Bool", "isEven = function: Int -> Bool"],
      "true: Bool",
    ],
  );
  assertExecute(
    "let rec isOdd n = if (n == 0) False else isEven (n - 1) and isEven n = if (n == 0) True else isOdd (n - 1) in isEven 5",
    ["false: Bool"],
  );
  assertExecute(
    "let rec isOdd n = if (n == 0) False else isEven (n - 1) and isEven n = if (n == 0) True else isOdd (n - 1) in isOdd 5",
    ["true: Bool"],
  );
});

Deno.test("LBool", () => {
  assertExecute("True", ["true: Bool"]);
  assertExecute("False", ["false: Bool"]);
});

Deno.test("LInt", () => {
  assertExecute("123", ["123: Int"]);
});

Deno.test("LString", () => {
  assertExecute('"hello"', ['"hello": String']);
  assertExecute('"\\"hello\\""', ['"\\"hello\\"": String']);
});

Deno.test("LTuple", () => {
  assertExecute('(1, "hello", (), True)', [
    '(1, "hello", (), true): (Int * String * () * Bool)',
  ]);
});

Deno.test("LUnit", () => {
  assertExecute("()", ["(): ()"]);
});

Deno.test("Match", () => {
  assertExecute("match True with x -> x", ["true: Bool"]);
  assertExecute("match False with x -> x", ["false: Bool"]);
  assertExecute("match () with x -> x", ["(): ()"]);
  assertExecute('match "hello" with x -> x', ['"hello": String']);
  assertExecute("match (1, 2) with (x, y) -> x + y", ["3: Int"]);

  assertExecute(
    "match (1, (False, 99)) with (_, (False, x)) -> x | (x, (True, _)) -> x",
    ["99: Int"],
  );
  assertExecute(
    "match (1, (True, 99)) with (_, (False, x)) -> x | (x, (True, _)) -> x",
    ["1: Int"],
  );
});

Deno.test("Op", () => {
  assertExecute("1 == 2", ["false: Bool"]);
  assertExecute("2 == 2", ["true: Bool"]);

  assertExecute("3 + 2", ["5: Int"]);
  assertExecute("3 - 2", ["1: Int"]);
  assertExecute("3 * 2", ["6: Int"]);
  assertExecute("9 / 2", ["4: Int"]);
});

Deno.test("Var", () => {
  assertExecute("let x = 1 ; x", [["x = 1: Int"], "1: Int"]);
  assertExecute("let x = True ; x", [["x = true: Bool"], "true: Bool"]);
  assertExecute("let x = \\a -> a ; x", [
    ["x = function: V1 -> V1"],
    "function: V1 -> V1",
  ]);

  assertExecute("let x = 1 in x", ["1: Int"]);
  assertExecute("let x = True in x", ["true: Bool"]);
  assertExecute("let x = \\a -> a in x", ["function: V2 -> V2"]);
});

Deno.test("Data Declaration - declaration", () => {
  assertExecute("data Boolean = BTrue | BFalse", ["Boolean = BTrue | BFalse"]);
  assertExecute("data List a = Cons a (List a) | Nil", [
    "List a = Cons a (List a) | Nil",
  ]);
  assertExecute("data Funny a b = A a (a -> b) b | B a (a * b) b | C ()", [
    "Funny a b = A a (a -> b) b | B a (a * b) b | C ()",
  ]);
  assertExecute("data Funny = A Int | B String | C Bool", [
    "Funny = A Int | B String | C Bool",
  ]);
});

Deno.test("Data Declaration - execute", () => {
  assertExecute("data Boolean = BTrue | BFalse ; BTrue", [
    "Boolean = BTrue | BFalse",
    "BTrue: Boolean",
  ]);

  assertExecute(
    "data List a = Cons a (List a) | Nil; Nil; Cons; Cons 10; Cons 10 (Cons 20 (Cons 30 Nil))",
    [
      "List a = Cons a (List a) | Nil",
      "Nil: List V1",
      "function: V1 -> List V1 -> List V1",
      "function: List Int -> List Int",
      "Cons 10 (Cons 20 (Cons 30 Nil)): List Int",
    ],
  );
});

Deno.test("Data Declaration - match", () => {
  assertExecute(
    "data List a = Cons a (List a) | Nil; let rec range n = if (n == 0) Nil else (Cons n (range (n - 1))) ; match (range 10) with | Nil -> 0 | Cons v _ -> v",
    [
      "List a = Cons a (List a) | Nil",
      ["range = function: Int -> List Int"],
      "10: Int",
    ],
  );
});

Deno.test("Error - add visibility ot non-toplevel declaration", () => {
  assertError("let x = let y* = 10 in y + y", {
    type: "VisibilityModifierError",
    name: "y",
    Visibility: 0,
  });
  assertExecute("let x* = let y = 10 in y + y", [["x = 20: Int"]]);
});

Deno.test("Import - raw mechanism using simple.tfun", () => {
  const ip = executeImport("./tests/simple.tfun", home());

  assertEquals(ip.length, 4);

  assertEquals(ip[0][0], "x");
  assertEquals(ip[0][1], 10);

  assertEquals(ip[1][0], "y");
  assertEquals(ip[1][1], 20);

  assertEquals(ip[2][0], "double");
  assertEquals(ip[2][1](5), 10);

  assertEquals(ip[3][0], "square");
  assertEquals(ip[3][1](5), 25);
});

Deno.test("Import - simple values", () => {
  assertExecute('import * from "./tests/simple.tfun"; double x ; square y', [
    "import",
    "20: Int",
    "400: Int",
  ]);
  assertError('let y = 1 ; import * from "./tests/simple.tfun"', {
    type: "ImportNameAlreadyDeclared",
    name: "y",
  });

  assertExecute('import x, double from "./tests/simple.tfun"; double x', [
    "import",
    "20: Int",
  ]);
  assertError(
    'import x, double from "./tests/simple.tfun"; square y',
    "Unknown name: square",
  );

  assertExecute(
    'import x as value, double as fun from "./tests/simple.tfun"; fun value',
    ["import", "20: Int"],
  );
  assertError(
    'let value = 1 ; import x as value, double as fun from "./tests/simple.tfun"',
    {
      type: "ImportNameAlreadyDeclared",
      name: "value",
    },
  );
});

Deno.test("Import - nested simple values", () => {
  assertExecute(
    'import * from "./tests/simple-nested.tfun" ; constant ; quad 10 ; id ; id 47',
    [
      "import",
      "function: V1 -> V2 -> V1",
      "10000: Int",
      "function: V1 -> V1",
      "47: Int",
    ],
  );
});

const assertExecute = (expression: string, expected: NestedString) => {
  const ast = parse(expression);
  const [result, _] = executeProgram(ast, defaultEnv(home()));

  ast.forEach((e, i) => {
    if (e.type === "DataDeclaration") {
      assertEquals(result[i][0].toString(), expected[i]);
    } else if (e.type !== "ImportStatement") {
      const [value, type] = result[i];

      assertEquals(expressionToNestedString(value, type!, e), expected[i]);
    }
  });
};

// deno-lint-ignore no-explicit-any
type MyError = any;

const assertError = (expression: string, error: MyError) => {
  const ast = parse(expression);
  try {
    executeProgram(ast, defaultEnv(home()));
    assert(false);
  } catch (e) {
    assertEquals(e, error);
  }
};
