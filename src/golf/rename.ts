import { Child, isBinder, isControl, isLet, Node, Program } from "../types/AST";
import { Control } from "../types/TokenValue";
import {
  compactMap,
  filter,
  trimStart,
  unique,
  withReplacer,
} from "./traversal";

export function rename(program: Program): Program {
  const _forcedRenames = [...compactMap(program, renamings)];
  const forcedRenames = new Map(_forcedRenames);
  if (forcedRenames.size < _forcedRenames.length)
    throw new Error("Duplicate \\usegolf{\\rename<id1><id2>}");
  const mapping = pickNameMapping(program, forcedRenames);
  return withReplacer(program, (n) => {
    if (renamings(n) !== undefined) return [];
    if (n.type !== "Control") return undefined;
    const value = mapping.get(n.value);
    if (value === undefined) return undefined;
    return { ...n, value };
  });
}

function renamings(n: Child): [string, string] | undefined {
  if (n.type !== "Usegolf") return undefined;
  const t = trimStart(n.children, "rename");
  if (t === undefined) return undefined;
  if (t.length !== 2)
    throw new Error(
      `Expected exactly two identifiers after 'rename' but got ${t.length}`
    );
  const bad = t.filter((c) => c.type !== "Control");
  if (bad.length > 0)
    throw new Error(`Expected Control after 'rename' but got ${bad[0].type}`);
  return (t as Control[]).map((c) => c.value) as [string, string];
}

function pickNameMapping(program: Program, forcedRenames: Map<string, string>) {
  // Reduce everything to backslash + one letter
  // Except whatever is most frequent becomes tilde
  const free = renameable(program);
  const lets = [...filter(program, isLet)];
  const mapping = new Map(
    [...forcedRenames].map(([k, v]) => {
      if (free.includes(k)) return [k, v];
      const vv = lets.filter((x) => x.rhs.value === k);
      if (vv.length === 0)
        throw new Error(`Cannot find binding for \\usegolf{\\rename${k}...}`);
      return [vv[0].binding.value, v];
    })
  );
  const counts = new Map(
    [...getNameCounts(program)].filter(([id]) => free.includes(id))
  );
  if (counts.size === 0) return mapping;
  const freefree = free
    .filter((x) => !mapping.has(x))
    .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0));
  let i = -1;
  function nextID() {
    while (i < ids.length) {
      const opt = i === -1 ? "~" : "\\" + ids[i];
      if (![...mapping.values()].includes(opt)) {
        return opt;
      }
      ++i;
    }
    throw new Error("Too many IDs");
  }
  for (const name of freefree) {
    mapping.set(name, nextID());
  }
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
