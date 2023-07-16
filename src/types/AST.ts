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
  value: string;
  /**
   * variant="word": value is a backslash followed by letters A-Za-z.
   * variant="symb": value is a backslash followed by any non-letter.
   * variant="active": value is any single byte.
   */
  variant: "word" | "symb" | "active";
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

export type Child = Other | Control | Newline | Space | SepSpace | Group;

export type Node = Program | Child;
