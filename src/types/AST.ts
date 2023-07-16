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
}

export interface Newline {
  type: "Newline";
}

export interface Space {
  type: "Space";
}

export interface SepSpace {
  type: "SepSpace";
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

export type Leaf = Other | Control | Newline | Space | SepSpace;

export type ChildParent = Group | Def | Let;

export type Child = Leaf | ChildParent;

export type UnchildParent = Program;

export type Parent = UnchildParent | ChildParent;

export type Node = Parent | Child;

/// / Helpers

export function isDef(node: Node): node is Def {
  return node.type === "Def";
}

export function isLet(node: Node): node is Let {
  return node.type === "Let";
}

export function isBinder(node: Node): node is Def | Let {
  return isDef(node) || isLet(node);
}

export function isControl(node: Node): node is Control {
  return node.type === "Control";
}
