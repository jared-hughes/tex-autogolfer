import type { Child, Node, Other, Program } from "../types/AST";
import { isNewcount } from "../types/AST";
import { filter, unique, withListReplacer, withReplacer } from "./traversal";

export function explicitNewcounts(program: Program): Program {
  return removeNumSepAuto(insertCounts(insertNumSepAuto(program)));
}

function insertNumSepAuto(program: Program) {
  return withListReplacer(program, (ns: Child[]) => {
    let someChanged = false;
    const ret = ns.flatMap((n, i): Child[] => {
      const prev = ns[i - 1];
      const ins =
        n.type === "Other" && /^\d/.test(n.value) && prev?.type === "Control";
      if (ins) {
        someChanged = true;
        return [{ type: "NumSepAuto" }, n];
      } else return [n];
    });
    return someChanged ? ret : undefined;
  });
}

function insertCounts(program: Program): Program {
  const mapping = pickCountMapping(program);
  const prog = withReplacer(program, (n) => {
    // Remove \newcount\x and replace \x with \count1
    if (n.type === "Newcount") return [];
    if (n.type !== "Control") return undefined;
    const counter = mapping.get(n.value);
    if (counter === undefined) return undefined;
    return [{ type: "Control", value: "\\Count" }, ...numberToItems(counter)];
  });
  return {
    type: "Program",
    children: [
      {
        type: "Let",
        binding: { type: "Control", value: "\\Count" },
        rhs: { type: "Control", value: "\\count" },
      },
      ...prog.children,
    ],
  };
}

function removeNumSepAuto(program: Program) {
  return withListReplacer(program, (ns: Child[]) => {
    let someChanged = false;
    const filtered = ns.filter((n, i) => {
      const keep = n.type !== "NumSepAuto" || isAfterCount(ns, i);
      if (!keep) someChanged = true;
      return keep;
    });
    return someChanged ? filtered : undefined;
  });
}

/** checks if ns[k...i-1] takes the form "\count123" for some k. */
function isAfterCount(ns: Child[], i: number) {
  for (let j = i - 1; j >= 0; j--) {
    const curr = ns[j];
    if (j < i - 1 && curr.type === "Control" && curr.value === "\\Count")
      return true;
    if (curr.type !== "Other" || !/^\d+$/.test(curr.value)) return false;
  }
  return false;
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
