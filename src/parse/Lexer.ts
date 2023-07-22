import * as moo from "moo";
import { DiagnosticsState } from "../types/diagnostics";
import { Pos } from "../types/AST";
import { TokenValue } from "../types/TokenValue";
import { ParseOpts } from "./Parser";

const rules = {
  comment: { match: /%[^\n]*\n?/, lineBreaks: true },
  word_control: { match: /\\[A-Za-z]+ ?/, value: (s: string) => s.trimEnd() },
  symb_control: /\\./,
  active: /[~\f]/,
  begin: /\{/,
  end: /\}/,
  begin_auto: /⦃/,
  end_auto: /⦄/,
  newline: { match: /\n(?:\s*\n)+/, lineBreaks: true },
  forced_output_space: /␣/,
  forced_source_space: /…/,
  num_sep_hint: /⫽+/,
  solo_newline: { match: /\n/, lineBreaks: true },
  space: / +/,
  other: { match: /[^]/, lineBreaks: true },
};

type RawToken = Exclude<moo.Token, "type"> & { type: keyof typeof rules };

type Token = TokenValue & {
  /** line & col of `from` */
  line: number;
  col: number;
  from: number;
  to: number;
  text: string;
};

export class Lexer extends DiagnosticsState {
  private curr: Token | null = null;
  private prevToken?: RawToken;
  private readonly lexer;

  constructor(
    input: string,
    public opts: ParseOpts
  ) {
    input = input.replace(/⦃(?:0x[0-9A-Za-z]+|\d+)⦄/g, (s: string) => {
      const t = String.fromCodePoint(parseInt(s.slice(1, -1)));
      return t + " ".repeat(Math.max(s.length - t.length, 0));
    });
    super(input);
    this.lexer = moo.compile(rules);
    this.lexer.reset(input);
  }

  private _next() {
    const t = this.lexer.next() as RawToken | undefined;
    this.prevToken = t;
    return t;
  }

  private next(): Token {
    while (true) {
      const prev = this.prevToken;
      const t = this._next();
      if (t === undefined)
        return {
          type: "EOF",
          line: prev ? prev.line + prev.lineBreaks : 0,
          col: prev ? prev.col + prev.text.length : 0,
          from: prev ? prev.offset + prev.text.length : 0,
          to: prev ? prev.offset + prev.text.length : 0,
          text: "",
        };
      const value = tokenValue(t, this.opts, {
        afterExpandafter:
          prev?.type === "word_control" && prev.value === "\\expandafter",
      });
      if (value !== undefined)
        return {
          ...value,
          line: t.line,
          col: t.col,
          from: t.offset,
          to: t.offset + t.text.length,
          text: t.text,
        };
    }
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

  consume() {
    const c = this._consume();
    this.assertNotEOF(c);
    return c;
  }

  consumeType<T extends TokenValue["type"]>(expected: T) {
    const c = this._consume();
    if (expected !== "EOF") this.assertNotEOF(c);
    if (expected === c.type) return c as Token & { type: T };
    throw this.pushFatalError(`Expected ${expected} but got '${c.text}'.`, c);
  }

  assertNotEOF(token: Token) {
    if (token.type === "EOF")
      throw this.pushFatalError("Unexpected end of file", token);
  }

  pushFatalError(message: string, pos: Pos) {
    this.pushError(message, pos);
    return new Error(message);
  }
}

function tokenValue(
  t: RawToken,
  opts: ParseOpts,
  { afterExpandafter }: { afterExpandafter: boolean }
): TokenValue | undefined {
  switch (t.type) {
    case "comment":
    case "space":
      return undefined;
    case "forced_source_space":
      return { type: "Other", value: " " };
    case "solo_newline":
      return opts.preserveNewlines ? { type: "Other", value: "\n" } : undefined;
    case "word_control":
    case "symb_control":
    case "active":
      return { type: "Control", value: t.value, afterExpandafter };
    case "begin":
      return { type: "Begin" };
    case "end":
      return { type: "End" };
    case "begin_auto":
      return { type: "BeginAuto" };
    case "end_auto":
      return { type: "EndAuto" };
    case "newline":
      return { type: "Newline" };
    case "forced_output_space":
      return { type: "Space" };
    case "num_sep_hint":
      return { type: "NumSepHint", value: t.value };
    case "other":
      return { type: "Other", value: t.value };
    default:
      t.type satisfies never;
  }
}
