#!/usr/bin/env -S node --enable-source-maps

import yargs from "yargs";
import fs from "fs";
import path from "path";

const options = yargs()
  .options({
    input: {
      alias: "i",
      describe: "input file",
      type: "string",
      demandOption: true,
    },
    output: {
      alias: "o",
      describe: "output file",
      type: "string",
    },
  })
  .parseSync(process.argv.slice(2));

let input = options.input;
if (!fs.existsSync(input)) input += ".tex";
const code = fs.readFileSync(input, { encoding: "utf-8" });

const output = options.output;
if (output !== undefined) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, code);
} else {
  // eslint-disable-next-line no-console
  process.stdout.write(code);
}
