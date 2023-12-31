import { Child, Control, Program, control, other, usegolf } from "../types/AST";
import { golfError } from "../types/diagnostics";
import { trimStart, withReplacer } from "./traversal";

export function desugar(program: Program): Program {
  // Desugar `\usegolf{rebind\a\b}` to `\usegolf{rebind\a}` and `\usegolf{rename\a\b}`
  return withReplacer(program, (n): Child[] | undefined => {
    if (n.type !== "Usegolf") return undefined;
    const t = trimStart(n.children, "rebind");
    if (t === undefined) return undefined;
    if (t.length !== 2) return undefined;
    if (t[1].type === "Other") t[1] = control(t[1].value);
    const bad = t.filter((c) => c.type !== "Control");
    if (bad.length > 0)
      golfError(`Expected Control after 'rebind' but got ${bad[0].type}`);
    const [a, b] = t as Control[];
    return [usegolf([other("rebind"), a]), usegolf([other("rename"), a, b])];
  });
}
