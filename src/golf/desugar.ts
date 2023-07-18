import { Child, Control, Program, other, usegolf } from "../types/AST";
import { trimStart, withReplacer } from "./traversal";

export function desugar(program: Program): Program {
  // Desugar `\usegolf{rebind\a\b}` to `\usegolf{rebind\a}` and `\usegolf{rename\a\b}`
  return withReplacer(program, (n): Child[] | undefined => {
    if (n.type !== "Usegolf") return undefined;
    const t = trimStart(n.children, "rebind");
    if (t === undefined) return undefined;
    if (t.length !== 2) return undefined;
    const bad = t.filter((c) => c.type !== "Control");
    if (bad.length > 0)
      throw new Error(`Expected Control after 'rebind' but got ${bad[0].type}`);
    const [a, b] = t as Control[];
    return [usegolf([other("rebind"), a]), usegolf([other("rename"), a, b])];
  });
}
