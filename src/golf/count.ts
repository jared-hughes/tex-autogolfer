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
import { filter, unique, withListReplacer, withReplacer } from "./traversal";

export function count(program: Program): Program {
  program = withReplacer(program, (n): Child[] | undefined => {
    // remove \usegolf{rebind\newcount}
    if (rebinding(n) === "\\newcount") return [];
    // remove \usegolf{rename\newcount\x}
    if (renamePair(n)?.[0] === "\\newcount") return [];
  });
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
  program = withReplacer(program, (n): Child[] | undefined => {
    // Remove \newcount\x and replace \x with \count1
    if (n.type === "Newcount") return [];
    if (n.type === "CounterIndex") {
      const counter = mapping.get(n.value);
      if (counter === undefined)
        throw new Error(`Unknown counter: '${n.value}'`);
      return [{ type: "Other", value: counter.toString() }];
    }
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
  if (i >= 241) golfError("Too many counters required.");
  return (i >= 1 && i <= 9) || i >= 23;
}

function counters(program: Node) {
  return unique([...filter(program, isNewcount)].map((x) => x.binding.value));
}
