import { Child, Program, control } from "../types/AST";
import { golfError } from "../types/diagnostics";
import { compactMap, trimStart, withReplacer } from "./traversal";

export function rebind(program: Program): Program {
  // Find rebindings
  const rebinds = [...compactMap(program, rebinding)];
  const rebindings = new Map(rebinds.map((s) => [s, s + "Rebind"]));
  // Do the rebinding
  program = withReplacer(program, (n): Child | undefined => {
    if (n.type === "Control") {
      const newName = rebindings.get(n.value);
      if (!newName) return undefined;
      return { ...n, value: newName };
    }
    const re = rebinding(n);
    if (re === undefined) return undefined;
    const rebound = rebindings.get(re);
    if (!rebound) return undefined;
    return {
      type: "Let",
      callee: control(rebindings.get("\\let") ?? "\\let"),
      binding: control(rebound),
      rhs: control(re),
    };
  });
  return program;
}

export function rebinding(n: Child): string | undefined {
  if (n.type !== "Usegolf") return undefined;
  const t = trimStart(n.children, "rebind");
  if (t === undefined) return undefined;
  if (t.length !== 1)
    golfError(
      `Expected exactly one identifier after 'rebind' but got ${t.length}`
    );
  const c = t[0];
  if (c.type !== "Control")
    golfError(`Expected Control after 'rebind' but got ${c.type}`);
  return c.value;
}
