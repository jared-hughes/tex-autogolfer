/* eslint-disable no-template-curly-in-string -- bunch of curlies in these tests */
import { test } from "node:test";
import assert from "node:assert/strict";
import { golf, Opts } from "../src/index.js";
import * as fs from "node:fs";

// Terrible
const cases: Record<string, string> = {
  "ex1.tex":
    "\\let~\\count\\let\\!\\advance abcdef\\f asdf~1 5~2 8 \\ifnum~1>4\\!~2 3\\fi\\!~1~2\\!~2-~1\\$asdf\\$ asdfa{bc{de}fg}",
  "ex2.tex": "\\def~#1{#1#1}\\def\\!#1{#1#1#1}~a{\\!c~b}",
  "ex3.tex":
    "\\let~\\count\\let\\!\\advance\\catcode1=13\\let\x01\\the~1 " +
    "5~2 8~3 9\\!~1~2\\!~3-~2\\!~1 5 \x01~1,\x01~2,\x01~3\x01~1 " +
    "\\ifnum5<~1\x01~2\\fi{\x01~1 \\ifnum5<~1\x01~2\\fi}",
  "ex4.tex":
    "\\let~\\count~1 39~2~1~3~2~4~3~5~4~6~5~7~6~8~7~9~8~23~9" +
    "\\advance~23 3~24~23\\the~24",
  "ex5.tex":
    "\\let\\countRebind\\count\\loop\\ifnum\\countRebind1<\\argc\\argv{\\countRebind1}\\endgraf\\advance\\countRebind1 1\\repeat",
  "ex6.tex":
    "\\let\f\\def\f~{:)}\f\\!{~~}\f\x01{\\!\\!}\f\\@{\x01\x01}\f\\#{\\@\\@}\f\\${\\#\\#}\f\\%{\\$\\$}\\%\\%",
  "ex7.tex": "\\let~\\count\\advance~1 2\\the~1",
  "ex8.tex":
    "\\let\\countRebind\\count\\countRebind1 37\\the\\countRebind1\\ .",
  "ex9.tex":
    "\\def~#1{\\expandafter\\xdef\\csname\\the#1\\endcsname{#2}}~\\x~\\y\\def\\!{}\\!\\!\\def\\@{\\expandafter\\xdef}\\@\\W{#1}",
  "exA.tex":
    "\\let\\letRebind\\let\\letRebind\\n\\newcount\\letRebind\\A\\advance\\letRebind\\I\\ifnum\\letRebind\\countRebind\\count\\countRebind0 5\\the\\countRebind0",
  "exB.tex":
    "\\catcode`$=13\\catcode37=13\\def~{}~~\\def${}$$\\def%{}%%\\def\\!{}\\!\\!",
  "exC.tex": "\\number`a:\\number`#:\\number`7ab\fcdef\fgh",
  "exD.tex": "\\newcount~~5 \\the~~8 \\the~",
  "exE.tex": "\\def\\f{hi}\\f\\let\\defRebind\\def\\defRebind\\g{hello}\\g",
  "exF.tex": "\\catcode10=12\\def\\f#1\\literalchar#2;{(#1,#2)}\\f Line1Line2;",
  "exG.tex": "\\let~\\count~0~1~1~0 \\the~0\\f0;\\g{~0}",
  "exH.tex": "abc\n\ndef\n\n123ghidefjkl",
  "exI.tex": "\\count0",
  "exJ.tex":
    "\\let~\\endgraf~~~\\def\\!{\\par}\\!\\!\\!\\let\\A\\abc\\A\\A\\A\\def\\D{\\ghi}\\D\\D\\D",
  "exK.tex": "\\newcount\\a\\a1\\a2\\a3\\a4",
  "exL.tex":
    "\x01\x02\x03\x04\x05\x06\x07\b\x0B\f\r\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F!abcdefghijklmnopqrstuvwxyz{|}~\x7F",
  "exM.tex":
    "\\let\f\\let\f\\!\\count\f\\@\\expandafter\f~\\ifnum\f\f\\advance\\@\\@\\@\f\f\f~~~\\!1\\!2\\!2\\!3\\!1\\!3\\!2\\!1",
  "exN.tex": "\\let\\$\\count\\$1\\$2\\$2\\$3\\$1\\$3\\$2\\$1",
};

for (const [name, exp] of Object.entries(cases)) {
  void test(name, () => {
    const source = fs.readFileSync(`./examples/${name}`, {
      encoding: "utf-8",
    });
    const opts: Opts = { preserveNewlines: false, newlinePar: false };
    const golfed = golf(source, opts);
    assert.equal(golfed, exp);
  });
}

void test("All examples tested", () => {
  const names = fs.readdirSync("./examples");
  assert.deepEqual(names, Object.keys(cases));
});
