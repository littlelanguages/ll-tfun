import { assertEquals } from "https://deno.land/std@0.137.0/testing/asserts.ts";
import { Constraints } from "./Constraints.ts";
import * as Infer from "./Infer.ts";
import { parse, Pattern } from "./Parser.ts";
import {
  createFresh,
  DataDefinition,
  emptyTypeEnv,
  Scheme,
  TArr,
  TVar,
  Type,
  typeBool,
  TypeEnv,
  typeInt,
} from "./Typing.ts";
import { home } from "./Src.ts";
import { emptyImportEnv } from "./Values.ts";
import * as Location from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.1.1/location.ts";

const src = home.newSrc("./Infer.test.ts");

const arbLocation = Location.mkCoordinate(0, 0, 0);

const assertTypeEquals = (ts: Array<Type>, expected: Array<string>) => {
  assertEquals(ts.map((t) => t.toString()), expected);
};

const assertConstraintsEquals = (
  constraints: Constraints,
  expected: Array<string>,
) => {
  assertEquals(constraints.toString(), expected.join(", "));
};

Deno.test("infer Apply", () => {
  const [constraints, type] = inferProgram(
    emptyTypeEnv
      .extend(
        "a",
        new TArr(new TVar("T"), new TVar("T")).toScheme(),
      )
      .extend("b", typeInt.toScheme()),
    "a b",
  );

  assertConstraintsEquals(constraints, [
    "V1 -> V1 ~ Int -> V2",
  ]);
  assertTypeEquals(type, ["V2"]);
});

Deno.test("infer If", () => {
  const [constraints, type] = inferProgram(
    emptyTypeEnv
      .extend("a", new TVar("S").toScheme())
      .extend("b", typeInt.toScheme())
      .extend("c", new TVar("T").toScheme()),
    "if (a) b else c",
  );

  assertConstraintsEquals(constraints, [
    "V1 ~ Bool",
    "Int ~ V2",
  ]);
  assertTypeEquals(type, ["Int"]);
});

Deno.test("infer Lam", () => {
  const [constraints, type] = inferProgram(emptyTypeEnv, "\\x = x 10");

  assertConstraintsEquals(constraints, [
    "V1 ~ Int -> V2",
  ]);
  assertTypeEquals(type, ["V1 -> V2"]);
});

Deno.test("infer Let", () => {
  const [constraints, type] = inferProgram(
    emptyTypeEnv,
    "let x = 10 and y = x + 1 ; y",
  );

  assertConstraintsEquals(constraints, [
    "Int -> Int -> V1 ~ Int -> Int -> Int",
  ]);
  assertTypeEquals(type, ["(Int * Int)", "Int"]);
});

Deno.test("infer LBool", () => {
  const [constraints, type] = inferProgram(emptyTypeEnv, "True");

  assertConstraintsEquals(constraints, []);
  assertTypeEquals(type, ["Bool"]);
});

Deno.test("infer LInt", () => {
  const [constraints, type] = inferProgram(emptyTypeEnv, "123");

  assertEquals(constraints.constraints.length, 0);
  assertTypeEquals(type, ["Int"]);
});

Deno.test("infer LString", () => {
  const [constraints, type] = inferProgram(emptyTypeEnv, '"hello"');

  assertEquals(constraints.constraints.length, 0);
  assertTypeEquals(type, ["String"]);
});

Deno.test("infer LTuple", () => {
  const [constraints, type] = inferProgram(emptyTypeEnv, '(1, "hello", True)');

  assertEquals(constraints.constraints.length, 0);
  assertTypeEquals(type, ["(Int * String * Bool)"]);
});

Deno.test("infer LUnit", () => {
  const [constraints, type] = inferProgram(emptyTypeEnv, "()");

  assertEquals(constraints.constraints.length, 0);
  assertTypeEquals(type, ["()"]);
});

Deno.test("infer Match", () => {
  const [constraints, type] = inferProgram(
    emptyTypeEnv,
    "match (1, 2) with (x, y) -> x + y",
  );

  assertConstraintsEquals(constraints, [
    "V2 -> V3 -> V4 ~ Int -> Int -> Int",
    "(V2 * V3) ~ (Int * Int)",
    "V4 ~ V1",
  ]);
  assertTypeEquals(type, ["V1"]);
});

Deno.test("infer RecordExtend", () => {
  const [constraints, type] = inferProgram(
    emptyTypeEnv,
    '{ x: 1, y: "hello" }',
  );

  assertEquals(constraints.constraints.length, 0);
  assertTypeEquals(type, ["{ x: Int, y: String }"]);
});

Deno.test("infer RecordSelect", () => {
  const [constraints, type] = inferProgram(emptyTypeEnv, "{ x: 1, y: 2 }.x");

  assertConstraintsEquals(constraints, [
    "{ x: Int, y: Int } ~ { x: V1 | V2 }",
  ]);

  assertTypeEquals(type, ["V1"]);
});

Deno.test("infer RecordSelect 2", () => {
  const [constraints, type] = inferProgram(emptyTypeEnv, "\\x = x.y");

  assertConstraintsEquals(constraints, [
    "V1 ~ { y: V2 | V3 }",
  ]);

  assertTypeEquals(type, ["V1 -> V2"]);
});

Deno.test("infer PBool pattern", () => {
  assertInferPattern(
    { type: "PBool", value: true, location: arbLocation },
    [],
    "Bool",
  );

  assertInferPattern(
    { type: "PBool", value: false, location: arbLocation },
    [],
    "Bool",
  );
});

