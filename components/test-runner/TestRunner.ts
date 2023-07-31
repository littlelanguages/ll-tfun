// This is a tool is a test runner over markdown files.  I searches for code
// blocks and then, if there is a handler for the code block, will ensure that
// the code works as expected.

import { Handler, run } from "./Runner.ts";
import { XTHandler } from "./XTHandler.ts";

if (Deno.args.length === 0) {
  console.log("Usage: deno run --allow-read TestRunner.ts <file>...<file>");
  Deno.exit(1);
}

const handlers = new Map<string, Handler>([["xt", new XTHandler()]]);


const errorResult = await run(Deno.args, handlers);

Deno.exit(errorResult);
