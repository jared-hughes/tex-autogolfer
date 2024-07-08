import { Child, Program } from "../types/AST";
import { withReplacer } from "./traversal";

export function parIsNewline(program: Program): Program {
  // Desugar `\usegolf{rebind\a\b}` to `\usegolf{rebind\a}` and `\usegolf{rename\a\b}`
  return withReplacer(program, (n): Child[] | undefined => {
    if (n.type !== "Control") return undefined;
    if (n.value === "\\par") return [{ type: "Newline" }];
    return undefined;
  });
}
