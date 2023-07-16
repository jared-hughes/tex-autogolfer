import type { Control as ControlNode } from "../types/AST";

export type Control = ControlNode;

export interface Newline {
  type: "Newline";
}

export interface Space {
  type: "Space";
}

export interface SepSpace {
  type: "SepSpace";
}

export interface Other {
  type: "Other";
  value: string;
}

export type EmitToken = Control | Newline | Space | SepSpace | Other;
