import { Child, isBinder, isControl, isLet, Node, Program } from "../types/AST";
import { Control } from "../types/TokenValue";
import { golfError, golfWarning } from "../types/diagnostics";
import {
  compactMap,
  filter,
  trimStart,
  unique,
  withReplacer,
} from "./traversal";

export function rename(program: Program): Program {
  const _forcedRenames = [...compactMap(program, renamePair)];
  const forcedRenames = new Map(_forcedRenames);
  if (forcedRenames.size < _forcedRenames.length)
    golfError("Duplicate \\usegolf{\\rename<id1><id2>}");
  const mapping = pickNameMapping(program, forcedRenames);
  return withReplacer(program, (n) => {
    if (renamePair(n) !== undefined) return [];
    if (n.type !== "Control") return undefined;
    const value = mapping.get(n.value);
    if (value === undefined) return undefined;
    return { ...n, value };
  });
}

export function renamePair(n: Child): [string, string] | undefined {
  if (n.type !== "Usegolf") return undefined;
  const t = trimStart(n.children, "rename");
  if (t === undefined || t.length === 0) return undefined;
  if (t.length !== 2)
    golfError(
      `Expected exactly two identifiers after 'rename' but got ${t.length}`
    );
  const bad = t.filter((c) => c.type !== "Control");
  if (bad.length > 0)
    golfError(`Expected Control after 'rename' but got ${bad[0].type}`);
  return (t as Control[]).map((c) => c.value) as [string, string];
}

function pickNameMapping(program: Program, forcedRenames: Map<string, string>) {
  // Reduce everything to backslash + one letter
  // Except whatever is most frequent becomes tilde
  const free = renameable(program);
  const lets = [...filter(program, isLet)];
  const unfree = [...filter(program, isControl)]
    .map((x) => x.value)
    .filter((v) => !free.includes(v));
  const mapping = new Map([
    ...[...forcedRenames].map(([k, v]): [string, string] => {
      if (free.includes(k)) return [k, v];
      const vv = lets.filter((x) => x.rhs.value === k);
      if (vv.length === 0)
        golfError(`Cannot find binding for \\usegolf{\\rename${k}...}`);
      return [vv[0].binding.value, v];
    }),
    ...unfree.map((v): [string, string] => [v, v]),
  ]);
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
      if (ids[i] === "a") golfWarning("Many IDs");
      const opt = i === -1 ? "~" : "\\" + ids[i];
      if (![...mapping.values()].includes(opt)) {
        return opt;
      }
      ++i;
    }
    golfError("Too many IDs");
  }
  for (const name of freefree) {
    mapping.set(name, nextID());
  }
  return mapping;
}

// Incomplete. TODO. Can we use any (even non-printable) symbols?
// Can't use \+, idk why.
// [ and ( at end since \[ and \( screw with syntax highlighting.
const ids = "!@#$%^&*)_-=]{}|;:'\"<>,.?/[(abcdefghijklmnopqrstuvwxyz";

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
