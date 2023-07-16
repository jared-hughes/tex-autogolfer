import type { Child, Node, Parent, Program } from "../types/AST";

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
      return node.children;
    case "Def":
      return [node.binding, ...node.params, ...node.body];
    case "Let":
      return [node.binding, node.rhs];
    default:
      node satisfies never;
      return [];
  }
}

function isParent(node: Node): node is Parent {
  switch (node.type) {
    case "Program":
    case "Group":
    case "Def":
    case "Let":
      node satisfies Parent;
      return true;
    case "Control":
    case "Newline":
    case "Other":
    case "SepSpace":
    case "Space":
      node satisfies Exclude<Node, Parent>;
      return false;
  }
}

type ChildVisitor = Visitor<Child | undefined>;

export function withReplacer(node: Child, replacer: ChildVisitor): Child;
export function withReplacer(node: Program, replacer: ChildVisitor): Program;
export function withReplacer(node: Node, replacer: ChildVisitor): Node {
  // never replace the whole program
  const ret = node.type === "Program" ? undefined : replacer(node);
  if (ret === undefined) {
    if (!isParent(node)) return node;
    // recurse on children
    switch (node.type) {
      case "Program":
      case "Group": {
        const [children, s] = mapSomeChanged(node.children, replacer);
        if (!s) return node;
        return { type: node.type, children };
      }
      case "Def": {
        const [name, s1] = mapSomeChanged([node.binding], replacer);
        const [params, s2] = mapSomeChanged(node.params, replacer);
        const [body, s3] = mapSomeChanged(node.body, replacer);
        if (!(s1 || s2 || s3)) return node;
        if (name.length !== 1 || name[0].type !== "Control")
          throw new Error(
            "Programming Error: Replaced Def Control with non-Control"
          );
        return { type: "Def", binding: name[0], params, body };
      }
      case "Let": {
        const [r, s] = mapSomeChanged([node.binding, node.rhs], replacer);
        if (!s) return node;
        if (
          r.length !== 2 ||
          r[0].type !== "Control" ||
          r[1].type !== "Control"
        )
          throw new Error(
            "Programming Error: Replaced Let Control with non-Control"
          );
        return { type: "Let", binding: r[0], rhs: r[1] };
      }
    }
    node satisfies never;
  } else {
    // Don't recurse, to avoid replacement loops.
    return ret;
  }
}

function mapSomeChanged(arr: Child[], replacer: Visitor<Child | undefined>) {
  let someChanged = false;
  const replaced = arr.map((c) => {
    const d = withReplacer(c, replacer);
    if (d !== c) someChanged = true;
    return d;
  });
  return [replaced, someChanged] as const;
}
