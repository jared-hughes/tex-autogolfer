import { control, isRebind } from "../types/AST";
import type { Child, Program } from "../types/AST";
import { filter, withReplacer } from "./traversal";

export function rebind(program: Program): Program {
  const rebinds = [...filter(program, isRebind)].map((n) => n.binding.value);
  const rebindings = new Map(rebinds.map((s) => [s, s + "Rebind"]));
  return withReplacer(program, (n): Child | Child[] | undefined => {
    if (n.type === "Rebind") {
      const newName = rebindings.get(n.binding.value);
      if (!newName) return undefined;
      return [
        {
          type: "Let",
          callee: control("\\let"),
          binding: control(newName),
          rhs: n.binding,
        },
      ];
    } else if (n.type === "Control") {
      const newName = rebindings.get(n.value);
      if (!newName) return undefined;
      return { ...n, value: newName };
    }
    return undefined;
  });
}
