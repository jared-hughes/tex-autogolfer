import type { Node, Program } from "../types/AST";
import { isBinder, isControl } from "../types/AST";
import { filter, withReplacer } from "./traversal";

export function golfAST(program: Program): Program {
  return applyNameMapping(program);
}

function applyNameMapping(program: Program) {
  const mapping = pickNameMapping(program);
  return withReplacer(program, (n) => {
    if (n.type !== "Control") return undefined;
    const value = mapping.get(n.value);
    if (value === undefined) return undefined;
    return { type: "Control", value };
  });
}

function pickNameMapping(program: Program) {
  // Reduce everything to backslash + one letter
  // Except whatever is most frequent becomes tilde
  const counts = getNameCounts(program);
  const [mostFrequent] = [...counts].reduce(([old, bestCount], [id, count]) =>
    count > bestCount ? [id, count] : [old, bestCount]
  );
  const mapping = new Map<string, string>();
  let i = 0;
  for (const name of renameable(program).filter((x) => x !== mostFrequent)) {
    mapping.set(name, "\\" + ids[i++]);
  }
  mapping.set(mostFrequent, "~");
  return mapping;
}

// Incomplete. TODO. Can we use any (even non-printable) symbols?
const ids = "!@#$%^&*()_+abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function getNameCounts(program: Node) {
  const counts = new Map<string, number>();
  for (const node of filter(program, isControl)) {
    const name = node.value;
    const v = counts.get(name) ?? 0;
    counts.set(name, v + 1);
  }
  return counts;
}

function renameable(program: Node) {
  return unique([...filter(program, isBinder)].map((x) => x.binding.value));
}

function unique(s: string[]): string[] {
  return [...new Set(s)];
}
