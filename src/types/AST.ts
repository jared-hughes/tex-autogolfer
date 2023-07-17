export interface Pos {
  line: number;
  col: number;
  from: number;
  to: number;
}

export interface Program {
  type: "Program";
  children: Child[];
}

export interface Other {
  type: "Other";
  value: string;
}

export interface Control {
  type: "Control";
  /**
   * variant "word": value is a backslash followed by letters A-Za-z.
   * variant "symb": value is a backslash followed by any non-letter.
   * variant "active": value is any single byte.
   */
  value: string;
  needsSpaceAfterIfCount?: boolean;
  needsBracesIfCount?: boolean;
}

export interface Newline {
  type: "Newline";
}

/** A space that gets inserted to change the output. */
export interface Space {
  type: "Space";
}

/** A space that gets inserted in the code to avoid a number parsing past it */
export interface NumSep {
  type: "NumSep";
}

export interface Group {
  type: "Group";
  children: Child[];
}

export interface Def {
  type: "Def";
  binding: Control;
  params: Child[];
  body: Child[];
}

export interface Let {
  type: "Let";
  binding: Control;
  rhs: Control;
}

export interface Newcount {
  type: "Newcount";
  binding: Control;
}

export type Leaf = Other | Control | Newline | Space | NumSep;

export type ChildParent = Group | Def | Let | Newcount;

export type Child = Leaf | ChildParent;

export type UnchildParent = Program;

export type Parent = UnchildParent | ChildParent;

export type Node = Parent | Child;

/// Helpers

export function isParent(node: Node): node is Parent {
  switch (node.type) {
    case "Program":
    case "Group":
    case "Def":
    case "Let":
    case "Newcount":
      node satisfies Parent;
      return true;
    case "Control":
    case "Newline":
    case "Other":
    case "NumSep":
    case "Space":
      node satisfies Exclude<Node, Parent>;
      return false;
  }
}

export function isDef(node: Node): node is Def {
  return node.type === "Def";
}

export function isLet(node: Node): node is Let {
  return node.type === "Let";
}

export function isNewcount(node: Node): node is Newcount {
  return node.type === "Newcount";
}

export type Binder = Def | Let | Newcount;

export function isBinder(node: Node): node is Binder {
  return isDef(node) || isLet(node) || isNewcount(node);
}

export function isControl(node: Node): node is Control {
  return node.type === "Control";
}
