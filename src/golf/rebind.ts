import { Child, Let, Program, control } from "../types/AST";
import { splitCompactMap, trimStart, withReplacer } from "./traversal";

export function rebind(program: Program): Program {
  const { satisfy: rebinds, unsatisfy: golfs } = splitCompactMap(
    program.golfs,
    (g) => {
      const t = trimStart(g, "rebind");
      if (t === undefined) return undefined;
      if (t.length !== 1)
        throw new Error(
          `Expected exactly one identifier after 'rebind' but got ${t.length}`
        );
      const c = t[0];
      if (c.type !== "Control")
        throw new Error(`Expected Control after 'rebind' but got ${c.type}`);
      return c.value;
    }
  );
  const rebindings = new Map(rebinds.map((s) => [s, s + "Rebind"]));
  const prog = withReplacer(program, (n): Child | Child[] | undefined => {
    if (n.type !== "Control") return undefined;
    const newName = rebindings.get(n.value);
    if (!newName) return undefined;
    return { ...n, value: newName };
  });
  return {
    ...prog,
    children: [
      ...[...rebindings].map(
        ([k, v]): Let => ({
          type: "Let",
          callee: control(rebindings.get("\\let") ?? "\\let"),
          binding: control(v),
          rhs: control(k),
        })
      ),
      ...prog.children,
    ],
    golfs,
  };
}
