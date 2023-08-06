import { assert, assertEquals } from "https://deno.land/std@0.137.0/testing/asserts.ts";

import { defaultEnv, emptyEnv, importPackage, parseExecute } from "./Interpreter.ts";
import { expressionToNestedString, NestedString } from "./Values.ts";
import { home } from "./Src.ts";
import * as Location from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.1.1/location.ts";
import { UnificationMismatchException } from "./Errors.ts";

const urn = home.newSrc("./Constraints.test.ts");
const arbLocation = Location.mkCoordinate(0, 0, 0);

Deno.test("App 1", () => {
  assertExecute("(\\n = n + 1) 1", ["2: Int"]);
});

Deno.test("App", () => {
  assertExecute("(\\a = \\b = a + b) 10 20", ["30: Int"]);
});

Deno.test("If", () => {
  assertExecute("if (True) 1 else 2", ["1: Int"]);
  assertExecute("if (False) 1 else 2", ["2: Int"]);
});

Deno.test("Lam", () => {
  assertExecute("\\a = \\b = a + b", ["function: Int -> Int -> Int"]);
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
      "False: Bool",
    ],
  );
  assertExecute(
    "let rec isOdd n = if (n == 0) False else isEven (n - 1) and isEven n = if (n == 0) True else isOdd (n - 1) ; isOdd 5",
    [
      ["isOdd = function: Int -> Bool", "isEven = function: Int -> Bool"],
      "True: Bool",
    ],
  );
  assertExecute(
    "let rec isOdd n = if (n == 0) False else isEven (n - 1) and isEven n = if (n == 0) True else isOdd (n - 1) in isEven 5",
    ["False: Bool"],
  );
  assertExecute(
    "let rec isOdd n = if (n == 0) False else isEven (n - 1) and isEven n = if (n == 0) True else isOdd (n - 1) in isOdd 5",
    ["True: Bool"],
  );
});

Deno.test("LBool", () => {
  assertExecute("True", ["True: Bool"]);
  assertExecute("False", ["False: Bool"]);
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
    '(1, "hello", (), True): (Int * String * () * Bool)',
  ]);
});

Deno.test("LUnit", () => {
  assertExecute("()", ["(): ()"]);
});

Deno.test("Match", () => {
  assertExecute("match True with x -> x", ["True: Bool"]);
  assertExecute("match False with x -> x", ["False: Bool"]);
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

  assertExecute(
    "match {a: 10, b: 20} with {a: x, b: y} -> x + y",
    ["30: Int"],
  );
  assertExecute(
    "match {a: 10, b: 20} with {a, b} -> a + b",
    ["30: Int"],
  );
  assertExecute(
    "match {a: 10, b: 20} with {a | _} -> a + a",
    ["20: Int"],
  );
  assertExecute(
    "match {a: 10, b: 20} with {a: 10 | _} -> 0 | {a: 20 | _ } -> 1 | _ -> 2",
    ["0: Int"],
  );
  assertExecute(
    "match {a: 20, b: 20} with {a: 10 | _} -> 0 | {a: 20 | _ } -> 1 | _ -> 2",
    ["1: Int"],
  );
  assertExecute(
    "match {a: 30, b: 20} with {a: 10 | _} -> 0 | {a: 20 | _ } -> 1 | _ -> 2",
    ["2: Int"],
  );
});

Deno.test("Op", () => {
  assertExecute("1 == 2", ["False: Bool"]);
  assertExecute("2 == 2", ["True: Bool"]);
  assertExecute("1 /= 2", ["True: Bool"]);
  assertExecute("2 /= 2", ["False: Bool"]);

  assertExecute("1 < 2", ["True: Bool"]);
  assertExecute("2 < 2", ["False: Bool"]);
  assertExecute("3 < 2", ["False: Bool"]);

  assertExecute("1 <= 2", ["True: Bool"]);
  assertExecute("2 <= 2", ["True: Bool"]);
  assertExecute("3 <= 2", ["False: Bool"]);

  assertExecute("1 > 2", ["False: Bool"]);
  assertExecute("2 > 2", ["False: Bool"]);
  assertExecute("3 > 2", ["True: Bool"]);

  assertExecute("1 >= 2", ["False: Bool"]);
  assertExecute("2 >= 2", ["True: Bool"]);
  assertExecute("3 >= 2", ["True: Bool"]);

  assertExecute("3 + 2", ["5: Int"]);
  assertExecute("3 - 2", ["1: Int"]);
  assertExecute("3 * 2", ["6: Int"]);
  assertExecute("9 / 2", ["4: Int"]);
});

