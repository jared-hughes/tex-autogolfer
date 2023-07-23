export interface Control {
  type: "Control";
  value: string;
  afterExpandafter?: boolean;
}

export interface Newline {
  type: "Newline";
}

export interface Space {
  type: "Space";
}

export interface NumSep {
  type: "NumSep";
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

export type SharedToken = Control | Newline | Space | Other | Begin | End;
export type EmitToken = SharedToken | NumSep;
export type EmitTokenType = EmitToken["type"];

export interface EOF {
  type: "EOF";
}

export interface NumSepHint {
  type: "NumSepHint";
  value: string;
}

export interface BeginAuto {
  type: "BeginAuto";
}

export interface EndAuto {
  type: "EndAuto";
}

export interface Mapsto {
  type: "Mapsto";
}

export type TokenValue =
  | SharedToken
  | BeginAuto
  | EndAuto
  | NumSepHint
  | Mapsto
  | EOF;
export type TokenType = TokenValue["type"];
