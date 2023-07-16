import * as moo from "moo";
import { DiagnosticsState } from "../types/diagnostics";
import type { Pos } from "../types/AST";

const rules = {
  comment: { match: /%[^\n]*\n?/, lineBreaks: true },
  word_control: { match: /\\[A-Za-z]+ ?/, value: (s: string) => s.trimEnd() },
  symb_control: /\\./,
  begin: /\{/,
  end: /\}/,
  newline: { match: /\n{2,}/, lineBreaks: true },
  forced_output_space: /␣/,
  forced_code_space: /⫽/,
  space: { match: /[ \n]+/, lineBreaks: true },
  other: { match: /[^]/, lineBreaks: true },
};

type TokenType = "eof" | keyof typeof rules;

export type Token = Exclude<moo.Token, "type"> & { type: TokenType };

export class Lexer extends DiagnosticsState {
  private curr: Token | null = null;
  private prevToken?: Token;
  private readonly lexer;

  constructor(input: string) {
    super(input);
    this.lexer = moo.compile(rules);
    this.lexer.reset(input);
  }

  private _next() {
    const t = this.lexer.next() as Token | undefined;
    this.prevToken = t;
    return t;
  }

  private next(): Token {
    const prev = this.prevToken;
    const t = this._next();
    if (t === undefined)
      return {
        type: "eof",
        value: "",
        offset: prev ? prev.offset + prev.text.length : 0,
        text: "",
        lineBreaks: 0,
        line: prev ? prev.line + prev.lineBreaks : 0,
        col: prev ? prev.col + prev.text.length : 0,
      };
    return t;
  }

  peek() {
    if (this.curr === null) this.curr = this.next();
    return this.curr;
  }

  private _consume() {
    if (this.curr === null) return this.next();
    const c = this.curr;
    this.curr = null;
    return c;
  }

  consume(expected?: string) {
    while (true) {
      const c = this._consume();
      this.assertNotEOF(c);
      if (expected === undefined || expected === c.value) return c;
      this.pushError(
        `Expected '${expected}' but got '${c.value}'. Skipping it.`,
        pos(c)
      );
    }
  }

  consumeType(expected: TokenType) {
    while (true) {
      const c = this._consume();
      if (expected !== "eof") this.assertNotEOF(c);
      if (expected === c.type) return c;
      this.pushError(
        `Expected ${expected} but got '${c.value}'. Skipping it.`,
        pos(c)
      );
    }
  }

  assertNotEOF(token: Token) {
    if (token.type === "eof")
      this.pushFatalError("Unexpected end of file", pos(token));
  }

  pushFatalError(message: string, pos: Pos) {
    this.pushError(message, pos);
    return new Error(message);
  }
}

export function pos(p: Token): Pos {
  return {
    from: p.offset,
    to: p.offset + p.text.length,
    line: p.line,
    col: p.col,
  };
}
