#!/usr/bin/env -S node --enable-source-maps
/* eslint-disable no-console */

import parseArgs from "minimist";
import fs from "fs";
import path from "path";
import { golf } from ".";

const options = parseArgs(process.argv.slice(2), { boolean: true });

const HELP = `Usage: tex-autogolfer [OPTION]... [FILE]
Golfs the TeX FILE by renaming identifiers, removing whitespace, etc.

Options:
  --preserve-newlines       keep input newlines in the output`;
if (options.h) {
  console.log(HELP);
  process.exit(0);
}

const opts = {
  preserveNewlines: !!options["preserve-newlines"],
};

const positional = options._;
if (positional.length !== 1) {
  console.log("Must specify exactly one file");
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