Deno.test("Records", () => {
  assertExecute("let x = {a: 10} ; x ; x.a", [
    ["x = { a: 10 }: { a: Int }"],
    "{ a: 10 }: { a: Int }",
    "10: Int",
  ]);
  assertExecute('let x = {a: 10, b: "Hello"} ; x ; x.b', [
    ['x = { a: 10, b: "Hello" }: { a: Int, b: String }'],
    '{ a: 10, b: "Hello" }: { a: Int, b: String }',
    '"Hello": String',
  ]);

  assertExecute("let rect a b = {a: a, b: b} ; rect 10 20", [
    ["rect = function: V1 -> V2 -> { a: V1, b: V2 }"],
    "{ a: 10, b: 20 }: { a: Int, b: Int }",
  ]);

  assertExecute(
    "let add a = a.a + a.b + a.c ; add {a: 10, b: 20, c: 30, d: 40}",
    [
      ["add = function: { a: Int, b: Int, c: Int | V12 } -> Int"],
      "60: Int",
    ],
  );
});

Deno.test("Var", () => {
  assertExecute("let x = 1 ; x", [["x = 1: Int"], "1: Int"]);
  assertExecute("let x = True ; x", [["x = True: Bool"], "True: Bool"]);
  assertExecute("let x = \\a = a ; x", [
    ["x = function: V1 -> V1"],
    "function: V1 -> V1",
  ]);

  assertExecute("let x = 1 in x", ["1: Int"]);
  assertExecute("let x = True in x", ["True: Bool"]);
  assertExecute("let x = \\a = a in x", ["function: V2 -> V2"]);
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
  assertExecute("data Funny = Funny {a: Int, b: Int}", [
    "Funny = Funny { a: Int, b: Int }",
  ]);
});

