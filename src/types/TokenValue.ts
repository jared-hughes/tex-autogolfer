export interface Control {
  type: "Control";
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

export interface Other {
  type: "Other";
  value: string;
}

export interface Begin {
  type: "Begin";
}

export interface End {
  type: "End";
}

export type EmitToken =
  | Control
  | Newline
  | Space
  | SepSpace
  | Other
  | Begin
  | End;
export type EmitTokenType = EmitToken["type"];

export interface EOF {
  type: "EOF";
}

export type TokenValue = EmitToken | EOF;
export type TokenType = TokenValue["type"];
