import { assertEquals } from "https://deno.land/std@0.137.0/testing/asserts.ts";

import * as Src from "./Src.ts";

Deno.test("file system init will compute absolute off of CWD", () => {
  assertUrn(
    "../tfun/Grammar.llgd",
    "/Users/graeme.lockley/Projects/ll-tfun/components/deno",
    "/Users/graeme.lockley/Projects/ll-tfun/components/tfun/Grammar.llgd",
  );

  assertUrn(
    "./.././tfun/Grammar.llgd",
    "/Users/graeme.lockley/Projects/ll-tfun/components/deno",
    "/Users/graeme.lockley/Projects/ll-tfun/components/tfun/Grammar.llgd",
  );

  assertUrn(
    "tfun/Grammar.llgd",
    "/Users/graeme.lockley/Projects/ll-tfun/components/deno",
    "/Users/graeme.lockley/Projects/ll-tfun/components/deno/tfun/Grammar.llgd",
  );
});

Deno.test("base directory as a src can be combined", () => {
  assertEquals(
    new Src.Src("/Users/graeme.lockley/deno/").newSrc("tfun/Scanner.llld")
      .urn(),
    "/Users/graeme.lockley/deno/tfun/Scanner.llld",
  );

  assertEquals(
    new Src.Src("/Users/graeme.lockley/deno").newSrc("tfun/Scanner.llld")
      .urn(),
    "/Users/graeme.lockley/tfun/Scanner.llld",
  );
});

Deno.test("srcs can be combined", () => {
  assertEquals(
    Src.from("tfun/Grammar.llgd", "/Users/graeme.lockley/deno/").newSrc(
      "./Scanner.llld",
    ).urn(),
    "/Users/graeme.lockley/deno/tfun/Scanner.llld",
  );

  assertEquals(
    Src.from("tfun/Grammar.llgd", "/Users/graeme.lockley/deno").newSrc(
      "./Scanner.llld",
    ).urn(),
    "/Users/graeme.lockley/deno/tfun/Scanner.llld",
  );
});

const assertUrn = (name: string, base: string, expected: string): void => {
  const src = Src.from(
    name,
    base,
  );

  assertEquals(
    expected,
    src.urn(),
  );
};
