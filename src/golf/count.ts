import {
  Child,
  Node,
  Other,
  Program,
  control,
  isNewcount,
  usegolf,
} from "../types/AST";
import { golfError } from "../types/diagnostics";
import { rebinding } from "./rebind";
import { renamePair } from "./rename";
import {
  filter,
  trimStart,
  unique,
  withListReplacer,
  withReplacer,
} from "./traversal";

type CountRebinding = [string, number];

export function count(program: Program): Program {
  const countRebinds: CountRebinding[] = [];
  program = withReplacer(program, (n): Child[] | undefined => {
    // remove \usegolf{rebind\newcount}
    if (rebinding(n) === "\\newcount") return [];
    // remove \usegolf{rename\newcount\x}
    if (renamePair(n)?.[0] === "\\newcount") return [];
    // remove \usegolf{rebindcount\x0}, but keep track
    const r = countRebinding(n);
    if (r !== undefined) {
      countRebinds.push(r);
      return [];
    }
  });
  return insertCounts(insertNumSepAuto(program), countRebinds);
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

function insertCounts(
  program: Program,
  countRebinds: CountRebinding[]
): Program {
  const mapping = pickCountMapping(program, countRebinds);
  program = withReplacer(program, (n): Child[] | undefined => {
    if (n.type === "Newcount") {
      // Remove \newcount\x
      return [];
    }
    if (n.type === "CounterIndex") {
      // Replace `♯\x` with 1
      const counter = mapping.get(n.value);
      if (counter === undefined)
        throw new Error(`Unknown counter: '${n.value}'`);
      return numberToItems(counter);
    }
    if (n.type !== "Control") return undefined;
    // Replace \x with \count1
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
    ...program,
    children: [
      usegolf([{ type: "Other", value: "rebind" }, control("\\count")]),
      ...program.children,
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

function itemsToNumber(ns: Child[]): number | undefined {
  let s = "";
  for (const n of ns) {
    if (n.type !== "Other") return undefined;
    if (!/^\d+$/.test(n.value)) return undefined;
    s += n.value;
  }
  return parseFloat(s);
}

function pickCountMapping(program: Program, countRebinds: CountRebinding[]) {
  const taken = new Set(countRebinds.map(([_k, v]) => v));
  const mapping = new Map<string, number>(countRebinds);
  let i = 0;
  for (const name of counters(program)) {
    if (mapping.has(name)) continue;
    do {
      ++i;
    } while (!isFreeCounter(i) || taken.has(i));
    mapping.set(name, i);
  }
  return mapping;
}

function isFreeCounter(i: number) {
  // Leave some room at the top for inserts. This should never be reachable lol.
  if (i >= 241) golfError("Too many counters required.");
  return (i >= 1 && i <= 9) || i >= 23;
}

function counters(program: Node) {
  return unique([...filter(program, isNewcount)].map((x) => x.binding.value));
}

function countRebinding(n: Node): CountRebinding | undefined {
  if (n.type !== "Usegolf") return undefined;
  const t = trimStart(n.children, "countrebind");
  if (t === undefined) return undefined;
  const c = t[0];
  if (c.type !== "Control")
    golfError(`Expected Control after 'countrebind' but got ${c.type}`);
  const num = itemsToNumber(t.slice(1));
  if (num === undefined)
    golfError(
      `Expected Number after 'countrebind${c.value}' but got something else.`
    );
  if (num < 0 || num > 255 || !Number.isInteger(num)) {
    golfError(`Invalid register number '${num}'.`);
  }
  return [c.value, num];
}
