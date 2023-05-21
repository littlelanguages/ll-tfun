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
