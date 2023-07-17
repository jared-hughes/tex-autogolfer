#!/usr/bin/env -S node --enable-source-maps
/* eslint-disable no-console */

import parseArgs from "minimist";
import fs from "fs";
import path from "path";
import { Opts, golf } from ".";

const options = parseArgs(process.argv.slice(2), {
  boolean: true,
  default: {
    "preserve-newlines": false,
    "explicit-newcounts": true,
    "map-names": true,
    rebind: true,
  },
});

const HELP = `
Usage: tex-autogolfer [OPTION]... [FILE]
Golfs the TeX FILE by renaming identifiers, removing whitespace, etc.

Options:
  --preserve-newlines       keep input newlines in the output
  --no-explicit-newcounts   disable introduction of \\count
  --no-map-names            disable renaming from \\let, \\def, etc.
  --no-rebind               ignore \\rebind
`.trim();
if (options.h) {
  console.log(HELP);
  process.exit(0);
}

function consumeOption(s: string) {
  const res = options[s];
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete options[s];
  return res;
}

const opts = {
  preserveNewlines: !!consumeOption("preserve-newlines"),
  "explicit-newcounts": !!consumeOption("explicit-newcounts"),
  "map-names": !!consumeOption("map-names"),
  rebind: !!consumeOption("rebind"),
} satisfies Opts;

const bad = Object.keys(options).filter((x) => x !== "_");

for (const key of bad) {
  console.error("Unrecognized option: %s", key);
}
if (bad.length > 0) process.exit(1);

const positional = consumeOption("_");
if (positional.length !== 1) {
  console.error("Must specify exactly one file");
  process.exit(1);
}

let input = positional[0];
if (!fs.existsSync(input)) input += ".tex";
let code = fs.readFileSync(input, { encoding: "utf-8" });
code = golf(code, opts);

const output = options.output;
if (output !== undefined) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, code);
} else {
  // eslint-disable-next-line no-console
  process.stdout.write(code);
}
