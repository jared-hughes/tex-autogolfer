import { Child, Program } from "../types/AST";
import { golfError } from "../types/diagnostics";
import { trimStart, withReplacer } from "./traversal";

export function replace(program: Program): Program {
  // Find rebindings
  const replacements = new Map<string, Child[]>();
  program = withReplacer(program, (n): Child | Child[] | undefined => {
    const x = replacement(n);
    if (!x) return undefined;
    const [ident, repl] = x;
    replacements.set(ident, repl);
    return [];
  });
  // Do the rebinding
  program = withReplacer(program, (n): Child | Child[] | undefined => {
    if (replacement(n)) return [];
    if (n.type === "Control" && !n.mapsto) {
      return replacements.get(n.value);
    }
  });
  return program;
}

export function replacement(n: Child): [string, Child[]] | undefined {
  if (n.type !== "Usegolf") return undefined;
  const t = trimStart(n.children, "replace");
  if (t === undefined) return undefined;
  if (t.length < 1)
    golfError(
      `Expected at least one identifier after 'rebind' but got ${t.length}`,
    );
  const c = t[0];
  if (c.type !== "Control")
    golfError(`Expected Control after 'rebind' but got ${c.type}`);
  return [c.value, t.slice(1)];
}
