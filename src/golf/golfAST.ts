import { Program, isUsegolf } from "../types/AST";
import { count } from "./count";
import { rename } from "./rename";
import { rebind } from "./rebind";
import { filter, trimStart, withReplacer } from "./traversal";
import { emitString } from "..";
import { desugar } from "./desugar";
import { golfWarning } from "../types/diagnostics";
import { parIsNewline } from "./parIsNewline";

export const transforms = [
  { name: "par-is-newline", transform: parIsNewline },
  { name: "desugar", transform: desugar, always: true },
  { name: "count", transform: count },
  { name: "rebind", transform: rebind, always: true },
  { name: "rename", transform: rename },
];

export function golfAST(program: Program): Program {
  for (const { name, transform, always } of transforms) {
    let satisfy = false;
    program = withReplacer(program, (n) => {
      if (n.type === "Usegolf" && trimStart(n.children, name)?.length === 0) {
        satisfy = true;
        return [];
      }
    });
    if (satisfy || always) {
      program = transform(program);
    }
  }
  const golfs = [...filter(program, isUsegolf)].map(emitString);
  if (golfs.length > 0) {
    golfWarning(
      "Warning: unknown golfs:\n" + golfs.map((x) => "  " + x).join("\n")
    );
  }
  return program;
}
