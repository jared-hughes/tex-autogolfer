import { isParent, Control, Child, Node, Program } from "../types/AST";
import { golfError } from "../types/diagnostics";

/** A map of a function over all nodes in pre-order traversal order, followed
 * by removal of `undefined` return values. Returns a generator, so is a no-op
 * if the values are not used. Name inspired by Swift's `compactMap`. */
export function* compactMap<T>(
  node: Node,
  func: Visitor<T | undefined>
): Generator<T, void, undefined> {
  // Don't call the function on the program
  const ret = node.type === "Program" ? undefined : func(node);
  if (ret !== undefined) yield ret;
  for (const child of children(node)) {
    yield* compactMap(child, func);
  }
}

export function* filter<S extends Child>(
  node: Node,
  func: (n: Child) => n is S
): Generator<S, void, undefined> {
  yield* compactMap(node, (c) => (func(c) ? c : undefined));
}

export type Visitor<T> = <N extends Child>(node: N) => T;

function children(node: Node): Child[] {
  if (!isParent(node)) return [];
  switch (node.type) {
    case "Program":
    case "Group":
    case "Usegolf":
      return node.children;
    case "Def":
      return [node.callee, node.binding, ...node.params, ...node.body];
    case "Let":
      return [node.callee, node.binding, node.rhs];
    case "Newcount":
      return [node.callee, node.binding];
    default:
      node satisfies never;
      return [];
  }
}

type ChildVisitor = Visitor<Child | Child[] | undefined>;

export function withReplacer(node: Program, replacer: ChildVisitor): Program {
  const [s, children] = flatMapSomeChanged(node.children, replacer);
  if (!s) return node;
  return { ...node, children };
}

function _withReplacer(node: Child, replacer: ChildVisitor): Child[] {
  const ret = replacer(node);
  if (ret === undefined) {
    if (!isParent(node)) return [node];
    // recurse on children
    switch (node.type) {
      case "Group":
      case "Usegolf": {
        const [s, children] = flatMapSomeChanged(node.children, replacer);
        if (!s) return [node];
        return [{ type: node.type, children }];
      }
      case "Def": {
        const [s1, [callee, binding]] = mapSomeChangedControl(
          [node.callee, node.binding],
          replacer
        );
        const [s2, params] = flatMapSomeChanged(node.params, replacer);
        const [s3, body] = flatMapSomeChanged(node.body, replacer);
        if (!(s1 || s2 || s3)) return [node];
        return [{ type: "Def", callee, binding, params, body }];
      }
      case "Let": {
        const [s, [callee, binding, rhs]] = mapSomeChangedControl(
          [node.callee, node.binding, node.rhs],
          replacer
        );
        if (!s) return [node];
        return [{ type: "Let", callee, binding, rhs }];
      }
      case "Newcount": {
        const [s, [callee, binding]] = mapSomeChangedControl(
          [node.callee, node.binding],
          replacer
        );
        if (!s) return [node];
        return [{ type: node.type, binding, callee }];
      }
    }
    node satisfies never;
  } else {
    // Don't recurse, to avoid replacement loops.
    // Call withReplacer again in the replacement if you want to replace the new stuff
    return Array.isArray(ret) ? ret : [ret];
  }
}

function flatMapSomeChanged(arr: Child[], replacer: ChildVisitor) {
  let someChanged = false;
  const replaced = arr.flatMap((c) => {
    const d = _withReplacer(c, replacer);
    if (d.length !== 1 || d[0] !== c) someChanged = true;
    return d;
  });
  return [someChanged, replaced] as const;
}

function mapSomeChanged(arr: Child[], replacer: ChildVisitor) {
  let someChanged = false;
  const replaced = arr.map((c) => {
    const d = _withReplacer(c, replacer);
    if (d.length !== 1)
      golfError(`Can only replace this with one node, but got ${d.length}.`);
    if (d[0] !== c) someChanged = true;
    return d[0];
  });
  return [someChanged, replaced] as const;
}

function mapSomeChangedControl(arr: Control[], replacer: ChildVisitor) {
  const [s, v] = mapSomeChanged(arr, replacer);
  const v2 = v.map((x) => {
    if (x.type !== "Control") golfError("Replaced Control with non-Control");
    return x;
  });
  return [s, v2] as const;
}

export function unique(s: string[]): string[] {
  return [...new Set(s)];
}

type ListReplacer = (node: Child[]) => Child[] | undefined;

export function withListReplacer(
  node: Program,
  replacer: ListReplacer
): Program {
  const [_a, c1] = _listReplacerList(node.children, replacer);
  return { ...node, children: replacer(c1) ?? c1 };
}

function _listReplacerList(ns: Child[], replacer: ListReplacer) {
  const [s, ns2] = mapSomeChanged(ns, (n) => _withListReplacer(n, replacer));
  const ns3 = replacer(ns2);
  if (ns3 === undefined) return [s, ns2] as const;
  else return [true, ns3] as const;
}

function _withListReplacer(
  n: Child,
  replacer: ListReplacer
): Child | undefined {
  if (!isParent(n)) return undefined;
  const f = (ns: Child[]) => _listReplacerList(ns, replacer);
  switch (n.type) {
    case "Let":
    case "Newcount":
      return undefined;
    case "Group": {
      const [s, children] = f(n.children);
      if (!s) return n;
      return { type: "Group", children };
    }
    case "Def": {
      const [s1, params] = f(n.params);
      const [s2, body] = f(n.body);
      if (!(s1 || s2)) return n;
      return { ...n, params, body };
    }
  }
}

export function trimStart(ns: Child[], value: string) {
  if (value.length === 0) return ns;
  for (let i = 0; i < ns.length; i++) {
    const n = ns[i];
    if (n.type !== "Other") return undefined;
    if (!value.startsWith(n.value)) return undefined;
    value = value.slice(n.value.length);
    if (value.length === 0) return ns.slice(i + 1);
  }
  return undefined;
}
