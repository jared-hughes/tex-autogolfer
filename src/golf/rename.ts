import {
  Child,
  isBinder,
  isControl,
  isLet,
  Node,
  Program,
  Control,
  Other,
  control,
} from "../types/AST";
import { golfError, golfWarning } from "../types/diagnostics";
import {
  compactMap,
  filter,
  trimStart,
  unique,
  withReplacer,
} from "./traversal";

export function rename(program: Program): Program {
  const extraNames: string[] = [];
  program = withReplacer(program, (n) => {
    const extra = extraName(n);
    if (extra === undefined) return undefined;
    extraNames.push(extra);
    return [];
  });
  const _forcedRenames = [...compactMap(program, renamePair)];
  const forcedRenames = new Map(_forcedRenames);
  if (forcedRenames.size < _forcedRenames.length)
    golfError("Duplicate \\usegolf{\\rename<id1><id2>}");
  const mapping = pickNameMapping(program, forcedRenames, extraNames);
  program = withReplacer(program, (n) => {
    if (renamePair(n) !== undefined) return [];
    if (n.type !== "Control") return undefined;
    if (n.mapsto) return n.mapsto;
    const value = mapping.get(n.value);
    if (value === undefined) return undefined;
    return { ...n, value };
  });
  program = removeDuplicateNewcounts(program);
  return program;
}

function removeDuplicateNewcounts(program: Program): Program {
  const seen = new Set();
  return withReplacer(program, (n) => {
    if (n.type !== "Newcount") return undefined;
    const name = n.binding.value;
    if (seen.has(name)) return [];
    seen.add(name);
    return undefined;
  });
}

function extraName(n: Child): string | undefined {
  if (n.type !== "Usegolf") return undefined;
  const t = trimStart(n.children, "rename-add");
  if (t === undefined) return undefined;
  if (t[0].type === "Control" && t[0].value === "\\char") {
    const int = parseInt(
      t
        .slice(1)
        .filter((n): n is Other => {
          if (n.type !== "Other")
            golfWarning(`That's not a digit after \\char...`);
          return n.type === "Other";
        })
        .map((x) => x.value)
        .join("")
    );
    return String.fromCharCode(int);
  } else if (t.length === 1 && t[0].type === "Other") {
    return t[0].value;
  }
}

export function renamePair(n: Child): [string, string] | undefined {
  if (n.type !== "Usegolf") return undefined;
  const t = trimStart(n.children, "rename");
  if (t === undefined || t.length === 0) return undefined;
  if (t.length !== 2)
    golfError(
      `Expected exactly two identifiers after 'rename' but got ${t.length}`
    );
  if (t[1].type === "Other") t[1] = control(t[1].value);
  const bad = t.filter((c) => c.type !== "Control");
  if (bad.length > 0)
    golfError(`Expected Control after 'rename' but got ${bad[0].type}`);
  return (t as Control[]).map((c) => c.value) as [string, string];
}

function pickNameMapping(
  program: Program,
  forcedRenames: Map<string, string>,
  extraNames: string[]
) {
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
  const ids = ["~", ...extraNames].concat([...easyIDs].map((t) => "\\" + t));
  let i = 0;
  function nextID() {
    while (i < ids.length) {
      const opt = ids[i];
      if (opt === "a") golfWarning("Many IDs");
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
const easyIDs = "!@#$%^&*)_-=]{}|;:'\"<>,.?/[(abcdefghijklmnopqrstuvwxyz";

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