Deno.test("infer PCons pattern", () => {
  const adt = new DataDefinition(home, "List", ["a"], []);
  adt.addConstructor("Nil", []);
  adt.addConstructor("Cons", [new TVar("a"), adt.instantiateWith()]);

  const origEnv = emptyTypeEnv.addData(adt);

  assertInferPatternWithEnv(
    origEnv,
    {
      type: "PCons",
      qualifier: undefined,
      name: { name: "Nil", location: arbLocation },
      args: [],
      location: arbLocation,
    },
    [],
    "List V1",
    origEnv,
  );

  assertInferPatternWithEnv(
    origEnv,
    {
      type: "PCons",
      qualifier: undefined,
      name: { name: "Cons", location: arbLocation },
      args: [{ type: "PVar", name: "x", location: arbLocation }, {
        type: "PVar",
        name: "xs",
        location: arbLocation,
      }],
      location: arbLocation,
    },
    ["V2 ~ V1", "V3 ~ List V1"],
    "List V1",
    origEnv
      .extend("x", new Scheme([], new TVar("V2", [src, arbLocation])))
      .extend("xs", new Scheme([], new TVar("V3", [src, arbLocation]))),
  );
});

Deno.test("infer PInt pattern", () => {
  assertInferPattern(
    { type: "PInt", value: 123, location: arbLocation },
    [],
    "Int",
  );
});

Deno.test("infer PString pattern", () => {
  assertInferPattern(
    { type: "PString", value: "hello", location: arbLocation },
    [],
    "String",
  );
});

Deno.test("infer PTuple pattern", () => {
  assertInferPattern(
    {
      type: "PTuple",
      values: [
        { type: "PBool", value: true, location: arbLocation },
        { type: "PInt", value: 123, location: arbLocation },
        { type: "PString", value: "hello", location: arbLocation },
        { type: "PUnit", location: arbLocation },
      ],
      location: arbLocation,
    },
    [],
    "(Bool * Int * String * ())",
  );
});

Deno.test("infer PUnit pattern", () => {
  assertInferPattern(
    { type: "PUnit", location: arbLocation },
    [],
    "()",
  );
});

Deno.test("infer PVar pattern", () => {
  assertInferPattern(
    { type: "PVar", name: "x", location: arbLocation },
    [],
    "V1",
    emptyTypeEnv.extend(
      "x",
      new Scheme([], new TVar("V1", [src, arbLocation])),
    ),
  );
});

Deno.test("infer PWildCard pattern", () => {
  assertInferPattern(
    { type: "PWildcard", location: arbLocation },
    [],
    "V1",
  );
});

Deno.test("infer Op '=='", () => {
  const scenario = (input: string, resultType: Type) => {
    const [constraints, type] = inferProgram(
      emptyTypeEnv
        .extend("a", new TVar("T").toScheme())
        .extend("b", new TVar("T").toScheme()),
      input,
    );

    assertConstraintsEquals(constraints, [
      `V1 ~ V2`,
      `V3 ~ ${resultType}`,
    ]);
    assertTypeEquals(type, ["V3"]);
  };

  scenario("a == b", typeBool);
  scenario("a /= b", typeBool);
});

Deno.test("infer Op excluding '=='", () => {
  const scenario = (input: string, resultType: Type) => {
    const [constraints, type] = inferProgram(
      emptyTypeEnv
        .extend("a", new TVar("T").toScheme())
        .extend("b", new TVar("T").toScheme()),
      input,
    );

    assertConstraintsEquals(constraints, [
      `V1 -> V2 -> V3 ~ Int -> Int -> ${resultType}`,
    ]);
    assertTypeEquals(type, ["V3"]);
  };

  scenario("a < b", typeBool);
  scenario("a <= b", typeBool);
  scenario("a > b", typeBool);
  scenario("a >= b", typeBool);
  scenario("a + b", typeInt);
  scenario("a - b", typeInt);
  scenario("a * b", typeInt);
  scenario("a / b", typeInt);
});

Deno.test("infer Var", () => {
  const [constraints, type] = inferProgram(
    emptyTypeEnv.extend(
      "a",
      new TArr(new TVar("T"), new TVar("T")).toScheme(),
    ),
    "a",
  );

  assertConstraintsEquals(constraints, []);
  assertTypeEquals(type, ["V1 -> V1"]);
});

const inferProgram = (
  defaultEnv: TypeEnv,
  input: string,
): [Constraints, Array<Type>, Infer.Env] => {
  return Infer.inferProgram(
    { type: defaultEnv, src, imports: emptyImportEnv() },
    parse(src, input),
    new Constraints(),
    createFresh(),
  );
};

const assertInferPatternWithEnv = (
  defaultEnv: TypeEnv,
  input: Pattern,
  expectedConstraints: Array<string>,
  expectedType: string,
  expectedTypeEnv: TypeEnv = emptyTypeEnv,
) => {
  const constraints = new Constraints();

  const [type, env] = Infer.inferPattern(
    input,
    { type: defaultEnv, src, imports: emptyImportEnv() },
    constraints,
    createFresh(),
  );

  assertConstraintsEquals(constraints, expectedConstraints);
  assertEquals(type.toString(), expectedType);
  assertEquals(env.type, expectedTypeEnv);
};

const assertInferPattern = (
  input: Pattern,
  expectedConstraints: Array<string>,
  expectedType: string,
  expectedTypeEnv: TypeEnv = emptyTypeEnv,
) =>
  assertInferPatternWithEnv(
    emptyTypeEnv,
    input,
    expectedConstraints,
    expectedType,
    expectedTypeEnv,
  );
