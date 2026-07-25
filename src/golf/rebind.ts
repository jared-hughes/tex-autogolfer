import { Child, Program, control } from "../types/AST";
import { golfError } from "../types/diagnostics";
import { compactMap, trimStart, withReplacer } from "./traversal";

export function rebind(program: Program): Program {
  program = rebindOne(program, "def");
  program = rebindOne(program, "let");
  return program;
}

export function rebindOne(program: Program, type: "def" | "let"): Program {
  // Find rebindings
  const golfname = type === "def" ? "rebindDef" : "rebind";
  const rebinds = [...compactMap(program, (n) => rebinding(n, golfname))];
  const rebindings = new Map(rebinds.map((s) => [s, s + "Rebind"]));
  // Do the rebinding
  program = withReplacer(program, (n): Child | undefined => {
    if (n.type === "Control" && !n.mapsto) {
      const newName = rebindings.get(n.value);
      if (!newName) return undefined;
      return { ...n, value: newName };
    }
    const re = rebinding(n, golfname);
    if (re === undefined) return undefined;
    const rebound = rebindings.get(re);
    if (!rebound) return undefined;
    const cmd = `\\${type}`; // \\let or \\def
    const callee = control(re === cmd ? cmd : (rebindings.get(cmd) ?? cmd));
    if (type === "let") {
      return {
        type: "Let",
        callee,
        binding: control(rebound),
        rhs: control(re),
      };
    } else {
      return {
        type: "Def",
        callee,
        binding: control(rebound),
        body: [control(re)],
        params: [],
      };
    }
  });
  return program;
}

export function rebinding(n: Child, golfname: string): string | undefined {
  if (n.type !== "Usegolf") return undefined;
  const t = trimStart(n.children, golfname);
  if (t === undefined) return undefined;
  if (t.length !== 1)
    golfError(
      `Expected exactly one identifier after '${golfname}' but got ${t.length}`,
    );
  const c = t[0];
  if (c.type !== "Control")
    golfError(`Expected Control after '${golfname}' but got ${c.type}`);
  return c.value;
}
