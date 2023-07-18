import {
  Child,
  Node,
  Other,
  Program,
  control,
  isNewcount,
  usegolf,
} from "../types/AST";
import { filter, unique, withListReplacer, withReplacer } from "./traversal";

export function count(program: Program): Program {
  return insertCounts(insertNumSepAuto(program));
}

function insertNumSepAuto(program: Program) {
  return withListReplacer(program, (ns: Child[]) => {
    let someChanged = false;
    const ret = ns.map((n, i): Child => {
      const next = ns[i + 1];
      if (n.type !== "Control") return n;
      const ins = next?.type === "Other" && /^\d/.test(next.value);
      if (ins) {
        someChanged = true;
        return { ...n, needsSpaceAfterIfCount: true };
      } else return n;
    });
    return someChanged ? ret : undefined;
  });
}

function insertCounts(program: Program): Program {
  const mapping = pickCountMapping(program);
  const prog = withReplacer(program, (n): Child[] | undefined => {
    // Remove \newcount\x and replace \x with \count1
    if (n.type === "Newcount") return [];
    if (n.type !== "Control") return undefined;
    const counter = mapping.get(n.value);
    if (counter === undefined) return undefined;
    const cnt = { type: "Control", value: "\\count" } as const;
    const numSep = n.needsSpaceAfterIfCount
      ? [{ type: "NumSep" } as const]
      : [];
    const g = [cnt, ...numberToItems(counter), ...numSep];
    return n.needsBracesIfCount ? [{ type: "Group", children: g }] : g;
  });
  return {
    ...prog,
    children: [
      usegolf([{ type: "Other", value: "rebind" }, control("\\count")]),
      ...prog.children,
    ],
  };
}

function numberToItems(n: number) {
  return [...BigInt(n).toString(10)].map(
    (d): Other => ({
      type: "Other",
      value: d,
    })
  );
}

function pickCountMapping(program: Program) {
  const mapping = new Map<string, number>();
  let i = 0;
  for (const name of counters(program)) {
    do {
      ++i;
    } while (!isFreeCounter(i));
    mapping.set(name, i);
  }
  return mapping;
}

function isFreeCounter(i: number) {
  // Leave some room at the top for inserts. This should never be reachable lol.
  if (i >= 241) throw new Error("Too many counters required.");
  return (i >= 1 && i <= 9) || i >= 23;
}

function counters(program: Node) {
  return unique([...filter(program, isNewcount)].map((x) => x.binding.value));
}