Deno.test("Data Declaration - execute", () => {
  assertExecute("data Boolean = BTrue | BFalse ; BTrue", [
    "Boolean = BTrue | BFalse",
    "BTrue: Boolean",
  ]);

  assertExecute(
    "data Funny = Funny {a: Int, b: Int} ; Funny ; Funny {a: 10, b: 10}",
    [
      "Funny = Funny { a: Int, b: Int }",
      "function: { a: Int, b: Int } -> Funny",
      "Funny { a: 10, b: 10 }: Funny",
    ],
  );

  assertExecute(
    "data List a = Cons a (List a) | Nil; Nil; Cons; Cons 10; Cons 10 (Cons 20 (Cons 30 Nil))",
    [
      "List a = Cons a (List a) | Nil",
      "[]: List V1",
      "function: V1 -> List V1 -> List V1",
      "function: List Int -> List Int",
      "[10, 20, 30]: List Int",
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
  const ip = importPackage(
    { name: "./tests/simple.tfun", location: arbLocation },
    emptyEnv(home, undefined),
  )
    .values;

  assertEquals(ip.size, 4);

  assertEquals(ip.get("x")![0], 10);

  assertEquals(ip.get("y")![0], 20);

  assertEquals(ip.get("double")![0](5), 10);

  assertEquals(ip.get("square")![0](5), 25);
});

Deno.test("Import - raw mechanism using adt.tfun", () => {
  const ip = importPackage(
    { name: "./tests/adt.tfun", location: arbLocation },
    emptyEnv(home, undefined),
  )
    .values;

  assertEquals(ip.size, 9);
});

Deno.test("Import - simple values", () => {
  assertExecute('import * from "./tests/simple.tfun"; double x ; square y', [
    "import",
    "20: Int",
    "400: Int",
  ]);

  assertExecute('import x, double from "./tests/simple.tfun"; double x', [
    "import",
    "20: Int",
  ]);
  assertError(
    'import x, double from "./tests/simple.tfun"; square y',
    "Unknown Name: square at Constraints.test.ts 1:46-51",
  );

  assertExecute(
    'import x as value, double as fun from "./tests/simple.tfun"; fun value',
    ["import", "20: Int"],
  );
});

Deno.test("Import - simple types", () => {
  assertExecute('import * from "./tests/adt.tfun"; length ; sum ; map', [
    "import",
    "function: List V1 -> Int",
    "function: List Int -> Int",
    "function: (V1 -> V2) -> List V1 -> List V2",
  ]);

  assertExecute(
    'import * as T from "./tests/adt.tfun"; T.length ; T.sum ; T.map',
    [
      "import",
      "function: List V1 -> Int",
      "function: List Int -> Int",
      "function: (V1 -> V2) -> List V1 -> List V2",
    ],
  );

  assertExecute(
    'import * from "./tests/adt.tfun"; Nil ; Cons ; Cons 1 Nil',
    [
      "import",
      "[]: List V1",
      "function: V1 -> List V1 -> List V1",
      "[1]: List Int",
    ],
  );

  assertExecute(
    'import * as T from "./tests/adt.tfun" ; T.Nil ; T.Cons ; T.Cons 1 T.Nil',
    [
      "import",
      "[]: List V1",
      "function: V1 -> List V1 -> List V1",
      "[1]: List Int",
    ],
  );

  assertExecute(
    'import * from "./tests/adt.tfun"; find (\\n = n == 1) (Cons 1 Nil) ; let v = find (\\n = n == 10) (Cons 1 Nil) ; withDefault 0 v',
    [
      "import",
      "Just 1: Maybe Int",
      ["v = Nothing: Maybe Int"],
      "0: Int",
    ],
  );

  assertExecute(
    'import * as T from "./tests/adt.tfun"; T.find (\\n = n == 1) (T.Cons 1 T.Nil) ; let v = T.find (\\n = n == 10) (T.Cons 1 T.Nil) ; T.withDefault 0 v',
    [
      "import",
      "Just 1: Maybe Int",
      ["v = Nothing: Maybe Int"],
      "0: Int",
    ],
  );

  assertExecute(
    'import * from "./tests/adt.tfun"; match (Cons 1 Nil) with | Nil -> 0 | Cons v _ -> v',
    [
      "import",
      "1: Int",
    ],
  );

  assertExecute(
    'import List from "./tests/adt.tfun"; match (Cons 1 Nil) with | Nil -> 0 | Cons v _ -> v',
    [
      "import",
      "1: Int",
    ],
  );
});

Deno.test("Import - qualified simple type in pattern matching", () => {
  assertExecute(
    'import * as T from "./tests/adt.tfun"; match (T.Cons 1 T.Nil) with | T.Nil -> 0 | T.Cons v _ -> v',
    [
      "import",
      "1: Int",
    ],
  );
});

Deno.test("Import - qualified simple type in data declaration", () => {
  assertExecute(
    'import * as T from "./tests/adt.tfun"; data Fred a = None | Other (T.List a) ; Other (T.Cons 1 T.Nil)',
    [
      "import",
      "Fred a = None | Other (List a)",
      "Other [1]: Fred Int",
    ],
  );
});

Deno.test("Import - values of the same name from different packages do not inter-operate", () => {
  assertCatchError(
    'import * as ADT from "./tests/adt.tfun" ; import * as List from "./tests/nested/List.tfun" ; ADT.sum (List.range 10)',
    (e: MyError) => e instanceof UnificationMismatchException,
  );
});

Deno.test("Import - nested values", () => {
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

  assertExecute(
    'import * as T from "./tests/simple-nested.tfun" ; T.constant ; T.quad 10 ; T.id ; T.id 47',
    [
      "import",
      "function: V1 -> V2 -> V1",
      "10000: Int",
      "function: V1 -> V1",
      "47: Int",
    ],
  );
});

Deno.test("Import - nested types", () => {
  assertExecute(
    'import * from "./tests/maybe-nested.tfun" ; Nothing ; Just 10 ; isJust (Just 10) ; isJust Nothing ; range 3 ; sum (range 10)',
    [
      "import",
      "Nothing: Maybe V1",
      "Just 10: Maybe Int",
      "True: Bool",
      "False: Bool",
      "[0, 1, 2]: List Int",
      "45: Int",
    ],
  );

  assertExecute(
    'import * as T from "./tests/maybe-nested.tfun" ; T.Nothing ; T.Just 10 ; T.isJust (T.Just 10) ; T.isJust T.Nothing ; T.range 3 ; T.sum (T.range 10)',
    [
      "import",
      "Nothing: Maybe V1",
      "Just 10: Maybe Int",
      "True: Bool",
      "False: Bool",
      "[0, 1, 2]: List Int",
      "45: Int",
    ],
  );

  assertError(
    'import * from "./tests/maybe-nested.tfun" ; Nothing ; Cons',
    "Unknown Name: Cons at Constraints.test.ts 1:55-58",
  );
});

Deno.test("Type declaration of values", () => {
  assertExecute("\\n = n", ["function: V1 -> V1"]);
  assertExecute("\\n:Int = n", ["function: Int -> Int"]);
  assertExecute("\\(n:Int) = n", ["function: Int -> Int"]);
  assertExecute("\\(n:Int): Int = n", ["function: Int -> Int"]);

  assertExecute(
    "data List n = Nil | Cons n (List n) ; let rec length xs = match xs with Nil -> 0 | Cons _ xsp -> 1 + (length xsp)",
    [
      "List n = Nil | Cons n (List n)",
      ["length = function: List V5 -> Int"],
    ],
  );

  assertExecute("let f1 (a: b) (b: b) = (a, b) and f2 b = (f1 b, b)", [[
    "f1 = function: b -> b -> (b * b)",
    "f2 = function: V1 -> (V1 -> (V1 * V1) * V1)",
  ]]);

  assertExecute(
    [
      "data Result err ok = Error err | Okay ok",
      "let map (f: b -> c) (r: Result a b) : Result a c = match r with | Error err -> Error err | Okay ok -> Okay (f ok)",
    ].join(" ; "),
    [
      "Result err ok = Error err | Okay ok",
      ["map = function: (V9 -> V6) -> Result a V9 -> Result a V6"],
    ],
  );
});

Deno.test("Typing of expressions", () => {
  assertExecute("1: Int", ["1: Int"]);
  assertExecute("\\x = (x: Int)", ["function: Int -> Int"]);
  assertExecute(
    [
      "let fun (a: x) (b: x) = (a, b)",
      "\\x = \\y = fun x y",
      "\\x = \\y = fun (x: Int) y",
    ].join(" ; "),
    [
      ["fun = function: x -> x -> (x * x)"],
      "function: V2 -> V2 -> (V2 * V2)",
      "function: Int -> Int -> (Int * Int)",
    ],
  );
});

Deno.test("Alias declaration", () => {
  assertExecute(
    "type Fred a = (a * Int)",
    ["Fred = ∀ a. (a * Int)"],
  );

  assertExecute(
    [
      "type Fred a = (a * Int)",
      "let mkFred0 n : Fred Int = (10, n)",
    ].join(" ; "),
    [
      "Fred = ∀ a. (a * Int)",
      ["mkFred0 = function: Int -> Fred Int"],
    ],
  );

  assertExecute(
    "type Fred a = {x: a, y: Int}",
    ["Fred = ∀ a. { x: a, y: Int }"],
  );

  assertExecute(
    [
      "type Fred a = {x: a, y: Int}",
      "let mkFred0: Fred Int = {x: 10, y: 11}",
    ].join(" ; "),
    [
      "Fred = ∀ a. { x: a, y: Int }",
      ["mkFred0 = { x: 10, y: 11 }: Fred Int"],
    ],
  );

  assertExecute(
    [
      "type Fred a = {x: a, y: Int}",
      "let mkFred0 x y : Fred Int = {x: x, y: y}",
      "let mkFred1 (x: a) y : Fred a = {x: x, y: y}",
      "let mkFred2 x y : Fred a = {x: x, y: y}",
    ].join(" ; "),
    [
      "Fred = ∀ a. { x: a, y: Int }",
      ["mkFred0 = function: Int -> Int -> Fred Int"],
      ["mkFred1 = function: a -> Int -> Fred a"],
      ["mkFred2 = function: a -> Int -> Fred a"],
    ],
  );

  assertExecute(
    [
      "type FredA a = (a * a)",
      "type FredB a b = (b * FredA a)",
      '("hello", (1, 2))',
      '("hello", (1, 2)) : FredB Int String',
    ].join(" ; "),
    [
      "FredA = ∀ a. (a * a)",
      "FredB = ∀ a, b. (b * FredA a)",
      '("hello", (1, 2)): (String * (Int * Int))',
      '("hello", (1, 2)): FredB Int String',
    ],
  );
});

Deno.test("Import - aliases", () => {
  assertExecute(
    ['import * from "./tests/nested/aliases.tfun"', "(10, 10) : AliasB Int"]
      .join(" ; "),
    [
      "import",
      "(10, 10): AliasB Int",
    ],
  );

  assertExecute(
    [
      'import * from "./tests/aliases.tfun"',
      "(10, 10) : AliasB Int",
      "(10, 10) : AliasD Int",
    ]
      .join(" ; "),
    [
      "import",
      "(10, 10): AliasB Int",
      "(10, 10): AliasD Int",
    ],
  );
});

const assertExecute = (expression: string, expected: NestedString) => {
  const [ast, result, newEnv] = parseExecute(urn, expression, defaultEnv(home));

  ast.forEach((e, i) => {
    if (e.type === "DataDeclaration") {
      assertEquals(result[i][0].toString(), expected[i]);
    } else if (e.type === "TypeAliasDeclaration") {
      assertEquals(
        `${e.name} = ${newEnv.type.findAlias(e.name)?.toString()}`,
        expected[i],
      );
    } else if (e.type !== "ImportStatement") {
      const [value, type] = result[i];

      assertEquals(expressionToNestedString(value, type!, e), expected[i]);
    }
  });
};

// deno-lint-ignore no-explicit-any
type MyError = any;

const assertError = (expression: string, error: MyError) => {
  try {
    parseExecute(urn, expression, defaultEnv(urn));
    assert(false);
  } catch (e) {
    if (e instanceof Error) {
      assertEquals(e.toString(), error);
    } else {
      assertEquals(e, error);
    }
  }
};

const assertCatchError = (
  expression: string,
  error: (error: MyError) => void,
) => {
  try {
    parseExecute(urn, expression, defaultEnv(home));
    assert(false);
  } catch (e) {
    assertEquals(error(e), true);
  }
};
