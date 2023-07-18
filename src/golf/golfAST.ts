import { Program, isUsegolf } from "../types/AST";
import { count } from "./count";
import { rename } from "./rename";
import { rebind } from "./rebind";
import { filter, trimStart, withReplacer } from "./traversal";
import { emitString } from "..";
import { desugar } from "./desugar";

export const transforms = [
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
    // eslint-disable-next-line no-console
    console.error("Warning: unknown golfs:\n" + golfs.join("\n"));
  }
  return program;
}
